ALTER TABLE `organizations` ADD `termsOfService` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `privacyPolicy` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `requireTermsAgreement` boolean DEFAULT false NOT NULL;