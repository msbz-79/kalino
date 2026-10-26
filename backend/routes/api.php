<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SpecialOfferSettingController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;

/*
|--------------------------------------------------------------------------
| اطلاعات کاربر واردشده
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'user' => $request->user(),
    ]);
});

/*
|--------------------------------------------------------------------------
| مسیرهای عمومی محصولات
|--------------------------------------------------------------------------
*/

Route::get('/products', [ProductController::class, 'index']);

Route::get('/products/special-offers', [
    ProductController::class,
    'specialOffers',
]);

Route::get('/products/{product}', [
    ProductController::class,
    'show',
]);

/*
|--------------------------------------------------------------------------
| تنظیمات عمومی پیشنهادهای ویژه
|--------------------------------------------------------------------------
*/

Route::get('/special-offer-settings', [
    SpecialOfferSettingController::class,
    'show',
]);

/*
|--------------------------------------------------------------------------
| مدیریت محصولات فقط برای ادمین
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/products', [
        ProductController::class,
        'store',
    ]);

    Route::put('/products/{product}', [
        ProductController::class,
        'update',
    ]);

    Route::patch('/products/{product}', [
        ProductController::class,
        'update',
    ]);

    Route::delete('/products/{product}', [
        ProductController::class,
        'destroy',
    ]);
});

/*
|--------------------------------------------------------------------------
| مدیریت کاربران فقط برای ادمین
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/users', [
        UserController::class,
        'index',
    ]);

    Route::post('/users', [
        UserController::class,
        'store',
    ]);

    Route::put('/users/{user}', [
        UserController::class,
        'update',
    ]);

    Route::delete('/users/{user}', [
        UserController::class,
        'destroy',
    ]);
});

/*
|--------------------------------------------------------------------------
| ویرایش تنظیمات پیشنهادهای ویژه فقط برای ادمین
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::put('/special-offer-settings', [
        SpecialOfferSettingController::class,
        'update',
    ]);
});

/*
|--------------------------------------------------------------------------
| آدرس‌ها و سفارش‌های کاربر واردشده
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // مدیریت آدرس‌ها
    Route::apiResource('addresses', AddressController::class);

    Route::patch('/addresses/{address}/default', [
        AddressController::class,
        'setDefault',
    ]);

    // ثبت سفارش جدید
    Route::post('/orders', [
        OrderController::class,
        'store',
    ]);

    // دریافت فهرست سفارش‌های کاربر واردشده
    Route::get('/orders', [
        OrderController::class,
        'index',
    ]);

    // دریافت اطلاعات یک سفارش
    Route::get('/orders/{orderNumber}', [
        OrderController::class,
        'show',
    ]);

    // شروع پرداخت سفارش
    Route::post('/orders/{order}/payment', [
        PaymentController::class,
        'pay',
    ])->name('orders.payment');

    // دریافت نظرات کاربر واردشده
    Route::get('/my-comments', [
        CommentController::class,
        'myComments',
    ]);
});

/*
|--------------------------------------------------------------------------
| بازگشت از درگاه پرداخت زرین‌پال
|--------------------------------------------------------------------------
*/

Route::get('/payments/zarinpal/callback', [
    PaymentController::class,
    'callback',
])->name('zarinpal.callback');

/*
|--------------------------------------------------------------------------
| نظرات محصولات
|--------------------------------------------------------------------------
*/

// نمایش نظرات تأییدشده یک محصول
Route::get('/comments', [
    CommentController::class,
    'index',
]);

// ثبت، ویرایش و حذف نظر توسط کاربر واردشده
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/comments', [
        CommentController::class,
        'store',
    ]);

    Route::patch('/comments/{comment}', [
        CommentController::class,
        'update',
    ]);

    Route::delete('/comments/{comment}', [
        CommentController::class,
        'destroy',
    ]);
});

/*
|--------------------------------------------------------------------------
| مدیریت نظرات فقط برای ادمین
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        // مشاهده نظرات و فیلتر بر اساس وضعیت
        Route::get('/comments', [
            AdminCommentController::class,
            'index',
        ]);

        // تأیید یا رد نظر
        Route::patch('/comments/{comment}/status', [
            AdminCommentController::class,
            'updateStatus',
        ]);
    });
