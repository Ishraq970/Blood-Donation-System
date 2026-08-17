-- =============================================
-- Blood Donation Management System - Database Schema
-- Database Management Systems (DBMS) Schema Script
-- =============================================

CREATE DATABASE BloodDonationSystem;
GO

USE BloodDonationSystem;
GO

USE master;
GO

IF DB_ID('BloodDonationSystem') IS NOT NULL
BEGIN
    ALTER DATABASE BloodDonationSystem
    SET SINGLE_USER
    WITH ROLLBACK IMMEDIATE;

    DROP DATABASE BloodDonationSystem;
END
GO

CREATE DATABASE BloodDonationSystem;
GO

USE BloodDonationSystem;
GO

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS DispatchAndTransits;
DROP TABLE IF EXISTS Donations;
DROP TABLE IF EXISTS EligibilityAndScreening;
DROP TABLE IF EXISTS EmergencyMatches;
DROP TABLE IF EXISTS BloodRequests;
DROP TABLE IF EXISTS BloodStock;
DROP TABLE IF EXISTS BloodBanks;
DROP TABLE IF EXISTS Hospitals;
DROP TABLE IF EXISTS Donors;
DROP TABLE IF EXISTS Users;
GO

-- 1. Users Table (Base User Account Table)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    Address NVARCHAR(255),
    Gender NVARCHAR(20),
    AccountStatus NVARCHAR(30) DEFAULT 'Active',
    CreatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- 2. Donors Table (Subtype of User)
CREATE TABLE Donors (
    DonorID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    BloodGroup NVARCHAR(5) NOT NULL,
    Genotype NVARCHAR(10),
    DateOfBirth DATE,
    WeightKg DECIMAL(5,2),
    City NVARCHAR(100),
    LastDonationDate DATE,
    IsEligible BIT DEFAULT 1,

    CONSTRAINT FK_Donors_Users
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- 3. Hospitals Table (Subtype of User)
CREATE TABLE Hospitals (
    HospitalID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    HospitalName NVARCHAR(150) NOT NULL,
    LicenseNumber NVARCHAR(100) NOT NULL UNIQUE,
    Address NVARCHAR(255),
    City NVARCHAR(100),
    EmergencyPhone NVARCHAR(20),

    CONSTRAINT FK_Hospitals_Users
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- 4. BloodBanks Table (Subtype of User)
CREATE TABLE BloodBanks (
    BankID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    BankName NVARCHAR(150) NOT NULL,
    Address NVARCHAR(255),
    City NVARCHAR(100),
    ContactPhone NVARCHAR(20),
    StorageCapacityUnits INT,

    CONSTRAINT FK_BloodBanks_Users
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- 5. BloodStock Table
CREATE TABLE BloodStock (
    BagID INT IDENTITY(1,1) PRIMARY KEY,
    BankID INT NOT NULL,
    DonorID INT NULL,
    BloodGroup NVARCHAR(5) NOT NULL,
    ComponentType NVARCHAR(50),
    VolumeML INT,
    CollectionDate DATE,
    ExpirationDate DATE,
    StockStatus NVARCHAR(30) DEFAULT 'Available',

    CONSTRAINT FK_BloodStock_BloodBanks
        FOREIGN KEY (BankID)
        REFERENCES BloodBanks(BankID),

    CONSTRAINT FK_BloodStock_Donors
        FOREIGN KEY (DonorID)
        REFERENCES Donors(DonorID)
        ON DELETE SET NULL
);
GO

-- 6. BloodRequests Table
CREATE TABLE BloodRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    HospitalID INT NOT NULL,
    BloodGroup NVARCHAR(5) NOT NULL,
    ComponentType NVARCHAR(50),
    QuantityUnits INT NOT NULL,
    UrgencyLevel NVARCHAR(30),
    RequestStatus NVARCHAR(30) DEFAULT 'Pending',
    RequestedAt DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_BloodRequests_Hospitals
        FOREIGN KEY (HospitalID)
        REFERENCES Hospitals(HospitalID)
);
GO

-- 7. EmergencyMatches Table
CREATE TABLE EmergencyMatches (
    MatchID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID INT NOT NULL,
    MatchedDonorID INT NULL,
    MatchedBagID INT NULL,
    MatchDistanceKM DECIMAL(8,2),
    MatchStatus NVARCHAR(30) DEFAULT 'Pending',
    MatchedAt DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_EmergencyMatches_Requests
        FOREIGN KEY (RequestID)
        REFERENCES BloodRequests(RequestID)
        ON DELETE CASCADE,

    CONSTRAINT FK_EmergencyMatches_Donors
        FOREIGN KEY (MatchedDonorID)
        REFERENCES Donors(DonorID)
        ON DELETE SET NULL,

    CONSTRAINT FK_EmergencyMatches_BloodStock
        FOREIGN KEY (MatchedBagID)
        REFERENCES BloodStock(BagID)
        ON DELETE SET NULL
);
GO

-- 8. EligibilityAndScreening Table
CREATE TABLE EligibilityAndScreening (
    ScreeningID INT IDENTITY(1,1) PRIMARY KEY,
    DonorID INT NOT NULL,
    ScreeningDate DATE,
    HemoglobinG_DL DECIMAL(4,2),
    SystolicBP INT,
    DiastolicBP INT,
    InfectiousDiseaseCleared BIT,
    NextEligibleDate DATE,

    CONSTRAINT FK_Screening_Donors
        FOREIGN KEY (DonorID)
        REFERENCES Donors(DonorID)
        ON DELETE CASCADE
);
GO

-- 9. Donations Table
CREATE TABLE Donations (
    DonationID INT IDENTITY(1,1) PRIMARY KEY,
    DonorID INT NOT NULL,
    BankID INT NOT NULL,
    DonationDate DATE,
    VolumeCollectedML INT,
    Remarks NVARCHAR(MAX),

    CONSTRAINT FK_Donations_Donors
        FOREIGN KEY (DonorID)
        REFERENCES Donors(DonorID),

    CONSTRAINT FK_Donations_BloodBanks
        FOREIGN KEY (BankID)
        REFERENCES BloodBanks(BankID)
);
GO

-- 10. DispatchAndTransits Table
CREATE TABLE DispatchAndTransits (
    DispatchID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID INT NOT NULL UNIQUE,
    BagID INT NOT NULL,
    CourierName NVARCHAR(100),
    TrackingNumber NVARCHAR(100) UNIQUE,
    DispatchTime DATETIME2,
    ArrivalTime DATETIME2 NULL,
    TransitStatus NVARCHAR(30),

    CONSTRAINT FK_Dispatch_Request
        FOREIGN KEY (RequestID)
        REFERENCES BloodRequests(RequestID),

    CONSTRAINT FK_Dispatch_BloodStock
        FOREIGN KEY (BagID)
        REFERENCES BloodStock(BagID)
);
GO
