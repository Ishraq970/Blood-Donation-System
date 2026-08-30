<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (The Traffic Cop of our Application)
|--------------------------------------------------------------------------
|
| Since this is an API-only backend now, we don't have any views to return.
| All real routes are in routes/api.php!
|
*/

// Return a simple JSON response for the root URL
Route::get('/', function () {
    return response()->json([
        'message' => 'Blood Donation System API is running successfully!',
        'status' => 'active'
    ]);
});
