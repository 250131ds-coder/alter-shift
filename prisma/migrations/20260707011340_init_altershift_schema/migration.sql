-- CreateIndex
CREATE INDEX `idx_ai_generation_log_store_target_date` ON `ai_generation_log`(`store_id`, `target_date`);

-- CreateIndex
CREATE INDEX `idx_event_template_store_id` ON `event_template`(`store_id`);

-- CreateIndex
CREATE INDEX `idx_shift_store_id_date` ON `shift`(`store_id`, `date`);

-- CreateIndex
CREATE INDEX `idx_shift_staff_id_date` ON `shift`(`staff_id`, `date`);

-- CreateIndex
CREATE INDEX `idx_shift_store_status_date` ON `shift`(`store_id`, `status`, `date`);

-- CreateIndex
CREATE INDEX `idx_store_event_store_id_date` ON `store_event`(`store_id`, `date`);

-- RenameIndex
ALTER TABLE `help_chat` RENAME INDEX `help_chat_from_store_id_fkey` TO `idx_help_chat_from_store_id`;

-- RenameIndex
ALTER TABLE `help_chat` RENAME INDEX `help_chat_to_store_id_fkey` TO `idx_help_chat_to_store_id`;

-- RenameIndex
ALTER TABLE `shift_comment` RENAME INDEX `shift_comment_shift_id_fkey` TO `idx_shift_comment_shift_id`;

-- RenameIndex
ALTER TABLE `skill` RENAME INDEX `skill_store_id_name_unique` TO `skill_name_unique`;

-- RenameIndex
ALTER TABLE `staff` RENAME INDEX `staff_store_id_fkey` TO `idx_staff_store_id`;
