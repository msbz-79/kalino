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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();

            // ارتباط با کاربری که این آدرس را ذخیره کرده است
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // اطلاعات تحویل‌گیرنده
            $table->string('recipient_name');
            $table->string('mobile', 20);

            // اطلاعات نشانی
            $table->string('province');
            $table->string('city');
            $table->text('address');
            $table->string('postal_code', 20)->nullable();

            // آیا این آدرس، آدرس پیش‌فرض کاربر است؟
            $table->boolean('is_default')->default(false);

            // زمان ایجاد و آخرین ویرایش
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
        Schema::dropIfExists('addresses');
    }
};
