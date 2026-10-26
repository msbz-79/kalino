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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // سفارش مربوط به این قلم
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            // محصول اصلی؛ ممکن است محصول بعداً حذف شود
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            // نسخه ثابت اطلاعات محصول در زمان خرید
            $table->string('product_name');
            $table->string('product_image')->nullable();

            // قیمت واحد و تعداد خریداری‌شده
            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('quantity');

            // قیمت کل این قلم: قیمت واحد × تعداد
            $table->decimal('line_total', 12, 2);

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
        Schema::dropIfExists('order_items');
    }
};
