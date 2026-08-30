<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/*
   Model: BloodBank
   Represents a blood bank institution. Each blood bank is linked to a user account.
   A blood bank can have many donations and stock items.
*/
class BloodBank extends Model
{
    use HasFactory;

    // Table and key configuration
    protected $table = 'BloodBanks';
    protected $primaryKey = 'BankID';
    public $timestamps = false;

    protected $fillable = [
        'UserID',
        'BankName',
        'Address',
        'City',
        'ContactPhone',
        'StorageCapacityUnits',
    ];

    /* Relationship: A BloodBank belongs to one User (admin account) */
    public function user()
    {
        return $this->belongsTo(User::class, 'UserID', 'UserID');
    }

    /* Relationship: A BloodBank has received many Donations */
    public function donations()
    {
        return $this->hasMany(Donation::class, 'BankID', 'BankID');
    }

    /* Relationship: A BloodBank has many BloodStock bags in storage */
    public function bloodStock()
    {
        return $this->hasMany(BloodStock::class, 'BankID', 'BankID');
    }
}
