ALTER TABLE `org_subscriptions` ADD `customPriceUsd` int;--> statement-breakpoint
ALTER TABLE `org_subscriptions` ADD `customPriceLabel` varchar(100);--> statement-breakpoint
ALTER TABLE `org_subscriptions` ADD `adminNotes` text;--> statement-breakpoint
ALTER TABLE `org_subscriptions` ADD `assignedByUserId` int;