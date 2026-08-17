# Blood Donation and Emergency Matching System

## Project Overview

The **Blood Donation and Emergency Matching System** is a database-driven system designed to connect blood donors, hospitals, and blood banks.

The system helps hospitals submit blood requests, allows blood banks to manage available blood stock, checks donor eligibility, and supports emergency matching between blood requests, donors, and available blood units.

This repository contains the database implementation for the first project checkpoint.

---

## Project Objectives

- Manage registered users and their account information.
- Maintain donor information and blood groups.
- Manage hospitals and blood banks.
- Track available blood stock.
- Record blood donation history.
- Manage hospital blood requests.
- Support emergency donor and blood-stock matching.
- Record donor eligibility and screening information.
- Track blood dispatch and transit information.
- Demonstrate CRUD operations using SQL Server.

---

## Database Management System

The database was developed using:

- **Microsoft SQL Server**
- **SQL Server Management Studio (SSMS)**
- **dbdiagram.io** for ERD design

---

## Database Tables

The database contains the following 10 tables:

| No. | Table | Purpose |
|---|---|---|
| 1 | `Users` | Stores user account information |
| 2 | `Donors` | Stores donor-specific information |
| 3 | `Hospitals` | Stores hospital information |
| 4 | `BloodBanks` | Stores blood bank information |
| 5 | `BloodStock` | Tracks available blood units |
| 6 | `BloodRequests` | Stores blood requests from hospitals |
| 7 | `EmergencyMatches` | Records matches between requests, donors, and blood stock |
| 8 | `EligibilityAndScreening` | Stores donor screening and eligibility information |
| 9 | `Donations` | Records donor blood donations |
| 10 | `DispatchAndTransits` | Tracks blood dispatch and delivery |

---

## Repository Structure

```text
Blood-Donation-Emergency-Matching-System/
│
├── schema.sql
├── crud_operations.sql
└── README.md