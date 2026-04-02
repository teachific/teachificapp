CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(64) NOT NULL,
	`commissionType` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`commissionValue` float NOT NULL DEFAULT 20,
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalSales` int NOT NULL DEFAULT 0,
	`totalEarned` float NOT NULL DEFAULT 0,
	`totalPaid` float NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `assignment_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`body` text,
	`fileUrl` text,
	`fileKey` text,
	`grade` varchar(32),
	`score` int,
	`feedback` text,
	`status` enum('pending','graded','returned') NOT NULL DEFAULT 'pending',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`gradedAt` timestamp,
	CONSTRAINT `assignment_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`courseId` int,
	`title` varchar(500) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`maxScore` int DEFAULT 100,
	`status` enum('draft','active','closed') NOT NULL DEFAULT 'draft',
	`allowFileUpload` boolean NOT NULL DEFAULT true,
	`allowTextSubmission` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`price` float NOT NULL DEFAULT 0,
	`salePrice` float,
	`courseIds` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalEnrollments` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bundles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(32) DEFAULT '#0ea5e9',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificate_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`htmlTemplate` text,
	`previewImageUrl` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificate_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`categoryId` int NOT NULL,
	CONSTRAINT `course_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`userId` int,
	`customerName` varchar(255),
	`customerEmail` varchar(320) NOT NULL,
	`courseId` int,
	`pricingId` int,
	`productType` enum('course','bundle','membership','digital') NOT NULL DEFAULT 'course',
	`productName` varchar(255),
	`amount` float NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','refunded','failed') NOT NULL DEFAULT 'pending',
	`couponId` int,
	`couponCode` varchar(64),
	`discountAmount` float DEFAULT 0,
	`stripePaymentIntentId` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discussion_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discussionId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255),
	`body` text NOT NULL,
	`isInstructorReply` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discussion_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discussions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`courseId` int,
	`title` varchar(500) NOT NULL,
	`body` text,
	`authorId` int NOT NULL,
	`authorName` varchar(255),
	`isPinned` boolean NOT NULL DEFAULT false,
	`status` enum('open','resolved','closed') NOT NULL DEFAULT 'open',
	`replyCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discussions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`status` enum('invited','active','removed') NOT NULL DEFAULT 'invited',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`managerId` int,
	`managerName` varchar(255),
	`seats` int NOT NULL DEFAULT 10,
	`usedSeats` int NOT NULL DEFAULT 0,
	`courseId` int,
	`notes` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` float NOT NULL DEFAULT 0,
	`billingInterval` enum('monthly','yearly','one_time') NOT NULL DEFAULT 'monthly',
	`trialDays` int DEFAULT 0,
	`courseAccess` enum('all','specific') NOT NULL DEFAULT 'all',
	`courseIds` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`memberCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenue_partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`shareType` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`shareValue` float NOT NULL DEFAULT 10,
	`appliesTo` enum('all','specific') NOT NULL DEFAULT 'all',
	`courseIds` text,
	`totalEarned` float NOT NULL DEFAULT 0,
	`totalPaid` float NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenue_partners_id` PRIMARY KEY(`id`)
);
