import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getCoursesByOrg,
  getCourseById,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  getSectionsByCourse,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getFullCurriculum,
  getPricingByCourse,
  createPricing,
  updatePricing,
  deletePricing,
  getEnrollmentsByUser,
  getEnrollmentsByCourse,
  getEnrollment,
  createEnrollment,
  updateEnrollmentProgress,
  getAllLessonProgress,
  upsertLessonProgress,
  getOrgTheme,
  upsertOrgTheme,
  getOrgSubscription,
  getPagesByOrg,
  getPageById,
  getPageByCourse,
  getPublishedPageBySlug,
  createPage,
  updatePage,
  deletePage,
  duplicatePage,
  getInstructorsByOrg,
  upsertInstructor,
  getCouponsByOrg,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  getReviewsByCourse,
  createReview,
  getCertificatesByUser,
  getLmsAnalyticsByOrg,
  getDashboardMetrics,
  getRevenueChartData,
  getRecentActivity,
  getRecentlyEditedCourses,
  getEnrolledCoursesForUser,
} from "./lmsDb";
import { getOrgById, getOrgMember } from "./db";
import {
  listDigitalProducts,
  getDigitalProduct,
  getDigitalProductBySlug,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  listProductPrices,
  upsertProductPrice,
  deleteProductPrice,
  createDigitalOrder,
  markOrderPaid,
  getOrderByToken,
  getOrderById,
  listOrdersForProduct,
  listOrdersForOrg,
  incrementDownloadCount,
  logDownload,
  listDownloadLogs,
  listDownloadLogsForOrder,
  updateOrderStatus,
  getWebinarsByOrg,
  getWebinarById,
  getPublishedWebinarBySlug,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  getWebinarRegistrations,
  getWebinarRegistrationByEmail,
  createWebinarRegistration,
  updateWebinarRegistration,
  createWebinarSession,
  getWebinarSessionByToken,
  updateWebinarSession,
  getWebinarFunnelSteps,
  upsertWebinarFunnelSteps,
  getWebinarStats,
  listEmailCampaigns,
  getEmailCampaignById,
  createEmailCampaign,
  updateEmailCampaign,
  deleteEmailCampaign,
  getEmailCampaignStats,
  getMembersWithEnrollments,
} from "./lmsDb";
import { copyCourse, copyLessonToSection, copySectionToCourse } from "./lmsDbCopy";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { getLimits } from "../shared/tierLimits";

// ─── Role helpers ────────────────────────────────────────────────────────────

async function requireOrgRole(
  userId: number,
  orgId: number,
  allowedRoles: string[] = ["org_admin", "sub_admin", "instructor"]
) {
  const member = await getOrgMember(userId, orgId);
  if (!member || !allowedRoles.includes(member.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return member;
}

async function requireOrgAdmin(userId: number, orgId: number) {
  return requireOrgRole(userId, orgId, ["org_admin", "sub_admin"]);
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const lmsRouter = router({
  // ── Courses ──────────────────────────────────────────────────────────────

  courses: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getCoursesByOrg(input.orgId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const course = await getCourseById(input.id);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        return course;
      }),

    create: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          title: z.string().min(1),
          slug: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        const slug =
          input.slug ??
          input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
            "-" +
            nanoid(4);
        return createCourse({
          orgId: input.orgId,
          title: input.title,
          slug,
          instructorId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          shortDescription: z.string().optional(),
          thumbnailUrl: z.string().optional(),
          promoVideoUrl: z.string().optional(),
          status: z.enum(["draft", "published", "hidden", "private", "archived"]).optional(),
          isPrivate: z.boolean().optional(),
          isHidden: z.boolean().optional(),
          disableTextCopy: z.boolean().optional(),
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
          enableChapterShare: z.boolean().optional(),
          enableCompletionShare: z.boolean().optional(),
          socialShareText: z.string().optional(),
          playerThemeColor: z.string().optional(),
          playerSidebarStyle: z.enum(["full", "minimal", "hidden"]).optional(),
          playerShowProgress: z.boolean().optional(),
          playerAllowNotes: z.boolean().optional(),
          playerShowLessonIcons: z.boolean().optional(),
          completionType: z.enum(["all_lessons", "percentage", "quiz_pass"]).optional(),
          completionPercentage: z.number().optional(),
          welcomeEmailEnabled: z.boolean().optional(),
          welcomeEmailSubject: z.string().optional(),
          welcomeEmailBody: z.string().optional(),
          afterPurchaseRedirectUrl: z.string().optional(),
          headerCode: z.string().optional(),
          footerCode: z.string().optional(),
          designTemplate: z.string().optional(),
          showCompleteButton: z.boolean().optional(),
          enableCertificate: z.boolean().optional(),
          trackProgress: z.boolean().optional(),
          requireSequential: z.boolean().optional(),
          language: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.id);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        const member = await requireOrgRole(ctx.user.id, course.orgId);
        // Gate hidden/private to Pro and Enterprise tiers
        if (input.status === "hidden" || input.status === "private") {
          const sub = await getOrgSubscription(course.orgId);
          const tier = sub?.plan || "free";
          if (!tier.includes("pro") && !tier.includes("enterprise")) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Hidden and Private courses require a Pro or Enterprise plan.",
            });
          }
        }
        const { id, ...data } = input;
        return updateCourse(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.id);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, course.orgId);
        await deleteCourse(input.id);
        return { success: true };
      }),
  }),

  // ── Curriculum ───────────────────────────────────────────────────────────

  curriculum: router({
    get: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return getFullCurriculum(input.courseId);
      }),

    createSection: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          title: z.string().min(1),
          sortOrder: z.number().default(0),
          isFreePreview: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, course.orgId);
        return createSection(input);
      }),

    updateSection: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          courseId: z.number().optional(),
          title: z.string().optional(),
          sortOrder: z.number().optional(),
          isFreePreview: z.boolean().optional(),
          drip: z.string().optional(),
          dripDays: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Tier gate: drip scheduling requires Builder+
        if ((input.drip || input.dripDays) && input.courseId) {
          const course = await getCourseById(input.courseId);
          if (course) {
            const sub = await getOrgSubscription(course.orgId);
            if (!getLimits(sub?.plan).dripScheduling) {
              throw new TRPCError({ code: "FORBIDDEN", message: "Drip scheduling requires a Builder plan or higher." });
            }
          }
        }
        const { id, courseId: _cid, ...data } = input;
        return updateSection(id, data);
      }),

    deleteSection: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSection(input.id);
        return { success: true };
      }),

    reorderSections: protectedProcedure
      .input(z.object({ sectionIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await reorderSections(input.sectionIds);
        return { success: true };
      }),

    createLesson: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          sectionId: z.number(),
          title: z.string().min(1),
          lessonType: z
            .enum([
              "video",
              "text",
              "scorm",
              "quiz",
              "flashcard",
              "exam",
              "pdf",
              "audio",
              "assignment",
              "live",
              "download",
              "weblink",
              "zoom",
            ])
            .default("text"),
          sortOrder: z.number().default(0),
          isFreePreview: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, course.orgId);
        return createLesson(input);
      }),

    updateLesson: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          lessonType: z
            .enum([
              "video",
              "text",
              "scorm",
              "quiz",
              "flashcard",
              "exam",
              "pdf",
              "audio",
              "assignment",
              "live",
              "download",
              "weblink",
              "zoom",
            ])
            .optional(),
          contentJson: z.string().optional(),
          videoUrl: z.string().optional(),
          videoProvider: z.enum(["upload", "youtube", "vimeo", "wistia"]).optional(),
          packageId: z.number().nullish(),
          quizId: z.number().nullish(),
          isFreePreview: z.boolean().optional(),
          isPublished: z.boolean().optional(),
          durationSeconds: z.number().nullish(),
          sortOrder: z.number().optional(),
          downloadUrl: z.string().optional(),
          downloadFileName: z.string().optional(),
          pdfUrl: z.string().optional(),
          audioUrl: z.string().optional(),
          webLinkUrl: z.string().optional(),
          richTextAddOn: z.string().optional(),
          liveSessionJson: z.string().optional(),
          // Lesson banners
          startBannerEnabled: z.boolean().optional(),
          startBannerPosition: z.enum(["top", "bottom", "left"]).optional(),
          startBannerMessage: z.string().optional(),
          startBannerImageUrl: z.string().optional(),
          startBannerSound: z.string().optional(),
          startBannerDurationMs: z.number().optional(),
          completeBannerEnabled: z.boolean().optional(),
          completeBannerPosition: z.enum(["top", "bottom", "left"]).optional(),
          completeBannerMessage: z.string().optional(),
          completeBannerImageUrl: z.string().optional(),
          completeBannerSound: z.string().optional(),
          completeBannerDurationMs: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateLesson(id, data);
      }),

    getLesson: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const lesson = await getLessonById(input.id);
        if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });
        return lesson;
      }),
    deleteLesson: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLesson(input.id);
        return { success: true };
      }),

    reorderLessons: protectedProcedure
      .input(z.object({ lessonIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await reorderLessons(input.lessonIds);
        return { success: true };
      }),
  }),

  // ── Pricing ──────────────────────────────────────────────────────────────

  pricing: router({
    list: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => getPricingByCourse(input.courseId)),

    create: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          orgId: z.number(),
          name: z.string(),
          pricingType: z.enum(["free", "one_time", "subscription", "payment_plan"]),
          price: z.number().default(0),
          currency: z.string().default("USD"),
          billingInterval: z.enum(["month", "year"]).optional(),
          accessDays: z.number().optional(),
          isFeatured: z.boolean().default(false),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return createPricing(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          price: z.number().optional(),
          isFeatured: z.boolean().optional(),
          sortOrder: z.number().optional(),
          accessDays: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePricing(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePricing(input.id);
        return { success: true };
      }),
  }),

  // ── Enrollments ──────────────────────────────────────────────────────────

  enrollments: router({
    myEnrollments: protectedProcedure.query(async ({ ctx }) => {
      return getEnrollmentsByUser(ctx.user.id);
    }),

    byCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input, ctx }) => {
        const course = await getCourseById(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, course.orgId);
        return getEnrollmentsByCourse(input.courseId);
      }),

    enroll: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          orgId: z.number(),
          pricingId: z.number().optional(),
          amountPaid: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getEnrollment(input.courseId, ctx.user.id);
        if (existing) return existing;
        return createEnrollment({
          courseId: input.courseId,
          userId: ctx.user.id,
          orgId: input.orgId,
          pricingId: input.pricingId,
          amountPaid: input.amountPaid,
        });
      }),

    progress: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input, ctx }) => {
        const enrollment = await getEnrollment(input.courseId, ctx.user.id);
        if (!enrollment) {
          // Allow org admins/sub-admins/instructors to preview without enrollment
          const course = await getCourseById(input.courseId);
          if (course) {
            const member = await getOrgMember(ctx.user.id, course.orgId);
            if (member && ["org_admin", "sub_admin", "instructor"].includes(member.role)) {
              return { enrollment: null, lessonProgress: [], isPreview: true };
            }
          }
          return null;
        }
        const lessonProgressList = await getAllLessonProgress(enrollment.id);
        return { enrollment, lessonProgress: lessonProgressList, isPreview: false };
      }),

    updateLessonProgress: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          lessonId: z.number(),
          status: z.enum(["not_started", "in_progress", "completed"]),
          timeSpentSeconds: z.number().optional(),
          scormData: z.string().optional(),
          quizScore: z.number().optional(),
          quizPassed: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const enrollment = await getEnrollment(input.courseId, ctx.user.id);
        if (!enrollment) throw new TRPCError({ code: "FORBIDDEN", message: "Not enrolled" });

        const progress = await upsertLessonProgress({
          enrollmentId: enrollment.id,
          lessonId: input.lessonId,
          userId: ctx.user.id,
          courseId: input.courseId,
          status: input.status,
          timeSpentSeconds: input.timeSpentSeconds,
          scormData: input.scormData,
          quizScore: input.quizScore,
          quizPassed: input.quizPassed,
          completedAt: input.status === "completed" ? new Date() : undefined,
        });

        // Recalculate overall progress
        const allLessons = await getAllLessonProgress(enrollment.id);
        const completed = allLessons.filter((l) => l.status === "completed").length;
        const total = allLessons.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        await updateEnrollmentProgress(enrollment.id, pct, input.lessonId);

        return progress;
      }),
  }),

  // ── Themes ───────────────────────────────────────────────────────────────

  themes: router({
    get: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getOrgTheme(input.orgId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          bgMode: z.enum(["light", "dark"]).optional(),
          primaryColor: z.string().optional(),
          accentColor: z.string().optional(),
          fontFamily: z.string().optional(),
          schoolName: z.string().optional(),
          adminLogoUrl: z.string().optional(),
          faviconUrl: z.string().optional(),
          customCss: z.string().optional(),
          studentPrimaryColor: z.string().optional(),
          studentAccentColor: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        const { orgId, ...data } = input;
        return upsertOrgTheme(orgId, data);
      }),
  }),

  // ── Page Builder ─────────────────────────────────────────────────────────

  pages: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getPagesByOrg(input.orgId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const page = await getPageById(input.id);
        if (!page) throw new TRPCError({ code: "NOT_FOUND" });
        return page;
      }),

    getByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return getPageByCourse(input.courseId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          courseId: z.number().optional(),
          pageType: z
            .enum(["course_sales", "school_home", "custom", "checkout", "thank_you"])
            .default("course_sales"),
          title: z.string().optional(),
          slug: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return createPage({ ...input, blocksJson: "[]" });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          blocksJson: z.string().optional(),
          isPublished: z.boolean().optional(),
          showHeader: z.boolean().optional(),
          showFooter: z.boolean().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
          customCss: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePage(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePage(input.id);
        return { success: true };
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const page = await getPublishedPageBySlug(input.slug);
        if (!page) throw new TRPCError({ code: "NOT_FOUND" });
        return page;
      }),

    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const original = await getPageById(input.id);
        if (!original) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, original.orgId);
        const copy = await duplicatePage(input.id);
        return copy;
      }),
  }),

  // ── Instructors ──────────────────────────────────────────────────────────

  instructors: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getInstructorsByOrg(input.orgId);
      }),

    upsert: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          displayName: z.string().optional(),
          title: z.string().optional(),
          bio: z.string().optional(),
          avatarUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return upsertInstructor({ ...input, userId: ctx.user.id });
      }),
  }),

  // ── Coupons ──────────────────────────────────────────────────────────────

  coupons: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getCouponsByOrg(input.orgId);
      }),

    validate: protectedProcedure
      .input(z.object({ orgId: z.number(), code: z.string() }))
      .query(async ({ input }) => {
        return getCouponByCode(input.orgId, input.code);
      }),

    create: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          code: z.string().min(1),
          discountType: z.enum(["percentage", "fixed"]).default("percentage"),
          discountValue: z.number(),
          maxUses: z.number().optional(),
          expiresAt: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return createCoupon(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          isActive: z.boolean().optional(),
          maxUses: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateCoupon(id, data);
      }),
  }),

  // ── Reviews ──────────────────────────────────────────────────────────────

  reviews: router({
    byCourse: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => getReviewsByCourse(input.courseId)),

    create: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          orgId: z.number(),
          rating: z.number().min(1).max(5),
          reviewText: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createReview({ ...input, userId: ctx.user.id });
      }),
  }),

  // ── Analytics ────────────────────────────────────────────────────────────

  analytics: router({
    summary: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getLmsAnalyticsByOrg(input.orgId);
      }),
  }),

  // ── Certificates ─────────────────────────────────────────────────────────

  certificates: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      return getCertificatesByUser(ctx.user.id);
    }),
  }),

  // ── Subscription ─────────────────────────────────────────────────────────

  subscription: router({
    get: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getOrgSubscription(input.orgId);
      }),
  }),

  // ── Copy / Duplicate ─────────────────────────────────────────────────────

  copy: router({
    course: protectedProcedure
      .input(z.object({ courseId: z.number(), newTitle: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, course.orgId);
        const newTitle = input.newTitle ?? `Copy of ${course.title}`;
        const newSlug =
          newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
          "-" +
          nanoid(4);
        return copyCourse(input.courseId, newTitle, newSlug);
      }),
    lesson: protectedProcedure
      .input(
        z.object({
          lessonId: z.number(),
          targetCourseId: z.number(),
          targetSectionId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.targetCourseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, course.orgId);
        return copyLessonToSection(
          input.lessonId,
          input.targetCourseId,
          input.targetSectionId
        );
      }),
    section: protectedProcedure
      .input(z.object({ sectionId: z.number(), targetCourseId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.targetCourseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, course.orgId);
        return copySectionToCourse(input.sectionId, input.targetCourseId);
      }),
  }),

  // ── AI Generation ─────────────────────────────────────────────────────────

  ai: router({
    generateCourse: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          topic: z.string().min(3),
          numModules: z.number().default(3),
          numLessonsPerModule: z.number().default(4),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        // Tier gate: AI generation requires Starter+
        const sub = await getOrgSubscription(input.orgId);
        if (!getLimits(sub?.plan).aiGeneration) {
          throw new TRPCError({ code: "FORBIDDEN", message: "AI course generation requires a Starter plan or higher. Please upgrade to use this feature." });
        }
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert instructional designer. Return valid JSON only, no markdown.",
            },
            {
              role: "user",
              content: `Create a course outline for: "${input.topic}". Return JSON: { "title": string, "description": string, "modules": [{ "title": string, "lessons": [{ "title": string, "type": "text"|"video"|"quiz"|"assignment", "description": string }] }] }. Create ${input.numModules} modules with ${input.numLessonsPerModule} lessons each.`,
            },
          ],
        });
        const rawContent = response.choices?.[0]?.message?.content ?? "{}";
        const content = typeof rawContent === "string" ? rawContent : "{}";
        try {
          const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
          return JSON.parse(cleaned);
        } catch {
          return { title: input.topic, description: "", modules: [] };
        }
      }),

    generateQuiz: protectedProcedure
      .input(
        z.object({
          topic: z.string().min(3),
          numQuestions: z.number().default(10),
          difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert quiz creator. Return valid JSON only, no markdown.",
            },
            {
              role: "user",
              content: `Create ${input.numQuestions} ${input.difficulty} multiple-choice questions about: "${input.topic}". Return JSON: { "questions": [{ "text": string, "choices": [{ "text": string, "isCorrect": boolean }], "explanation": string }] }`,
            },
          ],
        });
        const rawContent = response.choices?.[0]?.message?.content ?? "{}";
        const content = typeof rawContent === "string" ? rawContent : "{}";
        try {
          const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
          return JSON.parse(cleaned);
        } catch {
          return { questions: [] };
        }
      }),

    generateFlashcards: protectedProcedure
      .input(
        z.object({
          topic: z.string().min(3),
          numCards: z.number().default(15),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert educator. Return valid JSON only, no markdown.",
            },
            {
              role: "user",
              content: `Create ${input.numCards} flashcards about: "${input.topic}". Return JSON: { "cards": [{ "front": string, "back": string }] }`,
            },
          ],
        });
        const rawContent = response.choices?.[0]?.message?.content ?? "{}";
        const content = typeof rawContent === "string" ? rawContent : "{}";
        try {
          const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
          return JSON.parse(cleaned);
        } catch {
          return { cards: [] };
        }
      }),
  }),

  // ── Dashboard Analytics ─────────────────────────────────────────────────

  dashboard: router({
    metrics: protectedProcedure
      .input(z.object({ orgId: z.number(), days: z.number().default(30) }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getDashboardMetrics(input.orgId, input.days);
      }),
    chartData: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        days: z.number().default(30),
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
      }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getRevenueChartData(input.orgId, input.days, input.groupBy);
      }),
    recentActivity: protectedProcedure
      .input(z.object({ orgId: z.number(), limit: z.number().default(20) }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getRecentActivity(input.orgId, input.limit);
      }),
    recentCourses: protectedProcedure
      .input(z.object({ orgId: z.number(), limit: z.number().default(6) }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getRecentlyEditedCourses(input.orgId, input.limit);
      }),
    enrolledCourses: protectedProcedure
      .query(async ({ ctx }) => {
        return getEnrolledCoursesForUser(ctx.user.id);
      }),
  }),

  // ── Members ───────────────────────────────────────────────

  members: router({
    listWithEnrollments: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getMembersWithEnrollments } = await import("./lmsDb");
        return getMembersWithEnrollments(input.orgId);
      }),
    manualEnroll: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        courseId: z.number(),
        email: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getUserByEmail } = await import("./db");
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user found with that email address" });
        const existing = await getEnrollment(input.courseId, user.id);
        if (existing) return existing;
        return createEnrollment({
          courseId: input.courseId,
          userId: user.id,
          orgId: input.orgId,
          amountPaid: 0,
        });
      }),
  }),

  // ── Activity Tracking ───────────────────────────────────────────────

  activity: router({
    // Batch ingest events from the client tracker (protected — must be logged in)
    ingest: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          events: z.array(
            z.object({
              sessionKey: z.string(),
              eventType: z.enum([
                "page_view", "page_exit", "session_start", "session_heartbeat", "session_end",
                "video_play", "video_pause", "video_seek", "video_complete", "video_progress",
                "lesson_start", "lesson_complete", "quiz_start", "quiz_submit",
                "download", "link_click", "button_click", "search", "enrollment", "course_complete",
              ]),
              pageUrl: z.string().optional(),
              pageTitle: z.string().optional(),
              courseId: z.number().nullish(),
              lessonId: z.number().nullish(),
              quizId: z.number().nullish(),
              durationMs: z.number().nullish(),
              videoPositionSec: z.number().nullish(),
              videoDurationSec: z.number().nullish(),
              metadata: z.string().nullish(),
              referrer: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { insertActivityEvents } = await import("./lmsDb");
        await insertActivityEvents(
          input.events.map((e) => ({
            ...e,
            userId: ctx.user.id,
            orgId: input.orgId,
            userAgent: undefined,
          }))
        );
        return { ok: true };
      }),

    // Query events for a specific org (admin only)
    list: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          userId: z.number().optional(),
          courseId: z.number().optional(),
          eventType: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          limit: z.number().default(200),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getActivityEventsByOrg } = await import("./lmsDb");
        return getActivityEventsByOrg(input.orgId, {
          userId: input.userId,
          courseId: input.courseId,
          eventType: input.eventType,
          dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
          dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    // Summary stats for a specific user
    userSummary: protectedProcedure
      .input(z.object({ orgId: z.number(), userId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getActivitySummaryByUser } = await import("./lmsDb");
        return getActivitySummaryByUser(input.orgId, input.userId);
      }),

    // List all members who have activity
    memberList: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getActivityMemberList } = await import("./lmsDb");
        const userIds = await getActivityMemberList(input.orgId);
        // Fetch user details for each
        const { getUserById } = await import("./db");
        const members = await Promise.all(
          userIds.map(async (uid) => {
            const u = await getUserById(uid);
            return u ? { id: u.id, name: u.name, email: u.email } : null;
          })
        );
        return members.filter(Boolean);
      }),
  }),

  // ── Notification Settings ────────────────────────────────────────────────

  notifications: router({
    getOrgSettings: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getOrgNotificationSettings } = await import("./lmsDb");
        return getOrgNotificationSettings(input.orgId);
      }),

    updateOrgSettings: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          enrollment: z.boolean().optional(),
          completion: z.boolean().optional(),
          quizResult: z.boolean().optional(),
          reminder: z.boolean().optional(),
          announcement: z.boolean().optional(),
          weeklyDigest: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { updateOrgNotificationSettings } = await import("./lmsDb");
        const { orgId, ...settings } = input;
        return updateOrgNotificationSettings(orgId, settings);
      }),

    getCourseOverrides: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input, ctx }) => {
        const course = await getCourseById(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, course.orgId);
        const { getCourseNotificationOverrides } = await import("./lmsDb");
        return getCourseNotificationOverrides(input.courseId);
      }),

    updateCourseOverrides: protectedProcedure
      .input(
        z.object({
          courseId: z.number(),
          overrides: z.object({
            enrollment: z.boolean().optional(),
            completion: z.boolean().optional(),
            quizResult: z.boolean().optional(),
            reminder: z.boolean().optional(),
          }).nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const course = await getCourseById(input.courseId);
        if (!course) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, course.orgId);
        const { updateCourseNotificationOverrides } = await import("./lmsDb");
        await updateCourseNotificationOverrides(input.courseId, input.overrides);
        return { ok: true };
      }),
  }),

  // ── Email Branding ───────────────────────────────────────────────────────

  emailBranding: router({
    get: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { getOrgEmailBranding } = await import("./lmsDb");
        return getOrgEmailBranding(input.orgId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          logoUrl: z.string().optional(),
          primaryColor: z.string().optional(),
          footerText: z.string().optional(),
          senderName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        const { updateOrgEmailBranding } = await import("./lmsDb");
        const { orgId, ...branding } = input;
        return updateOrgEmailBranding(orgId, branding);
      }),
  }),

  // ── Digital Downloads ─────────────────────────────────────────────────
  downloads: router({
    // Product CRUD
    listProducts: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return listDigitalProducts(input.orgId);
      }),

    getProduct: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await getDigitalProduct(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        return product;
      }),

    getProductBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await getDigitalProductBySlug(input.slug);
        if (!product || !product.isPublished) throw new TRPCError({ code: "NOT_FOUND" });
        const prices = await listProductPrices(product.id);
        return { ...product, prices: prices.filter((p) => p.isActive) };
      }),

    createProduct: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        title: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        thumbnailUrl: z.string().optional(),
        defaultAccessDays: z.number().nullable().optional(),
        defaultMaxDownloads: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return createDigitalProduct(input as any);
      }),

    updateProduct: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
        thumbnailUrl: z.string().optional(),
        salesPageBlocksJson: z.any().optional(),
        isPublished: z.boolean().optional(),
        defaultAccessDays: z.number().nullable().optional(),
        defaultMaxDownloads: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const product = await getDigitalProduct(id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        await updateDigitalProduct(id, data as any);
        return getDigitalProduct(id);
      }),

    deleteProduct: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const product = await getDigitalProduct(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        await deleteDigitalProduct(input.id);
        return { ok: true };
      }),

    // Prices
    listPrices: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await getDigitalProduct(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        return listProductPrices(input.productId);
      }),

    upsertPrice: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        productId: z.number(),
        label: z.string(),
        type: z.enum(["one_time", "payment_plan"]),
        amount: z.string(),
        currency: z.string().optional(),
        installments: z.number().nullable().optional(),
        installmentAmount: z.string().nullable().optional(),
        intervalDays: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const product = await getDigitalProduct(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        return upsertProductPrice(input as any);
      }),

    deletePrice: protectedProcedure
      .input(z.object({ id: z.number(), productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const product = await getDigitalProduct(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        await deleteProductPrice(input.id);
        return { ok: true };
      }),

    // Orders
    createOrder: publicProcedure
      .input(z.object({
        productId: z.number(),
        priceId: z.number(),
        buyerEmail: z.string().email(),
        buyerName: z.string().optional(),
        paymentRef: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const product = await getDigitalProduct(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        const prices = await listProductPrices(input.productId);
        const price = prices.find((p) => p.id === input.priceId);
        if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Price not found" });
        // Calculate access expiry
        const accessExpiresAt = product.defaultAccessDays
          ? new Date(Date.now() + product.defaultAccessDays * 86400000)
          : null;
        const order = await createDigitalOrder({
          productId: input.productId,
          priceId: input.priceId,
          orgId: product.orgId,
          buyerEmail: input.buyerEmail,
          buyerName: input.buyerName,
          amount: price.amount,
          currency: price.currency ?? "USD",
          paymentRef: input.paymentRef,
          accessExpiresAt,
          maxDownloads: product.defaultMaxDownloads ?? null,
        });
        // Auto-mark as paid if no payment ref required (free or manual)
        if (input.paymentRef) {
          await markOrderPaid(order.id, input.paymentRef);
        }
        return order;
      }),

    confirmPayment: protectedProcedure
      .input(z.object({ orderId: z.number(), paymentRef: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const product = await getDigitalProduct(order.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        await markOrderPaid(input.orderId, input.paymentRef);
        return { ok: true };
      }),

    getOrderByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const order = await getOrderByToken(input.token);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const product = await getDigitalProduct(order.productId);
        const now = new Date();
        const expired = order.accessExpiresAt ? order.accessExpiresAt < now : false;
        const limitReached = order.maxDownloads ? (order.downloadCount ?? 0) >= order.maxDownloads : false;
        return {
          ...order,
          product: product ? { title: product.title, thumbnailUrl: product.thumbnailUrl } : null,
          canDownload: order.status === "paid" && !expired && !limitReached,
          expired,
          limitReached,
        };
      }),

    listOrders: protectedProcedure
      .input(z.object({ orgId: z.number(), productId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        if (input.productId) return listOrdersForProduct(input.productId);
        return listOrdersForOrg(input.orgId);
      }),

    updateOrderStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string(), notes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const product = await getDigitalProduct(order.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, product.orgId);
        await updateOrderStatus(input.id, input.status, input.notes);
        return { ok: true };
      }),

    listDownloadLogs: protectedProcedure
      .input(z.object({ orgId: z.number(), productId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        if (input.productId) return listDownloadLogs(input.productId);
        // Return logs for all products in this org
        const products = await listDigitalProducts(input.orgId);
        const allLogs = await Promise.all(products.map((p) => listDownloadLogs(p.id)));
        return allLogs.flat().sort((a, b) => new Date(b.downloadedAt!).getTime() - new Date(a.downloadedAt!).getTime());
      }),
  }),

  // ── Webinars ─────────────────────────────────────────────────────────────
  webinars: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        return getWebinarsByOrg(input.orgId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const w = await getWebinarById(input.id);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, w.orgId);
        return w;
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getPublishedWebinarBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        title: z.string(),
        slug: z.string(),
        type: z.enum(["live", "evergreen"]).default("evergreen"),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return createWebinar(input as any);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().nullish(),
        type: z.enum(["live", "evergreen"]).optional(),
        videoSource: z.enum(["upload", "youtube", "vimeo", "zoom", "teams", "embed"]).optional(),
        videoUrl: z.string().nullish(),
        videoFileUrl: z.string().nullish(),
        videoFileKey: z.string().nullish(),
        meetingUrl: z.string().nullish(),
        meetingId: z.string().nullish(),
        scheduledAt: z.string().nullish(),
        durationMinutes: z.number().nullish(),
        timezone: z.string().optional(),
        replayDelayMinutes: z.number().optional(),
        aiViewersEnabled: z.boolean().optional(),
        aiViewersMin: z.number().optional(),
        aiViewersMax: z.number().optional(),
        aiViewersPeakAt: z.number().optional(),
        salesPageBlocksJson: z.any().optional(),
        thumbnailUrl: z.string().nullish(),
        requireRegistration: z.boolean().optional(),
        registrationFormFields: z.any().optional(),
        postWebinarAction: z.enum(["product", "url", "thankyou", "none"]).optional(),
        postWebinarProductId: z.number().nullish(),
        postWebinarUrl: z.string().nullish(),
        postWebinarMessage: z.string().nullish(),
        postWebinarDelaySeconds: z.number().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const w = await getWebinarById(id);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, w.orgId);
        const updateData: any = { ...data };
        if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
        return updateWebinar(id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const w = await getWebinarById(input.id);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, w.orgId);
        await deleteWebinar(input.id);
        return { ok: true };
      }),

    // Funnel steps
    getFunnelSteps: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input, ctx }) => {
        const w = await getWebinarById(input.webinarId);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, w.orgId);
        return getWebinarFunnelSteps(input.webinarId);
      }),

    saveFunnelSteps: protectedProcedure
      .input(z.object({
        webinarId: z.number(),
        steps: z.array(z.object({
          stepType: z.enum(["registration", "confirmation", "reminder", "watch", "offer", "thankyou"]),
          title: z.string().optional(),
          pageBlocksJson: z.any().optional(),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          triggerType: z.enum(["immediate", "delay", "scheduled"]).optional(),
          triggerDelayMinutes: z.number().optional(),
          isActive: z.boolean().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const w = await getWebinarById(input.webinarId);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, w.orgId);
        await upsertWebinarFunnelSteps(input.webinarId, input.steps as any);
        return { ok: true };
      }),

    // Registration (public)
    register: publicProcedure
      .input(z.object({
        webinarId: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        customFields: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const w = await getWebinarById(input.webinarId);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        // Upsert registration
        const existing = await getWebinarRegistrationByEmail(input.webinarId, input.email);
        if (existing) return { registration: existing, alreadyRegistered: true };
        const reg = await createWebinarRegistration({
          webinarId: input.webinarId,
          orgId: w.orgId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          customFields: input.customFields,
          ipAddress: (ctx as any).req?.ip,
        });
        return { registration: reg, alreadyRegistered: false };
      }),

    // Start session (creates a session token for the watch page)
    startSession: publicProcedure
      .input(z.object({
        webinarId: z.number(),
        registrationId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const token = nanoid(32);
        const session = await createWebinarSession({
          webinarId: input.webinarId,
          registrationId: input.registrationId,
          sessionToken: token,
          ipAddress: (ctx as any).req?.ip,
          userAgent: (ctx as any).req?.headers?.['user-agent'],
        });
        return { sessionToken: token, sessionId: session?.id };
      }),

    // Heartbeat (updates watch time)
    heartbeat: publicProcedure
      .input(z.object({
        sessionToken: z.string(),
        watchedSeconds: z.number(),
        currentViewerCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const session = await getWebinarSessionByToken(input.sessionToken);
        if (!session) return { ok: false };
        await updateWebinarSession(session.id, {
          watchedSeconds: input.watchedSeconds,
          lastHeartbeatAt: new Date(),
          peakViewerCount: Math.max(session.peakViewerCount ?? 0, input.currentViewerCount ?? 0),
        });
        // Mark registration as attended if watched > 60s
        if (session.registrationId && input.watchedSeconds > 60) {
          await updateWebinarRegistration(session.registrationId, { attended: true, watchedSeconds: input.watchedSeconds });
        }
        return { ok: true };
      }),

    // Mark conversion (clicked post-webinar CTA)
    markConverted: publicProcedure
      .input(z.object({ registrationId: z.number() }))
      .mutation(async ({ input }) => {
        await updateWebinarRegistration(input.registrationId, { convertedAt: new Date() });
        return { ok: true };
      }),

    // AI viewer count generator
    getAiViewerCount: publicProcedure
      .input(z.object({
        webinarId: z.number(),
        elapsedMinutes: z.number(),
      }))
      .query(async ({ input }) => {
        const w = await getWebinarById(input.webinarId);
        if (!w || !w.aiViewersEnabled) return { count: 0 };
        const min = w.aiViewersMin ?? 50;
        const max = w.aiViewersMax ?? 300;
        const peak = w.aiViewersPeakAt ?? 30;
        const elapsed = input.elapsedMinutes;
        const duration = w.durationMinutes ?? 60;
        // Bell-curve style: ramp up to peak, then gradually decline
        let ratio: number;
        if (elapsed <= peak) {
          ratio = elapsed / peak;
        } else {
          ratio = 1 - ((elapsed - peak) / (duration - peak)) * 0.4;
        }
        ratio = Math.max(0.1, Math.min(1, ratio));
        const base = Math.round(min + (max - min) * ratio);
        // Add small random jitter ±5%
        const jitter = Math.round(base * 0.05 * (Math.random() * 2 - 1));
        return { count: Math.max(1, base + jitter) };
      }),

    // Reports
    getRegistrations: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input, ctx }) => {
        const w = await getWebinarById(input.webinarId);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, w.orgId);
        return getWebinarRegistrations(input.webinarId);
      }),

    getStats: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input, ctx }) => {
        const w = await getWebinarById(input.webinarId);
        if (!w) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgRole(ctx.user.id, w.orgId);
        return getWebinarStats(input.webinarId);
      }),
  }),

  // ── Email Marketing ─────────────────────────────────────────────────────
  emailMarketing: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return listEmailCampaigns(input.orgId);
      }),
    stats: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return getEmailCampaignStats(input.orgId);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const c = await getEmailCampaignById(input.id);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, c.orgId!);
        return c;
      }),
    create: protectedProcedure
      .input(z.object({
        orgId: z.number(),
        name: z.string().min(1),
        subject: z.string().min(1),
        htmlBody: z.string(),
        textBody: z.string().optional(),
        scheduledAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await requireOrgAdmin(ctx.user.id, input.orgId);
        return createEmailCampaign({ ...input, createdBy: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        htmlBody: z.string().optional(),
        textBody: z.string().optional(),
        status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
        scheduledAt: z.date().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const c = await getEmailCampaignById(input.id);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, c.orgId!);
        const { id, ...data } = input;
        return updateEmailCampaign(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const c = await getEmailCampaignById(input.id);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAdmin(ctx.user.id, c.orgId!);
        await deleteEmailCampaign(input.id);
        return { ok: true };
      }),
  }),
  // ── Media Upload ────────────────────────────────────────────────────────
  media: router({
    getUploadUrl: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          fileName: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await requireOrgRole(ctx.user.id, input.orgId);
        const ext = input.fileName.split(".").pop() ?? "bin";
        const key = `lms-media/${input.orgId}/${Date.now()}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, Buffer.alloc(0), input.contentType);
        const fileUrl = url.split("?")[0];
        return { key, fileUrl, uploadUrl: url };
      }),
  }),
});
