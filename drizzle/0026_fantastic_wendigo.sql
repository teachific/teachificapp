CREATE TABLE `form_analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`sessionId` int NOT NULL,
	`fieldId` int,
	`event` varchar(50) NOT NULL,
	`value` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`type` enum('course','custom_page','landing_page') NOT NULL,
	`targetId` int,
	`targetUrl` text,
	`triggerOn` enum('on_submit','on_completion') NOT NULL DEFAULT 'on_submit',
	`action` enum('enroll','redirect','tag','embed') NOT NULL,
	`label` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`sessionToken` varchar(100) NOT NULL,
	`userId` int,
	`respondentEmail` varchar(255),
	`droppedAtFieldId` int,
	`completed` boolean NOT NULL DEFAULT false,
	`memberVars` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationSeconds` int,
	CONSTRAINT `form_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `form_fields` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `form_fields` ADD `memberVarName` varchar(100);--> statement-breakpoint
ALTER TABLE `forms` ADD `buttonColor` varchar(20);--> statement-breakpoint
ALTER TABLE `forms` ADD `buttonTextColor` varchar(20);--> statement-breakpoint
ALTER TABLE `forms` ADD `headerBgColor` varchar(20);--> statement-breakpoint
ALTER TABLE `forms` ADD `headerTextColor` varchar(20);--> statement-breakpoint
ALTER TABLE `forms` ADD `fontFamily` varchar(100);--> statement-breakpoint
ALTER TABLE `forms` ADD `headerImageUrl` text;--> statement-breakpoint
ALTER TABLE `forms` ADD `useOrgBranding` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `forms` ADD `memberVarMappings` text;