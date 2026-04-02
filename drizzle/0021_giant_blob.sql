ALTER TABLE `course_lessons` ADD `isPrerequisite` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `requiresCompletion` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `passingScore` int;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `allowSkip` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `estimatedMinutes` int;