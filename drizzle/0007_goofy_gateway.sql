CREATE TABLE `recipe_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`tag` text NOT NULL,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
