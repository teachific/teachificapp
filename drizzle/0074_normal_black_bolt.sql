ALTER TABLE `quiz_attempts` ADD `takerName` varchar(255);--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `takerEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `answersJson` longtext;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `shareToken` varchar(32);--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `totalPoints` float;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `brandPrimaryColor` varchar(32);--> statement-breakpoint
ALTER TABLE `quizzes` ADD `brandBgColor` varchar(32);--> statement-breakpoint
ALTER TABLE `quizzes` ADD `brandLogoUrl` text;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `brandFontFamily` varchar(128);--> statement-breakpoint
ALTER TABLE `quizzes` ADD `completionMessage` text;