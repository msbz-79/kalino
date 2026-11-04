<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $dashboard = [
            'users_count' => User::count(),

            'products_count' => Product::count(),

            'orders_count' => Order::count(),

            'comments_count' => Comment::count(),

            'sales_chart' => $this->getSalesChart(),

            'recent_products' => Product::query()
                ->latest()
                ->take(5)
                ->get([
                    'id',
                    'name',
                    'price',
                    'stock',
                    'image',
                    'created_at',
                ]),

            'recent_users' => User::query()
                ->latest()
                ->take(5)
                ->get([
                    'id',
                    'name',
                    'email',
                    'created_at',
                ]),
        ];

        return response()->json([
            'dashboard' => $dashboard,
        ]);
    }

    private function getSalesChart(): array
    {
        $startDate = now()
            ->startOfMonth()
            ->subMonths(5);

        $sales = Order::query()
            ->where('payment_status', 'paid')
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', $startDate)
            ->selectRaw('YEAR(paid_at) as year, MONTH(paid_at) as month, SUM(total_amount) as total_sales')
            ->groupByRaw('YEAR(paid_at), MONTH(paid_at)')
            ->get()
            ->keyBy(function ($item) {
                return sprintf('%04d-%02d', $item->year, $item->month);
            });

        $chart = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()
                ->startOfMonth()
                ->subMonths($i);

            $key = $date->format('Y-m');

            $chart[] = [
                'label' => $date->toDateString(),
                'amount' => (float) ($sales->get($key)?->total_sales ?? 0),
            ];
        }

        return $chart;
    }
}
