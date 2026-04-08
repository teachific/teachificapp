-- Migration: App Access Restructure
-- Replace legacy role enums with web/desktop/bundle/none access model

-- Add new columns with new enum types
ALTER TABLE `users` ADD COLUMN `studioAccess` ENUM('none','web','desktop','bundle') NOT NULL DEFAULT 'none';
ALTER TABLE `users` ADD COLUMN `quizCreatorAccess` ENUM('none','web','desktop','bundle') NOT NULL DEFAULT 'none';
ALTER TABLE `users` ADD COLUMN `creatorAccess` ENUM('none','web','desktop','bundle') NOT NULL DEFAULT 'none';

-- Migrate existing data: map old roles to new access values
-- studioRole: none->none, creator->desktop, pro->desktop, team->bundle
UPDATE `users` SET `studioAccess` = CASE
  WHEN `studioRole` = 'creator' THEN 'desktop'
  WHEN `studioRole` = 'pro' THEN 'desktop'
  WHEN `studioRole` = 'team' THEN 'bundle'
  ELSE 'none'
END;

-- quizCreatorRole: none->none, lite->web, premium->desktop
UPDATE `users` SET `quizCreatorAccess` = CASE
  WHEN `quizCreatorRole` = 'lite' THEN 'web'
  WHEN `quizCreatorRole` = 'premium' THEN 'desktop'
  ELSE 'none'
END;

-- creatorRole: none->none, starter->web, pro->desktop, team->bundle
UPDATE `users` SET `creatorAccess` = CASE
  WHEN `creatorRole` = 'starter' THEN 'web'
  WHEN `creatorRole` = 'pro' THEN 'desktop'
  WHEN `creatorRole` = 'team' THEN 'bundle'
  ELSE 'none'
END;

-- Drop old columns
ALTER TABLE `users` DROP COLUMN `studioRole`;
ALTER TABLE `users` DROP COLUMN `quizCreatorRole`;
ALTER TABLE `users` DROP COLUMN `creatorRole`;
