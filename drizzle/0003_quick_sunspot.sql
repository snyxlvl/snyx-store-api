CREATE TABLE `globalControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`maintenanceEnabled` int NOT NULL DEFAULT 0,
	`maintenanceMessage` varchar(255) NOT NULL DEFAULT 'Extensão temporariamente em manutenção.',
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `globalControls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`licenseId` int,
	`deviceId` varchar(128),
	`alertType` varchar(96) NOT NULL,
	`message` varchar(255) NOT NULL,
	`payload` text,
	`resolved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityAlerts_id` PRIMARY KEY(`id`)
);
