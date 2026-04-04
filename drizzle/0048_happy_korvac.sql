CREATE TABLE `org_payment_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`stripeConnectAccountId` varchar(255),
	`stripeConnectEnabled` boolean NOT NULL DEFAULT false,
	`stripeConnectOnboardingComplete` boolean NOT NULL DEFAULT false,
	`paypalEmail` varchar(320),
	`paypalEnabled` boolean NOT NULL DEFAULT false,
	`paypalClientId` varchar(255),
	`paypalClientSecret` varchar(255),
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`autoEnrollNewMembers` boolean NOT NULL DEFAULT false,
	`revenueShareJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_payment_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_payment_settings_orgId_unique` UNIQUE(`orgId`)
);
