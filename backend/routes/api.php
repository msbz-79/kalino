<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SpecialOfferSettingController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BestSellerController;

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\WalletPaymentController;

use App\Http\Controllers\CommentController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Admin\FinanceController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;

// ========================================
// احراز هویت
// ========================================

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'user' => $request->user(),
    ]);
});

// ========================================
// تنظیمات عمومی شگفت‌انگیزها
// ========================================

Route::get('/special-offer-settings', [
    SpecialOfferSettingController::class,
    'show',
]);

// ========================================
// محصولات
// ========================================

// دریافت محصولات شگفت‌انگیز
Route::get('/products/special-offers', [
    ProductController::class,
    'specialOffers',
]);

// دریافت پرفروش‌ترین محصولات
Route::get('/products/best-sellers', [
    BestSellerController::class,
    'index',
]);

// دریافت برندها و رنگ‌های موجود برای فیلتر محصولات
Route::get('/products/filter-options', [
    ProductController::class,
    'filterOptions',
]);

// مسیرهای اصلی محصولات
Route::apiResource('/products', ProductController::class);

// ========================================
// نظرات عمومی محصولات
// ========================================

Route::get('/comments', [
    CommentController::class,
    'index',
]);

// ========================================
// پرداخت زرین‌پال
// ========================================

// callback پرداخت سفارش
Route::get('/payments/zarinpal/callback', [
    PaymentController::class,
    'callback',
])->name('zarinpal.callback');

// callback پرداخت شارژ کیف پول
Route::get('/wallet/zarinpal/callback', [
    WalletPaymentController::class,
    'callback',
])->name('wallet.zarinpal.callback');

// ========================================
// مسیرهای مخصوص کاربران واردشده
// ========================================

Route::middleware('auth:sanctum')->group(function () {

    // اطلاعات حساب کاربری
    Route::get('/account', [
        AccountController::class,
        'show',
    ]);

    // ویرایش اطلاعات حساب کاربری
    Route::patch('/account', [
        AccountController::class,
        'update',
    ]);

    Route::patch('/account/password', [
        AccountController::class,
        'updatePassword',
    ]);

    // اطلاعات داشبورد کاربر
    Route::get('/dashboard', [
        DashboardController::class,
        'index',
    ]);

    // شروع شارژ کیف پول
    Route::post('/wallet/deposit', [
        WalletPaymentController::class,
        'deposit',
    ])->name('wallet.deposit');

    // آدرس‌های کاربر
    Route::apiResource('addresses', AddressController::class);

    // تغییر آدرس پیش‌فرض
    Route::patch('/addresses/{address}/default', [
        AddressController::class,
        'setDefault',
    ]);

    // ثبت سفارش
    Route::post('/orders', [
        OrderController::class,
        'store',
    ]);

    // فهرست سفارش‌های کاربر
    Route::get('/orders', [
        OrderController::class,
        'index',
    ]);

    // جزئیات سفارش کاربر
    Route::get('/orders/{orderNumber}', [
        OrderController::class,
        'show',
    ]);

    // پرداخت سفارش با زرین‌پال
    Route::post('/orders/{order}/payment', [
        PaymentController::class,
        'pay',
    ])->name('orders.payment');

    // نظرات کاربر
    Route::get('/my-comments', [
        CommentController::class,
        'myComments',
    ]);

    // ثبت نظر
    Route::post('/comments', [
        CommentController::class,
        'store',
    ]);

    // ویرایش نظر
    Route::patch('/comments/{comment}', [
        CommentController::class,
        'update',
    ]);

    // حذف نظر
    Route::delete('/comments/{comment}', [
        CommentController::class,
        'destroy',
    ]);
});

// ========================================
// مسیرهای مخصوص مدیر
// ========================================

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // ========================================
    // داشبورد مدیریت
    // ========================================

    Route::get('/admin/dashboard', [
        AdminDashboardController::class,
        'index',
    ]);

    // ========================================
    // مدیریت کاربران
    // ========================================

    Route::apiResource('/users', UserController::class);

    // ========================================
    // مدیریت سفارش‌ها
    // ========================================

    // دریافت فهرست تمام سفارش‌های کاربران
    Route::get('/admin/orders', [
        OrderController::class,
        'adminIndex',
    ]);

    // دریافت جزئیات یک سفارش
    Route::get('/admin/orders/{orderNumber}', [
        OrderController::class,
        'adminShow',
    ]);

    // تغییر وضعیت سفارش
    Route::patch('/admin/orders/{orderNumber}/status', [
        OrderController::class,
        'adminUpdateStatus',
    ]);

    // ========================================
    // تنظیمات پیشنهاد ویژه
    // ========================================

    Route::get('/admin/special-offer-settings', [
        SpecialOfferSettingController::class,
        'show',
    ]);

    Route::put('/admin/special-offer-settings', [
        SpecialOfferSettingController::class,
        'update',
    ]);

    // ========================================
    // مدیریت نظرات
    // ========================================

    // دریافت، جست‌وجو و فیلتر نظرات
    Route::get('/admin/comments', [
        AdminCommentController::class,
        'index',
    ]);

    // تأیید یا رد نظر
    Route::patch('/admin/comments/{comment}/status', [
        AdminCommentController::class,
        'updateStatus',
    ]);

    // حذف نظر
    Route::delete('/admin/comments/{comment}', [
        AdminCommentController::class,
        'destroy',
    ]);

    // ========================================
    // مدیریت مالی
    // ========================================

    Route::prefix('admin/finance')
        ->controller(FinanceController::class)
        ->group(function () {

            // آمار کلی درآمد و کیف پول
            Route::get('/overview', 'overview');

            // گزارش فروش در بازه زمانی
            Route::get('/sales', 'sales');

            // فهرست تراکنش‌های کیف پول
            Route::get('/wallet-transactions', 'walletTransactions');
        });
});
