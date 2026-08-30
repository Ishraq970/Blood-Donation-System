<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/*
   Model: Recipient
   Represents a patient who needs blood.
   A recipient is linked to a User account and can make blood requests.
*/
class Recipient extends Model
{
    protected $table = 'Recipients';
    protected $primaryKey = 'RecipientID';
    public $timestamps = false;

    protected $fillable = [
        'UserID',
        'BloodGroup',
        'RequiredComponent',
        'City',
        'HospitalName',
        'EmergencyContact',
        'MedicalCondition',
        'IsEmergency',
    ];

    /* Relationship: A Recipient belongs to one User account */
    public function user()
    {
        return $this->belongsTo(User::class, 'UserID', 'UserID');
    }

    /* Relationship: A Recipient can make many BloodRequests over time */
    public function bloodRequests()
    {
        return $this->hasMany(BloodRequest::class, 'RecipientID', 'RecipientID');
    }
}
