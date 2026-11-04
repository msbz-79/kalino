<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * دریافت اطلاعات داشبورد کاربر واردشده
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // تعداد کل سفارش‌های کاربر، به‌جز سفارش‌های حذف نرم‌شده
        $ordersCount = Order::query()
            ->where('user_id', $user->id)
            ->count();

        // تعداد نظرات ثبت‌شده توسط کاربر
        $commentsCount = $user->comments()->count();

        // پنج سفارش اخیر کاربر
        $recentOrders = Order::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get([
                'id',
                'order_number',
                'status',
                'payment_status',
                'total_amount',
                'created_at',
            ]);

        return response()->json([
            'dashboard' => [
                'wallet_balance' => $user->wallet_balance,
                'orders_count' => $ordersCount,
                'comments_count' => $commentsCount,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }
}
