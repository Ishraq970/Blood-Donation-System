<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Backend Model: Donor
 * Represents a single row in the 'Donors' table in the database.
 */
class Donor extends Model
{
    // The exact name of the table in the database
    protected $table = 'Donors';
    
    // The primary key column of the table
    protected $primaryKey = 'DonorID';
    
    // We disable standard Laravel timestamps (created_at, updated_at) because this table doesn't have them
    public $timestamps = false;

    // The columns we are allowed to fill via our frontend forms
    protected $fillable = [
        'UserID',
        'BloodGroup',
        'Genotype',
        'DateOfBirth',
        'WeightKg',
        'City',
        'LastDonationDate',
        'IsEligible',
    ];

    /**
     * Relationship: A Donor belongs to a User.
     * This allows us to easily get the donor's full name and email.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'UserID', 'UserID');
    }
}
