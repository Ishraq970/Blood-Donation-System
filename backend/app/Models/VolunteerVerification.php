<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'volunteer_profile_id',
        'nid_number',
        'nid_document_path',
        'student_or_org_id_path',
        'reviewer_notes',
        'reviewed_at',
    ];

    protected $casts = [
        'nid_number' => 'encrypted',
        'reviewed_at' => 'datetime',
    ];

    public function volunteerProfile(): BelongsTo
    {
        return $this->belongsTo(VolunteerProfile::class);
    }
}
