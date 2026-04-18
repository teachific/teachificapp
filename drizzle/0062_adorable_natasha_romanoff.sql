ALTER TABLE `certificate_templates` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `primaryColor` varchar(32);--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `accentColor` varchar(32);--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `bgStyle` enum('white','light','gradient','dark') DEFAULT 'white';--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `signatureName` varchar(255);--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `signatureTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `signatureImageUrl` text;--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `footerText` text;--> statement-breakpoint
ALTER TABLE `certificate_templates` ADD `showTeachificBranding` boolean DEFAULT true NOT NULL;