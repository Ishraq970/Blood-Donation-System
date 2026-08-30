<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/*
   Model: Donation
   Represents a single blood donation event.
   A donor goes to a blood bank and donates blood — that event is recorded here.
*/
class Donation extends Model
{
    use HasFactory;

    protected $table = 'Donations';
    protected $primaryKey = 'DonationID';
    public $timestamps = false;

    protected $fillable = [
        'DonorID',
        'BankID',
        'DonationDate',
        'VolumeCollectedML',
        'Remarks',
    ];

    /* Relationship: A Donation was made by one Donor */
    public function donor()
    {
        return $this->belongsTo(Donor::class, 'DonorID', 'DonorID');
    }

    /* Relationship: A Donation happened at one BloodBank */
    public function bloodBank()
    {
        return $this->belongsTo(BloodBank::class, 'BankID', 'BankID');
    }
}
