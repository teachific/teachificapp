ALTER TABLE `course_lessons` ADD `startBannerCustomSoundUrl` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerConfetti` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `startBannerConfettiStyle` enum('burst','cannon','rain','fireworks') DEFAULT 'burst';--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerCustomSoundUrl` text;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerConfetti` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `completeBannerConfettiStyle` enum('burst','cannon','rain','fireworks') DEFAULT 'burst';