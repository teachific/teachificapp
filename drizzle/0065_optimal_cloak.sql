ALTER TABLE `organizations` ADD `seoTitle` varchar(60);--> statement-breakpoint
ALTER TABLE `organizations` ADD `seoDescription` varchar(160);--> statement-breakpoint
ALTER TABLE `organizations` ADD `seoKeywords` varchar(500);--> statement-breakpoint
ALTER TABLE `organizations` ADD `seoOgImageUrl` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `seoRobotsIndex` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `customCss` longtext;