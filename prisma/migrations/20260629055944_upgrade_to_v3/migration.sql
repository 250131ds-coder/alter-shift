/*
  Warnings:

  - You are about to drop the column `contact` on the `staff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[staffId,date]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `shift` MODIFY `date` DATE NOT NULL,
    MODIFY `startTime` INTEGER NULL,
    MODIFY `endTime` INTEGER NULL,
    MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `staff` DROP COLUMN `contact`,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `storeevent` ADD COLUMN `templateId` INTEGER NULL,
    MODIFY `date` DATE NOT NULL;

-- CreateTable
CREATE TABLE `EventTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventTemplate_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventTemplateRequirement` (
    `templateId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`templateId`, `skillId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HelpChat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fromStore` VARCHAR(191) NOT NULL,
    `toStore` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `isAi` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Shift_staffId_date_unique` ON `Shift`(`staffId`, `date`);

-- AddForeignKey
ALTER TABLE `EventTemplateRequirement` ADD CONSTRAINT `EventTemplateRequirement_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `EventTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventTemplateRequirement` ADD CONSTRAINT `EventTemplateRequirement_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreEvent` ADD CONSTRAINT `StoreEvent_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `EventTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `skill` RENAME INDEX `Skill_name_key` TO `Skill_name_unique`;

-- RenameIndex
ALTER TABLE `storeevent` RENAME INDEX `StoreEvent_date_key` TO `StoreEvent_date_unique`;
