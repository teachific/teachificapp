CREATE TABLE `authoringProjects` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`orgId` bigint NOT NULL,
	`userId` bigint NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'Untitled Project',
	`description` text,
	`settingsJson` text,
	`thumbnailUrl` varchar(1024),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`lastPublishedUrl` varchar(1024),
	`lastPublishedFormat` enum('scorm12','scorm2004','html5'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authoringProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `authoringSlides` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`projectId` bigint NOT NULL,
	`slideIndex` int NOT NULL DEFAULT 0,
	`title` varchar(255) NOT NULL DEFAULT 'Slide',
	`slideType` enum('content','quiz','interaction','scenario','video') NOT NULL DEFAULT 'content',
	`contentJson` text,
	`layout` varchar(64) NOT NULL DEFAULT 'title-content',
	`background` varchar(512),
	`notes` text,
	`nextSlideId` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authoringSlides_id` PRIMARY KEY(`id`)
);
