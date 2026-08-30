<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/*
   Model: BloodRequest
   Represents a formal request for blood from a Recipient.
   Tracks the blood group needed, quantity, urgency level, and request status.
*/
class BloodRequest extends Model
{
    protected $table = 'BloodRequests';
    protected $primaryKey = 'RequestID';
    public $timestamps = false;

    protected $fillable = [
        'RecipientID',
        'BloodGroup',
        'ComponentType',
        'QuantityUnits',
        'UrgencyLevel',
        'RequestStatus',
        'RequestedAt',
        'RequiredByDate',
        'Location',
    ];

    /* Relationship: A BloodRequest was made by one Recipient */
    public function recipient()
    {
        return $this->belongsTo(Recipient::class, 'RecipientID', 'RecipientID');
    }
}
