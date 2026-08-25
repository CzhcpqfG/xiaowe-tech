-- ============================================================
-- 小维健康科技官网 3.0 — 数据库初始化脚本
-- 目标数据库: MySQL 8.0+
-- 字符集: utf8mb4 / utf8mb4_unicode_ci
-- 存储引擎: InnoDB
--
-- 用法:
--   mysql -u root -p < init.sql
-- 或在 MySQL 客户端执行:
--   SOURCE /path/to/init.sql;
--
-- 关联文档:
--   - db/schema.md (设计文档, 字段含义/索引策略/安全规范)
--   - PROTOTYPE_PAGES.md (内容数据源)
--   - project_memory.md (后端与部署规划)
--
-- 注意:
--   1. 密码 hash 为占位符, 实际部署时由 NestJS 后端用 bcrypt(cost=12) 重新生成
--      生成方式: node -e "console.log(require('bcrypt').hashSync('Admin@2026', 12))"
--   2. 种子数据仅用于本地开发与测试, 生产环境部署后必须立即修改默认密码
--   3. 此脚本可重复执行 (DROP IF EXISTS + CREATE)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- 创建数据库 (如不存在)
CREATE DATABASE IF NOT EXISTS `bigsound_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `bigsound_db`;

-- ============================================================
-- 表结构定义 (按外键依赖顺序)
-- ============================================================

-- ------------------------------------------------------------
-- 1. users — C 端注册用户表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `phone`           VARCHAR(20)     NOT NULL COMMENT '手机号 (中国大陆 11 位)',
  `email`           VARCHAR(128)    DEFAULT NULL COMMENT '邮箱 (备选登录)',
  `password_hash`   VARCHAR(60)     NOT NULL COMMENT 'bcrypt 加密密码',
  `nickname`        VARCHAR(64)     NOT NULL COMMENT '昵称',
  `avatar_url`      VARCHAR(255)    DEFAULT NULL COMMENT '头像 URL (OSS 路径)',
  `role`            ENUM('visitor','vip') NOT NULL DEFAULT 'visitor' COMMENT 'C 端角色',
  `status`          ENUM('active','disabled') NOT NULL DEFAULT 'active' COMMENT '账号状态',
  `last_login_at`   DATETIME        DEFAULT NULL COMMENT '最近登录时间',
  `last_login_ip`   VARCHAR(45)     DEFAULT NULL COMMENT '最近登录 IP',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '软删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_status_deleted` (`status`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='C 端注册用户表';

-- ------------------------------------------------------------
-- 2. admin_users — 后台管理员表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username`        VARCHAR(32)     NOT NULL COMMENT '登录用户名',
  `password_hash`   VARCHAR(60)     NOT NULL COMMENT 'bcrypt 加密密码',
  `nickname`        VARCHAR(64)     NOT NULL COMMENT '显示名',
  `email`           VARCHAR(128)    DEFAULT NULL COMMENT '邮箱',
  `phone`           VARCHAR(20)     DEFAULT NULL COMMENT '手机号',
  `role`            ENUM('super_admin','editor','hr','readonly') NOT NULL DEFAULT 'readonly' COMMENT '角色',
  `permissions`     JSON            DEFAULT NULL COMMENT '细粒度权限 (覆盖角色默认)',
  `status`          ENUM('active','disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
  `last_login_at`   DATETIME        DEFAULT NULL COMMENT '最近登录',
  `last_login_ip`   VARCHAR(45)     DEFAULT NULL COMMENT '最近 IP',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台管理员表';

-- ------------------------------------------------------------
-- 3. news — 资讯文章表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(255)    NOT NULL COMMENT '标题',
  `category`        ENUM('company','product','industry') NOT NULL COMMENT '分类',
  `cover_image_url` VARCHAR(255)    DEFAULT NULL COMMENT '封面图 URL',
  `summary`         VARCHAR(500)    DEFAULT NULL COMMENT '摘要',
  `content`         LONGTEXT        NOT NULL COMMENT '正文 HTML',
  `author`          VARCHAR(64)     DEFAULT '大声助听器' COMMENT '作者/来源',
  `admin_id`        BIGINT UNSIGNED DEFAULT NULL COMMENT '最后编辑管理员',
  `view_count`      INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '浏览量',
  `is_published`    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否发布',
  `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '软删除',
  `version`         INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '乐观锁版本',
  `sort_order`      INT             NOT NULL DEFAULT 0 COMMENT '手动排序',
  `published_at`    DATETIME        DEFAULT NULL COMMENT '发布时间',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_published_deleted` (`category`, `is_published`, `is_deleted`),
  KEY `idx_published_at` (`published_at`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_sort_order` (`sort_order`),
  FULLTEXT KEY `idx_title_content` (`title`, `content`) WITH PARSER ngram,
  CONSTRAINT `fk_news_admin_users` FOREIGN KEY (`admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资讯文章表';

-- ------------------------------------------------------------
-- 4. jobs — 招聘职位表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(128)    NOT NULL COMMENT '职位名',
  `department`      ENUM('tech','manufacturing','marketing','hr_admin') NOT NULL COMMENT '部门分类',
  `location`        VARCHAR(64)     NOT NULL COMMENT '工作地点',
  `job_type`        ENUM('full_time','part_time','intern') NOT NULL DEFAULT 'full_time' COMMENT '工作类型',
  `experience`      VARCHAR(32)     DEFAULT NULL COMMENT '经验要求',
  `education`       VARCHAR(32)     DEFAULT NULL COMMENT '学历',
  `headcount`       VARCHAR(32)     DEFAULT NULL COMMENT '招聘人数',
  `salary_range`    VARCHAR(64)     DEFAULT NULL COMMENT '薪资范围',
  `description`     TEXT            DEFAULT NULL COMMENT '岗位职责 (富文本)',
  `requirement`     TEXT            DEFAULT NULL COMMENT '任职要求 (富文本)',
  `is_hot`          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否热门',
  `is_published`    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否发布',
  `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '软删除',
  `version`         INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '乐观锁',
  `sort_order`      INT             NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_department_published_deleted` (`department`, `is_published`, `is_deleted`),
  KEY `idx_is_hot` (`is_hot`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招聘职位表';

-- ------------------------------------------------------------
-- 5. job_applications — 简历投递记录表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE `job_applications` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_id`          BIGINT UNSIGNED NOT NULL COMMENT '关联 jobs.id',
  `user_id`         BIGINT UNSIGNED DEFAULT NULL COMMENT '关联 users.id (未登录 NULL)',
  `applicant_name`  VARCHAR(64)     NOT NULL COMMENT '应聘者姓名',
  `phone`           VARCHAR(20)     NOT NULL COMMENT '联系电话',
  `email`           VARCHAR(128)    DEFAULT NULL COMMENT '邮箱',
  `resume_url`      VARCHAR(255)    DEFAULT NULL COMMENT '简历 URL (OSS)',
  `cover_letter`    TEXT            DEFAULT NULL COMMENT '求职信',
  `status`          ENUM('pending','reviewing','interview','offer','rejected','hired') NOT NULL DEFAULT 'pending' COMMENT '投递状态',
  `admin_id`        BIGINT UNSIGNED DEFAULT NULL COMMENT '处理人 (HR)',
  `remark`          TEXT            DEFAULT NULL COMMENT 'HR 备注',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_job` (`user_id`, `job_id`),
  KEY `idx_job_id` (`job_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_admin_id` (`admin_id`),
  CONSTRAINT `fk_job_applications_jobs` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_job_applications_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_job_applications_admins` FOREIGN KEY (`admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='简历投递记录表';

-- ------------------------------------------------------------
-- 6. products — 产品展示表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `model`           VARCHAR(32)     NOT NULL COMMENT '型号',
  `name`            VARCHAR(128)    NOT NULL COMMENT '产品名',
  `category`        ENUM('hearing_aid','smartwatch','earphone') NOT NULL COMMENT '大类',
  `form_factor`     ENUM('bte','ite','neck','bone','box','watch_adult','watch_kid','earphone') DEFAULT NULL COMMENT '形态',
  `price_min`       DECIMAL(10,2)   DEFAULT NULL COMMENT '最低价',
  `price_max`       DECIMAL(10,2)   DEFAULT NULL COMMENT '最高价',
  `price_note`      VARCHAR(64)     DEFAULT NULL COMMENT '价格说明',
  `features`        JSON            DEFAULT NULL COMMENT '核心特性数组',
  `specs`           JSON            DEFAULT NULL COMMENT '详细规格',
  `description`     TEXT            DEFAULT NULL COMMENT '产品介绍',
  `image_url`       VARCHAR(255)    DEFAULT NULL COMMENT '主图 URL',
  `gallery_urls`    JSON            DEFAULT NULL COMMENT '多图轮播 URL 数组',
  `is_published`    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否发布',
  `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '软删除',
  `version`         INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '乐观锁',
  `sort_order`      INT             NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`model`),
  KEY `idx_category_published_deleted` (`category`, `is_published`, `is_deleted`),
  KEY `idx_form_factor` (`form_factor`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品展示表';

-- ------------------------------------------------------------
-- 7. stores — 门店表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stores`;
CREATE TABLE `stores` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(128)    NOT NULL COMMENT '门店名',
  `type`            ENUM('direct','franchise') NOT NULL COMMENT '直营/联营',
  `phone`           VARCHAR(20)     DEFAULT NULL COMMENT '联系电话',
  `address`         VARCHAR(255)    NOT NULL COMMENT '详细地址',
  `province`        VARCHAR(32)     DEFAULT NULL COMMENT '省份',
  `city`            VARCHAR(32)     DEFAULT NULL COMMENT '城市',
  `district`        VARCHAR(32)     DEFAULT NULL COMMENT '区县',
  `longitude`       DECIMAL(10,7)   DEFAULT NULL COMMENT '经度',
  `latitude`        DECIMAL(10,7)   DEFAULT NULL COMMENT '纬度',
  `business_hours`  VARCHAR(64)     DEFAULT NULL COMMENT '营业时间',
  `image_url`       VARCHAR(255)    DEFAULT NULL COMMENT '门店图片',
  `description`     TEXT            DEFAULT NULL COMMENT '门店介绍',
  `is_published`    TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否展示',
  `is_deleted`      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '软删除',
  `sort_order`      INT             NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type_published_deleted` (`type`, `is_published`, `is_deleted`),
  KEY `idx_city` (`city`),
  KEY `idx_geo` (`longitude`, `latitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门店表';

-- ------------------------------------------------------------
-- 8. invest_inquiries — 招商加盟咨询表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `invest_inquiries`;
CREATE TABLE `invest_inquiries` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT UNSIGNED DEFAULT NULL COMMENT '已登录用户关联',
  `contact_name`    VARCHAR(64)     NOT NULL COMMENT '联系人',
  `phone`           VARCHAR(20)     NOT NULL COMMENT '电话',
  `email`           VARCHAR(128)    DEFAULT NULL COMMENT '邮箱',
  `region`          VARCHAR(64)     DEFAULT NULL COMMENT '意向区域',
  `intent`          VARCHAR(64)     DEFAULT NULL COMMENT '意向店型',
  `budget`          VARCHAR(64)     DEFAULT NULL COMMENT '预算范围',
  `message`         TEXT            DEFAULT NULL COMMENT '留言',
  `status`          ENUM('pending','contacted','follow_up','signed','rejected') NOT NULL DEFAULT 'pending' COMMENT '跟进状态',
  `admin_id`        BIGINT UNSIGNED DEFAULT NULL COMMENT '负责人',
  `remark`          TEXT            DEFAULT NULL COMMENT '内部备注',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status_created` (`status`, `created_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_admin_id` (`admin_id`),
  CONSTRAINT `fk_invest_inquiries_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_invest_inquiries_admins` FOREIGN KEY (`admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='招商加盟咨询表';

-- ------------------------------------------------------------
-- 9. cms_audit_logs — 操作日志表
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cms_audit_logs`;
CREATE TABLE `cms_audit_logs` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`        BIGINT UNSIGNED NOT NULL COMMENT '操作人',
  `action`          ENUM('create','update','delete','publish','unpublish','login','logout') NOT NULL COMMENT '操作类型',
  `target_table`    VARCHAR(64)     NOT NULL COMMENT '目标表名',
  `target_id`       BIGINT UNSIGNED DEFAULT NULL COMMENT '目标记录 ID',
  `diff_json`       JSON            DEFAULT NULL COMMENT '变更前后对比',
  `ip`              VARCHAR(45)     DEFAULT NULL COMMENT '操作 IP',
  `user_agent`      VARCHAR(255)    DEFAULT NULL COMMENT 'UA',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_id_created` (`admin_id`, `created_at`),
  KEY `idx_target` (`target_table`, `target_id`),
  KEY `idx_action_created` (`action`, `created_at`),
  CONSTRAINT `fk_cms_audit_logs_admins` FOREIGN KEY (`admin_id`) REFERENCES `admin_users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 种子数据 (Seed Data)
-- ============================================================

-- ------------------------------------------------------------
-- 管理员账号 (4 个, 密码 hash 为 bcrypt cost=12 占位符)
-- 实际部署时用 NestJS 后端重新生成 hash, 明文密码见 schema.md §7.1
-- 这里使用的占位 hash 对应明文: Admin@2026 / Editor@2026 / HR@2026 / View@2026
-- 占位 hash 仅用于本地开发, 不可登录实际后端 (bcrypt 验证会用真实 hash)
-- ------------------------------------------------------------
INSERT INTO `admin_users` (`username`, `password_hash`, `nickname`, `email`, `role`, `status`, `created_at`) VALUES
  ('superadmin', '$2b$12$placeholder.superadmin.hash.must.regenerate.before.use.XX', '超级管理员', 'admin@bigsound.com', 'super_admin', 'active', NOW()),
  ('editor01',   '$2b$12$placeholder.editor01.hash.must.regenerate.before.use.XXXX', '内容编辑 - 张三', 'editor@bigsound.com', 'editor', 'active', NOW()),
  ('hr01',       '$2b$12$placeholder.hr01.hash.must.regenerate.before.use.XXXXXXX', '招聘 HR - 李四', 'hr@bigsound.com', 'hr', 'active', NOW()),
  ('viewer01',   '$2b$12$placeholder.viewer01.hash.must.regenerate.before.use.XXXXX', '只读账号 - 王五', 'viewer@bigsound.com', 'readonly', 'active', NOW());

-- ------------------------------------------------------------
-- 测试用户 (2 个, 密码明文 Test@2026, 同上占位 hash)
-- ------------------------------------------------------------
INSERT INTO `users` (`phone`, `email`, `password_hash`, `nickname`, `role`, `status`, `created_at`) VALUES
  ('13800138000', 'test_a@example.com', '$2b$12$placeholder.userA.hash.must.regenerate.before.use.XXXX', '测试用户A', 'visitor', 'active', NOW()),
  ('13800138001', 'test_b@example.com', '$2b$12$placeholder.userB.hash.must.regenerate.before.use.XXXX', '测试用户B', 'visitor', 'active', NOW());

-- ------------------------------------------------------------
-- 产品数据 (12 款助听器, 来自 PROTOTYPE_PAGES.md §4.5)
-- ------------------------------------------------------------
INSERT INTO `products` (`model`, `name`, `category`, `form_factor`, `price_min`, `price_max`, `price_note`, `features`, `is_published`, `sort_order`, `created_at`) VALUES
  ('DAB005', '臻听版', 'hearing_aid', 'bte', 12999.00, 15999.00, 'Pro 12999 / Max 15999',
    JSON_ARRAY(
      JSON_OBJECT('label','算法2.0','desc','中文言语增强补偿'),
      JSON_OBJECT('label','AI AGC','desc','自动增益控制'),
      JSON_OBJECT('label','HHT','desc','非平稳降噪算法'),
      JSON_OBJECT('label','WNR','desc','风噪抑制'),
      JSON_OBJECT('label','5核异构','desc','12nm 全数字处理器'),
      JSON_OBJECT('label','AI算力超','desc','15亿次/秒乘累加运算')
    ), 1, 1, NOW()),

  ('DAB006', '标准版', 'hearing_aid', 'ite', 15999.00, 15999.00, '15999',
    JSON_ARRAY(
      JSON_OBJECT('label','算法2.0','desc','中文言语增强补偿'),
      JSON_OBJECT('label','AI AGC','desc','自动增益控制'),
      JSON_OBJECT('label','HHT','desc','非平稳降噪算法'),
      JSON_OBJECT('label','DASH','desc','双重啸叫抑制'),
      JSON_OBJECT('label','5核异构','desc','12nm 全数字处理器'),
      JSON_OBJECT('label','AI算力超','desc','15亿次/秒乘累加运算')
    ), 1, 2, NOW()),

  ('DAB007', '尊享版', 'hearing_aid', 'neck', 5999.00, 7999.00, 'Pro 5999 / Max 7999',
    JSON_ARRAY(
      JSON_OBJECT('label','AFC','desc','自适应反馈(啸叫)抑制'),
      JSON_OBJECT('label','INR','desc','脉冲噪声(瞬噪)抑制算法'),
      JSON_OBJECT('label','HFMR','desc','高频毫秒重塑'),
      JSON_OBJECT('label','HHT','desc','非平稳横切降噪'),
      JSON_OBJECT('label','5核异构','desc','12nm 全数字处理器'),
      JSON_OBJECT('label','AI算力超','desc','15亿次/秒乘累加运算')
    ), 1, 3, NOW()),

  ('SAB001', '骨导版', 'hearing_aid', 'bone', 599.00, 599.00, '599',
    JSON_ARRAY(
      JSON_OBJECT('label','24通道','desc','WDRC'),
      JSON_OBJECT('label','1键','desc','极简操作'),
      JSON_OBJECT('label','多重','desc','智能降噪'),
      JSON_OBJECT('label','360°','desc','全向性硅麦'),
      JSON_OBJECT('label','41dB','desc','满档声增益'),
      JSON_OBJECT('label','121dB','desc','最大声输出')
    ), 1, 4, NOW()),

  ('SAP001', '悦享版', 'hearing_aid', 'ite', 1799.00, 1799.00, '1799',
    JSON_ARRAY(
      JSON_OBJECT('label','四核','desc','专业助听芯片'),
      JSON_OBJECT('label','64通道','desc','WDRC'),
      JSON_OBJECT('label','DASH','desc','双重啸叫抑制'),
      JSON_OBJECT('label','WNR','desc','风噪抑制'),
      JSON_OBJECT('label','48dB','desc','满档声增益'),
      JSON_OBJECT('label','113dB','desc','最大声输出')
    ), 1, 5, NOW()),

  ('DAQ001', '尊享版', 'hearing_aid', 'bte', NULL, NULL, '待 PM 确认',
    JSON_ARRAY(
      JSON_OBJECT('label','中文言语','desc','增强补偿算法'),
      JSON_OBJECT('label','HFMR','desc','高频毫秒重塑'),
      JSON_OBJECT('label','HHT','desc','非平稳降噪算法'),
      JSON_OBJECT('label','DASH','desc','双重啸叫抑制'),
      JSON_OBJECT('label','64通道','desc','WDRC'),
      JSON_OBJECT('label','45dB','desc','满档声增益')
    ), 1, 6, NOW()),

  ('SAQ002', '尊享版', 'hearing_aid', 'ite', 1999.00, 1999.00, '1999',
    JSON_ARRAY(
      JSON_OBJECT('label','AFC','desc','自适应反馈(啸叫)抑制'),
      JSON_OBJECT('label','INR','desc','脉冲噪声(瞬噪)抑制算法'),
      JSON_OBJECT('label','HFMR','desc','高频毫秒重塑'),
      JSON_OBJECT('label','64通道','desc','WDRC'),
      JSON_OBJECT('label','43dB','desc','满档声增益'),
      JSON_OBJECT('label','111dB','desc','最大声输出')
    ), 1, 7, NOW()),

  ('SAQ003', '标准版', 'hearing_aid', 'ite', 1699.00, 1699.00, '1699',
    JSON_ARRAY(
      JSON_OBJECT('label','HFMR','desc','高频毫秒重塑'),
      JSON_OBJECT('label','INR','desc','脉冲噪声(瞬噪)抑制算法'),
      JSON_OBJECT('label','DASH','desc','双重啸叫抑制'),
      JSON_OBJECT('label','中文言语','desc','增强补偿算法'),
      JSON_OBJECT('label','45dB','desc','满档声增益'),
      JSON_OBJECT('label','116dB','desc','最大声输出')
    ), 1, 8, NOW()),

  ('SAN001', '颈挂旗舰版', 'hearing_aid', 'neck', 9999.00, 9999.00, '9999',
    JSON_ARRAY(
      JSON_OBJECT('label','算法2.0','desc','中文言语增强补偿'),
      JSON_OBJECT('label','AI','desc','视频 AI 验配'),
      JSON_OBJECT('label','三重','desc','啸叫抑制'),
      JSON_OBJECT('label','WNR','desc','风噪抑制'),
      JSON_OBJECT('label','48dB','desc','满档声增益'),
      JSON_OBJECT('label','113dB','desc','最大声输出')
    ), 1, 9, NOW()),

  ('SAN002', '优享版', 'hearing_aid', 'neck', 2399.00, 2399.00, '2399',
    JSON_ARRAY(
      JSON_OBJECT('label','四核','desc','专业助听芯片'),
      JSON_OBJECT('label','33H','desc','超长续航'),
      JSON_OBJECT('label','三重','desc','啸叫抑制'),
      JSON_OBJECT('label','HFMR','desc','高频毫秒重塑'),
      JSON_OBJECT('label','42dB','desc','满档声增益'),
      JSON_OBJECT('label','110dB','desc','最大声输出')
    ), 1, 10, NOW()),

  ('SAN003', '尊享版', 'hearing_aid', 'neck', 3599.00, 3599.00, '3599',
    JSON_ARRAY(
      JSON_OBJECT('label','AI','desc','视频 AI 验配'),
      JSON_OBJECT('label','INR','desc','脉冲噪声(瞬噪)抑制算法'),
      JSON_OBJECT('label','HFMR','desc','高频毫秒重塑'),
      JSON_OBJECT('label','HHT','desc','非平稳横切降噪'),
      JSON_OBJECT('label','57dB','desc','满档声增益'),
      JSON_OBJECT('label','120dB','desc','最大声输出')
    ), 1, 11, NOW()),

  ('BO', '体佩版', 'hearing_aid', 'box', 1999.00, 1999.00, '1999',
    JSON_ARRAY(
      JSON_OBJECT('label','四核','desc','专业助听芯片'),
      JSON_OBJECT('label','64通道','desc','WDRC'),
      JSON_OBJECT('label','DASH','desc','双重啸叫抑制'),
      JSON_OBJECT('label','INR','desc','突发异响抑制'),
      JSON_OBJECT('label','30dB','desc','满档声增益'),
      JSON_OBJECT('label','115dB','desc','最大声输出')
    ), 1, 12, NOW());

-- ------------------------------------------------------------
-- 招聘职位 (9 个, 来自 PROTOTYPE_PAGES.md §7.5)
-- ------------------------------------------------------------
INSERT INTO `jobs` (`title`, `department`, `location`, `job_type`, `experience`, `education`, `headcount`, `salary_range`, `description`, `requirement`, `is_hot`, `is_published`, `sort_order`, `created_at`) VALUES
  ('助听器研发高级经理', 'tech', '深圳龙华', 'full_time', '5-10年', '硕士及以上', '2', '15-30K',
    '负责助听器产品研发规划与技术路线制定;带领团队完成芯片选型、算法实现、硬件设计;协调跨部门资源推动项目落地。',
    '电子工程/通信/声学相关专业硕士及以上;5年以上助听器或音频产品研发经验;熟悉 DSP/NPU 架构;有团队管理经验。',
    1, 1, 1, NOW()),

  ('助听器研发工程师', 'tech', '深圳龙华', 'full_time', '3-5年', '本科及以上', '若干', '12-24K',
    '参与助听器核心算法研发,包括中文言语增强、降噪、啸叫抑制等;协助硬件团队完成芯片调试与产品验证。',
    '电子/通信/计算机相关专业本科及以上;3年以上音频算法或 DSP 开发经验;熟悉 MATLAB/C/C++。',
    0, 1, 2, NOW()),

  ('生产制造工程师', 'manufacturing', '深圳龙华', 'full_time', '3-5年', '大专及以上', '2', '8-15K',
    '负责助听器生产线工艺优化与品质管控;制定生产 SOP;跟踪生产异常并推动改善。',
    '机械/电子相关专业大专及以上;3 年以上电子制造经验;有医疗器械生产经验优先。',
    0, 1, 3, NOW()),

  ('高级听力师', 'marketing', '深圳罗湖', 'full_time', '5-10年', '本科及以上', '若干', '8-12K',
    '为听损用户提供专业听力评估与助听器验配服务;参与门店运营与客户关系维护;配合市场活动开展科普讲座。',
    '听力学/医学相关专业本科及以上;持听力师资格证;5 年以上验配经验;沟通能力强。',
    1, 1, 4, NOW()),

  ('中级验配师', 'marketing', '深圳罗湖', 'full_time', '3-5年', '大专及以上', '若干', '5-9K',
    '为用户提供助听器验配、调试、保养服务;协助高级听力师完成听力评估。',
    '听力学/医学相关大专及以上;持验配师证;3 年以上验配经验。',
    0, 1, 5, NOW()),

  ('初级验配师', 'marketing', '深圳罗湖', 'full_time', '1-3年', '大专及以上', '若干', '5-7K',
    '协助中高级验配师完成日常工作;学习助听器验配流程与客户服务技巧。',
    '听力学/医学相关大专及以上;应届生或 1-3 年经验;持或正在考取验配师证。',
    0, 1, 6, NOW()),

  ('行政人事经理', 'hr_admin', '深圳龙华', 'full_time', '5-10年', '本科及以上', '1', '8-15K',
    '负责公司行政与人事全面工作;招聘、培训、绩效、员工关系管理;办公环境与后勤保障。',
    '人力资源/管理类本科及以上;5 年以上人事行政经验;熟悉劳动法规。',
    0, 1, 7, NOW()),

  ('行政助理', 'hr_admin', '深圳龙华', 'full_time', '1-3年', '大专及以上', '1', '5-7K',
    '协助行政人事经理完成日常事务;文档管理、会议组织、员工活动支持。',
    '行政/管理类大专及以上;1-3 年行政经验;熟练使用办公软件。',
    0, 1, 8, NOW()),

  ('市场运营专员', 'marketing', '深圳龙华', 'full_time', '3-5年', '本科及以上', '若干', '8-15K',
    '负责品牌新媒体内容运营;策划线上线下市场活动;KOL/KOC 合作与本地生活平台运营。',
    '市场营销/传播类本科及以上;3 年以上市场运营经验;有医疗器械/消费电子品牌经验优先。',
    0, 1, 9, NOW());

-- ------------------------------------------------------------
-- 门店 (1 家直营, 来自 PROTOTYPE_PAGES.md §4.8 + §6.6)
-- ------------------------------------------------------------
INSERT INTO `stores` (`name`, `type`, `phone`, `address`, `province`, `city`, `district`, `longitude`, `latitude`, `business_hours`, `is_published`, `sort_order`, `created_at`) VALUES
  ('创维大声听力服务中心 (深圳罗湖喜荟城)', 'direct', '13116993115',
    '深圳市罗湖区喜荟城东区二层 238 号 (地铁 5 号线太安站 C 口步行 700 米)',
    '广东省', '深圳市', '罗湖区',
    114.1315000, 22.5847000,
    '9:00-18:00', 1, 1, NOW());

-- ------------------------------------------------------------
-- 示例资讯文章 (3 篇, 每分类 1 篇, 用于前台联调)
-- ------------------------------------------------------------
INSERT INTO `news` (`title`, `category`, `summary`, `content`, `author`, `admin_id`, `view_count`, `is_published`, `published_at`, `sort_order`, `created_at`) VALUES
  ('大声助听器荣登 2026 中国国际福祉博览会', 'company',
    '大声中文助听器在 2026 中国国际福祉博览会上重磅亮相,展示 AI 中文助听核心技术。',
    '<h2>重磅亮相</h2><p>2026 年 3 月,大声助听器参展 2026 中国国际福祉博览会暨康复博览会,展示最新 AI 中文助听器产品矩阵。</p><p>本次展会,大声展位吸引了大量行业专家与听障人士驻足体验。</p>',
    '大声助听器', 1, 0, 1, NOW() - INTERVAL 7 DAY, 1, NOW() - INTERVAL 7 DAY),

  ('DAB005 臻听版上市 — Pro/Max 双版本同步发售', 'product',
    '大声 DAB005 臻听版正式上市,搭载 5 核异构 12nm 处理器,售价 Pro 12999 / Max 15999。',
    '<h2>DAB005 臻听版</h2><p>搭载 5 核异构 12nm 全数字处理器,AI 算力超 15 亿次/秒乘累加运算。</p><p>支持算法 2.0 中文言语增强补偿、HHT 非平稳降噪、AI AGC 自动增益控制。</p>',
    '大声助听器', 1, 0, 1, NOW() - INTERVAL 14 DAY, 1, NOW() - INTERVAL 14 DAY),

  ('WHO 报告:2050 年全球听损人群将达 25 亿', 'industry',
    '世界卫生组织最新报告指出,2050 年全球听力损失人群预计达 25 亿,中度以上听损人群将达 7 亿。',
    '<h2>WHO 最新报告</h2><p>世界卫生组织发布的《世界听力报告》预测,2050 年全球将有 25 亿人面临听力损失。</p><p>中国助听器市场潜力将超 1200 亿,行业前景广阔。</p>',
    '行业资讯', 1, 0, 1, NOW() - INTERVAL 30 DAY, 1, NOW() - INTERVAL 30 DAY);

-- ============================================================
-- 验证查询 (建表后可执行检查)
-- ============================================================
SELECT '=== 表清单 ===' AS section;
SHOW TABLES;

SELECT '=== 管理员账号 ===' AS section;
SELECT id, username, nickname, role, status FROM admin_users;

SELECT '=== 测试用户 ===' AS section;
SELECT id, phone, nickname, role, status FROM users;

SELECT '=== 产品列表 ===' AS section;
SELECT id, model, name, form_factor, price_min, price_max, price_note FROM products ORDER BY sort_order;

SELECT '=== 招聘职位 ===' AS section;
SELECT id, title, department, location, salary_range FROM jobs ORDER BY sort_order;

SELECT '=== 门店 ===' AS section;
SELECT id, name, type, city, address FROM stores;

SELECT '=== 资讯文章 ===' AS section;
SELECT id, title, category, is_published, published_at FROM news ORDER BY published_at DESC;

-- ============================================================
-- 脚本结束
-- 后续操作:
--   1. 用 NestJS 后端生成真实 bcrypt hash, UPDATE admin_users/users 表的 password_hash
--   2. 配置阿里云 RDS 白名单, 仅允许 ECS 内网访问
--   3. 启用 RDS 自动备份 + binlog 日志备份
--   4. 创建专用应用账号 (非 root), 仅授权 SELECT/INSERT/UPDATE/DELETE
-- ============================================================
