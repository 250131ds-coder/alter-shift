-- AlterTable
ALTER TABLE `shift` ADD COLUMN `is_overnight` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `work_minutes` INTEGER NOT NULL DEFAULT 0;
