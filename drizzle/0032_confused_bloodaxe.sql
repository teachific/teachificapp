ALTER TABLE `platform_settings` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `faviconUrl` text;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `primaryColor` varchar(32) DEFAULT '#189aa1' NOT NULL;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `accentColor` varchar(32) DEFAULT '#4ad9e0' NOT NULL;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `watermarkImageUrl` text;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `watermarkOpacity` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `watermarkPosition` varchar(32) DEFAULT 'bottom-left';--> statement-breakpoint
ALTER TABLE `platform_settings` ADD `watermarkSize` int DEFAULT 120;