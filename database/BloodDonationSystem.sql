-- =========================================================
-- BLOOD DONATION AND EMERGENCY MATCHING SYSTEM
-- =========================================================
-- Database : BloodDonationSystem
-- DBMS     : Microsoft SQL Server
--
-- Main Concept:
-- Users can act as:
--   1. Donors
--   2. Recipients
--   3. Blood Banks
--
-- Recipients directly create blood requests.
-- Donors are directly matched with recipients' requests.
-- Hospitals are NOT included as a separate entity.
-- =========================================================

-- =========================================================
-- 1. CREATE DATABASE
-- =========================================================

IF DB_ID('BloodDonationSystem') IS NULL
BEGIN
    CREATE DATABASE BloodDonationSystem;
END
GO

USE BloodDonationSystem;
GO

-- =========================================================
-- 2. DROP EXISTING TABLES
-- =========================================================

DROP TABLE IF EXISTS DispatchAndTransits;
DROP TABLE IF EXISTS Donations;
DROP TABLE IF EXISTS EligibilityAndScreening;
DROP TABLE IF EXISTS EmergencyMatches;
DROP TABLE IF EXISTS BloodRequests;
DROP TABLE IF EXISTS BloodStock;
DROP TABLE IF EXISTS BloodBanks;
DROP TABLE IF EXISTS Recipients;
DROP TABLE IF EXISTS Donors;
DROP TABLE IF EXISTS Users;
GO

-- =========================================================
-- 3. USERS
-- =========================================================

CREATE TABLE Users
(
    UserID INT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    Address VARCHAR(255),
    Gender VARCHAR(20),
    AccountStatus VARCHAR(30) DEFAULT 'Active',
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- =========================================================
-- 4. DONORS
-- =========================================================

CREATE TABLE Donors
(
    DonorID INT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    BloodGroup VARCHAR(5) NOT NULL,
    Genotype VARCHAR(10),
    DateOfBirth DATE,
    WeightKg DECIMAL(5,2),
    City VARCHAR(100),
    LastDonationDate DATE,
    IsEligible BIT DEFAULT 1,
    CONSTRAINT FK_Donors_Users FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 5. RECIPIENTS
-- =========================================================

CREATE TABLE Recipients
(
    RecipientID INT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    BloodGroup VARCHAR(5) NOT NULL,
    RequiredComponent VARCHAR(50),
    City VARCHAR(100),
    HospitalName VARCHAR(150),
    EmergencyContact VARCHAR(20),
    MedicalCondition VARCHAR(255),
    IsEmergency BIT DEFAULT 0,
    CONSTRAINT FK_Recipients_Users FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 6. BLOOD BANKS
-- =========================================================

CREATE TABLE BloodBanks
(
    BankID INT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    BankName VARCHAR(150) NOT NULL,
    Address VARCHAR(255),
    City VARCHAR(100),
    ContactPhone VARCHAR(20),
    StorageCapacityUnits INT,
    CONSTRAINT FK_BloodBanks_Users FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 7. BLOOD STOCK
-- =========================================================

CREATE TABLE BloodStock
(
    BagID INT PRIMARY KEY,
    BankID INT NOT NULL,
    DonorID INT NULL,
    BloodGroup VARCHAR(5) NOT NULL,
    ComponentType VARCHAR(50),
    VolumeML INT,
    CollectionDate DATE,
    ExpirationDate DATE,
    StockStatus VARCHAR(30) DEFAULT 'Available',
    CONSTRAINT FK_BloodStock_BloodBanks FOREIGN KEY (BankID)
        REFERENCES BloodBanks(BankID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT FK_BloodStock_Donors FOREIGN KEY (DonorID)
        REFERENCES Donors(DonorID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 8. BLOOD REQUESTS
-- =========================================================

CREATE TABLE BloodRequests
(
    RequestID INT PRIMARY KEY,
    RecipientID INT NOT NULL,
    BloodGroup VARCHAR(5) NOT NULL,
    ComponentType VARCHAR(50),
    QuantityUnits INT NOT NULL,
    UrgencyLevel VARCHAR(30),
    RequestStatus VARCHAR(30) DEFAULT 'Pending',
    RequestedAt DATETIME DEFAULT GETDATE(),
    RequiredByDate DATE,
    Location VARCHAR(255),
    CONSTRAINT FK_BloodRequests_Recipients FOREIGN KEY (RecipientID)
        REFERENCES Recipients(RecipientID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 9. EMERGENCY MATCHES
-- =========================================================

CREATE TABLE EmergencyMatches
(
    MatchID INT PRIMARY KEY,
    RequestID INT NOT NULL,
    MatchedDonorID INT NULL,
    MatchedBagID INT NULL,
    MatchDistanceKM DECIMAL(8,2),
    MatchStatus VARCHAR(30) DEFAULT 'Pending',
    MatchedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_EmergencyMatches_Requests FOREIGN KEY (RequestID)
        REFERENCES BloodRequests(RequestID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_EmergencyMatches_Donors FOREIGN KEY (MatchedDonorID)
        REFERENCES Donors(DonorID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT FK_EmergencyMatches_BloodStock FOREIGN KEY (MatchedBagID)
        REFERENCES BloodStock(BagID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 10. ELIGIBILITY AND SCREENING
-- =========================================================

CREATE TABLE EligibilityAndScreening
(
    ScreeningID INT PRIMARY KEY,
    DonorID INT NOT NULL,
    ScreeningDate DATE,
    HemoglobinG_DL DECIMAL(4,2),
    SystolicBP INT,
    DiastolicBP INT,
    InfectiousDiseaseCleared BIT,
    NextEligibleDate DATE,
    CONSTRAINT FK_Screening_Donors FOREIGN KEY (DonorID)
        REFERENCES Donors(DonorID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 11. DONATIONS
-- =========================================================

CREATE TABLE Donations
(
    DonationID INT PRIMARY KEY,
    DonorID INT NOT NULL,
    BankID INT NOT NULL,
    DonationDate DATE,
    VolumeCollectedML INT,
    Remarks VARCHAR(MAX),
    CONSTRAINT FK_Donations_Donors FOREIGN KEY (DonorID)
        REFERENCES Donors(DonorID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT FK_Donations_BloodBanks FOREIGN KEY (BankID)
        REFERENCES BloodBanks(BankID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- 12. DISPATCH AND TRANSITS
-- =========================================================

CREATE TABLE DispatchAndTransits
(
    DispatchID INT PRIMARY KEY,
    RequestID INT NOT NULL UNIQUE,
    BagID INT NOT NULL,
    CourierName VARCHAR(100),
    TrackingNumber VARCHAR(100) UNIQUE,
    DispatchTime DATETIME,
    ArrivalTime DATETIME NULL,
    TransitStatus VARCHAR(30),
    CONSTRAINT FK_Dispatch_Request FOREIGN KEY (RequestID)
        REFERENCES BloodRequests(RequestID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT FK_Dispatch_BloodStock FOREIGN KEY (BagID)
        REFERENCES BloodStock(BagID)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);
GO

-- =========================================================
-- INSERT SAMPLE DATA
-- =========================================================

INSERT INTO Users (UserID, FullName, Email, PasswordHash, Phone, Address, Gender, AccountStatus) VALUES
(1, 'John Smith', 'john@email.com', 'password123', '555-0101', '123 Main St', 'Male', 'Active'),
(2, 'Sarah Johnson', 'sarah@email.com', 'password123', '555-0102', '456 Oak Ave', 'Female', 'Active'),
(3, 'Mike Davis', 'mike@email.com', 'password123', '555-0103', '789 Pine Rd', 'Male', 'Active'),
(4, 'LifeSave Blood Bank', 'lifesave@bank.com', 'password123', '555-0201', '100 Medical Dr', 'New York', 'Active'),
(5, 'Emily Brown', 'emily@email.com', 'password123', '555-0104', '321 Elm St', 'Female', 'Active'),
(6, 'Red Cross Center', 'redcross@bank.com', 'password123', '555-0202', '200 Hospital Ln', 'Los Angeles', 'Active');

INSERT INTO Donors (DonorID, UserID, BloodGroup, Genotype, DateOfBirth, WeightKg, City, LastDonationDate, IsEligible) VALUES
(1, 1, 'O+', 'AA', '1990-05-15', 75.5, 'New York', '2025-01-10', 1),
(2, 3, 'A+', 'AS', '1985-08-22', 68.0, 'Los Angeles', '2025-02-01', 1);

INSERT INTO Recipients (RecipientID, UserID, BloodGroup, RequiredComponent, City, HospitalName, EmergencyContact, MedicalCondition, IsEmergency) VALUES
(1, 2, 'O+', 'Whole Blood', 'New York', 'St. Mary Hospital', '555-0102', 'Surgery Required', 1),
(2, 5, 'A+', 'Platelets', 'Los Angeles', 'City General', '555-0104', 'Chemotherapy', 0);

INSERT INTO BloodBanks (BankID, UserID, BankName, Address, City, ContactPhone, StorageCapacityUnits) VALUES
(1, 4, 'LifeSave Blood Bank', '100 Medical Dr', 'New York', '555-0201', 500),
(2, 6, 'Red Cross Center', '200 Hospital Ln', 'Los Angeles', '555-0202', 1000);

INSERT INTO BloodStock (BagID, BankID, DonorID, BloodGroup, ComponentType, VolumeML, CollectionDate, ExpirationDate, StockStatus) VALUES
(1, 1, 1, 'O+', 'Whole Blood', 450, '2025-07-01', '2025-08-15', 'Available'),
(2, 2, 2, 'A+', 'Platelets', 300, '2025-07-05', '2025-07-12', 'Available');

INSERT INTO BloodRequests (RequestID, RecipientID, BloodGroup, ComponentType, QuantityUnits, UrgencyLevel, RequestStatus, RequiredByDate, Location) VALUES
(1, 1, 'O+', 'Whole Blood', 2, 'Critical', 'Pending', '2025-08-20', 'St. Mary Hospital, NY'),
(2, 2, 'A+', 'Platelets', 1, 'Normal', 'Pending', '2025-08-25', 'City General, LA');

INSERT INTO EmergencyMatches (MatchID, RequestID, MatchedDonorID, MatchedBagID, MatchDistanceKM, MatchStatus) VALUES
(1, 1, 1, 1, 5.2, 'Pending');

INSERT INTO EligibilityAndScreening (ScreeningID, DonorID, ScreeningDate, HemoglobinG_DL, SystolicBP, DiastolicBP, InfectiousDiseaseCleared, NextEligibleDate) VALUES
(1, 1, '2025-07-01', 14.5, 120, 80, 1, '2025-09-01'),
(2, 2, '2025-07-05', 13.8, 118, 78, 1, '2025-09-05');

INSERT INTO Donations (DonationID, DonorID, BankID, DonationDate, VolumeCollectedML, Remarks) VALUES
(1, 1, 1, '2025-07-01', 450, 'Successful donation'),
(2, 2, 2, '2025-07-05', 300, 'Platelet donation');

INSERT INTO DispatchAndTransits (DispatchID, RequestID, BagID, CourierName, TrackingNumber, DispatchTime, ArrivalTime, TransitStatus) VALUES
(1, 1, 1, 'FastMed Courier', 'TRK001', '2025-08-17 10:00:00', NULL, 'In Transit');
GO

PRINT '==============================================';
PRINT 'BloodDonationSystem created successfully!';
PRINT '==============================================';
PRINT 'Tables created: Users, Donors, Recipients,';
PRINT 'BloodBanks, BloodStock, BloodRequests,';
PRINT 'EmergencyMatches, EligibilityAndScreening,';
PRINT 'Donations, DispatchAndTransits';
PRINT '==============================================';
GO
