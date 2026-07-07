/*
  Warnings:

  - You are about to drop the column `end_time` on the `shift` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `shift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `shift` DROP COLUMN `end_time`,
    DROP COLUMN `start_time`,
    ADD COLUMN `end_at` DATETIME(3) NULL,
    ADD COLUMN `start_at` DATETIME(3) NULL;

-- RenameIndex
ALTER TABLE `ai_generation_log` RENAME INDEX `idx_ai_generation_log_store_target_date` TO `idx_ai_generation_log_store_id_target_date`;

-- RenameIndex
ALTER TABLE `shift` RENAME INDEX `idx_shift_store_status_date` TO `idx_shift_store_id_status_date`;
