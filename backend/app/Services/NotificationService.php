<?php

namespace App\Services;

use App\Models\BloodRequest;
use App\Models\DonorProfile;
use App\Models\NotificationPreference;
use App\Models\RequestMatch;
use App\Models\User;
use App\Models\UserDevice;
use App\Notifications\DonorAcceptedNotification;
use App\Notifications\EmergencyMatchNotification;
use App\Notifications\RequestStatusChangedNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Notify an eligible donor about an emergency blood match.
     */
    public function notifyEligibleDonor(User $donorUser, BloodRequest $request, RequestMatch $match): void
    {
        $prefs = $donorUser->getPreferences();

        if ($prefs->channel_in_app && $prefs->emergency_alerts) {
            $donorUser->notify(new EmergencyMatchNotification($request, $match));
        }

        if ($prefs->channel_push && $prefs->emergency_alerts) {
            $this->sendPushNotification(
                $donorUser,
                "🚨 Emergency Blood Match ({$request->blood_group})",
                "URGENT: {$request->units_required} unit(s) needed at {$request->facility_name} ({$match->distance_km} km away).",
                [
                    'type' => 'EMERGENCY_MATCH',
                    'request_code' => $request->request_code,
                    'blood_group' => $request->blood_group,
                    'distance_km' => $match->distance_km,
                    'url' => route('donor.dashboard'),
                ]
            );
        }
    }

    /**
     * Notify a requester and relevant volunteers that a donor accepted the request.
     */
    public function notifyDonorAccepted(User $requester, BloodRequest $request, DonorProfile $donor): void
    {
        $prefs = $requester->getPreferences();

        if ($prefs->channel_in_app && $prefs->status_updates) {
            $requester->notify(new DonorAcceptedNotification($request, $donor));
        }

        if ($prefs->channel_push && $prefs->status_updates) {
            $this->sendPushNotification(
                $requester,
                "🩸 Donor Accepted Your Request!",
                "Donor {$donor->public_donor_code} has accepted your request for {$request->blood_group}.",
                [
                    'type' => 'DONOR_ACCEPTED',
                    'request_code' => $request->request_code,
                    'donor_code' => $donor->public_donor_code,
                    'url' => route('requests.show', $request->request_code),
                ]
            );
        }
    }

    /**
     * Notify a user about a change in request status.
     */
    public function notifyStatusChange(User $recipient, BloodRequest $request, string $fromStatus, string $toStatus): void
    {
        $prefs = $recipient->getPreferences();

        if ($prefs->channel_in_app && $prefs->status_updates) {
            $recipient->notify(new RequestStatusChangedNotification($request, $fromStatus, $toStatus));
        }

        if ($prefs->channel_push && $prefs->status_updates) {
            $readableStatus = str_replace('_', ' ', $toStatus);
            $this->sendPushNotification(
                $recipient,
                "Request {$request->request_code} Update",
                "Status advanced to {$readableStatus}.",
                [
                    'type' => 'STATUS_UPDATE',
                    'request_code' => $request->request_code,
                    'status' => $toStatus,
                    'url' => route('requests.show', $request->request_code),
                ]
            );
        }
    }

    /**
     * Register or refresh a user's push notification device token.
     */
    public function registerDeviceToken(
        User $user,
        string $token,
        string $deviceType = 'WEB',
        ?string $browser = null
    ): UserDevice {
        return UserDevice::updateOrCreate(
            [
                'user_id' => $user->id,
                'device_token' => $token,
            ],
            [
                'device_type' => strtoupper($deviceType),
                'browser' => $browser,
                'last_used_at' => now(),
                'is_active' => true,
            ]
        );
    }

    /**
     * Deactivate a user's push notification device token.
     */
    public function unregisterDeviceToken(User $user, string $token): bool
    {
        return (bool) UserDevice::where('user_id', $user->id)
            ->where('device_token', $token)
            ->update(['is_active' => false]);
    }

    /**
     * Update user notification preferences.
     */
    public function updatePreferences(User $user, array $data): NotificationPreference
    {
        $prefs = $user->getPreferences();
        $prefs->update($data);
        return $prefs->fresh();
    }

    /**
     * Send push notification via FCM or simulate safely when in dev/testing.
     */
    public function sendPushNotification(User $user, string $title, string $body, array $data = []): bool
    {
        $tokens = $user->devices()
            ->where('is_active', true)
            ->pluck('device_token')
            ->filter()
            ->all();

        if (empty($tokens)) {
            return false;
        }

        $fcmKey = config('services.fcm.key');

        if (!$fcmKey) {
            // Development / Local simulation fallback
            Log::info("FCM Simulated Dispatch for User #{$user->id}: [{$title}] {$body}", [
                'recipient_tokens_count' => count($tokens),
                'data' => $data,
            ]);
            return true;
        }

        try {
            $response = Http::withToken($fcmKey)
                ->post('https://fcm.googleapis.com/fcm/send', [
                    'registration_ids' => $tokens,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'icon' => '/icons/icon-192x192.png',
                    ],
                    'data' => $data,
                ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("FCM dispatch failed: {$e->getMessage()}", [
                'user_id' => $user->id,
            ]);
            return false;
        }
    }
}
