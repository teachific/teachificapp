import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql, gte, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { storagePut } from "./storage";
import {
  forms, formFields, formBranchingRules, formSubmissions, orgSubscriptions,
  formSessions, formAnalyticsEvents, formIntegrations, orgThemes,
} from "../drizzle/schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getFormById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  return rows[0];
}

async function getFormBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1);
  return rows[0];
}

async function getFieldsByForm(formId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(formFields).where(eq(formFields.formId, formId)).orderBy(formFields.sortOrder);
}

async function getRulesByForm(formId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(formBranchingRules).where(eq(formBranchingRules.formId, formId)).orderBy(formBranchingRules.sortOrder);
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Check if org has email workflow access (enterprise plan) ──────────────────
async function orgHasEmailAccess(orgId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(orgSubscriptions).where(eq(orgSubscriptions.orgId, orgId)).limit(1);
  const plan = rows[0]?.plan ?? "free";
  return ["pro", "enterprise"].includes(plan);
}

// ── Send notification email via SendGrid ──────────────────────────────────────
async function sendFormNotification(opts: {
  toEmails: string[];
  formTitle: string;
  answers: Record<string, string>;
  fields: Array<{ id: number; label: string }>;
  respondentEmail?: string;
}) {
  const sgApiKey = process.env.SENDGRID_API_KEY;
  if (!sgApiKey || opts.toEmails.length === 0) return;
  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(sgApiKey);

  const rows = opts.fields
    .map((f) => `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;border-bottom:1px solid #f3f4f6">${f.label}</td><td style="padding:6px 12px;color:#6b7280;border-bottom:1px solid #f3f4f6">${opts.answers[f.id] ?? "—"}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#189aa1">New Form Submission</h2>
      <p style="color:#6b7280">A new response was submitted to <strong>${opts.formTitle}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table>
      ${opts.respondentEmail ? `<p style="margin-top:16px;color:#6b7280;font-size:13px">Respondent email: ${opts.respondentEmail}</p>` : ""}
    </div>`;

  for (const to of opts.toEmails) {
    try {
      await sgMail.default.send({
        to,
        from: { email: process.env.SENDGRID_FROM_EMAIL || "noreply@teachific.app", name: process.env.SENDGRID_FROM_NAME || "Teachific" },
        subject: `New submission: ${opts.formTitle}`,
        html,
      });
    } catch (_) { /* best-effort */ }
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export const formsRouter = router({
  // ── List forms for an org ─────────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(forms).where(eq(forms.orgId, input.orgId)).orderBy(desc(forms.createdAt));
    }),

  // ── Get a single form with fields and rules ───────────────────────────────
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const form = await getFormById(input.id);
      if (!form) throw new TRPCError({ code: "NOT_FOUND" });
      const fields = await getFieldsByForm(form.id);
      const rules = await getRulesByForm(form.id);
      return { ...form, fields, rules };
    }),

  // ── Create a form ─────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      orgId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const baseSlug = slugify(input.title) || "form";
      const slug = `${baseSlug}-${nanoid(6)}`;
      await db.insert(forms).values({
        orgId: input.orgId,
        title: input.title,
        description: input.description ?? null,
        slug,
        status: "draft",
        submissionCount: 0,
      });
      const created = await getFormBySlug(slug);
      return created!;
    }),

  // ── Update form settings ──────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(["draft", "published", "closed"]).optional(),
      notifyEmails: z.array(z.string().email()).optional(),
      sendConfirmation: z.boolean().optional(),
      confirmationEmailField: z.string().optional().nullable(),
      confirmationSubject: z.string().optional().nullable(),
      confirmationBody: z.string().optional().nullable(),
      successMessage: z.string().optional().nullable(),
      redirectUrl: z.string().optional().nullable(),
      requireLogin: z.boolean().optional(),
      allowMultipleSubmissions: z.boolean().optional(),
      primaryColor: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, notifyEmails, ...rest } = input;
      await db.update(forms).set({
        ...rest,
        notifyEmails: notifyEmails ? JSON.stringify(notifyEmails) : undefined,
        updatedAt: new Date(),
      }).where(eq(forms.id, id));
      return { success: true };
    }),

  // ── Delete a form ─────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(formBranchingRules).where(eq(formBranchingRules.formId, input.id));
      await db.delete(formSubmissions).where(eq(formSubmissions.formId, input.id));
      await db.delete(formFields).where(eq(formFields.formId, input.id));
      await db.delete(forms).where(eq(forms.id, input.id));
      return { success: true };
    }),

  // ── Duplicate a form ──────────────────────────────────────────────────────
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const original = await getFormById(input.id);
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });
      const newSlug = `${slugify(original.title)}-copy-${nanoid(6)}`;
      await db.insert(forms).values({
        orgId: original.orgId,
        title: `${original.title} (Copy)`,
        description: original.description,
        slug: newSlug,
        status: "draft",
        notifyEmails: original.notifyEmails,
        sendConfirmation: original.sendConfirmation,
        confirmationEmailField: original.confirmationEmailField,
        confirmationSubject: original.confirmationSubject,
        confirmationBody: original.confirmationBody,
        successMessage: original.successMessage,
        redirectUrl: original.redirectUrl,
        requireLogin: original.requireLogin,
        allowMultipleSubmissions: original.allowMultipleSubmissions,
        primaryColor: original.primaryColor,
        submissionCount: 0,
      });
      const newForm = await getFormBySlug(newSlug);
      // Copy fields
      const fields = await getFieldsByForm(original.id);
      const fieldIdMap: Record<number, number> = {};
      for (const f of fields) {
        const { id, ...fData } = f;
        await db.insert(formFields).values({ ...fData, formId: newForm!.id });
        const inserted = await db.select().from(formFields)
          .where(and(eq(formFields.formId, newForm!.id), eq(formFields.sortOrder, fData.sortOrder)))
          .limit(1);
        if (inserted[0]) fieldIdMap[id] = inserted[0].id;
      }
      // Copy rules with remapped field IDs
      const rules = await getRulesByForm(original.id);
      for (const r of rules) {
        await db.insert(formBranchingRules).values({
          formId: newForm!.id,
          sourceFieldId: fieldIdMap[r.sourceFieldId] ?? r.sourceFieldId,
          operator: r.operator,
          value: r.value,
          action: r.action,
          targetFieldId: r.targetFieldId ? (fieldIdMap[r.targetFieldId] ?? r.targetFieldId) : null,
          sortOrder: r.sortOrder,
        });
      }
      return newForm!;
    }),

  // ── Fields CRUD ───────────────────────────────────────────────────────────
  fields: router({
    upsert: protectedProcedure
      .input(z.object({
        formId: z.number(),
        fields: z.array(z.object({
          id: z.number().optional(),
          type: z.string(),
          label: z.string(),
          placeholder: z.string().optional().nullable(),
          helpText: z.string().optional().nullable(),
          required: z.boolean().optional(),
          sortOrder: z.number(),
          options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
          minLength: z.number().optional().nullable(),
          maxLength: z.number().optional().nullable(),
          isBranchingSource: z.boolean().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const incomingIds = input.fields.filter((f) => f.id).map((f) => f.id!);
        // Delete fields that were removed
        const existing = await getFieldsByForm(input.formId);
        for (const ef of existing) {
          if (!incomingIds.includes(ef.id)) {
            await db.delete(formBranchingRules).where(eq(formBranchingRules.sourceFieldId, ef.id));
            await db.delete(formFields).where(eq(formFields.id, ef.id));
          }
        }
        // Upsert each field
        const result: Array<{ tempId?: number; id: number }> = [];
        for (const f of input.fields) {
          const data = {
            formId: input.formId,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder ?? null,
            helpText: f.helpText ?? null,
            required: f.required ?? false,
            sortOrder: f.sortOrder,
            options: f.options ? JSON.stringify(f.options) : null,
            minLength: f.minLength ?? null,
            maxLength: f.maxLength ?? null,
            isBranchingSource: f.isBranchingSource ?? false,
          };
          if (f.id) {
            await db.update(formFields).set(data).where(eq(formFields.id, f.id));
            result.push({ id: f.id });
          } else {
            await db.insert(formFields).values(data);
            const inserted = await db.select().from(formFields)
              .where(and(eq(formFields.formId, input.formId), eq(formFields.sortOrder, f.sortOrder)))
              .orderBy(desc(formFields.id))
              .limit(1);
            result.push({ id: inserted[0]?.id ?? 0 });
          }
        }
        return result;
      }),
  }),

  // ── Branching Rules CRUD ──────────────────────────────────────────────────
  rules: router({
    upsert: protectedProcedure
      .input(z.object({
        formId: z.number(),
        rules: z.array(z.object({
          id: z.number().optional(),
          sourceFieldId: z.number(),
          operator: z.enum(["equals", "not_equals", "contains", "not_contains", "is_empty", "is_not_empty"]),
          value: z.string().optional().nullable(),
          action: z.enum(["show_field", "hide_field", "jump_to_field", "submit_form"]),
          targetFieldId: z.number().optional().nullable(),
          sortOrder: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Replace all rules for this form
        await db.delete(formBranchingRules).where(eq(formBranchingRules.formId, input.formId));
        for (const r of input.rules) {
          await db.insert(formBranchingRules).values({
            formId: input.formId,
            sourceFieldId: r.sourceFieldId,
            operator: r.operator,
            value: r.value ?? null,
            action: r.action,
            targetFieldId: r.targetFieldId ?? null,
            sortOrder: r.sortOrder,
          });
        }
        return { success: true };
      }),
  }),

  // ── Submissions ───────────────────────────────────────────────────────────
  submissions: router({
    list: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(formSubmissions)
          .where(eq(formSubmissions.formId, input.formId))
          .orderBy(desc(formSubmissions.submittedAt));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(formSubmissions).where(eq(formSubmissions.id, input.id));
        return { success: true };
      }),
  }),

  // ── Public: get published form by slug (for the form player) ─────────────
  publicGet: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const form = await getFormBySlug(input.slug);
      if (!form || form.status !== "published") return null;
      const fields = await getFieldsByForm(form.id);
      const rules = await getRulesByForm(form.id);
      // Fetch org branding defaults from orgThemes
      let orgPrimaryColor: string | null = null;
      let orgFontFamily: string | null = null;
      if (form.orgId) {
        const db = await getDb();
        if (db) {
          const [themeRow] = await db.select().from(orgThemes).where(eq(orgThemes.orgId, form.orgId)).limit(1);
          orgPrimaryColor = themeRow?.primaryColor ?? null;
          orgFontFamily = themeRow?.fontFamily ?? null;
        }
      }
      // Don't expose internal email config to the public
      return {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        requireLogin: form.requireLogin,
        allowMultipleSubmissions: form.allowMultipleSubmissions,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl,
        // branding
        primaryColor: form.primaryColor,
        buttonColor: form.buttonColor,
        buttonTextColor: form.buttonTextColor,
        headerBgColor: form.headerBgColor,
        headerTextColor: form.headerTextColor,
        fontFamily: form.fontFamily,
        headerImageUrl: form.headerImageUrl,
        useOrgBranding: form.useOrgBranding,
        orgPrimaryColor,
        orgFontFamily,
        fields: fields.map((f) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          helpText: f.helpText,
          required: f.required,
          sortOrder: f.sortOrder,
          options: f.options ? JSON.parse(f.options) : [],
          isBranchingSource: f.isBranchingSource,
          isHidden: f.isHidden ?? false,
          memberVarName: f.memberVarName ?? null,
        })),
        rules: rules.map((r) => ({
          id: r.id,
          sourceFieldId: r.sourceFieldId,
          operator: r.operator,
          value: r.value,
          action: r.action,
          targetFieldId: r.targetFieldId,
        })),
      };
    }),

  // ── Public: submit a form response ───────────────────────────────────────
  publicSubmit: publicProcedure
    .input(z.object({
      formId: z.number(),
      answers: z.record(z.string(), z.any()),
      respondentEmail: z.string().email().optional(),
      respondentName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const form = await getFormById(input.formId);
      if (!form || form.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or not accepting submissions" });
      }

      // Store submission
      await db.insert(formSubmissions).values({
        formId: input.formId,
        userId: (ctx.user as any)?.id ?? null,
        respondentEmail: input.respondentEmail ?? null,
        respondentName: input.respondentName ?? null,
        answers: JSON.stringify(input.answers),
        ipAddress: ctx.req.ip ?? null,
        userAgent: ctx.req.headers["user-agent"] ?? null,
      });

      // Increment counter
      await db.update(forms)
        .set({ submissionCount: (form.submissionCount ?? 0) + 1, updatedAt: new Date() })
        .where(eq(forms.id, input.formId));

      // Email notifications (if configured)
      const notifyEmails: string[] = form.notifyEmails ? JSON.parse(form.notifyEmails) : [];
      if (notifyEmails.length > 0) {
        const fields = await getFieldsByForm(input.formId);
        const answersRecord: Record<string, string> = {};
        for (const [k, v] of Object.entries(input.answers)) {
          answersRecord[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
        }
        await sendFormNotification({
          toEmails: notifyEmails,
          formTitle: form.title,
          answers: answersRecord,
          fields: fields.map((f) => ({ id: f.id, label: f.label })),
          respondentEmail: input.respondentEmail,
        });
      }

      return { success: true, message: form.successMessage ?? "Thank you for your response!" };
    }),

  // ── Check if org has email routing access ────────────────────────────────
  emailAccessCheck: protectedProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }) => {
      const hasAccess = await orgHasEmailAccess(input.orgId);
      return { hasAccess };
    }),

  // ── Branding ──────────────────────────────────────────────────────────────
  branding: router({
    // Get org defaults for branding
    orgDefaults: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db.select().from(orgThemes).where(eq(orgThemes.orgId, input.orgId)).limit(1);
        const theme = rows[0];
        return {
          primaryColor: theme?.primaryColor ?? "#189aa1",
          accentColor: theme?.accentColor ?? "#4ad9e0",
          fontFamily: theme?.fontFamily ?? "Inter",
          logoUrl: theme?.adminLogoUrl ?? null,
          schoolName: theme?.schoolName ?? null,
        };
      }),

    // Upload header image for a form
    uploadHeaderImage: protectedProcedure
      .input(z.object({
        formId: z.number(),
        base64: z.string(), // data:image/...;base64,...
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Decode base64
        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const key = `form-headers/${ctx.user.id}/${input.formId}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        // Save to form
        await db.update(forms).set({ headerImageUrl: url }).where(eq(forms.id, input.formId));
        return { url };
      }),
  }),

  // ── Sessions & Analytics tracking ─────────────────────────────────────────
  sessions: router({
    start: publicProcedure
      .input(z.object({
        formId: z.number(),
        sessionToken: z.string(),
        memberVars: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { sessionId: 0 };
        const [result] = await db.insert(formSessions).values({
          formId: input.formId,
          sessionToken: input.sessionToken,
          userId: ctx.user?.id ?? null,
          memberVars: input.memberVars ? JSON.stringify(input.memberVars) : null,
        });
        const sessionId = (result as any).insertId as number;
        // Log form_start event
        await db.insert(formAnalyticsEvents).values({
          formId: input.formId,
          sessionId,
          event: "form_start",
        });
        return { sessionId };
      }),

    fieldView: publicProcedure
      .input(z.object({
        formId: z.number(),
        sessionId: z.number(),
        fieldId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return;
        await db.insert(formAnalyticsEvents).values({
          formId: input.formId,
          sessionId: input.sessionId,
          fieldId: input.fieldId,
          event: "field_view",
        });
      }),

    complete: publicProcedure
      .input(z.object({
        formId: z.number(),
        sessionId: z.number(),
        durationSeconds: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return;
        await db.update(formSessions)
          .set({ completed: true, completedAt: new Date(), durationSeconds: input.durationSeconds ?? null })
          .where(eq(formSessions.id, input.sessionId));
        await db.insert(formAnalyticsEvents).values({
          formId: input.formId,
          sessionId: input.sessionId,
          event: "form_complete",
        });
      }),

    dropout: publicProcedure
      .input(z.object({
        formId: z.number(),
        sessionId: z.number(),
        fieldId: z.number().optional(),
        durationSeconds: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return;
        await db.update(formSessions)
          .set({ droppedAtFieldId: input.fieldId ?? null, durationSeconds: input.durationSeconds ?? null })
          .where(eq(formSessions.id, input.sessionId));
      }),
  }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics: router({
    summary: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const sessions = await db.select().from(formSessions).where(eq(formSessions.formId, input.formId));
        const total = sessions.length;
        const completed = sessions.filter(s => s.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const durations = sessions.filter(s => s.durationSeconds != null && s.completed).map(s => s.durationSeconds!);
        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
        // Drop-off field
        const dropCounts: Record<number, number> = {};
        for (const s of sessions) {
          if (!s.completed && s.droppedAtFieldId) {
            dropCounts[s.droppedAtFieldId] = (dropCounts[s.droppedAtFieldId] ?? 0) + 1;
          }
        }
        const topDropFieldId = Object.entries(dropCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        return { total, completed, completionRate, avgDuration, topDropFieldId: topDropFieldId ? parseInt(topDropFieldId) : null };
      }),

    fieldDropoff: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Get all field_view events grouped by fieldId
        const events = await db.select().from(formAnalyticsEvents)
          .where(and(eq(formAnalyticsEvents.formId, input.formId), eq(formAnalyticsEvents.event, "field_view")));
        const viewCounts: Record<number, number> = {};
        for (const e of events) {
          if (e.fieldId) viewCounts[e.fieldId] = (viewCounts[e.fieldId] ?? 0) + 1;
        }
        // Get drop-off counts per field
        const sessions = await db.select().from(formSessions)
          .where(and(eq(formSessions.formId, input.formId)));
        const dropCounts: Record<number, number> = {};
        for (const s of sessions) {
          if (!s.completed && s.droppedAtFieldId) {
            dropCounts[s.droppedAtFieldId] = (dropCounts[s.droppedAtFieldId] ?? 0) + 1;
          }
        }
        return { viewCounts, dropCounts };
      }),

    timeSeries: protectedProcedure
      .input(z.object({ formId: z.number(), days: z.number().default(30) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        const sessions = await db.select().from(formSessions)
          .where(and(eq(formSessions.formId, input.formId), gte(formSessions.startedAt, since)));
        // Group by date
        const starts: Record<string, number> = {};
        const completions: Record<string, number> = {};
        for (const s of sessions) {
          const d = s.startedAt.toISOString().slice(0, 10);
          starts[d] = (starts[d] ?? 0) + 1;
          if (s.completed) completions[d] = (completions[d] ?? 0) + 1;
        }
        // Build ordered array for last N days
        const result: Array<{ date: string; starts: number; completions: number }> = [];
        for (let i = input.days - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          result.push({ date: d, starts: starts[d] ?? 0, completions: completions[d] ?? 0 });
        }
        return result;
      }),
  }),

  // ── Integrations ──────────────────────────────────────────────────────────
  integrations: router({
    list: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return db.select().from(formIntegrations).where(eq(formIntegrations.formId, input.formId));
      }),

    upsert: protectedProcedure
      .input(z.object({
        formId: z.number(),
        integrations: z.array(z.object({
          id: z.number().optional(),
          type: z.enum(["course", "custom_page", "landing_page"]),
          targetId: z.number().optional(),
          targetUrl: z.string().optional(),
          triggerOn: z.enum(["on_submit", "on_completion"]).default("on_submit"),
          action: z.enum(["enroll", "redirect", "tag", "embed"]),
          label: z.string().optional(),
          sortOrder: z.number().default(0),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Delete existing and re-insert
        await db.delete(formIntegrations).where(eq(formIntegrations.formId, input.formId));
        if (input.integrations.length > 0) {
          await db.insert(formIntegrations).values(
            input.integrations.map((ig, i) => ({
              formId: input.formId,
              type: ig.type,
              targetId: ig.targetId ?? null,
              targetUrl: ig.targetUrl ?? null,
              triggerOn: ig.triggerOn,
              action: ig.action,
              label: ig.label ?? null,
              sortOrder: i,
            }))
          );
        }
        return { success: true };
      }),
  }),

  // ── Member variable resolution ────────────────────────────────────────────
  memberVars: router({
    // Resolve member variable values for a given user (for pre-population preview in builder)
    resolve: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ ctx }) => {
        const user = ctx.user;
        return {
          name: user.name ?? "",
          email: user.email ?? "",
          userId: String(user.id),
          // Additional vars can be extended here
        };
      }),
  }),
});
