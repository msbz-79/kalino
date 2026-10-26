<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * ثبت سفارش جدید برای کاربر واردشده
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address_id' => ['required', 'integer'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],
            'items.*.selected_color' => [
                'nullable',
                'string',
                'max:100',
            ],
            'customer_note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $user = $request->user();

        return DB::transaction(function () use (
            $validated,
            $user
        ): JsonResponse {
            // فقط آدرس متعلق به کاربر واردشده مجاز است.
            $address = Address::query()
                ->where('user_id', $user->id)
                ->find($validated['address_id']);

            if (!$address) {
                throw ValidationException::withMessages([
                    'address_id' => [
                        'آدرس انتخاب‌شده معتبر نیست.',
                    ],
                ]);
            }

            $subtotal = 0;
            $orderItems = [];
            $requiredQuantities = [];

            // محاسبه مجموع تعداد هر محصول
            foreach ($validated['items'] as $item) {
                $productId = (int) $item['product_id'];
                $quantity = (int) $item['quantity'];

                if (!isset($requiredQuantities[$productId])) {
                    $requiredQuantities[$productId] = 0;
                }

                $requiredQuantities[$productId] += $quantity;
            }

            // قفل محصولات برای جلوگیری از فروش بیش از موجودی
            ksort($requiredQuantities);

            $products = [];

            foreach ($requiredQuantities as $productId => $quantity) {
                $product = Product::query()
                    ->where('is_active', true)
                    ->lockForUpdate()
                    ->find($productId);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'یکی از محصولات انتخاب‌شده موجود یا فعال نیست.',
                        ],
                    ]);
                }

                if ($quantity > $product->stock) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "موجودی محصول «{$product->name}» کافی نیست.",
                        ],
                    ]);
                }

                $products[$productId] = $product;
            }

            // محاسبه قیمت‌ها با استفاده از اطلاعات دیتابیس
            foreach ($validated['items'] as $item) {
                $productId = (int) $item['product_id'];
                $product = $products[$productId];
                $quantity = (int) $item['quantity'];

                $unitPrice = (float) $product->price;
                $lineTotal = round($unitPrice * $quantity, 2);

                $subtotal += $lineTotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_image' => $product->image,
                    'selected_color' => $item['selected_color'] ?? null,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                ];
            }

            // فعلاً تخفیف و هزینه ارسال صفر هستند.
            $discountAmount = 0;
            $shippingCost = 0;

            $totalAmount = max(
                0,
                $subtotal - $discountAmount + $shippingCost
            );

            // ایجاد سفارش با ذخیره اطلاعات گیرنده
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'order_number' => 'KAL-' . Str::upper(Str::random(12)),
                'status' => 'pending',
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'shipping_cost' => $shippingCost,
                'total_amount' => $totalAmount,
                'shipping_name' => $address->recipient_name,
                'shipping_mobile' => $address->mobile,
                'shipping_province' => $address->province,
                'shipping_city' => $address->city,
                'shipping_address' => $address->address,
                'shipping_postal_code' => $address->postal_code,
                'customer_note' => $validated['customer_note'] ?? null,
            ]);

            // ذخیره اقلام سفارش
            foreach ($orderItems as $itemData) {
                $order->items()->create($itemData);
            }

            // کاهش موجودی محصولات
            foreach ($requiredQuantities as $productId => $quantity) {
                $products[$productId]->decrement('stock', $quantity);
            }

            return response()->json([
                'message' => 'سفارش با موفقیت ثبت شد.',
                'order' => $order->load('items'),
            ], 201);
        });
    }

    /**
     * دریافت فهرست سفارش‌های کاربر واردشده
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:50'],
            'payment_status' => ['nullable', 'string', 'max:50'],
            'date_from' => ['nullable', 'date'],
            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $orders = Order::query()
            // فقط سفارش‌های کاربر واردشده
            ->where('user_id', $request->user()->id)

            // جست‌وجو بر اساس شماره سفارش
            ->when(
                $validated['search'] ?? null,
                fn ($query, $search) => $query->where(
                    'order_number',
                    'like',
                    "%{$search}%"
                )
            )

            // فیلتر وضعیت سفارش
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )

            // فیلتر وضعیت پرداخت
            ->when(
                $validated['payment_status'] ?? null,
                fn ($query, $paymentStatus) => $query->where(
                    'payment_status',
                    $paymentStatus
                )
            )

            // فیلتر تاریخ شروع
            ->when(
                $validated['date_from'] ?? null,
                fn ($query, $date) => $query->whereDate(
                    'created_at',
                    '>=',
                    $date
                )
            )

            // فیلتر تاریخ پایان
            ->when(
                $validated['date_to'] ?? null,
                fn ($query, $date) => $query->whereDate(
                    'created_at',
                    '<=',
                    $date
                )
            )

            ->latest()
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return response()->json([
            'orders' => $orders,
        ]);
    }

    /**
     * دریافت جزئیات کامل یک سفارش متعلق به کاربر واردشده
     */
    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->where('user_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'سفارش موردنظر پیدا نشد.',
            ], 404);
        }

        // دریافت اقلام ذخیره‌شده سفارش
        $order->load('items');

        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,

                // وضعیت و تاریخ‌ها
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'created_at' => $order->created_at,
                'paid_at' => $order->paid_at,

                // اطلاعات پرداخت
                'payment_provider' => $order->payment_provider,
                'transaction_id' => $order->transaction_id,

                // مبالغ
                'subtotal' => $order->subtotal,
                'discount_amount' => $order->discount_amount,
                'shipping_cost' => $order->shipping_cost,
                'total_amount' => $order->total_amount,

                // اطلاعات گیرنده و آدرس که هنگام ثبت سفارش ذخیره شده‌اند
                'shipping_name' => $order->shipping_name,
                'shipping_mobile' => $order->shipping_mobile,
                'shipping_province' => $order->shipping_province,
                'shipping_city' => $order->shipping_city,
                'shipping_address' => $order->shipping_address,
                'shipping_postal_code' => $order->shipping_postal_code,
                'customer_note' => $order->customer_note,

                // اطلاعات محصولات ذخیره‌شده در زمان ثبت سفارش
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name,
                        'product_image' => $item->product_image,
                        'selected_color' => $item->selected_color,
                        'price' => $item->unit_price,
                        'quantity' => $item->quantity,
                        'total' => $item->line_total,
                    ];
                })->values(),
            ],
        ]);
    }
}
