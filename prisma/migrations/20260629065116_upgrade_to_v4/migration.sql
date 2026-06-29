/*
  Warnings:

  - You are about to drop the column `fromStore` on the `helpchat` table. All the data in the column will be lost.
  - You are about to drop the column `toStore` on the `helpchat` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `shift` table. All the data in the column will be lost.
  - The `startTime` column on the `shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `endTime` column on the `shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[storeId,name]` on the table `EventTemplate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeId,date,title]` on the table `StoreEvent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeId` to the `EventTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromStoreId` to the `HelpChat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `HelpChat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `StoreEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `EventTemplate_name_unique` ON `eventtemplate`;

-- DropIndex
DROP INDEX `StoreEvent_date_unique` ON `storeevent`;

-- AlterTable
ALTER TABLE `eventtemplate` ADD COLUMN `storeId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `helpchat` DROP COLUMN `fromStore`,
    DROP COLUMN `toStore`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `fromStoreId` INTEGER NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `toStoreId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `sentAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `shift` DROP COLUMN `comment`,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `storeId` INTEGER NOT NULL,
    DROP COLUMN `startTime`,
    ADD COLUMN `startTime` TIME NULL,
    DROP COLUMN `endTime`,
    ADD COLUMN `endTime` TIME NULL;

-- AlterTable
ALTER TABLE `staff` ADD COLUMN `storeId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `storeevent` ADD COLUMN `storeId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Store` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `areaName` VARCHAR(191) NULL,
    `managerName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShiftComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shiftId` INTEGER NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `comment` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiGenerationLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `storeId` INTEGER NOT NULL,
    `targetDate` DATE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `EventTemplate_storeId_name_unique` ON `EventTemplate`(`storeId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `StoreEvent_storeId_date_title_unique` ON `StoreEvent`(`storeId`, `date`, `title`);

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventTemplate` ADD CONSTRAINT `EventTemplate_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreEvent` ADD CONSTRAINT `StoreEvent_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shift` ADD CONSTRAINT `Shift_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShiftComment` ADD CONSTRAINT `ShiftComment_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiGenerationLog` ADD CONSTRAINT `AiGenerationLog_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HelpChat` ADD CONSTRAINT `HelpChat_fromStoreId_fkey` FOREIGN KEY (`fromStoreId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HelpChat` ADD CONSTRAINT `HelpChat_toStoreId_fkey` FOREIGN KEY (`toStoreId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
