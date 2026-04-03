CREATE TABLE `flashcard_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`frontImageUrl` varchar(1024),
	`backImageUrl` varchar(1024),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flashcard_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flashcard_decks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`cardCount` int NOT NULL DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flashcard_decks_id` PRIMARY KEY(`id`)
);
