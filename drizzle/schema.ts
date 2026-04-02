import {
  bigint,
  boolean,
  float,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["site_owner", "site_admin", "org_admin", "user"]).default("user").notNull(),
  // Custom Teachific auth fields
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 128 }),
  emailVerificationExpiry: timestamp("emailVerificationExpiry"),
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Organizations ────────────────────────────────────────────────────────────
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  ownerId: int("ownerId").notNull(),
  maxStorageBytes: bigint("maxStorageBytes", { mode: "number" }).default(10737418240),
  usedStorageBytes: bigint("usedStorageBytes", { mode: "number" }).default(0),
  isActive: boolean("isActive").default(true).notNull(),
  // Custom domain for Pro+ orgs
  customDomain: varchar("customDomain", { length: 255 }),
  // Custom sender email for Builder+ orgs
  customSenderEmail: varchar("customSenderEmail", { length: 320 }),
  customSenderName: varchar("customSenderName", { length: 255 }),
  senderDomainVerified: boolean("senderDomainVerified").default(false).notNull(),
  senderDomainVerifiedAt: timestamp("senderDomainVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── Organization Members ─────────────────────────────────────────────────────
export const orgMembers = mysqlTable("org_members", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["org_admin", "user"]).default("user").notNull(),
  invitedBy: int("invitedBy"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type OrgMember = typeof orgMembers.$inferSelect;
export type InsertOrgMember = typeof orgMembers.$inferInsert;

// ─── Content Folders ────────────────────────────────────────────────────────────
export const contentFolders = mysqlTable("content_folders", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  ownerId: int("ownerId").notNull(),
  parentId: int("parentId"), // null = root folder
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 32 }), // optional accent color
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentFolder = typeof contentFolders.$inferSelect;
export type InsertContentFolder = typeof contentFolders.$inferInsert;

// ─── Content Packages ─────────────────────────────────────────────────────────
export const contentPackages = mysqlTable("content_packages", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  tags: text("tags"), // JSON string stored as text for TiDB compatibility
  scormVersion: mysqlEnum("scormVersion", ["1.2", "2004", "none"]).default("none").notNull(),
  scormEntryPoint: text("scormEntryPoint"),
  scormManifest: text("scormManifest"), // JSON string
  contentType: mysqlEnum("contentType", ["scorm", "html", "articulate", "ispring", "unknown"]).default("unknown").notNull(),
  // Display mode chosen at import
  displayMode: varchar("displayMode", { length: 20 }).default("native").notNull(), // 'native' | 'lms_shell' | 'quiz'
  lmsShellConfig: text("lmsShellConfig"), // JSON: { themeColor, showSidebar, showProgress, allowNotes, showCompletionBadge }
  llmSummary: text("llmSummary"),
  llmTags: text("llmTags"), // JSON string
  llmValidationNotes: text("llmValidationNotes"),
  originalZipKey: text("originalZipKey").notNull(),
  originalZipUrl: text("originalZipUrl").notNull(),
  originalZipSize: bigint("originalZipSize", { mode: "number" }).default(0),
  extractedFolderKey: text("extractedFolderKey"),
  status: mysqlEnum("status", ["uploading", "processing", "ready", "error"]).default("uploading").notNull(),
  processingError: text("processingError"),
  currentVersionId: int("currentVersionId"),
  totalPlayCount: int("totalPlayCount").default(0).notNull(),
  totalDownloadCount: int("totalDownloadCount").default(0).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  autoFullscreenMobile: boolean("autoFullscreenMobile").default(false).notNull(),
  folderId: int("folderId"), // null = root / uncategorized
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentPackage = typeof contentPackages.$inferSelect;
export type InsertContentPackage = typeof contentPackages.$inferInsert;

// ─── Content Versions ─────────────────────────────────────────────────────────
export const contentVersions = mysqlTable("content_versions", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  versionLabel: varchar("versionLabel", { length: 100 }),
  changelog: text("changelog"),
  uploadedBy: int("uploadedBy").notNull(),
  zipKey: text("zipKey").notNull(),
  zipUrl: text("zipUrl").notNull(),
  zipSize: bigint("zipSize", { mode: "number" }).default(0),
  extractedFolderKey: text("extractedFolderKey"),
  entryPoint: text("entryPoint"),
  fileCount: int("fileCount").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  replacedAt: timestamp("replacedAt"), // set when a newer version becomes current; null = still current
});

export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = typeof contentVersions.$inferInsert;

// ─── File Assets ──────────────────────────────────────────────────────────────
export const fileAssets = mysqlTable("file_assets", {
  id: int("id").autoincrement().primaryKey(),
  versionId: int("versionId").notNull(),
  packageId: int("packageId").notNull(),
  relativePath: text("relativePath").notNull(),
  s3Key: text("s3Key").notNull(),
  s3Url: text("s3Url").notNull(),
  mimeType: varchar("mimeType", { length: 255 }),
  fileSize: bigint("fileSize", { mode: "number" }).default(0),
  isEntryPoint: boolean("isEntryPoint").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileAsset = typeof fileAssets.$inferSelect;

// ─── Permissions ──────────────────────────────────────────────────────────────
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull().unique(),
  allowDownload: boolean("allowDownload").default(false).notNull(),
  downloadRequiresAuth: boolean("downloadRequiresAuth").default(true).notNull(),
  maxPlaysPerUser: int("maxPlaysPerUser"),
  maxTotalPlays: int("maxTotalPlays"),
  playExpiresAt: timestamp("playExpiresAt"),
  allowEmbed: boolean("allowEmbed").default(true).notNull(),
  allowedEmbedDomains: text("allowedEmbedDomains"), // JSON string
  allowExternalLinks: boolean("allowExternalLinks").default(true).notNull(),
  requiresAuth: boolean("requiresAuth").default(true).notNull(),
  allowedOrgIds: text("allowedOrgIds"), // JSON string
  allowedUserIds: text("allowedUserIds"), // JSON string
  shareToken: varchar("shareToken", { length: 64 }),
  shareTokenExpiresAt: timestamp("shareTokenExpiresAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// ─── Play Sessions ─────────────────────────────────────────────────────────────
export const playSessions = mysqlTable("play_sessions", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  versionId: int("versionId"),
  userId: int("userId"),
  orgId: int("orgId"),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  durationSeconds: int("durationSeconds").default(0),
  completionStatus: mysqlEnum("completionStatus", ["not_attempted", "incomplete", "completed", "passed", "failed", "unknown"]).default("not_attempted"),
  scoreRaw: float("scoreRaw"),
  scoreMax: float("scoreMax"),
  scoreMin: float("scoreMin"),
  scoreScaled: float("scoreScaled"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  country: varchar("country", { length: 2 }),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  // Dynamic URL parameters for learner identity & tracking
  learnerName:   varchar("learnerName",   { length: 255 }),
  learnerEmail:  varchar("learnerEmail",  { length: 320 }),
  learnerId:     varchar("learnerId",     { length: 128 }),
  learnerGroup:  varchar("learnerGroup",  { length: 128 }),
  customData:    text("customData"),
  utmSource:     varchar("utmSource",     { length: 128 }),
  utmMedium:     varchar("utmMedium",     { length: 128 }),
  utmCampaign:   varchar("utmCampaign",   { length: 128 }),
});

export type PlaySession = typeof playSessions.$inferSelect;
export type InsertPlaySession = typeof playSessions.$inferInsert;

// ─── SCORM CMI Data ───────────────────────────────────────────────────────────
export const scormData = mysqlTable("scorm_data", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  packageId: int("packageId").notNull(),
  userId: int("userId"),
  cmiData: text("cmiData"), // JSON string
  suspendData: text("suspendData"),
  lessonStatus: varchar("lessonStatus", { length: 64 }),
  lessonLocation: text("lessonLocation"),
  score: float("score"),
  totalTime: varchar("totalTime", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScormData = typeof scormData.$inferSelect;

// ─── Analytics Events ─────────────────────────────────────────────────────────
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  sessionId: int("sessionId"),
  userId: int("userId"),
  orgId: int("orgId"),
  eventType: mysqlEnum("eventType", [
    "play_start",
    "play_end",
    "play_pause",
    "play_resume",
    "download",
    "scorm_complete",
    "scorm_pass",
    "scorm_fail",
    "page_view",
    "link_click",
    "error",
  ]).notNull(),
  eventData: text("eventData"), // JSON string
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => ({
  packageIdx: index("analytics_package_idx").on(table.packageId),
  orgIdx: index("analytics_org_idx").on(table.orgId),
  eventTypeIdx: index("analytics_event_type_idx").on(table.eventType),
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId"), // null = standalone quiz
  orgId: int("orgId").notNull(),
  createdBy: int("createdBy").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  passingScore: float("passingScore").default(70),
  timeLimit: int("timeLimit"), // seconds, null = no limit
  maxAttempts: int("maxAttempts"), // null = unlimited
  shuffleQuestions: boolean("shuffleQuestions").default(false).notNull(),
  shuffleAnswers: boolean("shuffleAnswers").default(false).notNull(),
  showFeedbackImmediately: boolean("showFeedbackImmediately").default(true).notNull(),
  showCorrectAnswers: boolean("showCorrectAnswers").default(true).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// ─── Quiz Questions ───────────────────────────────────────────────────────────
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  questionType: mysqlEnum("questionType", [
    "multiple_choice",
    "true_false",
    "short_answer",
    "matching",
    "multiple_select",
  ]).default("multiple_choice").notNull(),
  questionText: text("questionText").notNull(),
  questionHtml: text("questionHtml"),
  imageUrl: text("imageUrl"),
  explanation: text("explanation"),
  points: float("points").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// ─── Quiz Answer Choices ──────────────────────────────────────────────────────
export const quizAnswerChoices = mysqlTable("quiz_answer_choices", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  choiceText: text("choiceText").notNull(),
  choiceHtml: text("choiceHtml"),
  isCorrect: boolean("isCorrect").default(false).notNull(),
  matchTarget: text("matchTarget"), // for matching questions
});

export type QuizAnswerChoice = typeof quizAnswerChoices.$inferSelect;

// ─── Quiz Attempts ────────────────────────────────────────────────────────────
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  packageId: int("packageId"),
  userId: int("userId"),
  sessionId: int("sessionId"),
  orgId: int("orgId"),
  attemptNumber: int("attemptNumber").default(1).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  scoreRaw: float("scoreRaw"),
  scorePct: float("scorePct"),
  isPassed: boolean("isPassed"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  timeTakenSeconds: int("timeTakenSeconds"),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;

// ─── Quiz Responses ───────────────────────────────────────────────────────────
export const quizResponses = mysqlTable("quiz_responses", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  questionId: int("questionId").notNull(),
  responseText: text("responseText"),
  selectedChoiceIds: text("selectedChoiceIds"), // JSON array of choice IDs
  isCorrect: boolean("isCorrect"),
  pointsEarned: float("pointsEarned").default(0),
  timeTakenSeconds: int("timeTakenSeconds"),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});

export type QuizResponse = typeof quizResponses.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// LMS PLATFORM TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Org Theme ────────────────────────────────────────────────────────────────
export const orgThemes = mysqlTable("org_themes", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull().unique(),
  // Admin UI theming (light/dark + custom colors)
  bgMode: mysqlEnum("bgMode", ["light", "dark"]).default("light").notNull(),
  primaryColor: varchar("primaryColor", { length: 32 }).default("#189aa1").notNull(),
  accentColor: varchar("accentColor", { length: 32 }).default("#4ad9e0").notNull(),
  fontFamily: varchar("fontFamily", { length: 128 }).default("Inter").notNull(),
  // School branding (student-facing)
  schoolName: varchar("schoolName", { length: 255 }),
  adminLogoUrl: text("adminLogoUrl"),
  faviconUrl: text("faviconUrl"),
  customCss: text("customCss"),
  // Student-facing colors (derived from primary/accent but can be overridden)
  studentPrimaryColor: varchar("studentPrimaryColor", { length: 32 }),
  studentAccentColor: varchar("studentAccentColor", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OrgTheme = typeof orgThemes.$inferSelect;
export type InsertOrgTheme = typeof orgThemes.$inferInsert;

// ─── Org Subscriptions ────────────────────────────────────────────────────────
export const orgSubscriptions = mysqlTable("org_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull().unique(),
  plan: mysqlEnum("plan", ["free", "starter", "builder", "pro", "enterprise"]).default("free").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "cancelled", "unpaid"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  // Manual Enterprise pricing set by site admin/owner
  customPriceUsd: int("customPriceUsd"), // price in cents, null = use standard pricing
  customPriceLabel: varchar("customPriceLabel", { length: 100 }), // e.g. "$499/mo"
  adminNotes: text("adminNotes"), // internal notes about this org's subscription
  assignedByUserId: int("assignedByUserId"), // who manually assigned this plan
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OrgSubscription = typeof orgSubscriptions.$inferSelect;

// ─── Instructors ──────────────────────────────────────────────────────────────
export const instructors = mysqlTable("instructors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orgId: int("orgId").notNull(),
  displayName: varchar("displayName", { length: 255 }),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  socialLinks: text("socialLinks"), // JSON: { website, twitter, linkedin, etc. }
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = typeof instructors.$inferInsert;

// ─── Courses ──────────────────────────────────────────────────────────────────
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  instructorId: int("instructorId"), // FK to instructors.id
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  thumbnailUrl: text("thumbnailUrl"),
  promoVideoUrl: text("promoVideoUrl"),
  // Status
  status: mysqlEnum("status", ["draft", "published", "hidden", "private", "archived"]).default("draft").notNull(),
  // hidden = published but not listed in catalog (direct link only) — Pro/Enterprise only
  // private = published but requires manual admin enrollment — Pro/Enterprise only
  isPrivate: boolean("isPrivate").default(false).notNull(), // legacy, now use status='private'
  isHidden: boolean("isHidden").default(false).notNull(), // legacy, now use status='hidden'
  disableTextCopy: boolean("disableTextCopy").default(false).notNull(),
  // SEO
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: text("seoDescription"),
  // Social sharing
  enableChapterShare: boolean("enableChapterShare").default(true).notNull(),
  enableCompletionShare: boolean("enableCompletionShare").default(true).notNull(),
  socialShareText: text("socialShareText"),
  // Player appearance
  playerThemeColor: varchar("playerThemeColor", { length: 32 }),
  playerSidebarStyle: mysqlEnum("playerSidebarStyle", ["full", "minimal", "hidden"]).default("full").notNull(),
  playerShowProgress: boolean("playerShowProgress").default(true).notNull(),
  playerAllowNotes: boolean("playerAllowNotes").default(false).notNull(),
  playerShowLessonIcons: boolean("playerShowLessonIcons").default(true).notNull(),
  // Completion
  completionType: mysqlEnum("completionType", ["all_lessons", "percentage", "quiz_pass"]).default("all_lessons").notNull(),
  completionPercentage: int("completionPercentage").default(100),
  // Welcome / after purchase
  welcomeEmailEnabled: boolean("welcomeEmailEnabled").default(true).notNull(),
  welcomeEmailSubject: varchar("welcomeEmailSubject", { length: 255 }),
  welcomeEmailBody: text("welcomeEmailBody"),
  afterPurchaseRedirectUrl: text("afterPurchaseRedirectUrl"),
  upsellCourseId: int("upsellCourseId"),
  // Custom page code
  headerCode: text("headerCode"),
  footerCode: text("footerCode"),
  // Design template
  designTemplate: varchar("designTemplate", { length: 64 }).default("colossal"),
  // Course behaviour
  showCompleteButton: boolean("showCompleteButton").default(true).notNull(),
  enableCertificate: boolean("enableCertificate").default(false).notNull(),
  trackProgress: boolean("trackProgress").default(true).notNull(),
  requireSequential: boolean("requireSequential").default(false).notNull(),
  language: varchar("language", { length: 16 }).default("en"),
  copiedFromId: int("copiedFromId"),
  // Counters
  totalEnrollments: int("totalEnrollments").default(0).notNull(),
  totalCompletions: int("totalCompletions").default(0).notNull(),
  totalRevenue: float("totalRevenue").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ─── Course Sections ──────────────────────────────────────────────────────────
export const courseSections = mysqlTable("course_sections", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isFreePreview: boolean("isFreePreview").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CourseSection = typeof courseSections.$inferSelect;
export type InsertCourseSection = typeof courseSections.$inferInsert;

// ─── Course Lessons ───────────────────────────────────────────────────────────
export const courseLessons = mysqlTable("course_lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  sectionId: int("sectionId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  lessonType: mysqlEnum("lessonType", [
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
  ]).default("text").notNull(),
  // Content references
  contentJson: text("contentJson"), // rich text / embed config JSON
  videoUrl: text("videoUrl"),
  videoProvider: mysqlEnum("videoProvider", ["upload", "youtube", "vimeo", "wistia"]).default("upload"),
  packageId: int("packageId"), // FK to content_packages for scorm/html lessons
  quizId: int("quizId"),       // FK to quizzes for quiz lessons
  pdfUrl: text("pdfUrl"),
  audioUrl: text("audioUrl"),
  downloadUrl: text("downloadUrl"),
  downloadFileName: varchar("downloadFileName", { length: 255 }),
  webLinkUrl: text("webLinkUrl"), // for weblink lesson type
  richTextAddOn: text("richTextAddOn"), // supplementary rich text for any lesson type
  liveSessionJson: text("liveSessionJson"), // JSON: { platform, meetingUrl, scheduledAt, duration, isRecurring, recurrenceRule }
  // Lesson banners
  startBannerEnabled: boolean("startBannerEnabled").default(false).notNull(),
  startBannerPosition: mysqlEnum("startBannerPosition", ["top", "bottom", "left"]).default("top"),
  startBannerMessage: text("startBannerMessage"),
  startBannerImageUrl: text("startBannerImageUrl"),
  startBannerSound: varchar("startBannerSound", { length: 64 }), // e.g. 'chime', 'bell', 'fanfare', 'none'
  startBannerDurationMs: int("startBannerDurationMs").default(5000),
  completeBannerEnabled: boolean("completeBannerEnabled").default(false).notNull(),
  completeBannerPosition: mysqlEnum("completeBannerPosition", ["top", "bottom", "left"]).default("bottom"),
  completeBannerMessage: text("completeBannerMessage"),
  completeBannerImageUrl: text("completeBannerImageUrl"),
  completeBannerSound: varchar("completeBannerSound", { length: 64 }),
  completeBannerDurationMs: int("completeBannerDurationMs").default(5000),
  // Settings
  sortOrder: int("sortOrder").default(0).notNull(),
  durationSeconds: int("durationSeconds"),
  isFreePreview: boolean("isFreePreview").default(false).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  // Drip
  dripDays: int("dripDays"), // null = available immediately
  dripDate: timestamp("dripDate"), // specific release date
  dripType: mysqlEnum("dripType", ["immediate", "days_after_enrollment", "specific_date"]).default("immediate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;

// ─── Course Pricing ───────────────────────────────────────────────────────────
export const coursePricing = mysqlTable("course_pricing", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  pricingType: mysqlEnum("pricingType", ["free", "one_time", "subscription", "payment_plan"]).default("free").notNull(),
  name: varchar("name", { length: 255 }), // e.g. "Regular price", "90 Day Access"
  price: float("price").default(0).notNull(),
  salePrice: float("salePrice"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  accessDays: int("accessDays"), // null = lifetime
  // Subscription
  subscriptionInterval: mysqlEnum("subscriptionInterval", ["monthly", "yearly"]),
  // Payment plan
  installmentCount: int("installmentCount"),
  installmentAmount: float("installmentAmount"),
  // Stripe
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CoursePricing = typeof coursePricing.$inferSelect;
export type InsertCoursePricing = typeof coursePricing.$inferInsert;

// ─── Course Enrollments ───────────────────────────────────────────────────────
export const courseEnrollments = mysqlTable("course_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  userId: int("userId").notNull(),
  orgId: int("orgId").notNull(),
  pricingId: int("pricingId"), // which pricing option was used
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"),
  progressPct: float("progressPct").default(0).notNull(),
  lastLessonId: int("lastLessonId"),
  lastAccessedAt: timestamp("lastAccessedAt"),
  // Payment
  amountPaid: float("amountPaid").default(0),
  currency: varchar("currency", { length: 3 }).default("USD"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  couponId: int("couponId"),
  isActive: boolean("isActive").default(true).notNull(),
  certificateIssued: boolean("certificateIssued").default(false).notNull(),
});
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;

// ─── Lesson Progress ──────────────────────────────────────────────────────────
export const lessonProgress = mysqlTable("lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  lessonId: int("lessonId").notNull(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  completedAt: timestamp("completedAt"),
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  scormData: text("scormData"), // JSON: SCORM cmi data
  quizScore: float("quizScore"),
  quizPassed: boolean("quizPassed"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).default("percentage").notNull(),
  discountValue: float("discountValue").notNull(),
  maxUses: int("maxUses"), // null = unlimited
  usedCount: int("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  appliesToCourseIds: text("appliesToCourseIds"), // JSON array, null = all courses
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ─── Certificates ─────────────────────────────────────────────────────────────
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  orgId: int("orgId").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  certUrl: text("certUrl"), // S3 URL to generated PDF
  certKey: text("certKey"), // S3 key
  certData: text("certData"), // JSON: student name, course name, date, etc.
  verificationCode: varchar("verificationCode", { length: 64 }).unique(),
});
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// ─── Page Builder Pages ───────────────────────────────────────────────────────
export const pageBuilderPages = mysqlTable("page_builder_pages", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  courseId: int("courseId"), // null = site-level page (home, about, etc.)
  pageType: mysqlEnum("pageType", ["course_sales", "school_home", "custom", "checkout", "thank_you"]).default("course_sales").notNull(),
  slug: varchar("slug", { length: 200 }),
  title: varchar("title", { length: 255 }),
  blocksJson: text("blocksJson").notNull().default("[]"), // JSON array of block objects
  isPublished: boolean("isPublished").default(false).notNull(),
  showHeader: boolean("showHeader").default(true).notNull(),
  showFooter: boolean("showFooter").default(true).notNull(),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  customCss: text("customCss"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PageBuilderPage = typeof pageBuilderPages.$inferSelect;
export type InsertPageBuilderPage = typeof pageBuilderPages.$inferInsert;

// ─── Course Reviews ───────────────────────────────────────────────────────────
export const courseReviews = mysqlTable("course_reviews", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  userId: int("userId").notNull(),
  orgId: int("orgId").notNull(),
  rating: int("rating").notNull(), // 1-5
  reviewText: text("reviewText"),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CourseReview = typeof courseReviews.$inferSelect;
export type InsertCourseReview = typeof courseReviews.$inferInsert;

// ─── Platform Settings ────────────────────────────────────────────────────────
// Singleton table (always id=1) for global platform configuration
export const platformSettings = mysqlTable("platform_settings", {
  id: int("id").autoincrement().primaryKey(),
  allowPublicRegistration: boolean("allowPublicRegistration").default(false).notNull(),
  maintenanceMode: boolean("maintenanceMode").default(false).notNull(),
  platformName: varchar("platformName", { length: 255 }).default("Teachific").notNull(),
  supportEmail: varchar("supportEmail", { length: 320 }),
  maxUploadSizeMb: int("maxUploadSizeMb").default(500).notNull(),
  enterpriseMaxUploadSizeMb: int("enterpriseMaxUploadSizeMb").default(5000).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlatformSettings = typeof platformSettings.$inferSelect;

// ─── Email Marketing: Templates ───────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId"), // null = site-wide template (for site owner)
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: text("htmlBody").notNull(),
  textBody: text("textBody"),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Email Marketing: Campaigns ───────────────────────────────────────────────
export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId"), // null = site owner campaign
  name: varchar("name", { length: 255 }).notNull(),
  templateId: int("templateId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: text("htmlBody").notNull(),
  textBody: text("textBody"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  recipientCount: int("recipientCount").default(0).notNull(),
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  openCount: int("openCount").default(0).notNull(),
  clickCount: int("clickCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

// ─── Email Marketing: Campaign Recipients ─────────────────────────────────────
export const emailCampaignRecipients = mysqlTable("email_campaign_recipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  errorMessage: text("errorMessage"),
});

export type EmailCampaignRecipient = typeof emailCampaignRecipients.$inferSelect;
export type InsertEmailCampaignRecipient = typeof emailCampaignRecipients.$inferInsert;

// ─── Email Marketing: Unsubscribes ────────────────────────────────────────────
export const emailUnsubscribes = mysqlTable("email_unsubscribes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  orgId: int("orgId"), // null = unsubscribed from site-level emails
  unsubscribedAt: timestamp("unsubscribedAt").defaultNow().notNull(),
  reason: text("reason"),
});

export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;
export type InsertEmailUnsubscribe = typeof emailUnsubscribes.$inferInsert;

// ─── Custom Auth: Password & Reset Tokens ─────────────────────────────────────
// Extend users table with custom auth fields (migration will add these columns)
// passwordHash: hashed password (bcrypt)
// emailVerified: boolean
// emailVerificationToken: token for email verification
// emailVerificationExpiry: expiry timestamp for verification token
// resetToken: token for password reset
// resetTokenExpiry: expiry timestamp for reset token
