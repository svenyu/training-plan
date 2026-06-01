-- CreateTable
CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(64) NOT NULL,
    `nickname` VARCHAR(64) NULL,
    `avatar_url` VARCHAR(512) NULL,
    `remind_enabled` BOOLEAN NOT NULL DEFAULT false,
    `remind_time` VARCHAR(8) NULL,
    `subscribe_quota` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_openid_key`(`openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exercise` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(32) NOT NULL DEFAULT 'main',
    `description` TEXT NULL,
    `video_url` VARCHAR(512) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `exercise_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `training_plan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `time_mode` VARCHAR(16) NOT NULL,
    `total_days` INTEGER NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `training_plan_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `plan_exercise` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `plan_id` BIGINT NOT NULL,
    `exercise_id` BIGINT NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `sets_desc` VARCHAR(200) NULL,

    INDEX `plan_exercise_plan_id_idx`(`plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `plan_execution` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `plan_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `train_date` DATE NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'in_progress',
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ended_at` DATETIME(3) NULL,

    INDEX `plan_execution_plan_id_train_date_idx`(`plan_id`, `train_date`),
    INDEX `plan_execution_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `execution_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `execution_id` BIGINT NOT NULL,
    `plan_exercise_id` BIGINT NOT NULL,
    `exercise_id` BIGINT NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `quality_rating` VARCHAR(16) NULL,
    `skip_reason` VARCHAR(200) NULL,
    `completed_at` DATETIME(3) NULL,

    INDEX `execution_item_execution_id_idx`(`execution_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `subscribe_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `result` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `exercise` ADD CONSTRAINT `exercise_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_plan` ADD CONSTRAINT `training_plan_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plan_exercise` ADD CONSTRAINT `plan_exercise_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `training_plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `plan_exercise` ADD CONSTRAINT `plan_exercise_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plan_execution` ADD CONSTRAINT `plan_execution_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `training_plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `plan_execution` ADD CONSTRAINT `plan_execution_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `execution_item` ADD CONSTRAINT `execution_item_execution_id_fkey` FOREIGN KEY (`execution_id`) REFERENCES `plan_execution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `execution_item` ADD CONSTRAINT `execution_item_plan_exercise_id_fkey` FOREIGN KEY (`plan_exercise_id`) REFERENCES `plan_exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `execution_item` ADD CONSTRAINT `execution_item_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `subscribe_log` ADD CONSTRAINT `subscribe_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
