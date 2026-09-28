<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'User',
                'slug' => 'user',
                'description' => 'General citizen and potential blood requester account',
            ],
            [
                'name' => 'Donor',
                'slug' => 'donor',
                'description' => 'Voluntary blood donor with availability management',
            ],
            [
                'name' => 'Volunteer',
                'slug' => 'volunteer',
                'description' => 'Admin-verified coordinator handling field emergencies',
            ],
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Main platform administrator with full governance access',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
