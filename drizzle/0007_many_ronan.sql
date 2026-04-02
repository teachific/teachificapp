CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`orgId` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`certUrl` text,
	`certKey` text,
	`certData` text,
	`verificationCode` varchar(64),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_verificationCode_unique` UNIQUE(`verificationCode`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`code` varchar(64) NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`discountValue` float NOT NULL,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`appliesToCourseIds` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`userId` int NOT NULL,
	`orgId` int NOT NULL,
	`pricingId` int,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`progressPct` float NOT NULL DEFAULT 0,
	`lastLessonId` int,
	`lastAccessedAt` timestamp,
	`amountPaid` float DEFAULT 0,
	`currency` varchar(3) DEFAULT 'USD',
	`stripePaymentIntentId` varchar(255),
	`couponId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`certificateIssued` boolean NOT NULL DEFAULT false,
	CONSTRAINT `course_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`sectionId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`lessonType` enum('video','text','scorm','quiz','pdf','audio','assignment','live','download') NOT NULL DEFAULT 'text',
	`contentJson` text,
	`videoUrl` text,
	`videoProvider` enum('upload','youtube','vimeo','wistia') DEFAULT 'upload',
	`packageId` int,
	`quizId` int,
	`pdfUrl` text,
	`audioUrl` text,
	`downloadUrl` text,
	`downloadFileName` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`durationSeconds` int,
	`isFreePreview` boolean NOT NULL DEFAULT false,
	`isPublished` boolean NOT NULL DEFAULT true,
	`dripDays` int,
	`dripDate` timestamp,
	`dripType` enum('immediate','days_after_enrollment','specific_date') NOT NULL DEFAULT 'immediate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`pricingType` enum('free','one_time','subscription','payment_plan') NOT NULL DEFAULT 'free',
	`name` varchar(255),
	`price` float NOT NULL DEFAULT 0,
	`salePrice` float,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`accessDays` int,
	`subscriptionInterval` enum('monthly','yearly'),
	`installmentCount` int,
	`installmentAmount` float,
	`stripePriceId` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`userId` int NOT NULL,
	`orgId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isFreePreview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`instructorId` int,
	`title` varchar(500) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`shortDescription` varchar(500),
	`thumbnailUrl` text,
	`promoVideoUrl` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`isPrivate` boolean NOT NULL DEFAULT false,
	`isHidden` boolean NOT NULL DEFAULT false,
	`disableTextCopy` boolean NOT NULL DEFAULT false,
	`seoTitle` varchar(255),
	`seoDescription` text,
	`enableChapterShare` boolean NOT NULL DEFAULT true,
	`enableCompletionShare` boolean NOT NULL DEFAULT true,
	`socialShareText` text,
	`playerThemeColor` varchar(32),
	`playerSidebarStyle` enum('full','minimal','hidden') NOT NULL DEFAULT 'full',
	`playerShowProgress` boolean NOT NULL DEFAULT true,
	`playerAllowNotes` boolean NOT NULL DEFAULT false,
	`completionType` enum('all_lessons','percentage','quiz_pass') NOT NULL DEFAULT 'all_lessons',
	`completionPercentage` int DEFAULT 100,
	`welcomeEmailEnabled` boolean NOT NULL DEFAULT true,
	`welcomeEmailSubject` varchar(255),
	`welcomeEmailBody` text,
	`afterPurchaseRedirectUrl` text,
	`upsellCourseId` int,
	`headerCode` text,
	`footerCode` text,
	`designTemplate` varchar(64) DEFAULT 'colossal',
	`totalEnrollments` int NOT NULL DEFAULT 0,
	`totalCompletions` int NOT NULL DEFAULT 0,
	`totalRevenue` float NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orgId` int NOT NULL,
	`displayName` varchar(255),
	`title` varchar(255),
	`bio` text,
	`avatarUrl` text,
	`socialLinks` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instructors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`lessonId` int NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`timeSpentSeconds` int DEFAULT 0,
	`scormData` text,
	`quizScore` float,
	`quizPassed` boolean,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`plan` enum('free','starter','builder','pro','enterprise') NOT NULL DEFAULT 'free',
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`status` enum('active','trialing','past_due','cancelled','unpaid') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_subscriptions_orgId_unique` UNIQUE(`orgId`)
);
--> statement-breakpoint
CREATE TABLE `org_themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`bgMode` enum('light','dark') NOT NULL DEFAULT 'light',
	`primaryColor` varchar(32) NOT NULL DEFAULT '#189aa1',
	`accentColor` varchar(32) NOT NULL DEFAULT '#4ad9e0',
	`fontFamily` varchar(128) NOT NULL DEFAULT 'Inter',
	`schoolName` varchar(255),
	`adminLogoUrl` text,
	`faviconUrl` text,
	`customCss` text,
	`studentPrimaryColor` varchar(32),
	`studentAccentColor` varchar(32),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_themes_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_themes_orgId_unique` UNIQUE(`orgId`)
);
--> statement-breakpoint
CREATE TABLE `page_builder_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`courseId` int,
	`pageType` enum('course_sales','school_home','custom','checkout','thank_you') NOT NULL DEFAULT 'course_sales',
	`slug` varchar(200),
	`title` varchar(255),
	`blocksJson` text NOT NULL DEFAULT ('[]'),
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_builder_pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `org_members` MODIFY COLUMN `role` enum('org_admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('site_owner','site_admin','org_admin','user') NOT NULL DEFAULT 'user';