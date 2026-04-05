ALTER TABLE `organizations` ADD `stripeConnectAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `stripeConnectStatus` enum('not_connected','pending','active','restricted','suspended') DEFAULT 'not_connected' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `paymentGateway` enum('teachific_pay','own_gateway') DEFAULT 'teachific_pay' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `ownStripePublishableKey` varchar(255);--> statement-breakpoint
ALTER TABLE `organizations` ADD `ownStripeSecretKeyEncrypted` text;--> statement-breakpoint
ALTER TABLE `users` ADD `creatorRole` enum('none','starter','pro','team') DEFAULT 'none' NOT NULL;