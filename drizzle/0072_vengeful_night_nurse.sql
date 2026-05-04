ALTER TABLE `quiz_questions` MODIFY COLUMN `questionType` enum('multiple_choice','true_false','short_answer','long_answer','matching','multiple_select','hotspot','ordering','fill_blank','numeric','rating_scale') NOT NULL DEFAULT 'multiple_choice';--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `orderingItemsJson` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `fillBlankAnswersJson` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `numericAnswer` float;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `numericTolerance` float;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `ratingMin` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `ratingMax` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `ratingLabelsJson` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `branchOnCorrect` int;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `branchOnIncorrect` int;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `userId` int;