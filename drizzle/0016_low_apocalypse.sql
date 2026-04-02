ALTER TABLE `quiz_questions` MODIFY COLUMN `questionType` enum('multiple_choice','true_false','short_answer','long_answer','matching','multiple_select','hotspot') NOT NULL DEFAULT 'multiple_choice';--> statement-breakpoint
ALTER TABLE `quiz_answer_choices` ADD `matchTargetImageUrl` text;--> statement-breakpoint
ALTER TABLE `quiz_answer_choices` ADD `choiceImageUrl` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `videoType` varchar(20);--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `fileUrl` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `fileLabel` varchar(255);--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `wordLimit` int;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `charLimit` int;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `rubric` text;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `hotspotRegionsJson` text;