-- =============================================
-- Blood Donation Management System - CRUD Operations Script
-- Project Checkpoint 1: CRUD Operations Demonstration
-- =============================================

USE BloodDonationSystem;
GO

-- ============================================================================
-- 1. CREATE (INSERT) OPERATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Create Users and specialized Entities (Donors, Hospitals, BloodBanks)
-- ----------------------------------------------------------------------------

-- A. Create a Donor User (User + Donor entity)
BEGIN TRANSACTION;
    INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, Gender, AccountStatus)
    VALUES ('Sarah Connor', 'sarah.connor@example.com', 'HASHED_PASS_123', '+15550192834', '742 Evergreen Terrace', 'Female', 'Active');

    -- Capture generated UserID
    DECLARE @NewDonorUserID INT = SCOPE_IDENTITY();

    INSERT INTO Donors (UserID, BloodGroup, Genotype, DateOfBirth, WeightKg, City, LastDonationDate, IsEligible)
    VALUES (@NewDonorUserID, 'O-', 'AA', '1995-04-12', 65.50, 'New York', '2026-01-15', 1);
COMMIT TRANSACTION;
GO

-- Create additional Donors for demo data
BEGIN TRANSACTION;
    INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, Gender)
    VALUES ('John Doe', 'john.doe@example.com', 'HASHED_PASS_456', '+15559876543', '100 Main St', 'Male');
    
    DECLARE @DonorUserID2 INT = SCOPE_IDENTITY();
    
    INSERT INTO Donors (UserID, BloodGroup, Genotype, DateOfBirth, WeightKg, City, LastDonationDate, IsEligible)
    VALUES (@DonorUserID2, 'A+', 'AS', '1992-08-25', 78.00, 'New York', '2025-11-20', 1);
COMMIT TRANSACTION;
GO

-- B. Create a Hospital User (User + Hospital entity)
BEGIN TRANSACTION;
    INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, Gender)
    VALUES ('City General Hospital Admin', 'admin@citygeneral.org', 'HASHED_PASS_789', '+15554443322', '500 Health Blvd', 'Other');

    DECLARE @NewHospitalUserID INT = SCOPE_IDENTITY();

    INSERT INTO Hospitals (UserID, HospitalName, LicenseNumber, Address, City, EmergencyPhone)
    VALUES (@NewHospitalUserID, 'City General Hospital', 'LIC-NY-2026-0091', '500 Health Blvd', 'New York', '+15554449999');
COMMIT TRANSACTION;
GO

-- C. Create a Blood Bank User (User + BloodBank entity)
BEGIN TRANSACTION;
    INSERT INTO Users (FullName, Email, PasswordHash, Phone, Address, Gender)
    VALUES ('Central Blood Bank Admin', 'contact@centralbloodbank.org', 'HASHED_PASS_999', '+15558881122', '12 Red Cross Way', 'Other');

    DECLARE @NewBankUserID INT = SCOPE_IDENTITY();

    INSERT INTO BloodBanks (UserID, BankName, Address, City, ContactPhone, StorageCapacityUnits)
    VALUES (@NewBankUserID, 'Central Red Cross Blood Bank', '12 Red Cross Way', 'New York', '+15558881122', 5000);
COMMIT TRANSACTION;
GO

-- ----------------------------------------------------------------------------
-- 1.2 Create Blood Stock Entry
-- ----------------------------------------------------------------------------
INSERT INTO BloodStock (BankID, DonorID, BloodGroup, ComponentType, VolumeML, CollectionDate, ExpirationDate, StockStatus)
VALUES 
(1, 1, 'O-', 'Whole Blood', 450, '2026-01-15', '2026-02-26', 'Available'),
(1, 2, 'A+', 'Packed Red Cells', 350, '2025-11-20', '2025-12-31', 'Expired');
GO

-- ----------------------------------------------------------------------------
-- 1.3 Create Blood Request (Hospital requesting blood)
-- ----------------------------------------------------------------------------
INSERT INTO BloodRequests (HospitalID, BloodGroup, ComponentType, QuantityUnits, UrgencyLevel, RequestStatus)
VALUES 
(1, 'O-', 'Whole Blood', 2, 'Critical', 'Pending');
GO

-- ----------------------------------------------------------------------------
-- 1.4 Create Screening Record for a Donor
-- ----------------------------------------------------------------------------
INSERT INTO EligibilityAndScreening (DonorID, ScreeningDate, HemoglobinG_DL, SystolicBP, DiastolicBP, InfectiousDiseaseCleared, NextEligibleDate)
VALUES 
(1, '2026-01-15', 14.2, 120, 80, 1, '2026-04-15');
GO

-- ----------------------------------------------------------------------------
-- 1.5 Create Donation Record
-- ----------------------------------------------------------------------------
INSERT INTO Donations (DonorID, BankID, DonationDate, VolumeCollectedML, Remarks)
VALUES 
(1, 1, '2026-01-15', 450, 'Successful voluntary donation. No adverse reactions.');
GO

-- ----------------------------------------------------------------------------
-- 1.6 Create Emergency Match Record
-- ----------------------------------------------------------------------------
INSERT INTO EmergencyMatches (RequestID, MatchedDonorID, MatchedBagID, MatchDistanceKM, MatchStatus)
VALUES 
(1, 1, 1, 4.25, 'Matched');
GO

-- ----------------------------------------------------------------------------
-- 1.7 Create Dispatch and Transit Record
-- ----------------------------------------------------------------------------
INSERT INTO DispatchAndTransits (RequestID, BagID, CourierName, TrackingNumber, DispatchTime, TransitStatus)
VALUES 
(1, 1, 'MedExpress Logistics', 'TRK-2026-884920', GETDATE(), 'In Transit');
GO


-- ============================================================================
-- 2. READ (SELECT) OPERATIONS
-- ============================================================================

-- 2.1 Basic SELECT: Retrieve all active Donors with User profile info
SELECT 
    d.DonorID,
    u.FullName,
    u.Email,
    u.Phone,
    d.BloodGroup,
    d.Genotype,
    d.City,
    d.LastDonationDate,
    d.IsEligible
FROM Donors d
INNER JOIN Users u ON d.UserID = u.UserID
WHERE u.AccountStatus = 'Active';
GO

-- 2.2 Filtered SELECT: Search for Available Blood Stock of rare blood group (O-)
SELECT 
    bs.BagID,
    bb.BankName,
    bb.City,
    bs.BloodGroup,
    bs.ComponentType,
    bs.VolumeML,
    bs.ExpirationDate,
    bs.StockStatus
FROM BloodStock bs
INNER JOIN BloodBanks bb ON bs.BankID = bb.BankID
WHERE bs.BloodGroup = 'O-' 
  AND bs.StockStatus = 'Available'
  AND bs.ExpirationDate >= CAST(GETDATE() AS DATE);
GO

-- 2.3 Complex Multi-Join SELECT: Blood Request details along with Hospital info and Dispatch status
SELECT 
    br.RequestID,
    h.HospitalName,
    h.EmergencyPhone,
    br.BloodGroup,
    br.ComponentType,
    br.QuantityUnits,
    br.UrgencyLevel,
    br.RequestStatus,
    br.RequestedAt,
    dt.CourierName,
    dt.TrackingNumber,
    dt.TransitStatus
FROM BloodRequests br
INNER JOIN Hospitals h ON br.HospitalID = h.HospitalID
LEFT JOIN DispatchAndTransits dt ON br.RequestID = dt.RequestID;
GO

-- 2.4 Aggregate SELECT: Total available blood volume per Blood Bank grouped by Blood Group
SELECT 
    bb.BankName,
    bs.BloodGroup,
    COUNT(bs.BagID) AS TotalBagsAvailable,
    SUM(bs.VolumeML) AS TotalVolumeML
FROM BloodStock bs
INNER JOIN BloodBanks bb ON bs.BankID = bb.BankID
WHERE bs.StockStatus = 'Available'
GROUP BY bb.BankName, bs.BloodGroup;
GO


-- ============================================================================
-- 3. UPDATE OPERATIONS
-- ============================================================================

-- 3.1 Update User Profile & Phone Number
UPDATE Users
SET Phone = '+15559990011',
    Address = '743 Evergreen Terrace'
WHERE Email = 'sarah.connor@example.com';
GO

-- 3.2 Update Donor Eligibility based on Screening/Last Donation
UPDATE Donors
SET LastDonationDate = GETDATE(),
    IsEligible = 0 -- Temporarily ineligible after recent donation
WHERE DonorID = 1;
GO

-- 3.3 Update Stock Status after Dispatch (Mark blood bag as 'Dispatched' or 'Reserved')
UPDATE BloodStock
SET StockStatus = 'Dispatched'
WHERE BagID = 1;
GO

-- 3.4 Update Blood Request Status when fulfilled
UPDATE BloodRequests
SET RequestStatus = 'Fulfilled'
WHERE RequestID = 1;
GO

-- 3.5 Update Dispatch Transit Status to 'Delivered' with Arrival Time
UPDATE DispatchAndTransits
SET TransitStatus = 'Delivered',
    ArrivalTime = GETDATE()
WHERE RequestID = 1;
GO


-- ============================================================================
-- 4. DELETE OPERATIONS
-- ============================================================================

-- 4.1 Delete a Blood Screening record
DELETE FROM EligibilityAndScreening
WHERE ScreeningID = 1;
GO

-- 4.2 Delete an Emergency Match record
DELETE FROM EmergencyMatches
WHERE MatchID = 1;
GO

-- 4.3 Soft Delete vs Hard Delete Demonstration
-- Soft Delete: Deactivate User Account (Recommended practice for relational history retention)
UPDATE Users
SET AccountStatus = 'Deactivated'
WHERE UserID = 2;
GO

-- Hard Delete: Cascade delete donor record by deleting associated User record
-- (Because of ON DELETE CASCADE on FK_Donors_Users, deleting User automatically deletes Donor record)
-- Note: Commented out to prevent unintended data loss in demo run:
/*
DELETE FROM Users
WHERE Email = 'john.doe@example.com';
*/
GO
