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
        Schema::create('request_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blood_request_id')->constrained('blood_requests')->cascadeOnDelete();
            $table->foreignId('donor_profile_id')->constrained('donor_profiles')->cascadeOnDelete();
            $table->decimal('distance_km', 8, 2);
            $table->integer('match_score')->default(0);
            $table->json('match_reason')->nullable();
            $table->string('notification_status', 30)->default('PENDING')->index(); // PENDING, SENT, DELIVERED, FAILED
            $table->string('response_status', 30)->default('PENDING')->index(); // PENDING, ACCEPTED, DECLINED, NO_RESPONSE, CANCELLED
            $table->timestamp('notified_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->unique(['blood_request_id', 'donor_profile_id']);
            $table->index(['donor_profile_id', 'response_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_matches');
    }
};
