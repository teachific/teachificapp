CREATE TABLE `video_clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`mediaItemId` int NOT NULL,
	`label` varchar(255) NOT NULL DEFAULT 'Clip',
	`startSec` float NOT NULL DEFAULT 0,
	`endSec` float NOT NULL DEFAULT 0,
	`videoUrl` text,
	`videoKey` text,
	`captionsUrl` text,
	`captionsBaked` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_clips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `org_media_library` ADD `durationSeconds` int;--> statement-breakpoint
ALTER TABLE `org_media_library` ADD `captionsUrl` text;--> statement-breakpoint
ALTER TABLE `org_media_library` ADD `transcriptJson` text;