<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Backend entry point
|--------------------------------------------------------------------------
|
| The React application in ../frontend owns every user-facing screen. This
| Laravel project is deliberately API-only: its endpoints live under /api.
| Keeping this small response at / makes a directly opened backend URL useful
| without accidentally serving the old Livewire frontend.
|
*/
Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'RoktoLinkBD'),
        'service' => 'RoktoLinkBD API',
        'status' => 'ok',
        'api' => url('/api'),
        'health' => url('/up'),
    ]);
})->name('home');

/*
 * Legacy Livewire routes are retained only for backwards-compatible links and
 * existing server-side workflows. They are not the frontend entry point; the
 * React application remains in ../frontend.
 */
Route::get('/requests', \App\Livewire\Requests\Index::class)->name('requests.index');
Route::get('/lifesavers', \App\Livewire\Lifesavers\Wall::class)->name('lifesavers');
Route::view('/about', 'pages.about')->name('about');
Route::view('/faq', 'pages.faq')->name('faq');
Route::view('/privacy', 'pages.privacy')->name('privacy');
Route::view('/terms', 'pages.terms')->name('terms');
Route::view('/safety', 'pages.safety')->name('safety');
Route::view('/guidelines', 'pages.guidelines')->name('guidelines');

Route::get('/locale/{locale}', function (string $locale, \Illuminate\Http\Request $request) {
    if (in_array($locale, ['en', 'bn'], true)) {
        session(['locale' => $locale]);
        cookie()->queue('roktolink_locale', $locale, 60 * 24 * 365);
        $request->user()?->update(['preferred_locale' => $locale]);
    }
    return redirect()->back();
})->name('locale.switch');

Route::middleware('guest')->group(function () {
    Route::get('/register', \App\Livewire\Auth\Register::class)->name('register');
    Route::get('/login', \App\Livewire\Auth\Login::class)->name('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/email/verify', \App\Livewire\Auth\VerifyEmail::class)->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', function (\Illuminate\Foundation\Auth\EmailVerificationRequest $request) {
        $request->fulfill();
        return redirect()->route('dashboard')->with('status', 'Your email address has been successfully verified.');
    })->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::post('/logout', function (\Illuminate\Http\Request $request) {
        \Illuminate\Support\Facades\Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('home');
    })->name('logout');
    Route::get('/dashboard', \App\Livewire\Dashboard::class)->name('dashboard');
    Route::get('/notifications', \App\Livewire\Notifications\Index::class)->name('notifications.index');
    Route::get('/settings/notifications', \App\Livewire\Settings\NotificationPreferences::class)->name('settings.notifications');
    Route::post('/devices/register', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'device_token' => 'required|string|max:500',
            'device_type' => 'nullable|string|in:WEB,ANDROID,IOS',
            'browser' => 'nullable|string|max:100',
        ]);
        $device = app(\App\Services\NotificationService::class)->registerDeviceToken(
            $request->user(),
            $validated['device_token'],
            $validated['device_type'] ?? 'WEB',
            $validated['browser'] ?? $request->userAgent(),
        );
        return response()->json(['success' => true, 'device_id' => $device->id]);
    })->name('devices.register');
    Route::post('/devices/unregister', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate(['device_token' => 'required|string|max:500']);
        app(\App\Services\NotificationService::class)->unregisterDeviceToken($request->user(), $validated['device_token']);
        return response()->json(['success' => true]);
    })->name('devices.unregister');
    Route::middleware('verified')->get('/requests/create', \App\Livewire\Requests\Create::class)->name('requests.create');
    Route::middleware('verified')->prefix('donor')->name('donor.')->group(function () {
        Route::get('/register', \App\Livewire\Donor\Register::class)->name('register');
        Route::get('/dashboard', \App\Livewire\Donor\Dashboard::class)->name('dashboard');
    });
    Route::middleware('verified')->prefix('volunteer')->name('volunteer.')->group(function () {
        Route::get('/apply', \App\Livewire\Volunteer\Apply::class)->name('apply');
        Route::get('/dashboard', \App\Livewire\Volunteer\Dashboard::class)->name('dashboard');
    });
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', \App\Livewire\Admin\Dashboard::class)->name('dashboard');
        Route::get('/locations', \App\Livewire\Admin\Locations\Index::class)->name('locations.index');
        Route::get('/volunteers', \App\Livewire\Admin\Volunteers\Index::class)->name('volunteers.index');
        Route::get('/analytics', \App\Livewire\Admin\Analytics\Index::class)->name('analytics.index');
        Route::get('/knowledge-base', \App\Livewire\Admin\KnowledgeBase\Index::class)->name('knowledge-base.index');
        Route::get('/audit-logs', \App\Livewire\Admin\AuditLogs::class)->name('audit-logs.index');
        Route::get('/volunteers/{id}/document/{type}', function (int $id, string $type, \Illuminate\Http\Request $request) {
            $profile = \App\Models\VolunteerProfile::with('verification')->findOrFail($id);
            $path = $type === 'nid' ? $profile->verification?->nid_document_path : $profile->verification?->student_or_org_id_path;
            if (!$path || !\Illuminate\Support\Facades\Storage::disk('local')->exists($path)) abort(404, 'Requested verification document was not found.');
            app(\App\Services\AuditService::class)->log('volunteer.nid_viewed', $profile, null, ['document_type' => $type], null, $request->user()?->id);
            return \Illuminate\Support\Facades\Storage::disk('local')->response($path);
        })->name('volunteers.document');
    });
});

Route::get('/requests/{code}', \App\Livewire\Requests\Show::class)->where('code', 'RLB-[0-9A-Za-z\\-]+')->name('requests.show');
Route::get('/certificates/{code}', \App\Livewire\Certificates\Show::class)->where('code', 'CERT-[0-9A-Za-z\\-]+')->name('certificates.show');
