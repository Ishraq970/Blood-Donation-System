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
        Schema::create('blood_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('request_code', 30)->unique()->index(); // RLB-26-XXXXXX
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->string('component', 50)->default('Whole Blood'); // Whole Blood, Red Cells, Platelets, Plasma, Other
            $table->string('blood_group', 5)->index(); // A+, A-, B+, B-, AB+, AB-, O+, O-
            $table->integer('units_required')->default(1);
            $table->integer('units_committed')->default(0);
            $table->integer('units_completed')->default(0);
            $table->enum('urgency', ['EMERGENCY_NOW', 'WITHIN_6_HOURS', 'TODAY', 'NORMAL'])->default('NORMAL')->index();
            $table->dateTime('required_at')->index();
            $table->string('facility_name', 200);
            $table->foreignId('facility_id')->nullable(); // For future accredited facility directory
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('landmark', 255)->nullable();
            $table->string('address_text', 255)->nullable();
            $table->string('requester_phone', 30)->nullable();
            $table->string('requester_relation', 100)->nullable(); // Self, Parent, Child, Spouse, Relative, Friend
            $table->string('verification_status', 40)->default('SELF_REPORTED');
            $table->string('status', 40)->default('CREATED')->index();
            $table->foreignId('primary_volunteer_id')->nullable();
            $table->text('public_note')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['blood_group', 'status']);
            $table->index(['urgency', 'status']);
            $table->index(['latitude', 'longitude']);
            $table->index(['required_at', 'status']);
        });

        Schema::create('request_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blood_request_id')->constrained('blood_requests')->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type', 30)->default('SYSTEM'); // REQUESTER, DONOR, VOLUNTEER, ADMIN, SYSTEM
            $table->string('event_type', 60)->index();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['blood_request_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_events');
        Schema::dropIfExists('blood_requests');
    }
};
