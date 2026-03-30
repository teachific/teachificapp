CREATE TABLE `content_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`ownerId` int NOT NULL,
	`parentId` int,
	`name` varchar(255) NOT NULL,
	`color` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_answer_choices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`choiceText` text NOT NULL,
	`choiceHtml` text,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`matchTarget` text,
	CONSTRAINT `quiz_answer_choices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`packageId` int,
	`userId` int,
	`sessionId` int,
	`orgId` int,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`scoreRaw` float,
	`scorePct` float,
	`isPassed` boolean,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`timeTakenSeconds` int,
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`questionType` enum('multiple_choice','true_false','short_answer','matching','multiple_select') NOT NULL DEFAULT 'multiple_choice',
	`questionText` text NOT NULL,
	`questionHtml` text,
	`imageUrl` text,
	`explanation` text,
	`points` float NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionId` int NOT NULL,
	`responseText` text,
	`selectedChoiceIds` text,
	`isCorrect` boolean,
	`pointsEarned` float DEFAULT 0,
	`timeTakenSeconds` int,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int,
	`orgId` int NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`instructions` text,
	`passingScore` float DEFAULT 70,
	`timeLimit` int,
	`maxAttempts` int,
	`shuffleQuestions` boolean NOT NULL DEFAULT false,
	`shuffleAnswers` boolean NOT NULL DEFAULT false,
	`showFeedbackImmediately` boolean NOT NULL DEFAULT true,
	`showCorrectAnswers` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content_packages` ADD `displayMode` varchar(20) DEFAULT 'native' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_packages` ADD `lmsShellConfig` text;--> statement-breakpoint
ALTER TABLE `content_packages` ADD `folderId` int;--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `learnerName` varchar(255);--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `learnerEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `learnerId` varchar(128);--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `learnerGroup` varchar(128);--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `customData` text;--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `utmSource` varchar(128);--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `utmMedium` varchar(128);--> statement-breakpoint
ALTER TABLE `play_sessions` ADD `utmCampaign` varchar(128);