<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BestSellerController extends Controller
{
    public function index(): JsonResponse
    {
        // محاسبه مجموع تعداد فروش هر محصول در سفارش‌های پرداخت‌شده
        $salesQuery = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->select(
                'order_items.product_id',
                DB::raw('SUM(order_items.quantity) as total_sold')
            )
            ->where('orders.payment_status', 'paid')
            ->whereNotNull('orders.paid_at')
            ->whereNull('orders.deleted_at')
            ->whereNull('order_items.deleted_at')
            ->groupBy('order_items.product_id');

        // دریافت ۱۰ محصول با بیشترین تعداد فروش
        $products = Product::query()
            ->joinSub($salesQuery, 'sales', function ($join) {
                $join->on('products.id', '=', 'sales.product_id');
            })
            ->where('products.is_active', true)
            ->select('products.*', 'sales.total_sold')
            ->orderByDesc('sales.total_sold')
            ->limit(10)
            ->get();

        // تبدیل مسیر تصاویر به URL قابل استفاده در فرانت‌اند
        $products->transform(function ($product) {
            $product->image = $product->image
                ? asset('storage/' . $product->image)
                : null;

            return $product;
        });

        return response()->json([
            'message' => 'پرفروش‌ترین محصولات با موفقیت دریافت شدند.',
            'data' => $products,
        ]);
    }
}
