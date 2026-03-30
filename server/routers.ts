import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  addOrgMember,
  createOrg,
  createPackage,
  createPermissions,
  createPlaySession,
  createVersion,
  deletePackage,
  getAllOrgs,
  getAllPackages,
  getAllUsers,
  getAnalyticsByOrg,
  getAnalyticsByPackage,
  getAnalyticsSummary,
  getEntryPointAsset,
  getFileAssetsByVersion,
  getOrgById,
  getOrgBySlug,
  getOrgMember,
  getOrgMembers,
  getOrgsByUserId,
  getPackageById,
  getPackagesByOrg,
  getPermissions,
  getPlaySession,
  getPlaySessionsByPackage,
  getUserById,
  getUserPlayCount,
  getVersionById,
  getVersionsByPackage,
  incrementDownloadCount,
  incrementPlayCount,
  logAnalyticsEvent,
  removeOrgMember,
  updateOrgMemberRole,
  updatePackage,
  updatePermissions,
  updatePlaySession,
  updateUserRole,
  upsertScormData,
  getScormData,
  getLatestVersionNumber,
  getFoldersByOrg,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  movePackageToFolder,
  setVersionReplacedAt,
  deleteVersionAssets,
  getOrgIdForUser,
} from "./db";
import {
  getQuizById,
  getQuizzesByOrg,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getChoicesByQuestion,
  upsertChoices,
  createAttempt,
  getAttemptById,
  submitAttempt,
  getAttemptsByQuiz,
  saveResponse,
  getResponsesByAttempt,
  getQuizAnalytics,
} from "./quizDb";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
// site_owner + site_admin have site-wide access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "site_admin" && ctx.user.role !== "site_owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// org_admin can manage their own org; site_admin + site_owner can manage any org
const orgAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!(["site_owner", "site_admin", "org_admin"] as string[]).includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Organization admin access required" });
  }
  return next({ ctx });
});

const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "site_owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Site owner access required" });
  }
  return next({ ctx });
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Users (admin) ─────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(() => getAllUsers()),
    get: adminProcedure.input(z.object({ id: z.number() })).query(({ input }) => getUserById(input.id)),
    updateRole: ownerProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["site_owner", "site_admin", "org_admin", "user"]) }))
      .mutation(({ input }) => updateUserRole(input.userId, input.role)),
  }),

  // ── Organizations ─────────────────────────────────────────────────────────
  orgs: router({
    list: adminProcedure.query(() => getAllOrgs()),
    myOrgs: protectedProcedure.query(({ ctx }) => getOrgsByUserId(ctx.user.id)),
    // Auto-provision a default org for users who have none (e.g. existing users pre-dating auto-creation)
    ensureDefault: protectedProcedure.mutation(async ({ ctx }) => {
      const existing = await getOrgsByUserId(ctx.user.id);
      if (existing.length > 0) return existing[0];
      const base = (ctx.user.name || ctx.user.email || "personal")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      const slug = `${base}-workspace`;
      const taken = await getOrgBySlug(slug);
      const finalSlug = taken ? `${slug}-${ctx.user.id}` : slug;
      const orgName = ctx.user.name ? `${ctx.user.name}'s Workspace` : "My Workspace";
      await createOrg({ name: orgName, slug: finalSlug, description: "Default personal workspace", ownerId: ctx.user.id });
      const newOrg = await getOrgBySlug(finalSlug);
      if (newOrg) await addOrgMember(newOrg.id, ctx.user.id, "org_admin");
      return newOrg;
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getOrgById(input.id)),
    getBySlug: protectedProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getOrgBySlug(input.slug)),

    create: adminProcedure
      .input(z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getOrgBySlug(input.slug);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug already in use" });
        await createOrg({ ...input, ownerId: ctx.user.id });
        const org = await getOrgBySlug(input.slug);
        if (org) await addOrgMember(org.id, ctx.user.id, "org_admin");
        return org;
      }),

    members: router({
      list: protectedProcedure.input(z.object({ orgId: z.number() })).query(async ({ input, ctx }) => {
        const members = await getOrgMembers(input.orgId);
        const users = await Promise.all(members.map((m) => getUserById(m.userId)));
        return members.map((m, i) => ({ ...m, user: users[i] }));
      }),
      add: adminProcedure
        .input(z.object({ orgId: z.number(), userId: z.number(), role: z.enum(["org_admin", "user"]) }))
        .mutation(({ input, ctx }) => addOrgMember(input.orgId, input.userId, input.role, ctx.user.id)),
      remove: adminProcedure
        .input(z.object({ orgId: z.number(), userId: z.number() }))
        .mutation(({ input }) => removeOrgMember(input.orgId, input.userId)),
      updateRole: adminProcedure
        .input(z.object({ orgId: z.number(), userId: z.number(), role: z.enum(["org_admin", "user"]) }))
        .mutation(({ input }) => updateOrgMemberRole(input.orgId, input.userId, input.role)),
    }),
  }),

  // ── Content Packages ──────────────────────────────────────────────────────
  packages: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        // Site-wide roles: see everything (or filter by explicit orgId)
        if (ctx.user.role === "site_owner" || ctx.user.role === "site_admin") {
          return input?.orgId ? getPackagesByOrg(input.orgId) : getAllPackages();
        }
        // org_admin: always scoped to their assigned org only
        if (ctx.user.role === "org_admin") {
          const orgId = await getOrgIdForUser(ctx.user.id);
          if (!orgId) return [];
          return getPackagesByOrg(orgId);
        }
        // Regular users: see packages from their orgs
        const orgs = await getOrgsByUserId(ctx.user.id);
        const orgIds = orgs.map((o) => o.id);
        if (input?.orgId && orgIds.includes(input.orgId)) return getPackagesByOrg(input.orgId);
        const allPkgs = await Promise.all(orgIds.map((id) => getPackagesByOrg(id)));
        return allPkgs.flat();
      }),

    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const pkg = await getPackageById(input.id);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });
      // Private packages require authentication
      if (!pkg.isPublic && !ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This content is private. Please sign in to access it." });
      }
      return pkg;
    }),

    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        originalZipKey: z.string(),
        originalZipUrl: z.string(),
        originalZipSize: z.number().optional(),
        contentType: z.enum(["scorm", "html", "articulate", "ispring", "unknown"]).optional(),
        scormVersion: z.enum(["1.2", "2004", "none"]).optional(),
        scormEntryPoint: z.string().optional(),
        displayMode: z.enum(["native", "lms_shell", "quiz"]).default("native"),
        lmsShellConfig: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createPackage({
          orgId: input.orgId,
          uploadedBy: ctx.user.id,
          title: input.title,
          description: input.description,
          tags: JSON.stringify(input.tags ?? []),
          originalZipKey: input.originalZipKey,
          originalZipUrl: input.originalZipUrl,
          originalZipSize: input.originalZipSize ?? 0,
          contentType: input.contentType ?? "unknown",
          scormVersion: input.scormVersion ?? "none",
          scormEntryPoint: input.scormEntryPoint,
          displayMode: input.displayMode,
          lmsShellConfig: input.lmsShellConfig,
          status: "uploading",
        });
        const pkgs = await getPackagesByOrg(input.orgId);
        return pkgs[0];
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        displayMode: z.enum(["native", "lms_shell", "quiz"]).optional(),
        lmsShellConfig: z.string().optional(),
        isPublic: z.boolean().optional(),
        autoFullscreenMobile: z.boolean().optional(),
        status: z.enum(["uploading", "processing", "ready", "error"]).optional(),
        scormVersion: z.enum(["1.2", "2004", "none"]).optional(),
        scormEntryPoint: z.string().optional(),
        scormManifest: z.string().optional(),
        contentType: z.enum(["scorm", "html", "articulate", "ispring", "unknown"]).optional(),
        llmSummary: z.string().optional(),
        llmTags: z.string().optional(),
        llmValidationNotes: z.string().optional(),
        extractedFolderKey: z.string().optional(),
        currentVersionId: z.number().optional(),
        processingError: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, tags, ...rest } = input;
        await updatePackage(id, {
          ...rest,
          ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
        });
        return getPackageById(id);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletePackage(input.id)),

    // LLM analysis of an uploaded package
    analyze: protectedProcedure
      .input(z.object({
        packageId: z.number(),
        fileList: z.array(z.string()),
        manifestXml: z.string().optional(),
        sampleHtml: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `You are an expert eLearning content analyst. Analyze the following SCORM/HTML content package and provide:
1. A concise description (2-3 sentences) of what this course covers
2. 5-8 relevant tags (single words or short phrases)
3. SCORM compliance validation notes
4. Detected content structure (number of modules, quiz presence, etc.)

File list (first 30): ${input.fileList.slice(0, 30).join(", ")}
${input.manifestXml ? `\nSCORM Manifest (excerpt):\n${input.manifestXml.slice(0, 2000)}` : ""}
${input.sampleHtml ? `\nSample HTML content:\n${input.sampleHtml.slice(0, 1000)}` : ""}

Respond in JSON format: { "description": "...", "tags": [...], "validationNotes": "...", "structure": "..." }`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are an eLearning content analyst. Always respond with valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" } as Parameters<typeof invokeLLM>[0]["response_format"],
          });
          const content = response?.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
          await updatePackage(input.packageId, {
            llmSummary: parsed.description ?? "",
            llmTags: JSON.stringify(parsed.tags ?? []),
            llmValidationNotes: `${parsed.validationNotes ?? ""}\n\nStructure: ${parsed.structure ?? ""}`.trim(),
          });
          return parsed;
        } catch (err) {
          console.error("[LLM Analysis] Failed:", err);
          return { description: "", tags: [], validationNotes: "Analysis unavailable", structure: "" };
        }
      }),

    // Extract questions from SCORM/HTML using LLM
    extractQuestions: protectedProcedure
      .input(z.object({
        packageId: z.number(),
        htmlContent: z.string(),
        orgId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const prompt = `Extract all quiz questions from the following HTML content. For each question identify:
- The question text
- Question type (multiple_choice, true_false, short_answer, matching, multiple_select)
- All answer choices
- Which answer(s) are correct
- Any explanation/rationale provided

HTML Content:
${input.htmlContent.slice(0, 6000)}

Respond in JSON: { "questions": [{ "questionText": "...", "questionType": "multiple_choice", "choices": [{ "text": "...", "isCorrect": true/false }], "explanation": "..." }] }`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are an expert at extracting quiz questions from educational HTML content. Always respond with valid JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" } as Parameters<typeof invokeLLM>[0]["response_format"],
          });
          const content = response?.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
          return { questions: parsed.questions ?? [] };
        } catch (err) {
          console.error("[Question Extraction] Failed:", err);
          return { questions: [] };
        }
      }),
  }),

  // ── Versions ──────────────────────────────────────────────────────────────
  versions: router({
    list: protectedProcedure
      .input(z.object({ packageId: z.number() }))
      .query(({ input }) => getVersionsByPackage(input.packageId)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getVersionById(input.id)),

    create: protectedProcedure
      .input(z.object({
        packageId: z.number(),
        versionLabel: z.string().optional(),
        changelog: z.string().optional(),
        zipKey: z.string(),
        zipUrl: z.string(),
        zipSize: z.number().optional(),
        extractedFolderKey: z.string().optional(),
        entryPoint: z.string().optional(),
        fileCount: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Mark the currently active version as replaced
        const pkg = await getPackageById(input.packageId);
        if (pkg?.currentVersionId) {
          await setVersionReplacedAt(pkg.currentVersionId, new Date());
        }
        const latestNum = await getLatestVersionNumber(input.packageId);
        await createVersion({
          ...input,
          versionNumber: latestNum + 1,
          uploadedBy: ctx.user.id,
          zipSize: input.zipSize ?? 0,
          fileCount: input.fileCount ?? 0,
        });
        const versions = await getVersionsByPackage(input.packageId);
        const newVersion = versions[0];
        if (newVersion) {
          await updatePackage(input.packageId, { currentVersionId: newVersion.id });
        }
        return newVersion;
      }),

    restore: protectedProcedure
      .input(z.object({ packageId: z.number(), versionId: z.number() }))
      .mutation(async ({ input }) => {
        const pkg = await getPackageById(input.packageId);
        // Mark the currently active version as replaced (now)
        if (pkg?.currentVersionId && pkg.currentVersionId !== input.versionId) {
          await setVersionReplacedAt(pkg.currentVersionId, new Date());
        }
        // Restore the target version: clear its replacedAt and set as current
        await setVersionReplacedAt(input.versionId, null);
        await updatePackage(input.packageId, { currentVersionId: input.versionId });
        return { success: true };
      }),

    purgeExpired: protectedProcedure
      .input(z.object({ packageId: z.number() }))
      .mutation(async ({ input }) => {
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
        const versions = await getVersionsByPackage(input.packageId);
        const expired = versions.filter(
          (v) => v.replacedAt !== null && v.replacedAt !== undefined && new Date(v.replacedAt) < cutoff
        );
        for (const v of expired) {
          await deleteVersionAssets(v.id);
        }
        return { deleted: expired.length };
      }),

    assets: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .query(({ input }) => getFileAssetsByVersion(input.versionId)),

    entryPoint: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .query(({ input }) => getEntryPointAsset(input.versionId)),
  }),

  // ── Permissions ───────────────────────────────────────────────────────────
  permissions: router({
    get: publicProcedure
      .input(z.object({ packageId: z.number() }))
      .query(({ input }) => getPermissions(input.packageId)),

    update: adminProcedure
      .input(z.object({
        packageId: z.number(),
        allowDownload: z.boolean().optional(),
        downloadRequiresAuth: z.boolean().optional(),
        maxPlaysPerUser: z.number().nullable().optional(),
        maxTotalPlays: z.number().nullable().optional(),
        playExpiresAt: z.date().nullable().optional(),
        allowEmbed: z.boolean().optional(),
        allowedEmbedDomains: z.array(z.string()).optional(),
        allowExternalLinks: z.boolean().optional(),
        requiresAuth: z.boolean().optional(),
        allowedOrgIds: z.array(z.number()).optional(),
        allowedUserIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { packageId, allowedEmbedDomains, allowedOrgIds, allowedUserIds, ...rest } = input;
        const existing = await getPermissions(packageId);
        if (!existing) await createPermissions(packageId);
        await updatePermissions(packageId, {
          ...rest,
          ...(allowedEmbedDomains !== undefined ? { allowedEmbedDomains: JSON.stringify(allowedEmbedDomains) } : {}),
          ...(allowedOrgIds !== undefined ? { allowedOrgIds: JSON.stringify(allowedOrgIds) } : {}),
          ...(allowedUserIds !== undefined ? { allowedUserIds: JSON.stringify(allowedUserIds) } : {}),
        });
        return getPermissions(packageId);
      }),

    generateShareToken: adminProcedure
      .input(z.object({ packageId: z.number(), expiresInDays: z.number().optional() }))
      .mutation(async ({ input }) => {
        const token = nanoid(32);
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 86400000)
          : null;
        await updatePermissions(input.packageId, {
          shareToken: token,
          shareTokenExpiresAt: expiresAt ?? undefined,
        });
        return { token };
      }),
  }),

  // ── Play Sessions ─────────────────────────────────────────────────────────
  sessions: router({
    start: publicProcedure
      .input(z.object({
        packageId: z.number(),
        versionId: z.number().optional(),
        orgId: z.number().optional(),
        // Dynamic URL learner identity params
        learnerName:  z.string().max(255).optional(),
        learnerEmail: z.string().max(320).optional(),
        learnerId:    z.string().max(128).optional(),
        learnerGroup: z.string().max(128).optional(),
        customData:   z.string().optional(),
        utmSource:    z.string().max(128).optional(),
        utmMedium:    z.string().max(128).optional(),
        utmCampaign:  z.string().max(128).optional(),
        referrer:     z.string().max(512).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const pkg = await getPackageById(input.packageId);
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });

        // Private packages require authentication to start a session
        if (!pkg.isPublic && !ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "This content is private. Please sign in to access it." });
        }

        const perms = await getPermissions(input.packageId);

        // Check play limits
        if (perms?.maxTotalPlays && pkg.totalPlayCount >= perms.maxTotalPlays) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Maximum total plays reached" });
        }
        if (perms?.maxPlaysPerUser && ctx.user) {
          const userCount = await getUserPlayCount(input.packageId, ctx.user.id);
          if (userCount >= perms.maxPlaysPerUser) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You have reached the maximum number of plays" });
          }
        }
        if (perms?.playExpiresAt && new Date() > perms.playExpiresAt) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This content has expired" });
        }

        const token = nanoid(32);
        await createPlaySession({
          packageId: input.packageId,
          versionId: input.versionId,
          userId: ctx.user?.id,
          orgId: input.orgId,
          sessionToken: token,
          ipAddress: ctx.req.headers["x-forwarded-for"] as string ?? ctx.req.socket?.remoteAddress,
          userAgent: ctx.req.headers["user-agent"],
          referrer: input.referrer,
          // Dynamic learner identity from URL params
          learnerName:  input.learnerName,
          learnerEmail: input.learnerEmail,
          learnerId:    input.learnerId,
          learnerGroup: input.learnerGroup,
          customData:   input.customData,
          utmSource:    input.utmSource,
          utmMedium:    input.utmMedium,
          utmCampaign:  input.utmCampaign,
        });

        await incrementPlayCount(input.packageId);
        await logAnalyticsEvent({
          packageId: input.packageId,
          userId: ctx.user?.id,
          orgId: input.orgId,
          eventType: "play_start",
          eventData: JSON.stringify({ versionId: input.versionId }),
        });

        return { sessionToken: token };
      }),

    end: publicProcedure
      .input(z.object({
        sessionToken: z.string(),
        durationSeconds: z.number().optional(),
        completionStatus: z.enum(["not_attempted", "incomplete", "completed", "passed", "failed", "unknown"]).optional(),
        scoreRaw: z.number().optional(),
        scoreMax: z.number().optional(),
        scoreMin: z.number().optional(),
        scoreScaled: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const session = await getPlaySession(input.sessionToken);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });

        const isCompleted = input.completionStatus === "completed" || input.completionStatus === "passed";
        await updatePlaySession(input.sessionToken, {
          endedAt: new Date(),
          durationSeconds: input.durationSeconds,
          completionStatus: input.completionStatus,
          scoreRaw: input.scoreRaw,
          scoreMax: input.scoreMax,
          scoreMin: input.scoreMin,
          scoreScaled: input.scoreScaled,
          isCompleted,
        });

        if (isCompleted) {
          await logAnalyticsEvent({
            packageId: session.packageId,
            sessionId: session.id,
            userId: session.userId ?? undefined,
            orgId: session.orgId ?? undefined,
            eventType: "scorm_complete",
            eventData: JSON.stringify({ score: input.scoreRaw }),
          });
        }
        return { success: true };
      }),

    get: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(({ input }) => getPlaySession(input.sessionToken)),

    listByPackage: protectedProcedure
      .input(z.object({ packageId: z.number(), limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        // org_admin: verify the package belongs to their org
        if (ctx.user.role === "org_admin") {
          const orgId = await getOrgIdForUser(ctx.user.id);
          const pkg = await getPackageById(input.packageId);
          if (!pkg || pkg.orgId !== orgId) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return getPlaySessionsByPackage(input.packageId, input.limit ?? 200);
      }),
  }),

  // ── SCORM LMS API ─────────────────────────────────────────────────────────
  scorm: router({
    getData: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        const session = await getPlaySession(input.sessionToken);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        const data = await getScormData(session.id);
        return data ?? { cmiData: "{}", suspendData: "", lessonStatus: "not attempted", lessonLocation: "", score: null, totalTime: "" };
      }),

    setData: publicProcedure
      .input(z.object({
        sessionToken: z.string(),
        cmiData: z.string().optional(),
        suspendData: z.string().optional(),
        lessonStatus: z.string().optional(),
        lessonLocation: z.string().optional(),
        score: z.number().optional(),
        totalTime: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const session = await getPlaySession(input.sessionToken);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        const { sessionToken, ...data } = input;
        await upsertScormData(session.id, session.packageId, session.userId ?? undefined, data);
        await updatePlaySession(sessionToken, { lastActiveAt: new Date() });
        return { success: true };
      }),
  }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  analytics: router({
    summary: protectedProcedure
      .input(z.object({ orgId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        // org_admin: always scope to their assigned org
        if (ctx.user.role === "org_admin") {
          const orgId = await getOrgIdForUser(ctx.user.id);
          return getAnalyticsSummary(orgId ?? undefined);
        }
        return getAnalyticsSummary(input.orgId);
      }),

    byPackage: protectedProcedure
      .input(z.object({ packageId: z.number() }))
      .query(async ({ input, ctx }) => {
        // org_admin: verify the package belongs to their org before returning data
        if (ctx.user.role === "org_admin") {
          const orgId = await getOrgIdForUser(ctx.user.id);
          const pkg = await getPackageById(input.packageId);
          if (!pkg || pkg.orgId !== orgId) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        return getAnalyticsByPackage(input.packageId);
      }),

    byOrg: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(({ input }) => getAnalyticsByOrg(input.orgId)),

    logEvent: publicProcedure
      .input(z.object({
        packageId: z.number(),
        sessionId: z.number().optional(),
        orgId: z.number().optional(),
        eventType: z.enum(["play_start", "play_end", "play_pause", "play_resume", "download", "scorm_complete", "scorm_pass", "scorm_fail", "page_view", "link_click", "error"]),
        eventData: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await logAnalyticsEvent({
          ...input,
          userId: ctx.user?.id,
          eventData: input.eventData,
        });
        return { success: true };
      }),

    trackDownload: protectedProcedure
      .input(z.object({ packageId: z.number(), orgId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        await incrementDownloadCount(input.packageId);
        await logAnalyticsEvent({
          packageId: input.packageId,
          userId: ctx.user.id,
          orgId: input.orgId,
          eventType: "download",
          eventData: JSON.stringify({}),
        });
        return { success: true };
      }),
  }),

  // ── Quizzes ───────────────────────────────────────────────────────────────
  quizzes: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(({ input }) => getQuizzesByOrg(input.orgId)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        const questions = await getQuestionsByQuiz(input.id);
        const questionsWithChoices = await Promise.all(
          questions.map(async (q) => ({ ...q, choices: await getChoicesByQuestion(q.id) }))
        );
        return { ...quiz, questions: questionsWithChoices };
      }),

    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        packageId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        instructions: z.string().optional(),
        passingScore: z.number().optional(),
        timeLimit: z.number().optional(),
        maxAttempts: z.number().optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleAnswers: z.boolean().optional(),
        showFeedbackImmediately: z.boolean().optional(),
        showCorrectAnswers: z.boolean().optional(),
      }))
      .mutation(({ input, ctx }) => createQuiz({ ...input, createdBy: ctx.user.id })),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        instructions: z.string().optional(),
        passingScore: z.number().optional(),
        timeLimit: z.number().nullable().optional(),
        maxAttempts: z.number().nullable().optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleAnswers: z.boolean().optional(),
        showFeedbackImmediately: z.boolean().optional(),
        showCorrectAnswers: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateQuiz(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteQuiz(input.id)),

    questions: router({
      list: protectedProcedure
        .input(z.object({ quizId: z.number() }))
        .query(async ({ input }) => {
          const questions = await getQuestionsByQuiz(input.quizId);
          return Promise.all(questions.map(async (q) => ({ ...q, choices: await getChoicesByQuestion(q.id) })));
        }),

      upsert: protectedProcedure
        .input(z.object({
          quizId: z.number(),
          questions: z.array(z.object({
            id: z.number().optional(),
            sortOrder: z.number(),
            questionType: z.enum(["multiple_choice", "true_false", "short_answer", "matching", "multiple_select"]),
            questionText: z.string(),
            questionHtml: z.string().optional(),
            imageUrl: z.string().optional(),
            explanation: z.string().optional(),
            points: z.number().optional(),
            choices: z.array(z.object({
              id: z.number().optional(),
              sortOrder: z.number(),
              choiceText: z.string(),
              choiceHtml: z.string().optional(),
              isCorrect: z.boolean(),
              matchTarget: z.string().optional(),
            })).optional(),
          })),
        }))
        .mutation(async ({ input }) => {
          for (const q of input.questions) {
            let questionId = q.id;
            if (!questionId) {
              const newQ = await createQuestion({
                quizId: input.quizId,
                sortOrder: q.sortOrder,
                questionType: q.questionType,
                questionText: q.questionText,
                questionHtml: q.questionHtml,
                imageUrl: q.imageUrl,
                explanation: q.explanation,
                points: q.points ?? 1,
              });
              questionId = newQ.insertId;
            } else {
              await updateQuestion(questionId, {
                sortOrder: q.sortOrder,
                questionType: q.questionType,
                questionText: q.questionText,
                questionHtml: q.questionHtml,
                imageUrl: q.imageUrl,
                explanation: q.explanation,
                points: q.points ?? 1,
              });
            }
            if (q.choices && questionId) {
              await upsertChoices(questionId, q.choices);
            }
          }
          return getQuestionsByQuiz(input.quizId);
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => deleteQuestion(input.id)),
    }),

    attempts: router({
      start: protectedProcedure
        .input(z.object({ quizId: z.number(), packageId: z.number().optional(), orgId: z.number().optional() }))
        .mutation(async ({ input, ctx }) => {
          const existing = await getAttemptsByQuiz(input.quizId, ctx.user.id);
          const attemptNumber = existing.length + 1;
          return createAttempt({
            quizId: input.quizId,
            packageId: input.packageId,
            userId: ctx.user.id,
            orgId: input.orgId,
            attemptNumber,
          });
        }),

      saveResponse: protectedProcedure
        .input(z.object({
          attemptId: z.number(),
          questionId: z.number(),
          responseText: z.string().optional(),
          selectedChoiceIds: z.array(z.number()).optional(),
          timeTakenSeconds: z.number().optional(),
        }))
        .mutation(({ input }) => saveResponse({
          ...input,
          selectedChoiceIds: input.selectedChoiceIds ? JSON.stringify(input.selectedChoiceIds) : undefined,
        })),

      submit: protectedProcedure
        .input(z.object({ attemptId: z.number() }))
        .mutation(({ input }) => submitAttempt(input.attemptId)),

      get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const attempt = await getAttemptById(input.id);
          if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });
          const responses = await getResponsesByAttempt(input.id);
          return { ...attempt, responses };
        }),

      list: protectedProcedure
        .input(z.object({ quizId: z.number() }))
        .query(({ input, ctx }) => getAttemptsByQuiz(input.quizId, ctx.user.id)),
    }),

    analytics: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(({ input }) => getQuizAnalytics(input.quizId)),
  }),

  // ── Folders ────────────────────────────────────────────────────────────────────────────────────
  folders: router({
    // List all folders for the current user's org
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        // org_admin: always scope to their assigned org, ignore input.orgId
        if (ctx.user.role === "org_admin") {
          const orgId = await getOrgIdForUser(ctx.user.id);
          if (!orgId) return [];
          return getFoldersByOrg(orgId);
        }
        return getFoldersByOrg(input.orgId);
      }),

    // Create a new folder
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1).max(255),
        parentId: z.number().nullable().optional(),
        color: z.string().max(32).optional(),
      }))
      .mutation(({ input, ctx }) =>
        createFolder({
          orgId: input.orgId,
          ownerId: ctx.user.id,
          name: input.name.trim(),
          parentId: input.parentId ?? null,
          color: input.color ?? null,
        })
      ),

    // Rename a folder
    rename: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(255) }))
      .mutation(async ({ input }) => {
        await updateFolder(input.id, { name: input.name.trim() });
        return getFolderById(input.id);
      }),

    // Move a folder to a different parent (or to root if parentId is null)
    move: protectedProcedure
      .input(z.object({ id: z.number(), parentId: z.number().nullable() }))
      .mutation(async ({ input }) => {
        // Prevent moving a folder into itself or its own descendant
        if (input.parentId === input.id)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot move a folder into itself" });
        await updateFolder(input.id, { parentId: input.parentId ?? null });
        return getFolderById(input.id);
      }),

    // Delete a folder (children promoted to parent, packages moved to uncategorized)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFolder(input.id);
        return { success: true };
      }),

    // Move a package into a folder (or to root if folderId is null)
    movePackage: protectedProcedure
      .input(z.object({ packageId: z.number(), folderId: z.number().nullable() }))
      .mutation(async ({ input }) => {
        await movePackageToFolder(input.packageId, input.folderId);
        return { success: true };
      }),

    // Reorder folders by updating sortOrder for a batch of IDs
    reorder: protectedProcedure
      .input(z.object({ orderedIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await Promise.all(
          input.orderedIds.map((id, index) => updateFolder(id, { sortOrder: index }))
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
