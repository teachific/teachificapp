CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`sessionId` int,
	`userId` int,
	`orgId` int,
	`eventType` enum('play_start','play_end','play_pause','play_resume','download','scorm_complete','scorm_pass','scorm_fail','page_view','link_click','error') NOT NULL,
	`eventData` json DEFAULT ('{}'),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`tags` json DEFAULT ('[]'),
	`scormVersion` enum('1.2','2004','none') NOT NULL DEFAULT 'none',
	`scormEntryPoint` text,
	`scormManifest` json,
	`contentType` enum('scorm','html','articulate','ispring','unknown') NOT NULL DEFAULT 'unknown',
	`llmSummary` text,
	`llmTags` json DEFAULT ('[]'),
	`llmValidationNotes` text,
	`originalZipKey` text NOT NULL,
	`originalZipUrl` text NOT NULL,
	`originalZipSize` bigint DEFAULT 0,
	`extractedFolderKey` text,
	`status` enum('uploading','processing','ready','error') NOT NULL DEFAULT 'uploading',
	`processingError` text,
	`currentVersionId` int,
	`totalPlayCount` int NOT NULL DEFAULT 0,
	`totalDownloadCount` int NOT NULL DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`versionLabel` varchar(100),
	`changelog` text,
	`uploadedBy` int NOT NULL,
	`zipKey` text NOT NULL,
	`zipUrl` text NOT NULL,
	`zipSize` bigint DEFAULT 0,
	`extractedFolderKey` text,
	`entryPoint` text,
	`fileCount` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`packageId` int NOT NULL,
	`relativePath` text NOT NULL,
	`s3Key` text NOT NULL,
	`s3Url` text NOT NULL,
	`mimeType` varchar(255),
	`fileSize` bigint DEFAULT 0,
	`isEntryPoint` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`invitedBy` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `org_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`logoUrl` text,
	`ownerId` int NOT NULL,
	`maxStorageBytes` bigint DEFAULT 10737418240,
	`usedStorageBytes` bigint DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`allowDownload` boolean NOT NULL DEFAULT false,
	`downloadRequiresAuth` boolean NOT NULL DEFAULT true,
	`maxPlaysPerUser` int,
	`maxTotalPlays` int,
	`playExpiresAt` timestamp,
	`allowEmbed` boolean NOT NULL DEFAULT true,
	`allowedEmbedDomains` json DEFAULT ('[]'),
	`allowExternalLinks` boolean NOT NULL DEFAULT true,
	`requiresAuth` boolean NOT NULL DEFAULT true,
	`allowedOrgIds` json DEFAULT ('[]'),
	`allowedUserIds` json DEFAULT ('[]'),
	`shareToken` varchar(64),
	`shareTokenExpiresAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_packageId_unique` UNIQUE(`packageId`)
);
--> statement-breakpoint
CREATE TABLE `play_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`versionId` int,
	`userId` int,
	`orgId` int,
	`sessionToken` varchar(64) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`durationSeconds` int DEFAULT 0,
	`completionStatus` enum('not_attempted','incomplete','completed','passed','failed','unknown') DEFAULT 'not_attempted',
	`scoreRaw` float,
	`scoreMax` float,
	`scoreMin` float,
	`scoreScaled` float,
	`ipAddress` varchar(45),
	`userAgent` text,
	`referrer` text,
	`country` varchar(2),
	`isCompleted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `play_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `play_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `scorm_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`packageId` int NOT NULL,
	`userId` int,
	`cmiData` json DEFAULT ('{}'),
	`suspendData` text,
	`lessonStatus` varchar(64),
	`lessonLocation` text,
	`score` float,
	`totalTime` varchar(32),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scorm_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('site_owner','admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `analytics_package_idx` ON `analytics_events` (`packageId`);--> statement-breakpoint
CREATE INDEX `analytics_org_idx` ON `analytics_events` (`orgId`);--> statement-breakpoint
CREATE INDEX `analytics_event_type_idx` ON `analytics_events` (`eventType`);