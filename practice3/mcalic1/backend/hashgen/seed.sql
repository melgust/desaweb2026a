USE EnterpriseDb;

-- Roles
INSERT INTO Roles (Id, Name, Description, CreatedAt)
SELECT UUID(), 'Admin', 'Full system access', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Admin');

INSERT INTO Roles (Id, Name, Description, CreatedAt)
SELECT UUID(), 'Manager', 'Can manage products', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Manager');

INSERT INTO Roles (Id, Name, Description, CreatedAt)
SELECT UUID(), 'User', 'Read-only access', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'User');

-- Admin user
INSERT INTO Users (Id, Name, Email, PasswordHash, RoleId, IsActive, CreatedAt, UpdatedAt)
SELECT UUID(), 'System Administrator', 'admin@enterprise.com',
       '$2a$11$4iO0Z.g/rRlM83giwIMEJ.041x40YQvu2Jk0JsLC3oE2os9Dpo8Tm',
       (SELECT Id FROM Roles WHERE Name = 'Admin'),
       1, UTC_TIMESTAMP(), UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@enterprise.com');

-- Standard user
INSERT INTO Users (Id, Name, Email, PasswordHash, RoleId, IsActive, CreatedAt, UpdatedAt)
SELECT UUID(), 'Standard User', 'user@enterprise.com',
       '$2a$11$8ceVhV9BwPfhlHlmDkwotORPpT8vpds/UcLdV4.c06HrSQPmN4Kj.',
       (SELECT Id FROM Roles WHERE Name = 'User'),
       1, UTC_TIMESTAMP(), UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'user@enterprise.com');
