CREATE TABLE `form_branching_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`sourceFieldId` int NOT NULL,
	`operator` varchar(50) NOT NULL,
	`value` text,
	`action` varchar(50) NOT NULL,
	`targetFieldId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_branching_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`label` text NOT NULL,
	`placeholder` text,
	`helpText` text,
	`required` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`options` text,
	`minLength` int,
	`maxLength` int,
	`isBranchingSource` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`userId` int,
	`respondentEmail` varchar(255),
	`respondentName` varchar(255),
	`answers` text NOT NULL,
	`ipAddress` varchar(50),
	`userAgent` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `form_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`slug` varchar(200) NOT NULL,
	`status` enum('draft','published','closed') NOT NULL DEFAULT 'draft',
	`notifyEmails` text,
	`sendConfirmation` boolean NOT NULL DEFAULT false,
	`confirmationEmailField` varchar(100),
	`confirmationSubject` varchar(255),
	`confirmationBody` text,
	`successMessage` text,
	`redirectUrl` text,
	`requireLogin` boolean NOT NULL DEFAULT false,
	`allowMultipleSubmissions` boolean NOT NULL DEFAULT true,
	`primaryColor` varchar(20),
	`submissionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forms_id` PRIMARY KEY(`id`)
);
