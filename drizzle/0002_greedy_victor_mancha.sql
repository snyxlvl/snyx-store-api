CREATE TABLE `extensionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licenseId` int,
	`userId` int,
	`deviceId` varchar(128),
	`eventType` varchar(96) NOT NULL,
	`payload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extensionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(190) NOT NULL,
	`message` text NOT NULL,
	`status` enum('open','pending','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`extensionEnabled` int NOT NULL DEFAULT 1,
	`emailAlerts` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
