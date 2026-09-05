CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Products` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `Price` decimal(65,30) NOT NULL,
    `Stock` int NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Products` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Roles` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Roles` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Users` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `RoleId` char(36) COLLATE ascii_general_ci NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_Roles_Name` ON `Roles` (`Name`);

CREATE UNIQUE INDEX `IX_Users_Email` ON `Users` (`Email`);

CREATE INDEX `IX_Users_RoleId` ON `Users` (`RoleId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260826022501_InitialCreate', '9.0.0');

ALTER TABLE `Products` ADD `SupplierId` char(36) COLLATE ascii_general_ci NULL;

CREATE TABLE `Suppliers` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `ContactEmail` longtext CHARACTER SET utf8mb4 NULL,
    `Phone` longtext CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_Suppliers` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Products_SupplierId` ON `Products` (`SupplierId`);

CREATE INDEX `IX_Suppliers_Name` ON `Suppliers` (`Name`);

ALTER TABLE `Products` ADD CONSTRAINT `FK_Products_Suppliers_SupplierId` FOREIGN KEY (`SupplierId`) REFERENCES `Suppliers` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260829033653_AddSupplier', '9.0.0');

ALTER TABLE `Products` ADD `CategoryId` char(36) COLLATE ascii_general_ci NULL;

CREATE TABLE `Categories` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    `SupplierId` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_Categories` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Categories_Suppliers_SupplierId` FOREIGN KEY (`SupplierId`) REFERENCES `Suppliers` (`Id`) ON DELETE SET NULL
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Products_CategoryId` ON `Products` (`CategoryId`);

CREATE INDEX `IX_Categories_Name` ON `Categories` (`Name`);

CREATE INDEX `IX_Categories_SupplierId` ON `Categories` (`SupplierId`);

ALTER TABLE `Products` ADD CONSTRAINT `FK_Products_Categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `Categories` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260831043203_AddCategories', '9.0.0');

COMMIT;

