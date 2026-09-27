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
        Schema::dropIfExists('volunteer_verifications');
        Schema::dropIfExists('volunteer_profiles');

        Schema::create('volunteer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('volunteer_code', 30)->unique();
            $table->string('organization_affiliation')->nullable();
            $table->foreignId('assigned_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('emergency_contact_phone', 25);
            $table->string('verification_status', 30)->default('PENDING')->index(); // PENDING, APPROVED, REJECTED, SUSPENDED
            $table->foreignId('verified_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->integer('active_cases_count')->default(0);
            $table->integer('completed_cases_count')->default(0);
            $table->timestamps();

            $table->index(['verification_status', 'assigned_location_id'], 'vol_status_loc_idx');
        });

        Schema::create('volunteer_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('volunteer_profile_id')->constrained('volunteer_profiles')->cascadeOnDelete();
            $table->text('nid_number'); // Encrypted string
            $table->string('nid_document_path')->nullable();
            $table->string('student_or_org_id_path')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('volunteer_verifications');
        Schema::dropIfExists('volunteer_profiles');
    }
};
