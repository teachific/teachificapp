CREATE TABLE `digital_download_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`downloadedAt` timestamp DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `digital_download_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `digital_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`priceId` int NOT NULL,
	`orgId` int NOT NULL,
	`buyerEmail` varchar(255) NOT NULL,
	`buyerName` varchar(255),
	`amount` varchar(20) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`paymentRef` varchar(255),
	`downloadToken` varchar(64) NOT NULL,
	`accessExpiresAt` timestamp,
	`maxDownloads` int,
	`downloadCount` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `digital_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `digital_product_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`amount` varchar(20) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`installments` int,
	`installmentAmount` varchar(20),
	`intervalDays` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `digital_product_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `digital_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileType` varchar(100),
	`fileSize` bigint,
	`thumbnailUrl` text,
	`salesPageBlocksJson` json,
	`isPublished` boolean DEFAULT false,
	`defaultAccessDays` int,
	`defaultMaxDownloads` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digital_products_id` PRIMARY KEY(`id`)
);
