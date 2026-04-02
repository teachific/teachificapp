ALTER TABLE `course_lessons` ADD `startBannerEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerPosition` enum('top','bottom','left') DEFAULT 'top';--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerMessage` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerImageUrl` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerSound` varchar(64);--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerDurationMs` int DEFAULT 5000;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerPosition` enum('top','bottom','left') DEFAULT 'bottom';--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerMessage` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerImageUrl` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerSound` varchar(64);--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerDurationMs` int DEFAULT 5000;--> statement-breakpoint
ALTER TABLE `page_builder_pages` ADD `showHeader` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `page_builder_pages` ADD `showFooter` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `page_builder_pages` ADD `metaTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `page_builder_pages` ADD `metaDescription` text;--> statement-breakpoint
ALTER TABLE `page_builder_pages` ADD `customCss` text;