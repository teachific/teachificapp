CREATE TABLE `teachific_pay_charges` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`orgId` bigint NOT NULL,
	`stripeChargeId` varchar(128) NOT NULL,
	`stripePaymentIntentId` varchar(128),
	`stripeCheckoutSessionId` varchar(128),
	`amount` bigint NOT NULL,
	`platformFee` bigint NOT NULL DEFAULT 0,
	`netAmount` bigint NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'usd',
	`chargeStatus` enum('succeeded','pending','failed','refunded','partially_refunded') NOT NULL DEFAULT 'succeeded',
	`amountRefunded` bigint NOT NULL DEFAULT 0,
	`courseId` bigint,
	`learnerId` bigint,
	`learnerEmail` varchar(256),
	`isGroupRegistration` boolean NOT NULL DEFAULT false,
	`groupSize` bigint NOT NULL DEFAULT 1,
	`chargedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachific_pay_charges_id` PRIMARY KEY(`id`),
	CONSTRAINT `teachific_pay_charges_stripeChargeId_unique` UNIQUE(`stripeChargeId`)
);
--> statement-breakpoint
CREATE TABLE `teachific_pay_disputes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`orgId` bigint NOT NULL,
	`stripeDisputeId` varchar(128) NOT NULL,
	`stripeChargeId` varchar(128) NOT NULL,
	`stripePaymentIntentId` varchar(128),
	`amount` bigint NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'usd',
	`status` enum('warning_needs_response','warning_under_review','warning_closed','needs_response','under_review','charge_refunded','won','lost') NOT NULL DEFAULT 'needs_response',
	`reason` varchar(128),
	`evidenceDueBy` bigint,
	`evidenceSubmitted` boolean NOT NULL DEFAULT false,
	`courseId` bigint,
	`learnerId` bigint,
	`learnerEmail` varchar(256),
	`accessRevoked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teachific_pay_disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `teachific_pay_disputes_stripeDisputeId_unique` UNIQUE(`stripeDisputeId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `quizCreatorAccess` enum('none','web','desktop','bundle') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `studioAccess` enum('none','web','desktop','bundle') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `creatorAccess` enum('none','web','desktop','bundle') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `quizCreatorRole`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `studioRole`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `creatorRole`;