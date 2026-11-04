<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('type', 20); // deposit یا withdrawal
            $table->decimal('amount', 12, 2);

            $table->string('status', 20)->default('pending');
            // pending، completed یا failed

            $table->string('payment_provider', 30)->nullable();
            $table->string('authority')->nullable()->unique();
            $table->string('transaction_id')->nullable();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
