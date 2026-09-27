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
        // 1. User AI Preferences & Memory
        if (!Schema::hasTable('user_ai_preferences')) {
            Schema::create('user_ai_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('language', 10)->default('bn'); // 'bn' | 'en'
                $table->string('preferred_area', 100)->nullable();
                $table->string('communication_style', 30)->default('compassionate'); // concise, compassionate, urgent
                $table->boolean('emergency_mode_enabled')->default(true);
                $table->timestamps();

                $table->unique('user_id');
            });
        }

        // 2. Chat Escalations to Human Volunteers / Support
        if (!Schema::hasTable('chat_escalations')) {
            Schema::create('chat_escalations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('session_id', 100)->index();
                $table->string('reason', 255);
                $table->string('contact_phone', 30)->nullable();
                $table->string('blood_group', 10)->nullable();
                $table->string('location_text', 150)->nullable();
                $table->string('status', 30)->default('PENDING')->index(); // PENDING, ASSIGNED, RESOLVED, CANCELLED
                $table->foreignId('assigned_volunteer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('resolution_notes')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamps();
            });
        }

        // 3. Chatbot Quality Feedback
        if (!Schema::hasTable('chat_feedback')) {
            Schema::create('chat_feedback', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('session_id', 100)->index();
                $table->string('intent', 50)->nullable();
                $table->string('query_text', 500)->nullable();
                $table->text('response_text')->nullable();
                $table->tinyInteger('rating'); // 1 = helpful (thumbs up), -1 = not helpful (thumbs down)
                $table->text('comment')->nullable();
                $table->timestamps();
            });
        }

        // 4. AI Prompts Versioning
        if (!Schema::hasTable('ai_prompts')) {
            Schema::create('ai_prompts', function (Blueprint $table) {
                $table->id();
                $table->string('name', 60)->index(); // 'system_prompt', 'ner_extractor', 'emergency_agent'
                $table->integer('version')->default(1);
                $table->text('prompt_text');
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_prompts');
        Schema::dropIfExists('chat_feedback');
        Schema::dropIfExists('chat_escalations');
        Schema::dropIfExists('user_ai_preferences');
    }
};
