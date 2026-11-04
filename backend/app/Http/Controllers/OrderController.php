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

                $requiredQuantities[$productId] =
                    ($requiredQuantities[$productId] ?? 0) + $quantity;
            }

            // مرتب‌سازی شناسه‌ها برای کاهش احتمال بن‌بست دیتابیس
            ksort($requiredQuantities);

            $products = [];

            // قفل محصولات و بررسی موجودی
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

            // محاسبه قیمت‌ها بر اساس اطلاعات دیتابیس
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

            $discountAmount = 0;
            $shippingCost = 0;

            $totalAmount = max(
                0,
                $subtotal - $discountAmount + $shippingCost
            );

            // ایجاد سفارش
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
            ->where('user_id', $request->user()->id)

            ->when(
                $validated['search'] ?? null,
                fn ($query, $search) => $query->where(
                    'order_number',
                    'like',
                    "%{$search}%"
                )
            )

            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )

            ->when(
                $validated['payment_status'] ?? null,
                fn ($query, $paymentStatus) => $query->where(
                    'payment_status',
                    $paymentStatus
                )
            )

            ->when(
                $validated['date_from'] ?? null,
                fn ($query, $date) => $query->whereDate(
                    'created_at',
                    '>=',
                    $date
                )
            )

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
     * دریافت جزئیات سفارش متعلق به کاربر واردشده
     */
    public function show(
        Request $request,
        string $orderNumber
    ): JsonResponse {
        $order = Order::query()
            ->where('user_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->with('items')
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'سفارش موردنظر پیدا نشد.',
            ], 404);
        }

        return response()->json([
            'order' => $this->formatOrderDetails($order),
        ]);
    }

    /**
     * دریافت فهرست تمام سفارش‌ها برای پنل مدیریت
     */
    public function adminIndex(Request $request): JsonResponse
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

            ->when(
                $validated['search'] ?? null,
                function ($query, $search) {
                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('order_number', 'like', "%{$search}%")
                            ->orWhere('shipping_name', 'like', "%{$search}%")
                            ->orWhere('shipping_mobile', 'like', "%{$search}%");
                    });
                }
            )

            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )

            ->when(
                $validated['payment_status'] ?? null,
                fn ($query, $paymentStatus) => $query->where(
                    'payment_status',
                    $paymentStatus
                )
            )

            ->when(
                $validated['date_from'] ?? null,
                fn ($query, $date) => $query->whereDate(
                    'created_at',
                    '>=',
                    $date
                )
            )

            ->when(
                $validated['date_to'] ?? null,
                fn ($query, $date) => $query->whereDate(
                    'created_at',
                    '<=',
                    $date
                )
            )

            ->withCount('items')
            ->latest()
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return response()->json([
            'orders' => $orders,
        ]);
    }

    /**
     * دریافت جزئیات یک سفارش برای مدیر
     */
    public function adminShow(string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->with('items')
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'سفارش موردنظر پیدا نشد.',
            ], 404);
        }

        return response()->json([
            'order' => $this->formatOrderDetails($order),
        ]);
    }

    /**
     * تغییر وضعیت سفارش توسط مدیر
     */
    public function adminUpdateStatus(
        Request $request,
        string $orderNumber
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,processing,shipped,delivered,cancelled,returned',
            ],
        ]);

        $result = DB::transaction(function () use (
            $validated,
            $orderNumber
        ) {
            $order = Order::query()
                ->where('order_number', $orderNumber)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                return [
                    'error' => true,
                    'status_code' => 404,
                    'message' => 'سفارش موردنظر پیدا نشد.',
                ];
            }

            $currentStatus = $order->status;
            $newStatus = $validated['status'];

            if ($currentStatus === $newStatus) {
                return [
                    'error' => true,
                    'status_code' => 422,
                    'message' => 'سفارش در حال حاضر همین وضعیت را دارد.',
                ];
            }

            // وضعیت‌های مجاز بعدی
            $allowedTransitions = [
                'pending' => [
                    'processing',
                    'cancelled',
                ],
                'processing' => [
                    'shipped',
                    'cancelled',
                ],
                'shipped' => [
                    'delivered',
                    'returned',
                ],
                'delivered' => [
                    'returned',
                ],
                'cancelled' => [],
                'returned' => [],
            ];

            if (!in_array(
                $newStatus,
                $allowedTransitions[$currentStatus] ?? [],
                true
            )) {
                return [
                    'error' => true,
                    'status_code' => 422,
                    'message' => 'تغییر وضعیت از حالت فعلی به وضعیت انتخاب‌شده مجاز نیست.',
                ];
            }

            // لغو سفارش پرداخت‌شده بدون بازپرداخت مجاز نیست.
            if (
                $newStatus === 'cancelled' &&
                $order->payment_status === 'paid'
            ) {
                return [
                    'error' => true,
                    'status_code' => 422,
                    'message' => 'این سفارش پرداخت شده است. ابتدا باید فرایند بازپرداخت وجه انجام شود.',
                ];
            }

            // بازگرداندن موجودی فقط هنگام ورود به وضعیت لغو یا مرجوعی
            if (in_array($newStatus, ['cancelled', 'returned'], true)) {
                $items = $order->items()->get();

                foreach ($items as $item) {
                    if (!$item->product_id) {
                        continue;
                    }

                    DB::table('products')
                        ->where('id', $item->product_id)
                        ->increment('stock', $item->quantity);
                }
            }

            $order->update([
                'status' => $newStatus,
            ]);

            return [
                'error' => false,
                'order' => $order->fresh(),
            ];
        });

        if ($result['error']) {
            return response()->json([
                'message' => $result['message'],
            ], $result['status_code']);
        }

        $messages = [
            'pending' => 'وضعیت سفارش به در انتظار بررسی تغییر کرد.',
            'processing' => 'سفارش با موفقیت تأیید شد.',
            'shipped' => 'وضعیت سفارش به ارسال شده تغییر کرد.',
            'delivered' => 'سفارش با موفقیت تحویل داده شد.',
            'cancelled' => 'سفارش لغو شد و موجودی محصولات بازگردانده شد.',
            'returned' => 'سفارش مرجوع شد و موجودی محصولات بازگردانده شد.',
        ];

        return response()->json([
            'message' => $messages[$validated['status']],
            'order' => $result['order'],
        ]);
    }

    /**
     * یکسان‌سازی ساختار خروجی جزئیات سفارش
     */
    private function formatOrderDetails(Order $order): array
    {
        return [
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

            // اطلاعات گیرنده و آدرس
            'shipping_name' => $order->shipping_name,
            'shipping_mobile' => $order->shipping_mobile,
            'shipping_province' => $order->shipping_province,
            'shipping_city' => $order->shipping_city,
            'shipping_address' => $order->shipping_address,
            'shipping_postal_code' => $order->shipping_postal_code,
            'customer_note' => $order->customer_note,

            // اقلام سفارش
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
        ];
    }
}
