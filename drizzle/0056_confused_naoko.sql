CREATE TABLE `app_versions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`product` enum('creator','studio','quizcreator') NOT NULL,
	`version` varchar(32) NOT NULL,
	`releaseNotes` text,
	`windowsUrl` varchar(1024),
	`macUrl` varchar(1024),
	`isLatest` boolean NOT NULL DEFAULT false,
	`releasedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_versions_id` PRIMARY KEY(`id`)
);
