ALTER TABLE `organizations` ADD `subdomainEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `customSubdomain` varchar(100);