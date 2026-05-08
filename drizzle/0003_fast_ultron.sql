CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tool_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`partner` text NOT NULL,
	`source` text NOT NULL,
	`clicked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`synced_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
