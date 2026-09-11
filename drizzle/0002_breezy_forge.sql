CREATE TABLE `login_codes` (
	`hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_code_email` ON `login_codes` (`email`);--> statement-breakpoint
CREATE INDEX `login_code_expiry` ON `login_codes` (`expires`);