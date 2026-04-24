ALTER TABLE `courses` ADD `accessDurationType` enum('lifetime','days','date') DEFAULT 'lifetime' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `accessDurationDays` int;--> statement-breakpoint
ALTER TABLE `courses` ADD `accessExpiryDate` timestamp;