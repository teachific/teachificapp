CREATE TABLE `org_limit_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`featureKey` varchar(100) NOT NULL,
	`limitValue` int NOT NULL,
	`overriddenByUserId` int,
	`note` varchar(255),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_limit_overrides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plan_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan` enum('free','starter','builder','pro','enterprise') NOT NULL,
	`featureKey` varchar(100) NOT NULL,
	`featureLabel` varchar(150) NOT NULL,
	`limitValue` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plan_limits_id` PRIMARY KEY(`id`)
);
