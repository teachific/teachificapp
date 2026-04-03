CREATE TABLE `community_dms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_dms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_hubs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`tagline` varchar(500),
	`description` text,
	`coverImageUrl` text,
	`logoUrl` text,
	`primaryColor` varchar(20) DEFAULT '#0d9488',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_hubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(64) NOT NULL,
	`invitedByUserId` int NOT NULL,
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_invites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','moderator','admin') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`isBanned` boolean NOT NULL DEFAULT false,
	CONSTRAINT `community_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_post_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(10) NOT NULL DEFAULT '👍',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_post_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_post_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255),
	`authorAvatarUrl` text,
	`content` text NOT NULL,
	`isHidden` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_post_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`hubId` int NOT NULL,
	`orgId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255),
	`authorAvatarUrl` text,
	`content` text NOT NULL,
	`imageUrl` text,
	`isPinned` boolean NOT NULL DEFAULT false,
	`isHidden` boolean NOT NULL DEFAULT false,
	`replyCount` int NOT NULL DEFAULT 0,
	`reactionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_spaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hubId` int NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`coverImageUrl` text,
	`emoji` varchar(10) DEFAULT '💬',
	`sortOrder` int NOT NULL DEFAULT 0,
	`accessType` enum('open','invite_only','course_enrollment','purchase') NOT NULL DEFAULT 'open',
	`isInviteOnly` boolean NOT NULL DEFAULT false,
	`linkedCourseId` int,
	`price` int DEFAULT 0,
	`stripePriceId` varchar(255),
	`salesPageTitle` varchar(500),
	`salesPageContent` text,
	`salesPageCta` varchar(255) DEFAULT 'Join Community',
	`memberCount` int NOT NULL DEFAULT 0,
	`postCount` int NOT NULL DEFAULT 0,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_spaces_id` PRIMARY KEY(`id`)
);
