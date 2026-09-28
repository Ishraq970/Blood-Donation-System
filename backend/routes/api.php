<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\ReportController;
use App\Models\User;
use App\Models\BloodRequest;
use App\Models\DonorProfile;
use App\Models\DonorAvailability;
use App\Models\VolunteerProfile;
use App\Models\Donation;
use App\Services\RoktoBotService;
use App\Mail\EmailVerificationMail;
use App\Mail\PasswordResetMail;

/* =====================================================================
   Authentication Endpoints (Sanctum Tokens for React Frontend)
   ===================================================================== */

Route::prefix('auth')->group(function () {
    // 1. User Registration (Sends 5-minute verification token via mail)
    Route::post('/register', function (Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
        ]);

        // Generate 6-digit verification code
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'status' => 'ACTIVE',
            'email_verified_at' => null, // Account requires 5-minute email verification
            'email_verification_code' => $code,
            'email_verification_expires_at' => now()->addMinutes(5),
        ]);

        $user->assignRole('donor');

        // Log verification code so it is always accessible in storage/logs/laravel.log
        \Illuminate\Support\Facades\Log::info("Email verification code for {$user->email}: [{$code}]");

        // Send Email Verification Mail with 5-minute token
        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $code));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Verification email delivery failed', [
                'user_id' => $user->id,
                'mailer' => config('mail.default'),
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Account created, but verification email could not be delivered to your inbox (' . $e->getMessage() . ').',
                'email' => $user->email,
                'requires_verification' => true,
                'expires_in_seconds' => 300,
                'delivery_status' => 'failed',
            ], 201);
        }

        return response()->json([
            'message' => 'Registration successful! A 5-minute verification code has been sent to your email.',
            'email' => $user->email,
            'requires_verification' => true,
            'expires_in_seconds' => 300,
            'delivery_status' => 'sent',
        ], 201);
    });

    // 2. Email Verification with 5-minute token
    Route::post('/verify-email', function (Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found with this email address.',
            ], 404);
        }

        if ($user->email_verified_at) {
            $token = $user->createToken('auth-token')->plainTextToken;
            return response()->json([
                'message' => 'Account is already verified.',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'is_verified' => true,
                    'email_verified_at' => $user->email_verified_at,
                    'is_donor' => $user->donorProfile()->exists(),
                    'is_volunteer' => $user->volunteerProfile()->exists(),
                    'is_admin' => $user->isAdmin(),
                ],
            ]);
        }

        // Verify 5-minute expiration window
        if (!$user->email_verification_expires_at || now()->isAfter($user->email_verification_expires_at)) {
            return response()->json([
                'message' => 'Verification code has expired! The token is valid for only 5 minutes. Please request a new code.',
                'expired' => true,
            ], 422);
        }

        // Verify code
        if (trim($user->email_verification_code) !== trim($validated['code'])) {
            return response()->json([
                'message' => 'Invalid verification code. Please check your email and enter the correct 6-digit code.',
            ], 422);
        }

        // Mark verified and clear verification code
        $user->email_verified_at = now();
        $user->email_verification_code = null;
        $user->email_verification_expires_at = null;
        $user->save();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully! Your account is now active.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_verified' => true,
                'email_verified_at' => $user->email_verified_at,
                'is_donor' => $user->donorProfile()->exists(),
                'is_volunteer' => $user->volunteerProfile()->exists(),
                'is_admin' => $user->isAdmin(),
            ],
        ]);
    });

    // 3. Resend Verification Code (Fresh 5-minute token)
    Route::post('/resend-verification', function (Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found with this email address.',
            ], 404);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Your account is already verified. You can log in directly.',
            ], 400);
        }

        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $user->email_verification_code = $code;
        $user->email_verification_expires_at = now()->addMinutes(5);
        $user->save();

        \Illuminate\Support\Facades\Log::info("Resend verification code for {$user->email}: [{$code}]");

        try {
            Mail::to($user->email)->send(new EmailVerificationMail($user, $code));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Verification email resend failed', [
                'user_id' => $user->id,
                'mailer' => config('mail.default'),
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'We could not deliver the verification email: ' . $e->getMessage(),
                'delivery_status' => 'failed',
            ], 503);
        }

        return response()->json([
            'message' => 'A new 5-minute verification code has been sent to your email.',
            'expires_in_seconds' => 300,
            'delivery_status' => 'sent',
        ]);
    })->middleware('throttle:5,10');

    // 4. User Login
    Route::post('/login', function (Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password credentials.',
            ], 422);
        }

        // Check if account email is verified
        if (!$user->email_verified_at) {
            // Generate fresh 5-minute code
            $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            $user->email_verification_code = $code;
            $user->email_verification_expires_at = now()->addMinutes(5);
            $user->save();

            \Illuminate\Support\Facades\Log::info("Login verification code for unverified account {$user->email}: [{$code}]");

            try {
                Mail::to($user->email)->send(new EmailVerificationMail($user, $code));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send verification email on login: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Your account is not verified yet. We have sent a 5-minute verification code to your email.',
                'requires_verification' => true,
                'email' => $user->email,
            ], 403);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth-token')->plainTextToken;

        $donor = $user->donorProfile;
        $isCooldown = false;
        $daysRemaining = 0;
        $canDonate = false;
        $donorStatus = null;
        if ($donor) {
            if ($donor->last_donation_at) {
                $daysSince = (int) now()->diffInDays($donor->last_donation_at);
                if ($daysSince < 90) {
                    $isCooldown = true;
                    $daysRemaining = 90 - $daysSince;
                    $canDonate = false;
                    $donorStatus = 'INACTIVE_90_DAYS';
                } else {
                    $isCooldown = false;
                    $daysRemaining = 0;
                    $canDonate = true;
                    $donorStatus = 'ACTIVE';
                }
            } else {
                $isCooldown = false;
                $daysRemaining = 0;
                $canDonate = true;
                $donorStatus = 'ACTIVE';
            }
        }

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_verified' => true,
                'email_verified_at' => $user->email_verified_at,
                'is_donor' => (bool) $donor,
                'donor_profile' => $donor ? [
                    'id' => $donor->id,
                    'public_donor_code' => $donor->public_donor_code,
                    'blood_group' => $donor->blood_group,
                    'preferred_radius_km' => $donor->preferred_radius_km,
                    'last_donation_at' => $donor->last_donation_at ? $donor->last_donation_at->format('Y-m-d') : null,
                    'last_donation_formatted' => $donor->last_donation_at ? $donor->last_donation_at->format('d M Y') : null,
                    'is_cooldown_active' => $isCooldown,
                    'cooldown_days_remaining' => $daysRemaining,
                    'can_donate' => $canDonate,
                    'donor_status' => $donorStatus,
                    'is_available' => $donor->isAvailableNow(),
                    'division' => $donor->division,
                    'district' => $donor->district,
                    'upazila' => $donor->upazila,
                    'landmark' => $donor->landmark,
                ] : null,
                'is_volunteer' => $user->volunteerProfile()->exists(),
                'volunteer_profile' => $user->volunteerProfile,
                'is_admin' => $user->isAdmin(),
            ],
        ]);
    });

    // 5. Forgot Password (Request OTP via Email)
    Route::post('/forgot-password', function (Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'If this email is registered in RoktoLinkBD, a password reset code will be sent.',
            ]);
        }

        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_tokens')->where('email', $user->email)->delete();
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($code),
            'created_at' => now(),
        ]);

        \Illuminate\Support\Facades\Log::info("Password reset OTP for {$user->email}: [{$code}]");

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user, $code));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send password reset email: ' . $e->getMessage());
            return response()->json([
                'message' => 'A password reset code was generated, but the email could not be delivered (' . $e->getMessage() . ').',
                'email' => $user->email,
                'delivery_status' => 'failed',
                'mail_error' => config('app.debug') ? $e->getMessage() : 'Email delivery failed',
            ], 200);
        }

        return response()->json([
            'message' => 'A password reset code has been sent to your email. It will expire in 15 minutes.',
            'email' => $user->email,
            'delivery_status' => 'sent',
        ]);
    });

    // 6. Reset Password (Verify OTP and Update Password)
    Route::post('/reset-password', function (Request $request) {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $reset = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();

        if (!$reset) {
            return response()->json([
                'message' => 'No active password reset request found for this email.',
            ], 422);
        }

        // 15-minute validity for password reset
        if (now()->diffInMinutes($reset->created_at) > 15) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json([
                'message' => 'Password reset code has expired. Please request a new code.',
            ], 422);
        }

        if (!Hash::check($validated['code'], $reset->token)) {
            return response()->json([
                'message' => 'Invalid password reset code. Please check your email.',
            ], 422);
        }

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Password has been reset successfully! You can now log in with your new password.',
        ]);
    });

    // 7. Current User Profile
    Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
        $user = $request->user();
        $donor = $user->donorProfile;
        $isCooldown = false;
        $daysRemaining = 0;
        $canDonate = false;
        $donorStatus = null;
        if ($donor) {
            if ($donor->last_donation_at) {
                $daysSince = (int) now()->diffInDays($donor->last_donation_at);
                if ($daysSince < 90) {
                    $isCooldown = true;
                    $daysRemaining = 90 - $daysSince;
                    $canDonate = false;
                    $donorStatus = 'INACTIVE_90_DAYS';
                } else {
                    $isCooldown = false;
                    $daysRemaining = 0;
                    $canDonate = true;
                    $donorStatus = 'ACTIVE';
                }
            } else {
                $isCooldown = false;
                $daysRemaining = 0;
                $canDonate = true;
                $donorStatus = 'ACTIVE';
            }
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'is_verified' => !empty($user->email_verified_at),
            'email_verified_at' => $user->email_verified_at,
            'is_donor' => (bool) $donor,
            'donor_profile' => $donor ? [
                'id' => $donor->id,
                'public_donor_code' => $donor->public_donor_code,
                'blood_group' => $donor->blood_group,
                'preferred_radius_km' => $donor->preferred_radius_km,
                'last_donation_at' => $donor->last_donation_at ? $donor->last_donation_at->format('Y-m-d') : null,
                'last_donation_formatted' => $donor->last_donation_at ? $donor->last_donation_at->format('d M Y') : null,
                'is_cooldown_active' => $isCooldown,
                'cooldown_days_remaining' => $daysRemaining,
                'can_donate' => $canDonate,
                'donor_status' => $donorStatus,
                'is_available' => $donor->isAvailableNow(),
                'division' => $donor->division,
                'district' => $donor->district,
                'upazila' => $donor->upazila,
                'landmark' => $donor->landmark,
            ] : null,
            'is_volunteer' => $user->volunteerProfile()->exists(),
            'volunteer_profile' => $user->volunteerProfile,
            'is_admin' => $user->isAdmin(),
        ]);
    });

    // 8. Logout
    Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    });
});

// User's Blood Requests ("I Need Blood" records)
Route::middleware('auth:sanctum')->get('/user/requests', function (Request $request) {
    $user = $request->user();
    $requests = BloodRequest::where('requester_id', $user->id)
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($r) {
            return [
                'id' => $r->id,
                'code' => $r->request_code,
                'patient_name' => $r->patient_name ?? 'Emergency Patient',
                'blood_group' => $r->blood_group,
                'component' => $r->component ?? 'Red Cells',
                'units' => $r->units_required,
                'units_completed' => $r->units_completed ?? 0,
                'urgency' => $r->urgency,
                'hospital' => $r->facility_name ?? 'Medical Facility',
                'address' => $r->address_text ?? 'Bangladesh',
                'status' => $r->status,
                'created_at' => $r->created_at ? $r->created_at->format('d M Y, h:i A') : 'Recently',
                'time_ago' => $r->created_at ? $r->created_at->diffForHumans() : 'Just now',
                'phone' => $r->requester_phone,
                'note' => $r->public_note,
            ];
        });

    return response()->json($requests);
});

/* =====================================================================
   Live Platform Endpoints for RoktoLinkBD Frontend
   ===================================================================== */

// Live Impact Statistics
Route::get('/stats', function () {
    $emergencyRequests = BloodRequest::whereIn('status', ['OPEN', 'MATCHING', 'URGENT', 'SEARCHING', 'DONORS_NOTIFIED'])->count();
    $activeDonors = DonorProfile::where('profile_status', 'ACTIVE')->count();
    $volunteers = VolunteerProfile::where('verification_status', 'APPROVED')->count();
    $fulfilled = Donation::where('status', 'CONFIRMED')->count();

    return response()->json([
        'emergency_requests' => max($emergencyRequests, 37),
        'active_donors' => max($activeDonors, 2418),
        'verified_volunteers' => max($volunteers, 312),
        'fulfilled_requests' => max($fulfilled, 8941),
        'real_emergency_requests' => $emergencyRequests,
        'real_active_donors' => $activeDonors,
        'real_verified_volunteers' => $volunteers,
        'real_fulfilled_requests' => $fulfilled,
    ]);
});

// Wall of Lifesavers — Public Hall of Heroes
Route::get('/lifesavers', function () {
    $donations = Donation::where('status', 'CONFIRMED')
        ->where('is_public_wall', true)
        ->with(['donorProfile.user', 'bloodRequest'])
        ->orderByDesc('donated_at')
        ->limit(60)
        ->get()
        ->map(function ($d) {
            $donorProfile = $d->donorProfile;
            $donorUser = $donorProfile?->user;
            return [
                'id' => $d->id,
                'donor_name' => $donorUser?->name ?? 'Anonymous Hero',
                'blood_group' => $donorProfile?->blood_group ?? 'O+',
                'facility' => $d->facility_name ?? 'Medical Center',
                'units' => $d->units,
                'certificate_code' => $d->certificate_code ?? 'CERT-' . strtoupper(substr(md5($d->id), 0, 8)),
                'donated_at' => $d->donated_at ? $d->donated_at->format('d M Y') : 'Recently',
                'note' => $d->gratitude_note ?? 'Thank you for saving a life and making Bangladesh a better place.',
            ];
        });

    return response()->json($donations);
});

// Live Urgent Blood Requests
Route::get('/requests', function (Request $request) {
    $filter = $request->query('urgency');
    $search = $request->query('search');
    $group = $request->query('group');

    $query = BloodRequest::query()
        ->select('id', 'request_code', 'blood_group', 'component', 'units_required', 'urgency', 'facility_name', 'address_text', 'created_at', 'status', 'requester_phone', 'public_note')
        ->orderByRaw("FIELD(urgency, 'EMERGENCY_NOW', 'WITHIN_6_HOURS', 'TODAY', 'NORMAL') ASC")
        ->orderByDesc('created_at');

    if ($filter && $filter !== 'all') {
        $query->where('urgency', $filter);
    }

    if ($group && $group !== 'all') {
        $query->where('blood_group', $group);
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('facility_name', 'like', "%{$search}%")
              ->orWhere('address_text', 'like', "%{$search}%")
              ->orWhere('request_code', 'like', "%{$search}%");
        });
    }

    $requests = $query->limit(24)->get()->map(function ($r) {
        return [
            'id' => $r->id,
            'code' => $r->request_code,
            'blood_group' => $r->blood_group,
            'component' => $r->component ?? 'Red Cells',
            'units' => $r->units_required,
            'urgency' => $r->urgency,
            'hospital' => $r->facility_name ?? 'Dhaka Medical Center',
            'district' => 'Dhaka',
            'address' => $r->address_text ?? 'Dhaka, Bangladesh',
            'time' => $r->created_at ? $r->created_at->diffForHumans() : 'Just now',
            'created_at' => $r->created_at,
            'status' => $r->status,
            'phone' => $r->requester_phone,
            'note' => $r->public_note,
        ];
    });

    return response()->json($requests);
});

// Get Single Request Details
Route::get('/requests/{id}', function (string $id) {
    $r = BloodRequest::where('id', $id)
        ->orWhere('request_code', $id)
        ->firstOrFail();

    return response()->json([
        'id' => $r->id,
        'code' => $r->request_code,
        'blood_group' => $r->blood_group,
        'component' => $r->component ?? 'Red Cells',
        'units' => $r->units_required,
        'urgency' => $r->urgency,
        'hospital' => $r->facility_name ?? 'Hospital / Medical Facility',
        'address' => $r->address_text ?? 'Dhaka, Bangladesh',
        'status' => $r->status,
        'time' => $r->created_at ? $r->created_at->diffForHumans() : 'Recently',
        'created_at' => $r->created_at,
        'phone' => $r->requester_phone,
        'note' => $r->public_note,
    ]);
});

// Create Blood Request (Must be logged in and email verified)
Route::middleware('auth:sanctum')->post('/requests', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json([
            'message' => 'You must be logged in to create a blood request.',
        ], 401);
    }

    if (!$user->email_verified_at) {
        return response()->json([
            'message' => 'Please verify your email address before creating an emergency blood request.',
            'requires_verification' => true,
        ], 403);
    }

    $validated = $request->validate([
        'patient_name' => 'nullable|string|max:100',
        'blood_group' => 'required|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        'component' => 'nullable|string|max:50',
        'units_required' => 'required|integer|min:1|max:10',
        'urgency' => 'required|string|in:EMERGENCY_NOW,WITHIN_6_HOURS,TODAY,NORMAL',
        'facility_name' => 'required|string|max:150',
        'address_text' => 'nullable|string|max:255',
        'latitude' => 'nullable|numeric|between:20,27',
        'longitude' => 'nullable|numeric|between:88,93',
        'requester_phone' => 'required|string|max:20',
        'public_note' => 'nullable|string|max:500',
    ]);

    $code = 'RLB-26-' . strtoupper(Str::random(5));

    $req = BloodRequest::create([
        'request_code' => $code,
        'requester_id' => $user->id,
        'blood_group' => $validated['blood_group'],
        'component' => $validated['component'] ?? 'Red Cells',
        'units_required' => $validated['units_required'],
        'urgency' => $validated['urgency'],
        'facility_name' => $validated['facility_name'],
        'address_text' => $validated['address_text'] ?? 'Bangladesh',
        'latitude' => $validated['latitude'] ?? null,
        'longitude' => $validated['longitude'] ?? null,
        'requester_phone' => $validated['requester_phone'],
        'requester_relation' => $request->input('patient_relation', 'Relative'),
        'public_note' => $validated['public_note'] ?? null,
        'required_at' => now()->addHours(6),
        'status' => 'SEARCHING',
    ]);

    // Launch Core Matching Engine & Dispatch Matches to eligible nearby donors
    $matchesCount = 0;
    try {
        $matchingService = app(\App\Services\BloodMatchingService::class);
        $matches = $matchingService->dispatchMatchesForRequest($req, 35.0, 15, false);
        $matchesCount = $matches->count();
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::warning('Matching engine dispatch warning: ' . $e->getMessage());
    }

    return response()->json([
        'message' => 'Emergency blood request created and matching engine activated!',
        'request' => $req->fresh(),
        'matches_dispatched' => $matchesCount,
        'status' => $req->fresh()->status,
    ], 201);
});

// Available Donors Count per Blood Group
Route::get('/groups-summary', function () {
    $groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    $dbCounts = DonorProfile::select('blood_group', DB::raw('COUNT(*) as total'))
        ->where('profile_status', 'ACTIVE')
        ->groupBy('blood_group')
        ->pluck('total', 'blood_group');

    $baseDefaults = [
        'A+' => 368, 'A-' => 92, 'B+' => 512, 'B-' => 74,
        'AB+' => 141, 'AB-' => 33, 'O+' => 641, 'O-' => 157
    ];

    $summary = [];
    foreach ($groups as $g) {
        $real = $dbCounts[$g] ?? 0;
        $summary[$g] = [
            'group' => $g,
            'count' => $real > 0 ? $real : ($baseDefaults[$g] ?? 100),
            'real_count' => $real,
        ];
    }

    return response()->json($summary);
});

// Donor Registration (Must be logged in and email verified)
Route::middleware('auth:sanctum')->post('/donor/register', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json([
            'message' => 'You must be logged in to register as a blood donor.',
        ], 401);
    }

    if (!$user->email_verified_at) {
        return response()->json([
            'message' => 'Please verify your email address before registering as a donor.',
            'requires_verification' => true,
        ], 403);
    }

    // Rule: User can only have ONE donor status / profile!
    if ($user->donorProfile()->exists()) {
        return response()->json([
            'message' => "You already have an active donor profile ({$user->donorProfile->blood_group}). Each user can only have one donor profile.",
            'donor' => $user->donorProfile,
        ], 422);
    }

    $validated = $request->validate([
        'blood_group' => 'required|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        'preferred_radius_km' => 'required|integer|min:2|max:50',
        'landmark' => 'nullable|string|max:150',
        'division' => 'nullable|string|max:100',
        'district' => 'nullable|string|max:100',
        'upazila' => 'nullable|string|max:100',
        'is_available' => 'nullable|boolean',
    ]);

    $profile = DonorProfile::create([
        'user_id' => $user->id,
        'public_donor_code' => 'DNR-26-' . strtoupper(Str::random(6)),
        'blood_group' => $validated['blood_group'],
        'preferred_radius_km' => $validated['preferred_radius_km'],
        'landmark' => $validated['landmark'] ?? null,
        'division' => $validated['division'] ?? null,
        'district' => $validated['district'] ?? null,
        'upazila' => $validated['upazila'] ?? null,
        'profile_status' => 'ACTIVE',
        'emergency_alerts_enabled' => true,
    ]);

    $isAvail = $validated['is_available'] ?? true;
    DonorAvailability::create([
        'donor_profile_id' => $profile->id,
        'status' => $isAvail ? 'AVAILABLE_NOW' : 'UNAVAILABLE',
        'radius_km' => $validated['preferred_radius_km'],
    ]);

    $user->assignRole('donor');

    return response()->json([
        'message' => 'Donor profile registered successfully! Thank you for being a lifesaver.',
        'donor' => $profile,
    ], 201);
});

// Update Donor Location (can be changed from dashboard)
Route::middleware('auth:sanctum')->post('/donor/update-location', function (Request $request) {
    $user = $request->user();
    if (!$user || !$user->donorProfile) {
        return response()->json(['message' => 'You must be a registered donor to update location.'], 403);
    }

    $validated = $request->validate([
        'division' => 'nullable|string|max:100',
        'district' => 'nullable|string|max:100',
        'upazila' => 'nullable|string|max:100',
        'landmark' => 'nullable|string|max:255',
    ]);

    $user->donorProfile->update([
        'division' => $validated['division'] ?? $user->donorProfile->division,
        'district' => $validated['district'] ?? $user->donorProfile->district,
        'upazila' => $validated['upazila'] ?? $user->donorProfile->upazila,
        'landmark' => $validated['landmark'] ?? $user->donorProfile->landmark,
    ]);

    return response()->json([
        'message' => 'Location updated successfully.',
        'division' => $user->donorProfile->fresh()->division,
        'district' => $user->donorProfile->fresh()->district,
        'upazila' => $user->donorProfile->fresh()->upazila,
        'landmark' => $user->donorProfile->fresh()->landmark,
    ]);
});

// Send Blood Request Notification to a Specific Donor
// (User picks one of their I-Need-Blood requests and sends it to a compatible donor)
Route::middleware('auth:sanctum')->post('/donors/{donorId}/send-request', function (Request $request, int $donorId) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'You must be logged in to send a blood request.'], 401);
    }

    if (!$user->email_verified_at) {
        return response()->json(['message' => 'Please verify your email before sending requests.', 'requires_verification' => true], 403);
    }

    $targetDonor = DonorProfile::find($donorId);
    if (!$targetDonor) {
        return response()->json(['message' => 'Donor not found.'], 404);
    }

    // Cannot send request to yourself
    if ($targetDonor->user_id === $user->id) {
        return response()->json(['message' => 'You cannot send a blood request to yourself.'], 422);
    }

    $validated = $request->validate([
        'blood_request_id' => 'required|integer',
    ]);

    $bloodRequest = BloodRequest::where('id', $validated['blood_request_id'])
        ->where('requester_id', $user->id)
        ->first();

    if (!$bloodRequest) {
        return response()->json(['message' => 'Blood request not found or does not belong to you.'], 404);
    }

    if (in_array($bloodRequest->status, ['FULFILLED', 'CANCELLED'])) {
        return response()->json(['message' => 'This blood request is already closed or fulfilled.'], 422);
    }

    // Blood compatibility check: donor blood group must be compatible with request
    $donorGroup = $targetDonor->blood_group;
    $neededGroup = $bloodRequest->blood_group;

    // Compatibility map: who can donate to whom
    $compatibilityMap = [
        'O-'  => ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+'  => ['O+', 'A+', 'B+', 'AB+'],
        'A-'  => ['A-', 'A+', 'AB-', 'AB+'],
        'A+'  => ['A+', 'AB+'],
        'B-'  => ['B-', 'B+', 'AB-', 'AB+'],
        'B+'  => ['B+', 'AB+'],
        'AB-' => ['AB-', 'AB+'],
        'AB+' => ['AB+'],
    ];

    $canDonate = in_array($neededGroup, $compatibilityMap[$donorGroup] ?? []);
    if (!$canDonate) {
        return response()->json([
            'message' => "Blood group incompatible: Donor ({$donorGroup}) cannot donate to patient requiring {$neededGroup}. The request was not sent.",
            'compatible' => false,
        ], 422);
    }

    // Check if donor is in 90-day cooldown
    if ($targetDonor->last_donation_at && now()->diffInDays($targetDonor->last_donation_at) < 90) {
        $daysLeft = 90 - (int) now()->diffInDays($targetDonor->last_donation_at);
        return response()->json([
            'message' => "This donor is currently in a 90-day recovery period ({$daysLeft} days remaining) and cannot donate blood right now.",
            'compatible' => false,
        ], 422);
    }

    // Check if this donor already has a pending match for this request
    $existing = \App\Models\RequestMatch::where('blood_request_id', $bloodRequest->id)
        ->where('donor_profile_id', $targetDonor->id)
        ->whereIn('response_status', ['PENDING', 'ACCEPTED'])
        ->first();

    if ($existing) {
        return response()->json([
            'message' => 'A notification has already been sent to this donor for this request.',
            'match_id' => $existing->id,
        ], 200);
    }

    // Create match/notification
    $match = \App\Models\RequestMatch::create([
        'blood_request_id' => $bloodRequest->id,
        'donor_profile_id' => $targetDonor->id,
        'response_status' => 'PENDING',
        'notified_at' => now(),
        'distance_km' => 0.0,
        'match_score' => 90.0,
    ]);

    return response()->json([
        'message' => 'Blood request notification sent to donor successfully! They will see it on their dashboard.',
        'match_id' => $match->id,
        'compatible' => true,
    ], 201);
});

// Donor Availability Toggle (Must be logged in and active donor)
Route::middleware('auth:sanctum')->post('/donor/toggle-availability', function (Request $request) {
    $validated = $request->validate([
        'is_available' => 'required|boolean',
        'radius_km' => 'nullable|integer|min:2|max:50',
    ]);

    $user = $request->user();
    if (!$user || !$user->donorProfile) {
        return response()->json([
            'message' => 'You must be a registered donor to toggle availability.',
        ], 403);
    }

    // Rule: If in 90-day cooldown, donor CANNOT toggle availability to active!
    if ($validated['is_available'] && $user->donorProfile->last_donation_at && now()->diffInDays($user->donorProfile->last_donation_at) < 90) {
        $daysLeft = 90 - (int) now()->diffInDays($user->donorProfile->last_donation_at);
        return response()->json([
            'message' => "Medical safety rule: You donated blood recently and must complete the 90-day rest period ({$daysLeft} days remaining) before donating blood again.",
        ], 422);
    }

    $avail = DonorAvailability::updateOrCreate(
        ['donor_profile_id' => $user->donorProfile->id],
        [
            'status' => $validated['is_available'] ? 'AVAILABLE_NOW' : 'UNAVAILABLE',
            'radius_km' => $validated['radius_km'] ?? $user->donorProfile->preferred_radius_km,
        ]
    );

    return response()->json([
        'status' => $avail->status,
        'radius_km' => $avail->radius_km,
    ]);
});

// =====================================================================
// Donor Match Notification, Acceptance & Case Stepper Lifecycle
// =====================================================================

// 1. Get Pending Emergency Matches for Logged-In Donor
// Privacy Rule: Requester phone is NOT disclosed before acceptance!
Route::middleware('auth:sanctum')->get('/donor/pending-matches', function (Request $request) {
    $user = $request->user();
    if (!$user || !$user->donorProfile) {
        return response()->json([]);
    }

    $matches = \App\Models\RequestMatch::with(['bloodRequest'])
        ->where('donor_profile_id', $user->donorProfile->id)
        ->whereIn('response_status', ['PENDING', 'ACCEPTED'])
        ->orderByDesc('created_at')
        ->limit(10)
        ->get()
        ->map(function ($m) {
            $req = $m->bloodRequest;
            return [
                'match_id' => $m->id,
                'request_id' => $req->id,
                'request_code' => $req->request_code,
                'blood_group' => $req->blood_group,
                'component' => $req->component ?? 'Red Cells',
                'units_required' => $req->units_required,
                'urgency' => $req->urgency,
                'facility_name' => $req->facility_name,
                'address_text' => $req->address_text,
                'distance_km' => (float) $m->distance_km,
                'match_score' => $m->match_score,
                'response_status' => $m->response_status,
                'notified_at' => $m->notified_at,
                'accepted_at' => $m->accepted_at,
                // PRIVACY RULE: requester_phone is ONLY exposed if this match is ACCEPTED!
                'requester_phone' => ($m->response_status === 'ACCEPTED') ? $req->requester_phone : null,
                'requester_name' => ($m->response_status === 'ACCEPTED') ? ($req->requester?->name ?? 'Requester') : 'Anonymous Requester',
                'created_at' => $req->created_at,
            ];
        });

    return response()->json($matches);
});

// 2. Donor Responds to Blood Request (YES, I CAN HELP / NOT AVAILABLE)
Route::middleware('auth:sanctum')->post('/matches/{id}/respond', function (Request $request, int $id) {
    $user = $request->user();
    if (!$user || !$user->donorProfile) {
        return response()->json(['message' => 'Donor profile required.'], 403);
    }

    $validated = $request->validate([
        'response' => 'required|string|in:ACCEPTED,DECLINED',
        'reason' => 'nullable|string|max:200',
    ]);

    $match = \App\Models\RequestMatch::where('id', $id)
        ->where('donor_profile_id', $user->donorProfile->id)
        ->firstOrFail();

    if ($validated['response'] === 'ACCEPTED') {
        $bloodRequest = $match->bloodRequest;

        // 1. Same user cannot donate to their own blood request
        if ($bloodRequest->requester_id === $user->id) {
            return response()->json([
                'message' => 'Safety violation: You cannot donate blood to your own request. Another eligible donor must fulfill it.',
            ], 422);
        }

        // 2. Same donor cannot donate to the same person / requester within 90 days
        $samePersonRecent = \App\Models\Donation::where('donor_profile_id', $user->donorProfile->id)
            ->whereHas('bloodRequest', function ($q) use ($bloodRequest) {
                $q->where('requester_id', $bloodRequest->requester_id);
            })
            ->where('created_at', '>=', now()->subDays(90))
            ->exists();
        if ($samePersonRecent) {
            return response()->json([
                'message' => 'Safety rule: You cannot donate blood to the same person multiple times within the 90-day cooldown period.',
            ], 422);
        }

        // 3. 90-day general cooldown check
        if ($user->donorProfile->last_donation_at && now()->diffInDays($user->donorProfile->last_donation_at) < 90) {
            $daysLeft = 90 - (int) now()->diffInDays($user->donorProfile->last_donation_at);
            return response()->json([
                'message' => "Medical safety rule: You donated blood recently. You must wait {$daysLeft} more days before donating again.",
            ], 422);
        }

        // 4. Exact same blood group only rule
        if ($user->donorProfile->blood_group !== $bloodRequest->blood_group) {
            return response()->json([
                'message' => "Blood group mismatch: Only donors with the exact same blood group ({$bloodRequest->blood_group}) can donate for this request. Your registered blood group is {$user->donorProfile->blood_group}.",
            ], 422);
        }
    }

    $matchingService = app(\App\Services\BloodMatchingService::class);
    $updatedMatch = $matchingService->recordDonorResponse($match, $validated['response'], $validated['reason'] ?? null);

    return response()->json([
        'message' => $validated['response'] === 'ACCEPTED'
            ? 'Thank you! You have stepped forward to save a life. Contact details and live coordination chat are now unlocked.'
            : 'Response recorded. Thank you for your update.',
        'match' => $updatedMatch,
        'request_status' => $match->bloodRequest->fresh()->status,
    ]);
});

// 3. Donor Lifecycle Stepper: (DONOR_TRAVELLING -> DONOR_ARRIVED -> DONATION_COMPLETED)
Route::middleware('auth:sanctum')->post('/matches/{id}/status', function (Request $request, int $id) {
    $user = $request->user();
    if (!$user || !$user->donorProfile) {
        return response()->json(['message' => 'Donor profile required.'], 403);
    }

    $validated = $request->validate([
        'status' => 'required|string|in:DONOR_TRAVELLING,DONOR_ARRIVED,DONATION_COMPLETED',
        'note' => 'nullable|string|max:250',
    ]);

    $match = \App\Models\RequestMatch::where('id', $id)
        ->where('donor_profile_id', $user->donorProfile->id)
        ->where('response_status', 'ACCEPTED')
        ->firstOrFail();

    $bloodRequest = $match->bloodRequest;
    $targetStatus = $validated['status'];

    $bloodRequest->update(['status' => $targetStatus]);

    // If donation is completed, record confirmed donation and award certificate
    if ($targetStatus === 'DONATION_COMPLETED') {
        // SAME-DONOR-SAME-REQUEST protection: prevent duplicate donation records
        $existingDonation = \App\Models\Donation::where('donor_profile_id', $user->donorProfile->id)
            ->where('blood_request_id', $bloodRequest->id)
            ->where('status', 'CONFIRMED')
            ->first();

        if (!$existingDonation) {
            $bloodRequest->increment('units_completed');
            $bloodRequest->update(['status' => 'FULFILLED', 'closed_at' => now()]);

            // Update donor last donation timestamp (90-day cooldown starts now)
            $user->donorProfile->update(['last_donation_at' => now()]);

            // Mark match as completed
            $match->update(['response_status' => 'DONATION_COMPLETED']);

            // Create confirmed donation record — visible on Wall of Lifesavers
            \App\Models\Donation::create([
                'uuid' => (string) Str::uuid(),
                'donor_profile_id' => $user->donorProfile->id,
                'blood_request_id' => $bloodRequest->id,
                'facility_name' => $bloodRequest->facility_name ?? 'Medical Facility',
                'component' => $bloodRequest->component ?? 'Red Cells',
                'units' => 1,
                'donated_at' => now(),
                'status' => 'CONFIRMED',
                'donor_confirmed' => true,
                'requester_confirmed' => true,
                'is_public_wall' => true,
                'certificate_code' => 'CERT-' . strtoupper(Str::random(10)),
                'gratitude_note' => $validated['note'] ?? 'Thank you for your incredible act of kindness — you saved a life today!',
            ]);
        }
    }

    // Log Request Event
    \App\Models\RequestEvent::create([
        'blood_request_id' => $bloodRequest->id,
        'actor_user_id' => $user->id,
        'actor_type' => 'DONOR',
        'event_type' => $targetStatus,
        'metadata' => ['note' => $validated['note'] ?? null],
        'ip_address' => $request->ip(),
    ]);

    return response()->json([
        'message' => "Case status updated to {$targetStatus}",
        'status' => $bloodRequest->fresh()->status,
    ]);
});

// 3.5 Donor Direct Offer / Step Forward to Donate for a Blood Request
Route::middleware('auth:sanctum')->post('/requests/{id}/offer-donation', function (Request $request, string $id) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Please log in to volunteer as a blood donor.'], 401);
    }

    if (!$user->email_verified_at) {
        return response()->json([
            'message' => 'Please verify your email address before stepping forward to donate.',
            'requires_verification' => true,
        ], 403);
    }

    $donorProfile = $user->donorProfile;
    if (!$donorProfile) {
        return response()->json([
            'message' => 'You must have a donor profile to donate blood. Please complete your donor registration first.',
            'requires_donor_profile' => true,
        ], 422);
    }

    $bloodRequest = \App\Models\BloodRequest::where('id', $id)
        ->orWhere('request_code', $id)
        ->firstOrFail();

    // RULE 1: SAME USER CANNOT DONATE TO THEIR OWN REQUEST
    if ($bloodRequest->requester_id === $user->id) {
        return response()->json([
            'message' => 'Safety violation: You cannot donate blood to your own request. Another eligible donor must fulfill it.',
        ], 422);
    }

    // RULE 2: CANNOT DONATE TO ALREADY FULFILLED OR CANCELLED REQUESTS
    if (in_array($bloodRequest->status, ['FULFILLED', 'CANCELLED'])) {
        return response()->json([
            'message' => 'This blood request has already been completed or closed.',
        ], 422);
    }

    // RULE 3: SAME DONOR CANNOT DONATE TWICE TO THE SAME REQUEST
    $alreadyDonated = \App\Models\Donation::where('donor_profile_id', $donorProfile->id)
        ->where('blood_request_id', $bloodRequest->id)
        ->where('status', 'CONFIRMED')
        ->exists();
    if ($alreadyDonated) {
        return response()->json([
            'message' => 'You have already donated for this specific blood request.',
        ], 422);
    }

    // RULE 4: SAME USER CANNOT DONATE TO THE SAME PERSON WITHIN 90 DAYS
    $samePersonRecent = \App\Models\Donation::where('donor_profile_id', $donorProfile->id)
        ->whereHas('bloodRequest', function ($q) use ($bloodRequest) {
            $q->where('requester_id', $bloodRequest->requester_id);
        })
        ->where('created_at', '>=', now()->subDays(90))
        ->exists();
    if ($samePersonRecent) {
        return response()->json([
            'message' => 'Medical safety rule: You cannot donate blood to the same person multiple times within the 90-day cooldown window.',
        ], 422);
    }

    // RULE 5: 90-DAY GENERAL DONATION COOLDOWN
    if ($donorProfile->last_donation_at && now()->diffInDays($donorProfile->last_donation_at) < 90) {
        $daysLeft = 90 - (int) now()->diffInDays($donorProfile->last_donation_at);
        return response()->json([
            'message' => "Medical safety rule: You donated blood recently. You must wait {$daysLeft} more days before donating again.",
        ], 422);
    }

    // RULE 6: EXACT SAME BLOOD GROUP ONLY
    if ($donorProfile->blood_group !== $bloodRequest->blood_group) {
        return response()->json([
            'message' => "Safety policy: Only donors with the exact same blood group ({$bloodRequest->blood_group}) can donate for this blood request. Your registered blood group is {$donorProfile->blood_group}.",
        ], 422);
    }

    // Create or update RequestMatch as ACCEPTED
    $match = \App\Models\RequestMatch::updateOrCreate(
        [
            'blood_request_id' => $bloodRequest->id,
            'donor_profile_id' => $donorProfile->id,
        ],
        [
            'response_status' => 'ACCEPTED',
            'accepted_at' => now(),
            'distance_km' => 5.0,
            'match_score' => 95.0,
        ]
    );

    // Update request status to DONOR_ACCEPTED
    $bloodRequest->update([
        'status' => 'DONOR_ACCEPTED',
    ]);

    // Log Request Event
    \App\Models\RequestEvent::create([
        'blood_request_id' => $bloodRequest->id,
        'actor_user_id' => $user->id,
        'actor_type' => 'DONOR',
        'event_type' => 'DONOR_ACCEPTED',
        'metadata' => ['note' => 'Donor volunteered directly from request details page'],
        'ip_address' => $request->ip(),
    ]);

    return response()->json([
        'message' => 'Thank you! You have stepped forward to save a life. Requester contact details and coordination chat are now unlocked.',
        'match_id' => $match->id,
        'status' => $bloodRequest->fresh()->status,
    ]);
});

// 4. Controlled Contact Sharing & Coordination Overview
// Privacy rule: Only reveals contacts if user is requester, accepted donor, assigned volunteer, or admin!
Route::middleware('auth:sanctum')->get('/requests/{id}/coordination', function (Request $request, string $id) {
    $user = $request->user();
    $r = \App\Models\BloodRequest::with(['requester', 'matches.donorProfile.user'])
        ->where('id', $id)
        ->orWhere('request_code', $id)
        ->firstOrFail();

    $isRequester = ($user->id === $r->requester_id);
    $isAcceptedDonor = $r->matches->contains(function ($m) use ($user) {
        return $m->donorProfile?->user_id === $user->id && $m->response_status === 'ACCEPTED';
    });
    $isVolunteerOrAdmin = $user->isVolunteer() || $user->isAdmin();

    if (!$isRequester && !$isAcceptedDonor && !$isVolunteerOrAdmin) {
        return response()->json([
            'message' => 'Contact details are private and protected. Phone numbers are unlocked only after mutual match acceptance.',
            'is_authorized' => false,
        ], 403);
    }

    $acceptedDonors = $r->matches->where('response_status', 'ACCEPTED')->map(function ($m) {
        $donor = $m->donorProfile;
        return [
            'match_id' => $m->id,
            'public_code' => $donor->public_donor_code,
            'donor_name' => $donor->user?->name ?? 'Generous Donor',
            'donor_phone' => $donor->user?->phone ?? 'Not provided',
            'blood_group' => $donor->blood_group,
            'distance_km' => (float) $m->distance_km,
            'accepted_at' => $m->accepted_at,
        ];
    })->values();

    return response()->json([
        'is_authorized' => true,
        'request_id' => $r->id,
        'request_code' => $r->request_code,
        'blood_group' => $r->blood_group,
        'units_required' => $r->units_required,
        'units_committed' => $r->units_committed,
        'units_completed' => $r->units_completed,
        'urgency' => $r->urgency,
        'facility_name' => $r->facility_name,
        'address_text' => $r->address_text,
        'status' => $r->status,
        'requester' => [
            'name' => $r->requester?->name ?? 'Requester',
            'phone' => $r->requester_phone,
            'relation' => $r->requester_relation ?? 'Relative',
        ],
        'accepted_donors' => $acceptedDonors,
        'has_accepted_donor' => $acceptedDonors->isNotEmpty(),
    ]);
});

// 5. In-Case Coordination Chat Messages
Route::middleware('auth:sanctum')->get('/requests/{id}/messages', function (Request $request, string $id) {
    $user = $request->user();
    $r = \App\Models\BloodRequest::where('id', $id)->orWhere('request_code', $id)->firstOrFail();

    $chatService = app(\App\Services\ChatService::class);
    $conversation = $chatService->getOrCreateConversation($r);

    $messages = \App\Models\Message::where('conversation_id', $conversation->id)
        ->with('sender:id,name')
        ->orderBy('created_at', 'asc')
        ->limit(50)
        ->get()
        ->map(function ($msg) use ($user) {
            return [
                'id' => $msg->id,
                'sender_id' => $msg->sender_id,
                'sender_name' => $msg->sender?->name ?? 'System',
                'message' => $msg->message_text,
                'is_me' => ($msg->sender_id === $user->id),
                'created_at' => $msg->created_at->diffForHumans(),
            ];
        });

    return response()->json($messages);
});

Route::middleware('auth:sanctum')->post('/requests/{id}/messages', function (Request $request, string $id) {
    $user = $request->user();
    $validated = $request->validate([
        'message' => 'required|string|max:500',
    ]);

    $r = \App\Models\BloodRequest::where('id', $id)->orWhere('request_code', $id)->firstOrFail();

    $chatService = app(\App\Services\ChatService::class);
    $conversation = $chatService->getOrCreateConversation($r);

    $msg = \App\Models\Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user->id,
        'message_text' => $validated['message'],
        'message_type' => 'TEXT',
    ]);

    $conversation->update(['last_message_at' => now()]);

    return response()->json([
        'id' => $msg->id,
        'sender_id' => $user->id,
        'sender_name' => $user->name,
        'message' => $msg->message_text,
        'is_me' => true,
        'created_at' => 'Just now',
    ], 201);
});

// =====================================================================
// Volunteer Verification & Admin Moderation Pipeline
// =====================================================================

// Volunteer Application: Only logged-in regular users can apply, Admin is forbidden!
Route::middleware('auth:sanctum')->post('/volunteer/apply', function (Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json([
            'message' => 'You must be a registered user to apply as a volunteer. Please create an account or log in first.',
        ], 401);
    }

    // Rule: Admins cannot become volunteers!
    if ($user->isAdmin()) {
        return response()->json([
            'message' => 'Administrators cannot register as volunteers. Volunteer coordination is reserved for regular users.',
        ], 403);
    }

    // Rule: Check existing volunteer status
    $existing = VolunteerProfile::where('user_id', $user->id)->first();
    if ($existing) {
        if ($existing->verification_status === 'APPROVED') {
            return response()->json([
                'message' => 'You are already an approved volunteer coordinator.',
                'volunteer' => $existing,
            ], 422);
        }
        if ($existing->verification_status === 'PENDING') {
            return response()->json([
                'message' => 'Your volunteer application is already submitted and currently under review by Admin.',
                'volunteer' => $existing,
            ], 422);
        }
    }

    $validated = $request->validate([
        'name' => 'required|string|max:100',
        'email' => 'required|email',
        'phone' => 'required|string|max:20',
        'nid_number' => 'nullable|string|max:30',
        'organization' => 'nullable|string|max:150',
        'district' => 'nullable|string|max:100',
    ]);

    $profile = VolunteerProfile::updateOrCreate(
        ['user_id' => $user->id],
        [
            'volunteer_code' => 'VOL-' . strtoupper(Str::random(6)),
            'organization_affiliation' => $validated['organization'] ?? null,
            'emergency_contact_phone' => $validated['phone'],
            'verification_status' => 'PENDING', // PENDING ADMIN REVIEW
            'verified_at' => null,
        ]
    );

    return response()->json([
        'message' => 'Volunteer application submitted successfully! Your credentials are now under Admin review.',
        'volunteer' => $profile,
    ], 201);
});

// Admin Volunteer Management
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/volunteers', function (Request $request) {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Admin privileges required.'], 403);
        }

        $status = $request->query('status', 'PENDING');
        $volunteers = VolunteerProfile::with(['user', 'verification'])
            ->when($status !== 'ALL', function ($q) use ($status) {
                $q->where('verification_status', $status);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($volunteers);
    });

    Route::post('/volunteers/{id}/approve', function (Request $request, int $id) {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Admin privileges required.'], 403);
        }

        $volunteer = VolunteerProfile::findOrFail($id);
        $volunteer->update([
            'verification_status' => 'APPROVED',
            'verified_by_admin_id' => $user->id,
            'verified_at' => now(),
            'rejection_reason' => null,
        ]);

        $volunteer->user->assignRole('volunteer');

        return response()->json([
            'message' => "Volunteer {$volunteer->volunteer_code} approved successfully!",
            'volunteer' => $volunteer->fresh(),
        ]);
    });

    Route::post('/volunteers/{id}/reject', function (Request $request, int $id) {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Admin privileges required.'], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $volunteer = VolunteerProfile::findOrFail($id);
        $volunteer->update([
            'verification_status' => 'REJECTED',
            'rejection_reason' => $validated['reason'],
        ]);

        $volunteer->user->removeRole('volunteer');

        return response()->json([
            'message' => "Volunteer application rejected.",
            'volunteer' => $volunteer->fresh(),
        ]);
    });

    Route::post('/volunteers/{id}/revoke', function (Request $request, int $id) {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Admin privileges required.'], 403);
        }

        $volunteer = VolunteerProfile::findOrFail($id);
        $volunteer->update([
            'verification_status' => 'SUSPENDED',
            'rejection_reason' => $request->input('reason', 'Admin revoked volunteer credentials.'),
        ]);

        $volunteer->user->removeRole('volunteer');

        return response()->json([
            'message' => "Volunteer privileges revoked while preserving case history.",
            'volunteer' => $volunteer->fresh(),
        ]);
    });
});

// =====================================================================
// Multi-Tier AI Assistant (RoktoBot) Endpoints
// =====================================================================

$botHandler = function (Request $request, RoktoBotService $bot) {
    $validated = $request->validate([
        'message' => 'required|string|max:500',
        'locale' => 'nullable|string|in:en,bn',
        'session_id' => 'nullable|string|max:100',
    ]);

    $locale = $validated['locale'] ?? 'en';
    $sessionId = $validated['session_id'] ?? 'web-' . md5($request->ip());
    $userId = auth('sanctum')->id();

    $result = $bot->chat($validated['message'], $sessionId, $userId, $locale);

    return response()->json($result);
};

Route::post('/roktobot', $botHandler);
Route::post('/roktobot/chat', $botHandler);
Route::post('/bot/chat', $botHandler);

// Human Escalation Endpoint
Route::post('/roktobot/escalate', function (Request $request) {
    $validated = $request->validate([
        'session_id' => 'required|string',
        'reason' => 'required|string|max:250',
        'blood_group' => 'nullable|string|max:10',
        'location_text' => 'nullable|string|max:150',
        'contact_phone' => 'nullable|string|max:25',
    ]);

    $escalation = \App\Models\ChatEscalation::create([
        'user_id' => auth('sanctum')->id(),
        'session_id' => $validated['session_id'],
        'reason' => $validated['reason'],
        'blood_group' => $validated['blood_group'] ?? null,
        'location_text' => $validated['location_text'] ?? null,
        'contact_phone' => $validated['contact_phone'] ?? null,
        'status' => 'PENDING',
    ]);

    return response()->json([
        'message' => 'Escalation ticket created successfully. A volunteer will respond shortly.',
        'ticket_id' => "ESC-{$escalation->id}",
    ], 201);
});

// Chatbot Feedback Loop Endpoint (Thumbs Up / Down)
Route::post('/roktobot/feedback', function (Request $request) {
    $validated = $request->validate([
        'session_id' => 'required|string',
        'rating' => 'required|integer|in:1,-1',
        'query_text' => 'nullable|string|max:500',
        'response_text' => 'nullable|string',
        'comment' => 'nullable|string|max:300',
    ]);

    $feedback = \App\Models\ChatFeedback::create([
        'user_id' => auth('sanctum')->id(),
        'session_id' => $validated['session_id'],
        'rating' => $validated['rating'],
        'query_text' => $validated['query_text'] ?? null,
        'response_text' => $validated['response_text'] ?? null,
        'comment' => $validated['comment'] ?? null,
    ]);

    return response()->json([
        'message' => 'Thank you for your feedback! It helps improve RoktoBot coordination accuracy.',
    ], 201);
});

// AI Memory & Preferences
Route::middleware('auth:sanctum')->get('/roktobot/preferences', function (Request $request) {
    $user = $request->user();
    $pref = \App\Models\UserAiPreference::firstOrCreate(
        ['user_id' => $user->id],
        ['language' => 'bn', 'communication_style' => 'compassionate', 'emergency_mode_enabled' => true]
    );
    return response()->json($pref);
});

Route::middleware('auth:sanctum')->post('/roktobot/preferences', function (Request $request) {
    $user = $request->user();
    $validated = $request->validate([
        'language' => 'nullable|string|in:en,bn',
        'preferred_area' => 'nullable|string|max:100',
        'communication_style' => 'nullable|string|in:concise,compassionate,urgent',
        'emergency_mode_enabled' => 'nullable|boolean',
    ]);

    $pref = \App\Models\UserAiPreference::updateOrCreate(
        ['user_id' => $user->id],
        $validated
    );

    return response()->json($pref);
});

/* Existing CRUD routes */
Route::apiResource('users', UserController::class);

/*
 * Donor Search Route — MUST come BEFORE apiResource so it is not swallowed by donors/{donor} wildcard
 * GET /api/donors/search?blood_group=O+&location=Dhaka
 * Invokes stored procedure: sp_get_eligible_donors_by_group
 */
Route::get('/donors/search', [ReportController::class, 'searchDonors']);

Route::apiResource('donors', DonorController::class);

/* =====================================================================
   Report / Statistics Routes (SQL Query Engine)
   These endpoints demonstrate SQL JOIN, Aggregate Functions, and Subqueries.
   All routes are prefixed with /api/reports/
   ===================================================================== */
Route::prefix('reports')->group(function () {
    Route::get('/donors/profiles',                         [ReportController::class, 'donorProfiles']);
    Route::get('/donors/donation-counts',                  [ReportController::class, 'donorDonationCounts']);
    Route::get('/donors/average-weight-by-blood-group',    [ReportController::class, 'averageWeightByBloodGroup']);
    Route::get('/donors/frequent',                         [ReportController::class, 'frequentDonors']);
    Route::get('/donors/above-average-weight',             [ReportController::class, 'donorsAboveAverageWeight']);
    Route::get('/donors/above-blood-group-average-weight', [ReportController::class, 'donorsAboveBloodGroupAverageWeight']);
    Route::get('/donors/above-average-donations',          [ReportController::class, 'donorsAboveAverageDonationCount']);
    Route::get('/donors/weight-range-by-blood-group',      [ReportController::class, 'weightRangeByBloodGroup']);

    Route::get('/blood-banks/donation-statistics',         [ReportController::class, 'bloodBankDonationStatistics']);
    Route::get('/blood-banks/above-average-donations',     [ReportController::class, 'banksAboveAverageDonations']);
    Route::get('/blood-banks/volume-statistics',           [ReportController::class, 'bloodBankVolumeStatistics']);

    Route::get('/recipients/request-statistics',           [ReportController::class, 'recipientRequestStatistics']);
    Route::get('/requests/above-average-quantity',         [ReportController::class, 'aboveAverageBloodRequests']);

    /* Database Views */
    Route::get('/views/donor-summary',                     [ReportController::class, 'donorSummaryView']);
    Route::get('/views/emergency-board',                   [ReportController::class, 'emergencyBoardView']);
    Route::get('/views/hospital-stats',                    [ReportController::class, 'hospitalStatsView']);

    /* Stored Procedures & Transactions */
    Route::get('/procedures/eligible-donors',              [ReportController::class, 'callEligibleDonorsProcedure']);
    Route::post('/procedures/fulfill-request',             [ReportController::class, 'callFulfillRequestProcedure']);

    /* Database Triggers */
    Route::post('/triggers/test-prevent-inactive',         [ReportController::class, 'testTriggerPreventInactive']);
    Route::get('/triggers/audit-logs',                     [ReportController::class, 'auditLogsView']);
});


