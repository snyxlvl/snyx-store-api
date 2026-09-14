CREATE TABLE `extensionVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(32) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileUrl` varchar(255) NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`changelog` text,
	`active` int NOT NULL DEFAULT 0,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extensionVersions_id` PRIMARY KEY(`id`)
);
