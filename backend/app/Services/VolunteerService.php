<?php

namespace App\Services;

use App\Models\BloodRequest;
use App\Models\RequestEvent;
use App\Models\Role;
use App\Models\User;
use App\Models\VolunteerProfile;
use App\Models\VolunteerVerification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class VolunteerService
{
    /** Allowed MIME types for identity documents. */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'application/pdf',
    ];

    public function __construct(
        protected NotificationService $notificationService,
        protected ChatService $chatService,
        protected AuditService $auditService
    ) {}

    /**
     * Submit a new volunteer verification application.
     */
    public function submitApplication(
        User $user,
        array $data,
        ?UploadedFile $nidFile = null,
        ?UploadedFile $idFile = null
    ): VolunteerProfile {
        return DB::transaction(function () use ($user, $data, $nidFile, $idFile) {
            $nidPath = null;
            $idPath = null;

            if ($nidFile) {
                $this->validateFileMime($nidFile, 'NID document');
                $nidPath = $nidFile->store('verifications', 'local');
            }

            if ($idFile) {
                $this->validateFileMime($idFile, 'ID document');
                $idPath = $idFile->store('verifications', 'local');
            }

            $profile = VolunteerProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'organization_affiliation' => $data['organization_affiliation'] ?? null,
                    'assigned_location_id' => $data['assigned_location_id'] ?? null,
                    'emergency_contact_phone' => $data['emergency_contact_phone'],
                    'verification_status' => 'PENDING',
                    'rejection_reason' => null,
                ]
            );

            VolunteerVerification::updateOrCreate(
                ['volunteer_profile_id' => $profile->id],
                [
                    'nid_number' => $data['nid_number'],
                    'nid_document_path' => $nidPath ?? ($profile->verification?->nid_document_path),
                    'student_or_org_id_path' => $idPath ?? ($profile->verification?->student_or_org_id_path),
                ]
            );

            return $profile->fresh(['verification', 'user', 'assignedLocation']);
        });
    }

    /**
     * Approve a volunteer application.
     */
    public function approveApplication(VolunteerProfile $profile, User $admin): bool
    {
        return DB::transaction(function () use ($profile, $admin) {
            $old = ['verification_status' => $profile->verification_status];

            $profile->update([
                'verification_status' => 'APPROVED',
                'verified_by_admin_id' => $admin->id,
                'verified_at' => now(),
                'rejection_reason' => null,
            ]);

            $user = $profile->user;
            $user->assignRole('volunteer');

            // Send notification
            $this->notificationService->sendPushNotification(
                $user,
                '🎖️ Volunteer Verification Approved!',
                'Welcome to the RoktoLinkBD volunteer response team. You can now coordinate emergency blood cases.',
                ['type' => 'VOLUNTEER_APPROVED', 'url' => route('volunteer.dashboard')]
            );

            // Audit
            $this->auditService->log(
                'volunteer.approved',
                $profile,
                $old,
                ['verification_status' => 'APPROVED'],
                null,
                $admin->id
            );

            return true;
        });
    }

    /**
     * Reject a volunteer application with reason.
     */
    public function rejectApplication(VolunteerProfile $profile, User $admin, string $reason): bool
    {
        return DB::transaction(function () use ($profile, $admin, $reason) {
            $old = ['verification_status' => $profile->verification_status];

            $profile->update([
                'verification_status' => 'REJECTED',
                'verified_by_admin_id' => $admin->id,
                'verified_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $user = $profile->user;
            $user->removeRole('volunteer');

            $this->notificationService->sendPushNotification(
                $user,
                'Volunteer Application Update',
                "Your application could not be verified at this time: {$reason}",
                ['type' => 'VOLUNTEER_REJECTED']
            );

            // Audit
            $this->auditService->log(
                'volunteer.rejected',
                $profile,
                $old,
                ['verification_status' => 'REJECTED', 'rejection_reason' => $reason],
                $reason,
                $admin->id
            );

            return true;
        });
    }

    /**
     * Claim an active emergency blood request for case coordination.
     */
    public function claimCase(BloodRequest $request, VolunteerProfile $volunteer): bool
    {
        if (!$volunteer->isApproved()) {
            throw new InvalidArgumentException('Only approved volunteers can coordinate emergency cases.');
        }

        if ($request->primary_volunteer_id) {
            throw new InvalidArgumentException('This case already has an assigned primary volunteer.');
        }

        return DB::transaction(function () use ($request, $volunteer) {
            $request->update(['primary_volunteer_id' => $volunteer->user_id]);
            $volunteer->increment('active_cases_count');

            // Add volunteer to coordination chat
            $conversation = $this->chatService->getOrCreateConversation($request);
            $this->chatService->addParticipant($conversation, $volunteer->user, 'VOLUNTEER');
            $this->chatService->sendSystemNotice(
                $conversation,
                "🎖️ Volunteer {$volunteer->volunteer_code} has claimed case coordination."
            );

            // Audit event
            RequestEvent::create([
                'blood_request_id' => $request->id,
                'actor_user_id' => $volunteer->user_id,
                'actor_type' => 'VOLUNTEER',
                'event_type' => 'VOLUNTEER_ASSIGNED',
                'metadata' => [
                    'volunteer_code' => $volunteer->volunteer_code,
                    'volunteer_name' => $volunteer->user->name,
                ],
                'ip_address' => request()->ip(),
            ]);

            return true;
        });
    }

    /**
     * Validate uploaded file MIME type using actual file content (not just extension).
     * Prevents MIME-type spoofing attacks where an attacker renames a PHP file to .jpg.
     *
     * @throws \InvalidArgumentException when the MIME type is not allowed
     */
    private function validateFileMime(UploadedFile $file, string $label): void
    {
        $detected = $file->getMimeType(); // Reads actual file magic bytes via Symfony

        if (! in_array($detected, self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidArgumentException(
                "{$label} must be a JPEG, PNG, or PDF file. Detected type: {$detected}"
            );
        }
    }
}
