ALTER TABLE `groups` ADD `managerTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `groups` ADD `managerEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `groups` ADD `managerPhone` varchar(50);--> statement-breakpoint
ALTER TABLE `groups` ADD `productIds` text;--> statement-breakpoint
ALTER TABLE `groups` ADD `welcomeEmailSent` boolean DEFAULT false NOT NULL;