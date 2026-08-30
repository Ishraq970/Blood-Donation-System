<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\UserController;
use App\Http\Controllers\DonorController;

Route::apiResource('users', UserController::class);
Route::apiResource('donors', DonorController::class);
