<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

/**
 * AuditService — Append-only log of high-risk administrative actions.
 *
 * Logged events:
 *   volunteer.approved         - Admin approves a volunteer
 *   volunteer.rejected         - Admin rejects a volunteer
 *   volunteer.suspended        - Admin suspends a volunteer
 *   volunteer.revoked          - Admin revokes a volunteer
 *   volunteer.nid_viewed       - Admin opens NID document viewer
 *   donation.manual_change     - Admin manually modifies a donation record
 *   blood_request.overridden   - Admin force-transitions request status
 *   account.suspended          - Admin suspends a user account
 *   account.closed             - Admin closes a user account
 *   report.resolved            - Admin resolves a report
 *   report.dismissed           - Admin dismisses a report
 *   admin.login                - Admin login event
 *   config.changed             - Sensitive configuration changed
 *   certificate.revoked        - Admin revokes a certificate
 */
class AuditService
{
    /**
     * Record a high-risk action.
     *
     * @param  string          $event        Machine-readable event slug (e.g. 'volunteer.approved')
     * @param  Model|null      $auditable    The model being acted on (polymorphic)
     * @param  array|null      $oldValues    State before the action (never include secrets)
     * @param  array|null      $newValues    State after the action
     * @param  string|null     $reason       Optional admin-provided justification
     * @param  int|null        $actorId      User ID performing the action (null = SYSTEM)
     * @param  string          $actorType    'USER' | 'ADMIN' | 'SYSTEM'
     */
    public function log(
        string $event,
        ?Model $auditable = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $reason = null,
        ?int $actorId = null,
        string $actorType = 'ADMIN'
    ): AuditLog {
        // Never include password hashes or raw secrets in audit values
        $oldValues = $this->sanitize($oldValues);
        $newValues = $this->sanitize($newValues);

        return AuditLog::create([
            'actor_id'       => $actorId ?? auth()->id(),
            'actor_type'     => $actorType,
            'event'          => $event,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id'   => $auditable?->getKey(),
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'reason'         => $reason,
            'ip_address'     => Request::ip(),
            'user_agent'     => mb_substr(Request::userAgent() ?? '', 0, 512),
        ]);
    }

    /**
     * Strip sensitive fields before persisting to audit log.
     */
    private function sanitize(?array $values): ?array
    {
        if (! $values) {
            return null;
        }

        $sensitiveKeys = ['password', 'password_confirmation', 'token', 'secret', 'nid_number', 'api_key'];

        foreach ($sensitiveKeys as $key) {
            if (array_key_exists($key, $values)) {
                $values[$key] = '[REDACTED]';
            }
        }

        return $values;
    }
}
