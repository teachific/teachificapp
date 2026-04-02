ALTER TABLE `course_lessons` MODIFY COLUMN `lessonType` enum('video','text','scorm','quiz','flashcard','exam','pdf','audio','assignment','live','download','weblink','zoom') NOT NULL DEFAULT 'text';--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `webLinkUrl` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `richTextAddOn` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `liveSessionJson` text;