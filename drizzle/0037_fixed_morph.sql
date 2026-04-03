ALTER TABLE `courses` ADD `whatYouLearn` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `requirements` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `targetAudience` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `instructorBio` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `preStartPageEnabled` boolean DEFAULT true NOT NULL;