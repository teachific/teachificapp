ALTER TABLE `org_themes` ADD `watermarkImageUrl` text;--> statement-breakpoint
ALTER TABLE `org_themes` ADD `watermarkOpacity` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `org_themes` ADD `watermarkPosition` varchar(32) DEFAULT 'bottom-left';--> statement-breakpoint
ALTER TABLE `org_themes` ADD `watermarkSize` int DEFAULT 120;