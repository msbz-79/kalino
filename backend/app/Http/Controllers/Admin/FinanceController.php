<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * آمار کلی درآمد فروش و تراکنش‌های کیف پول
     */
    public function overview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = $validated['from'] ?? now()->startOfMonth()->toDateString();
        $to = $validated['to'] ?? now()->toDateString();

        $orders = Order::query()
            ->where('payment_status', 'paid')
            ->whereBetween('paid_at', [
                $from . ' 00:00:00',
                $to . ' 23:59:59',
            ]);

        $walletTransactions = WalletTransaction::query()
            ->where('status', 'completed')
            ->whereBetween('paid_at', [
                $from . ' 00:00:00',
                $to . ' 23:59:59',
            ]);

        $deposit = (clone $walletTransactions)
            ->where('type', 'deposit');

        $withdrawal = (clone $walletTransactions)
            ->where('type', 'withdrawal');

        return response()->json([
            'period' => [
                'from' => $from,
                'to' => $to,
            ],

            'sales' => [
                'total_revenue' => (clone $orders)->sum('total_amount'),
                'paid_orders_count' => (clone $orders)->count(),
                'average_order_amount' => (clone $orders)->avg('total_amount') ?? 0,
            ],

            'wallet' => [
                'total_deposits' => (clone $deposit)->sum('amount'),
                'deposits_count' => (clone $deposit)->count(),

                'total_withdrawals' => (clone $withdrawal)->sum('amount'),
                'withdrawals_count' => (clone $withdrawal)->count(),
            ],
        ]);
    }

    /**
     * گزارش فروش در بازه زمانی
     */
    public function sales(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = $validated['from'] ?? now()->startOfMonth()->toDateString();
        $to = $validated['to'] ?? now()->toDateString();

        $sales = Order::query()
            ->where('payment_status', 'paid')
            ->whereBetween('paid_at', [
                $from . ' 00:00:00',
                $to . ' 23:59:59',
            ])
            ->selectRaw('
                DATE(paid_at) as date,
                COUNT(*) as orders_count,
                SUM(total_amount) as revenue
            ')
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'period' => [
                'from' => $from,
                'to' => $to,
            ],
            'sales' => $sales,
        ]);
    }

    /**
     * فهرست تراکنش‌های کیف پول
     */
    public function walletTransactions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:deposit,withdrawal'],
            'status' => ['nullable', 'in:pending,completed,failed'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $transactions = WalletTransaction::query()
            ->with('user:id,name,email')
            ->when(
                $validated['type'] ?? null,
                fn ($query, $type) => $query->where('type', $type)
            )
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->when(
                $validated['from'] ?? null,
                fn ($query, $from) => $query->whereDate('created_at', '>=', $from)
            )
            ->when(
                $validated['to'] ?? null,
                fn ($query, $to) => $query->whereDate('created_at', '<=', $to)
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return response()->json($transactions);
    }
}
