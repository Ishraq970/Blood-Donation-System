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
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('blood_request_id')->constrained('blood_requests')->cascadeOnDelete();
            $table->foreignId('donor_profile_id')->constrained('donor_profiles')->cascadeOnDelete();
            $table->string('certificate_code', 30)->unique();
            $table->timestamp('donated_at');
            $table->string('component', 50)->default('Whole Blood');
            $table->integer('units')->default(1);
            $table->string('facility_name');
            $table->boolean('donor_confirmed')->default(false);
            $table->boolean('requester_confirmed')->default(false);
            $table->boolean('volunteer_verified')->default(false);
            $table->string('status', 30)->default('PENDING_CONFIRMATION')->index(); // PENDING_CONFIRMATION, CONFIRMED, DISPUTED
            $table->text('gratitude_note')->nullable();
            $table->boolean('is_public_wall')->default(true);
            $table->timestamps();

            $table->index(['donor_profile_id', 'status']);
            $table->index(['blood_request_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
