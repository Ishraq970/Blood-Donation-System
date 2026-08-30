<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
   Fix Missing Cascade Deletes
   ============================
   The original migration was missing onDelete('cascade') on several
   foreign key relationships. Without this, trying to delete a User who
   has donations would crash with a "foreign key constraint fails" error.

   This migration fixes all affected tables by:
   1. Dropping the old foreign key (that only had onUpdate cascade)
   2. Re-adding it with BOTH onDelete AND onUpdate cascade

   We create a NEW migration instead of editing the old one.
   This is the correct professional approach — never edit old migrations
   that have already been run on a database.
*/
return new class extends Migration
{
    public function up(): void
    {
        /* Fix Donations table — allow cascade when a Donor or BloodBank is deleted */
        Schema::table('Donations', function (Blueprint $table) {
            $table->dropForeign(['DonorID']);
            $table->foreign('DonorID')
                ->references('DonorID')
                ->on('Donors')
                ->onDelete('cascade')  // <-- was missing
                ->onUpdate('cascade');

            $table->dropForeign(['BankID']);
            $table->foreign('BankID')
                ->references('BankID')
                ->on('BloodBanks')
                ->onDelete('cascade')  // <-- was missing
                ->onUpdate('cascade');
        });

        /* Fix BloodRequests table — allow cascade when a Recipient is deleted */
        Schema::table('BloodRequests', function (Blueprint $table) {
            $table->dropForeign(['RecipientID']);
            $table->foreign('RecipientID')
                ->references('RecipientID')
                ->on('Recipients')
                ->onDelete('cascade')  // <-- was missing
                ->onUpdate('cascade');
        });

        /* Fix BloodStock table — allow cascade when a BloodBank or Donor is deleted */
        Schema::table('BloodStock', function (Blueprint $table) {
            $table->dropForeign(['BankID']);
            $table->foreign('BankID')
                ->references('BankID')
                ->on('BloodBanks')
                ->onDelete('cascade')  // <-- was missing
                ->onUpdate('cascade');

            $table->dropForeign(['DonorID']);
            $table->foreign('DonorID')
                ->references('DonorID')
                ->on('Donors')
                ->onDelete('set null')  // set null because DonorID is nullable in BloodStock
                ->onUpdate('cascade');
        });

        /* Fix EmergencyMatches — cascade on donor/bag delete */
        Schema::table('EmergencyMatches', function (Blueprint $table) {
            $table->dropForeign(['MatchedDonorID']);
            $table->foreign('MatchedDonorID')
                ->references('DonorID')
                ->on('Donors')
                ->onDelete('set null')  // nullable column, use set null
                ->onUpdate('cascade');

            $table->dropForeign(['MatchedBagID']);
            $table->foreign('MatchedBagID')
                ->references('BagID')
                ->on('BloodStock')
                ->onDelete('set null')  // nullable column, use set null
                ->onUpdate('cascade');
        });

        /* Fix DispatchAndTransits — cascade on request/bag delete */
        Schema::table('DispatchAndTransits', function (Blueprint $table) {
            $table->dropForeign(['RequestID']);
            $table->foreign('RequestID')
                ->references('RequestID')
                ->on('BloodRequests')
                ->onDelete('cascade')  // <-- was missing
                ->onUpdate('cascade');

            $table->dropForeign(['BagID']);
            $table->foreign('BagID')
                ->references('BagID')
                ->on('BloodStock')
                ->onDelete('cascade')  // <-- was missing
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        /* Reverse all the changes back to the original (no onDelete cascade) */
        Schema::table('Donations', function (Blueprint $table) {
            $table->dropForeign(['DonorID']);
            $table->foreign('DonorID')->references('DonorID')->on('Donors')->onUpdate('cascade');
            $table->dropForeign(['BankID']);
            $table->foreign('BankID')->references('BankID')->on('BloodBanks')->onUpdate('cascade');
        });

        Schema::table('BloodRequests', function (Blueprint $table) {
            $table->dropForeign(['RecipientID']);
            $table->foreign('RecipientID')->references('RecipientID')->on('Recipients')->onUpdate('cascade');
        });

        Schema::table('BloodStock', function (Blueprint $table) {
            $table->dropForeign(['BankID']);
            $table->foreign('BankID')->references('BankID')->on('BloodBanks')->onUpdate('cascade');
            $table->dropForeign(['DonorID']);
            $table->foreign('DonorID')->references('DonorID')->on('Donors')->onUpdate('cascade');
        });

        Schema::table('EmergencyMatches', function (Blueprint $table) {
            $table->dropForeign(['MatchedDonorID']);
            $table->foreign('MatchedDonorID')->references('DonorID')->on('Donors')->onUpdate('cascade');
            $table->dropForeign(['MatchedBagID']);
            $table->foreign('MatchedBagID')->references('BagID')->on('BloodStock')->onUpdate('cascade');
        });

        Schema::table('DispatchAndTransits', function (Blueprint $table) {
            $table->dropForeign(['RequestID']);
            $table->foreign('RequestID')->references('RequestID')->on('BloodRequests')->onUpdate('cascade');
            $table->dropForeign(['BagID']);
            $table->foreign('BagID')->references('BagID')->on('BloodStock')->onUpdate('cascade');
        });
    }
};
