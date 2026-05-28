CREATE TABLE `action_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`player_id` integer NOT NULL,
	`quarter` integer NOT NULL,
	`action_id` text NOT NULL,
	`action_name` text NOT NULL,
	`action_cost` real NOT NULL,
	`action_driver` text NOT NULL,
	`action_effect` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_token` text NOT NULL,
	`phase` text DEFAULT 'lobby' NOT NULL,
	`quarter` integer DEFAULT 0 NOT NULL,
	`max_quarters` integer DEFAULT 16 NOT NULL,
	`max_players` integer DEFAULT 6 NOT NULL,
	`grid_state` text,
	`driver_health` text,
	`weighted_scores` text,
	`average_willingness` real DEFAULT 0,
	`events` text,
	`active_disaster` text,
	`available_actions` text,
	`score` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`session_token` text NOT NULL,
	`name` text NOT NULL,
	`willingness_to_pay` real DEFAULT 150,
	`driver_importance` text,
	`preferences_submitted` integer DEFAULT false NOT NULL,
	`action_submitted_for_quarter` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
