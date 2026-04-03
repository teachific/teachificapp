import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { forms, formFields, formBranchingRules, formSubmissions, orgSubscriptions } from "../drizzle/schema";

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
        primaryColor: form.primaryColor,
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
});
