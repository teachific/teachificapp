CREATE TABLE `org_media_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`filename` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL DEFAULT 0,
	`fileKey` varchar(1000) NOT NULL,
	`url` text NOT NULL,
	`altText` varchar(500),
	`tags` text,
	`source` enum('form','course','direct','other') NOT NULL DEFAULT 'direct',
	`sourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_media_library_id` PRIMARY KEY(`id`)
);
