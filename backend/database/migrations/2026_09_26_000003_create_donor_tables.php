<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('donor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('public_donor_code', 30)->unique();
            $table->string('blood_group', 5)->index(); // A+, A-, B+, B-, AB+, AB-, O+, O-
            $table->string('blood_group_verification_status', 40)->default('SELF_REPORTED');
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('landmark', 255)->nullable();
            $table->integer('preferred_radius_km')->default(10);
            $table->date('last_donation_at')->nullable();
            $table->string('last_donation_source', 40)->default('SELF_REPORTED');
            $table->enum('profile_status', ['ACTIVE', 'PAUSED', 'INACTIVE'])->default('ACTIVE')->index();
            $table->boolean('emergency_alerts_enabled')->default(true);
            $table->timestamps();

            $table->index(['blood_group', 'profile_status']);
            $table->index(['latitude', 'longitude']);
        });

        Schema::create('donor_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_profile_id')->constrained('donor_profiles')->cascadeOnDelete();
            $table->enum('status', ['AVAILABLE_NOW', 'AVAILABLE_LATER', 'UNAVAILABLE', 'DO_NOT_DISTURB'])->default('AVAILABLE_NOW')->index();
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable()->index();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('radius_km')->default(10);
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index(['donor_profile_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donor_availabilities');
        Schema::dropIfExists('donor_profiles');
    }
};
