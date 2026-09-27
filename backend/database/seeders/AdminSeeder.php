<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminName = env('ADMIN_NAME', 'RoktoLinkBD Main Administrator');
        $adminEmail = env('ADMIN_EMAIL', 'admin@roktolinkbd.org');
        $adminPassword = env('ADMIN_PASSWORD', 'AdminSecure2026!');

        $admin = User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'uuid' => (string) Str::uuid(),
                'name' => $adminName,
                'password' => Hash::make($adminPassword),
                'email_verified_at' => now(),
                'phone' => '01700000000',
                'preferred_locale' => 'en',
                'status' => 'ACTIVE',
            ]
        );

        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole && !$admin->roles->contains($adminRole->id)) {
            $admin->roles()->attach($adminRole->id);
        }
    }
}
