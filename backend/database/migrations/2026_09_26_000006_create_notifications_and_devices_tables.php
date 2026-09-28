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
        // Standard Laravel Notifications Table
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // Push Notification Devices (FCM tokens)
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('device_token', 500);
            $table->string('device_type', 20)->default('WEB'); // WEB, ANDROID, IOS
            $table->string('browser', 100)->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'device_token']);
            $table->index(['user_id', 'is_active']);
        });

        // User Notification Preferences
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('channel_in_app')->default(true);
            $table->boolean('channel_push')->default(true);
            $table->boolean('channel_email')->default(true);
            $table->boolean('channel_sms')->default(false);
            $table->boolean('emergency_alerts')->default(true);
            $table->boolean('chat_messages')->default(true);
            $table->boolean('status_updates')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('notifications');
    }
};
