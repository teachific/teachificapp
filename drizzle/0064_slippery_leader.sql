ALTER TABLE `organizations` ADD `domainVerificationStatus` enum('unverified','pending','verified','failed') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `domainVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD `domainVerificationError` varchar(500);