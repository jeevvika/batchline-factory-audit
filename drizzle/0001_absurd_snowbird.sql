CREATE TABLE `factory_workspace` (
	`slug` varchar(64) NOT NULL,
	`state` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `factory_workspace_slug` PRIMARY KEY(`slug`)
);
