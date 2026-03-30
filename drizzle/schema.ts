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
  role: mysqlEnum("role", ["site_owner", "admin", "user"]).default("user").notNull(),
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
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
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
