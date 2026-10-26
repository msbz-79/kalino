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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // ارتباط با کاربر ثبت‌کننده سفارش
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // آدرس ذخیره‌شده‌ای که کاربر هنگام خرید انتخاب کرده است
            // در صورت حذف واقعی آدرس، سفارش همچنان باقی می‌ماند
            $table->foreignId('address_id')
                ->nullable()
                ->constrained('addresses')
                ->nullOnDelete();

            // شماره یکتای سفارش
            $table->string('order_number')->unique();

            // وضعیت سفارش
            $table->string('status')->default('pending');

            // وضعیت پرداخت
            $table->string('payment_status')->default('pending');

            // اطلاعات پرداخت آنلاین
            $table->string('payment_provider')->nullable();
            $table->string('transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();

            // مبالغ سفارش
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('shipping_cost', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);

            // نسخه ثابت اطلاعات تحویل در زمان ثبت سفارش
            $table->string('shipping_name');
            $table->string('shipping_mobile', 20);
            $table->string('shipping_province');
            $table->string('shipping_city');
            $table->text('shipping_address');
            $table->string('shipping_postal_code', 20)->nullable();

            // توضیحات اختیاری مشتری
            $table->text('customer_note')->nullable();

            $table->timestamps();

            // حذف نرم
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
