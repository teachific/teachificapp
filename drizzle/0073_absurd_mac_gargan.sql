ALTER TABLE `quizzes` ADD `shareToken` varchar(32);--> statement-breakpoint
ALTER TABLE `quizzes` ADD `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `quizzes` ADD CONSTRAINT `quizzes_shareToken_unique` UNIQUE(`shareToken`);