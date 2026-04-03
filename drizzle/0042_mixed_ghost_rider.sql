ALTER TABLE `org_members` MODIFY COLUMN `role` enum('org_super_admin','org_admin','member','user') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('site_owner','site_admin','org_super_admin','org_admin','member','user') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `forms` ADD `customCss` text;--> statement-breakpoint
ALTER TABLE `org_members` ADD `memberSubRole` enum('basic_member','instructor','group_manager','group_member') DEFAULT 'basic_member';