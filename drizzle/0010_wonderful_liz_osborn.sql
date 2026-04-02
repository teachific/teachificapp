ALTER TABLE `courses` ADD `showCompleteButton` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `enableCertificate` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `trackProgress` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `requireSequential` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `language` varchar(16) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `courses` ADD `copiedFromId` int;