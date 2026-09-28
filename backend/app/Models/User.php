<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'name',
        'email',
        'phone',
        'password',
        'preferred_locale',
        'profile_photo_path',
        'date_of_birth',
        'status',
        'email_verification_code',
        'email_verification_expires_at',
        'last_login_at',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'preferred_locale' => 'en',
        'status' => 'ACTIVE',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_verification_expires_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'date_of_birth' => 'date',
            'password' => 'hashed',
        ];
    }

    /**
     * The roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    /**
     * Check if user has a given role.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains(function ($r) use ($role) {
            return strtolower($r->slug) === strtolower($role) || strtolower($r->name) === strtolower($role);
        });
    }

    /**
     * Assign a role to the user.
     */
    public function assignRole(string|Role $role): void
    {
        $roleModel = is_string($role)
            ? Role::firstOrCreate(['slug' => strtolower($role)], ['name' => ucfirst($role)])
            : $role;

        if (!$this->roles->contains($roleModel->id)) {
            $this->roles()->attach($roleModel->id);
            $this->load('roles');
        }
    }

    /**
     * Remove a role from the user.
     */
    public function removeRole(string|Role $role): void
    {
        $roleId = is_string($role) ? Role::where('slug', strtolower($role))->value('id') : $role->id;
        if ($roleId) {
            $this->roles()->detach($roleId);
            $this->load('roles');
        }
    }

    /**
     * Quick role helper methods.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isVolunteer(): bool
    {
        return $this->hasRole('volunteer');
    }

    public function isDonor(): bool
    {
        return $this->hasRole('donor');
    }

    public function donorProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(DonorProfile::class);
    }

    public function devices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    public function notificationPreference(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(NotificationPreference::class);
    }

    public function getPreferences(): NotificationPreference
    {
        return $this->notificationPreference()->firstOrCreate([], [
            'channel_in_app' => true,
            'channel_push' => true,
            'channel_email' => true,
            'channel_sms' => false,
            'emergency_alerts' => true,
            'chat_messages' => true,
            'status_updates' => true,
        ]);
    }

    public function conversations(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot('role_in_request', 'last_read_at')
            ->withTimestamps();
    }

    public function volunteerProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(VolunteerProfile::class);
    }

    public function isApprovedVolunteer(): bool
    {
        return $this->isVolunteer() && $this->volunteerProfile && $this->volunteerProfile->isApproved();
    }

    public function isAvailableDonor(): bool
    {
        return $this->isDonor() && $this->donorProfile && $this->donorProfile->isAvailableNow();
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }
}
