ALTER TABLE `organizations` ADD `isPrimary` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `quizCreatorRole` enum('none','lite','premium') DEFAULT 'none' NOT NULL;