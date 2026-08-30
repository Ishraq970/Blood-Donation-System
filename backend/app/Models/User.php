<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Backend Model: User
 * Represents a single row in the 'users' table in the database.
 * This class allows us to interact with the database using PHP instead of raw SQL queries.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    // Explicitly telling Laravel which table this model connects to
    protected $table = 'users';
    
    // Explicitly telling Laravel which column is the Primary Key
    protected $primaryKey = 'UserID';

    /**
     * The attributes that are mass assignable.
     * These are the columns that we are allowed to insert data into via forms.
     * This protects against "mass assignment vulnerabilities".
     *
     * @var list<string>
     */
    protected $fillable = [
        'FullName',
        'Email',
        'PasswordHash',
        'Phone',
        'Address',
        'Gender',
        'AccountStatus',
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
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
