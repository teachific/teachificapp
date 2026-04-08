ALTER TABLE `teachific_pay_disputes` ADD `adminNotes` text;--> statement-breakpoint
ALTER TABLE `teachific_pay_disputes` ADD `escalated` boolean DEFAULT false NOT NULL;