CREATE TABLE `funnel_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funnelId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`name` varchar(255) NOT NULL,
	`stepType` enum('landing','sales','order','upsell','downsell','thank_you','webinar','custom') NOT NULL DEFAULT 'landing',
	`pageId` int,
	`slug` varchar(200),
	`visitors` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`slug` varchar(200) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`courseId` int,
	`totalVisitors` int NOT NULL DEFAULT 0,
	`totalConversions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnels_id` PRIMARY KEY(`id`)
);
