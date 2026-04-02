CREATE TABLE `platform_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`allowPublicRegistration` boolean NOT NULL DEFAULT false,
	`maintenanceMode` boolean NOT NULL DEFAULT false,
	`platformName` varchar(255) NOT NULL DEFAULT 'Teachific',
	`supportEmail` varchar(320),
	`maxUploadSizeMb` int NOT NULL DEFAULT 500,
	`enterpriseMaxUploadSizeMb` int NOT NULL DEFAULT 5000,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`)
);
