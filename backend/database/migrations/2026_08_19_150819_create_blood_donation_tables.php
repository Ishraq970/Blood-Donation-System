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
        Schema::create('Donors', function (Blueprint $table) {
            $table->id('DonorID');
            $table->unsignedBigInteger('UserID')->unique();
            $table->string('BloodGroup', 5);
            $table->string('Genotype', 10)->nullable();
            $table->date('DateOfBirth')->nullable();
            $table->decimal('WeightKg', 5, 2)->nullable();
            $table->string('City', 100)->nullable();
            $table->date('LastDonationDate')->nullable();
            $table->boolean('IsEligible')->default(1);
            $table->foreign('UserID')->references('UserID')->on('users')->onDelete('cascade')->onUpdate('cascade');
        });

        Schema::create('Recipients', function (Blueprint $table) {
            $table->id('RecipientID');
            $table->unsignedBigInteger('UserID')->unique();
            $table->string('BloodGroup', 5);
            $table->string('RequiredComponent', 50)->nullable();
            $table->string('City', 100)->nullable();
            $table->string('HospitalName', 150)->nullable();
            $table->string('EmergencyContact', 20)->nullable();
            $table->string('MedicalCondition', 255)->nullable();
            $table->boolean('IsEmergency')->default(0);
            $table->foreign('UserID')->references('UserID')->on('users')->onDelete('cascade')->onUpdate('cascade');
        });

        Schema::create('BloodBanks', function (Blueprint $table) {
            $table->id('BankID');
            $table->unsignedBigInteger('UserID')->unique();
            $table->string('BankName', 150);
            $table->string('Address', 255)->nullable();
            $table->string('City', 100)->nullable();
            $table->string('ContactPhone', 20)->nullable();
            $table->integer('StorageCapacityUnits')->nullable();
            $table->foreign('UserID')->references('UserID')->on('users')->onDelete('cascade')->onUpdate('cascade');
        });

        Schema::create('BloodStock', function (Blueprint $table) {
            $table->id('BagID');
            $table->unsignedBigInteger('BankID');
            $table->unsignedBigInteger('DonorID')->nullable();
            $table->string('BloodGroup', 5);
            $table->string('ComponentType', 50)->nullable();
            $table->integer('VolumeML')->nullable();
            $table->date('CollectionDate')->nullable();
            $table->date('ExpirationDate')->nullable();
            $table->string('StockStatus', 30)->default('Available');
            $table->foreign('BankID')->references('BankID')->on('BloodBanks')->onUpdate('cascade');
            $table->foreign('DonorID')->references('DonorID')->on('Donors')->onUpdate('cascade');
        });

        Schema::create('BloodRequests', function (Blueprint $table) {
            $table->id('RequestID');
            $table->unsignedBigInteger('RecipientID');
            $table->string('BloodGroup', 5);
            $table->string('ComponentType', 50)->nullable();
            $table->integer('QuantityUnits');
            $table->string('UrgencyLevel', 30)->nullable();
            $table->string('RequestStatus', 30)->default('Pending');
            $table->dateTime('RequestedAt')->useCurrent();
            $table->date('RequiredByDate')->nullable();
            $table->string('Location', 255)->nullable();
            $table->foreign('RecipientID')->references('RecipientID')->on('Recipients')->onUpdate('cascade');
        });

        Schema::create('EmergencyMatches', function (Blueprint $table) {
            $table->id('MatchID');
            $table->unsignedBigInteger('RequestID');
            $table->unsignedBigInteger('MatchedDonorID')->nullable();
            $table->unsignedBigInteger('MatchedBagID')->nullable();
            $table->decimal('MatchDistanceKM', 8, 2)->nullable();
            $table->string('MatchStatus', 30)->default('Pending');
            $table->dateTime('MatchedAt')->useCurrent();
            $table->foreign('RequestID')->references('RequestID')->on('BloodRequests')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('MatchedDonorID')->references('DonorID')->on('Donors')->onUpdate('cascade');
            $table->foreign('MatchedBagID')->references('BagID')->on('BloodStock')->onUpdate('cascade');
        });

        Schema::create('EligibilityAndScreening', function (Blueprint $table) {
            $table->id('ScreeningID');
            $table->unsignedBigInteger('DonorID');
            $table->date('ScreeningDate')->nullable();
            $table->decimal('HemoglobinG_DL', 4, 2)->nullable();
            $table->integer('SystolicBP')->nullable();
            $table->integer('DiastolicBP')->nullable();
            $table->boolean('InfectiousDiseaseCleared')->nullable();
            $table->date('NextEligibleDate')->nullable();
            $table->foreign('DonorID')->references('DonorID')->on('Donors')->onDelete('cascade')->onUpdate('cascade');
        });

        Schema::create('Donations', function (Blueprint $table) {
            $table->id('DonationID');
            $table->unsignedBigInteger('DonorID');
            $table->unsignedBigInteger('BankID');
            $table->date('DonationDate')->nullable();
            $table->integer('VolumeCollectedML')->nullable();
            $table->text('Remarks')->nullable();
            $table->foreign('DonorID')->references('DonorID')->on('Donors')->onUpdate('cascade');
            $table->foreign('BankID')->references('BankID')->on('BloodBanks')->onUpdate('cascade');
        });

        Schema::create('DispatchAndTransits', function (Blueprint $table) {
            $table->id('DispatchID');
            $table->unsignedBigInteger('RequestID')->unique();
            $table->unsignedBigInteger('BagID');
            $table->string('CourierName', 100)->nullable();
            $table->string('TrackingNumber', 100)->unique()->nullable();
            $table->dateTime('DispatchTime')->nullable();
            $table->dateTime('ArrivalTime')->nullable();
            $table->string('TransitStatus', 30)->nullable();
            $table->foreign('RequestID')->references('RequestID')->on('BloodRequests')->onUpdate('cascade');
            $table->foreign('BagID')->references('BagID')->on('BloodStock')->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('DispatchAndTransits');
        Schema::dropIfExists('Donations');
        Schema::dropIfExists('EligibilityAndScreening');
        Schema::dropIfExists('EmergencyMatches');
        Schema::dropIfExists('BloodRequests');
        Schema::dropIfExists('BloodStock');
        Schema::dropIfExists('BloodBanks');
        Schema::dropIfExists('Recipients');
        Schema::dropIfExists('Donors');
    }
};
