CREATE TABLE `form_docs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`docType` varchar(50) NOT NULL DEFAULT 'merged_pdf',
	`template` text,
	`templateFileUrl` text,
	`templateFileKey` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_docs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_filters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`conditions` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_filters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_labels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`fieldId` int NOT NULL,
	`customLabel` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_labels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_scheduled_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`frequency` varchar(20) NOT NULL DEFAULT 'weekly',
	`dayValue` int,
	`hourUtc` int NOT NULL DEFAULT 8,
	`deliveryEmail` varchar(320) NOT NULL,
	`format` varchar(10) NOT NULL DEFAULT 'csv',
	`filterId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_scheduled_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`visibleFieldIds` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_views_id` PRIMARY KEY(`id`)
);
