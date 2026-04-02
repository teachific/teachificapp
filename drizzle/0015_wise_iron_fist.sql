ALTER TABLE `organizations` ADD `customDomain` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `customSenderEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `organizations` ADD `customSenderName` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `senderDomainVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `senderDomainVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;