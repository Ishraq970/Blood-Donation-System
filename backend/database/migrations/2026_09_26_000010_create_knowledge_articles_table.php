<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50)->index(); // Account, Donors, Requests, Volunteers, Safety, Privacy, Notifications, Maps, Donation, General
            $table->string('title_en', 255);
            $table->string('title_bn', 255)->nullable();
            $table->text('content_en');
            $table->text('content_bn')->nullable();
            $table->json('keywords')->nullable(); // ["blood", "donate", "register"]
            $table->boolean('is_published')->default(true)->index();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['category', 'is_published']);
        });

        // RoktoBot chat session logs (for support/quality, opt-in only)
        Schema::create('bot_chat_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_id', 64)->index();
            $table->string('role', 10); // user | assistant
            $table->text('content');
            $table->string('source', 30)->default('KB'); // KB | AI | FALLBACK
            $table->string('matched_article_slug', 255)->nullable();
            $table->timestamps();

            $table->index(['session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_chat_logs');
        Schema::dropIfExists('knowledge_articles');
    }
};
