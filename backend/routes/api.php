<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\UserController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\ReportController;

/* Existing CRUD routes - unchanged */
Route::apiResource('users', UserController::class);
Route::apiResource('donors', DonorController::class);

/* =====================================================================
   Report / Statistics Routes
   These endpoints demonstrate SQL JOIN, Aggregate Functions, and Subqueries.
   All routes are prefixed with /api/reports/
   ===================================================================== */
Route::prefix('reports')->group(function () {

    /* Donor Reports */
    Route::get('/donors/profiles',                         [ReportController::class, 'donorProfiles']);
    Route::get('/donors/donation-counts',                  [ReportController::class, 'donorDonationCounts']);
    Route::get('/donors/average-weight-by-blood-group',    [ReportController::class, 'averageWeightByBloodGroup']);
    Route::get('/donors/frequent',                         [ReportController::class, 'frequentDonors']);
    Route::get('/donors/above-average-weight',             [ReportController::class, 'donorsAboveAverageWeight']);
    Route::get('/donors/above-blood-group-average-weight', [ReportController::class, 'donorsAboveBloodGroupAverageWeight']);
    Route::get('/donors/above-average-donations',          [ReportController::class, 'donorsAboveAverageDonationCount']);
    Route::get('/donors/weight-range-by-blood-group',      [ReportController::class, 'weightRangeByBloodGroup']);

    /* Blood Bank Reports */
    Route::get('/blood-banks/donation-statistics',         [ReportController::class, 'bloodBankDonationStatistics']);
    Route::get('/blood-banks/above-average-donations',     [ReportController::class, 'banksAboveAverageDonations']);
    Route::get('/blood-banks/volume-statistics',           [ReportController::class, 'bloodBankVolumeStatistics']);

    /* Recipient Reports */
    Route::get('/recipients/request-statistics',           [ReportController::class, 'recipientRequestStatistics']);
    Route::get('/requests/above-average-quantity',         [ReportController::class, 'aboveAverageBloodRequests']);
});
