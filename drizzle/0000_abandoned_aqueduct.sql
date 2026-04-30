CREATE TABLE `cook_prep_state` (
	`id` text PRIMARY KEY NOT NULL,
	`cook_id` text NOT NULL,
	`prep_item_id` text NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`cook_id`) REFERENCES `cooks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prep_item_id`) REFERENCES `prep_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cooks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`recipe_id` text NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	`rating` integer,
	`notes` text,
	`synced_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`amount` text NOT NULL,
	`name` text NOT NULL,
	`prep` text,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prep_items` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`label` text NOT NULL,
	`duration` text,
	`default_checked` integer DEFAULT false NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`duration` text NOT NULL,
	`servings` integer DEFAULT 4 NOT NULL,
	`tag` text,
	`tint_key` text,
	`source_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`synced_at` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `steps` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`segments_json` text NOT NULL,
	`ingredients_json` text NOT NULL,
	`timers_json` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`name` text NOT NULL,
	`price` text NOT NULL,
	`partner` text NOT NULL,
	`affiliate_url` text,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`cooking_frequency` text,
	`dietary_preferences` text,
	`skill_level` text,
	`default_serving_size` integer DEFAULT 4,
	`has_completed_onboarding` integer DEFAULT false NOT NULL,
	`synced_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`is_guest` integer DEFAULT true NOT NULL,
	`email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`synced_at` text
);
