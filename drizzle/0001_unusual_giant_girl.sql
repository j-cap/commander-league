CREATE TABLE `join_requests` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL,
	`verified` integer NOT NULL,
	`reviewed` integer,
	`reviewed_by` text
);
--> statement-breakpoint
CREATE INDEX `join_request_status` ON `join_requests` (`status`,`created`);--> statement-breakpoint
CREATE TABLE `join_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`expires` integer,
	`max_uses` integer,
	`uses` integer NOT NULL,
	`updated_by` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `join_tokens` (
	`hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `join_token_expiry` ON `join_tokens` (`expires`);