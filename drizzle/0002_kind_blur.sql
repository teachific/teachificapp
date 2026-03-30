ALTER TABLE `analytics_events` MODIFY COLUMN `eventData` text;--> statement-breakpoint
ALTER TABLE `content_packages` MODIFY COLUMN `tags` text;--> statement-breakpoint
ALTER TABLE `content_packages` MODIFY COLUMN `scormManifest` text;--> statement-breakpoint
ALTER TABLE `content_packages` MODIFY COLUMN `llmTags` text;--> statement-breakpoint
ALTER TABLE `permissions` MODIFY COLUMN `allowedEmbedDomains` text;--> statement-breakpoint
ALTER TABLE `permissions` MODIFY COLUMN `allowedOrgIds` text;--> statement-breakpoint
ALTER TABLE `permissions` MODIFY COLUMN `allowedUserIds` text;--> statement-breakpoint
ALTER TABLE `scorm_data` MODIFY COLUMN `cmiData` text;