-- 删除计划时级联删除训练会话（execution_item 已随 plan_execution 级联）
ALTER TABLE `plan_execution` DROP FOREIGN KEY `plan_execution_plan_id_fkey`;
ALTER TABLE `plan_execution` ADD CONSTRAINT `plan_execution_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `training_plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
