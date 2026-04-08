CREATE TABLE `org_media_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_media_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `org_media_library` ADD `folderId` int;