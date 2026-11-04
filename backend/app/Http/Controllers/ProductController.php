<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\SpecialOfferSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'min_price' => ['sometimes', 'integer', 'min:0'],
            'max_price' => [
                'sometimes',
                'integer',
                'min:0',
                function ($attribute, $value, $fail) use ($request) {
                    $minPrice = $request->input('min_price');

                    if (
                        $minPrice !== null &&
                        $value < $minPrice
                    ) {
                        $fail('حداکثر قیمت باید بزرگ‌تر یا مساوی حداقل قیمت باشد.');
                    }
                },
            ],
            'brand' => ['sometimes', 'string', 'max:255'],
            'color' => ['sometimes', 'string', 'max:100'],
            'sort' => [
                'sometimes',
                'in:newest,price_asc,price_desc,bestselling',
            ],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'status' => ['sometimes', 'in:all,active,inactive'],
            'category' => ['sometimes', 'string', 'exists:categories,slug'],
        ]);

        $user = $request->user();
        $isAdmin = $user && $user->role === 'admin';
        $status = $validated['status'] ?? 'active';

        if ($status !== 'active' && !$isAdmin) {
            abort(403, 'شما اجازه مشاهده این محصولات را ندارید.');
        }

        $query = Product::query();

        // فیلتر وضعیت محصولات
        if ($status === 'active') {
            $query->where('products.is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('products.is_active', false);
        }

        // فیلتر دسته‌بندی محصولات
        if (!empty($validated['category'])) {
            $query->whereHas('category', function ($q) use ($validated) {
                $q->where('slug', $validated['category'])
                    ->where('is_active', true);
            });
        }

        // جستجو در نام و توضیحات محصول
        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                    ->orWhere('products.description', 'like', "%{$search}%");
            });
        }

        // فیلتر برند
        if (!empty($validated['brand'])) {
            $query->where('products.brand', $validated['brand']);
        }

        // فیلتر رنگ
        if (!empty($validated['color'])) {
            $query->whereJsonContains(
                'products.colors',
                ['name' => $validated['color']]
            );
        }

        // فیلتر حداقل قیمت
        if (isset($validated['min_price'])) {
            $query->where(
                'products.price',
                '>=',
                $validated['min_price']
            );
        }

        // فیلتر حداکثر قیمت
        if (isset($validated['max_price'])) {
            $query->where(
                'products.price',
                '<=',
                $validated['max_price']
            );
        }

        // مرتب‌سازی محصولات
        $sort = $validated['sort'] ?? 'newest';

        if ($sort === 'price_asc') {
            $query->orderBy('products.price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('products.price', 'desc');
        } elseif ($sort === 'bestselling') {

            // محاسبه مجموع فروش محصولات در سفارش‌های پرداخت‌شده
            $salesQuery = DB::table('order_items')
                ->join(
                    'orders',
                    'orders.id',
                    '=',
                    'order_items.order_id'
                )
                ->select(
                    'order_items.product_id',
                    DB::raw('SUM(order_items.quantity) as total_sold')
                )
                ->where('orders.payment_status', 'paid')
                ->whereNotNull('orders.paid_at')
                ->whereNull('orders.deleted_at')
                ->whereNull('order_items.deleted_at')
                ->groupBy('order_items.product_id');

            // اتصال اطلاعات فروش به محصولات
            $query->leftJoinSub(
                $salesQuery,
                'sales',
                function ($join) {
                    $join->on(
                        'products.id',
                        '=',
                        'sales.product_id'
                    );
                }
            );

            $query->select('products.*')
                ->selectRaw('COALESCE(sales.total_sold, 0) as total_sold')
                ->orderByDesc('total_sold');
        } else {
            $query->latest('products.created_at');
        }

        // صفحه‌بندی محصولات
        $products = $query
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        // تبدیل مسیر تصاویر به URL قابل دسترسی
        $products->getCollection()->transform(function ($product) {
            $product->image = $product->image
                ? asset('storage/' . $product->image)
                : null;

            return $product;
        });

        return response()->json([
            'data' => $products,
        ]);
    }

    /**
     * دریافت گزینه‌های فیلتر محصولات
     * شامل برندها، رنگ‌ها و محدوده قیمت محصولات فعال
     */
    public function filterOptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => [
                'sometimes',
                'string',
                'exists:categories,slug',
            ],
        ]);

        $query = Product::query()
            ->where('products.is_active', true);

        // محدودکردن گزینه‌های فیلتر به دسته‌بندی انتخاب‌شده
        if (!empty($validated['category'])) {
            $query->whereHas('category', function ($q) use ($validated) {
                $q->where('slug', $validated['category'])
                    ->where('is_active', true);
            });
        }

        // دریافت فقط ستون‌های موردنیاز
        $products = $query->get([
            'brand',
            'colors',
            'price',
        ]);

        // استخراج برندهای یکتا
        $brands = $products
            ->pluck('brand')
            ->filter(fn($brand) => is_string($brand) && trim($brand) !== '')
            ->map(fn($brand) => trim($brand))
            ->unique()
            ->sort()
            ->values();

        // استخراج رنگ‌های محصولات
        $colors = $products
            ->flatMap(function ($product) {
                return is_array($product->colors)
                    ? $product->colors
                    : [];
            })
            ->filter(function ($color) {
                return is_array($color)
                    && !empty($color['name'])
                    && !empty($color['hex']);
            })
            ->map(function ($color) {
                return [
                    'name' => trim($color['name']),
                    'hex' => strtoupper($color['hex']),
                ];
            })
            ->unique(fn($color) => mb_strtolower($color['name']))
            ->sortBy('name')
            ->values();

        // محاسبه کمترین و بیشترین قیمت محصولات
        $minPrice = $products->min('price') ?? 0;
        $maxPrice = $products->max('price') ?? 0;

        return response()->json([
            'data' => [
                'brands' => $brands,
                'colors' => $colors,
                'min_price' => (int) $minPrice,
                'max_price' => (int) $maxPrice,
            ],
        ]);
    }

    public function specialOffers(): JsonResponse
    {
        $now = now();
        $setting = SpecialOfferSetting::query()->first();

        if (
            !$setting ||
            !$setting->is_active ||
            !$setting->start_at ||
            !$setting->end_at ||
            $now->lt($setting->start_at) ||
            $now->gt($setting->end_at)
        ) {
            return response()->json([
                'message' => 'در حال حاضر شگفت‌انگیزی فعالی وجود ندارد.',
                'data' => [],
            ]);
        }

        $products = Product::query()
            ->where('is_active', true)
            ->where('is_special_offer', true)
            ->latest()
            ->get();

        $products->transform(function ($product) {
            $product->image = $product->image
                ? asset('storage/' . $product->image)
                : null;

            return $product;
        });

        return response()->json([
            'message' => 'محصولات شگفت‌انگیز با موفقیت دریافت شدند.',
            'data' => $products,
        ]);
    }

    /**
     * تبدیل رشته JSON رنگ‌ها به آرایه قبل از اعتبارسنجی.
     */
    private function prepareColors(Request $request): void
    {
        if (!$request->has('colors')) {
            return;
        }

        $colors = $request->input('colors');

        if (!is_string($colors)) {
            return;
        }

        $decodedColors = json_decode($colors, true);

        if (
            json_last_error() === JSON_ERROR_NONE &&
            is_array($decodedColors)
        ) {
            $request->merge([
                'colors' => $decodedColors,
            ]);
        }
    }

    /**
     * اعتبارسنجی رنگ‌های محصول.
     */
    private function validateColors(Request $request): array
    {
        return $request->validate([
            'colors' => ['sometimes', 'array', 'max:30'],
            'colors.*.name' => ['required', 'string', 'max:100'],
            'colors.*.hex' => [
                'required',
                'string',
                'regex:/^#[0-9A-Fa-f]{6}$/',
            ],
        ]);
    }

    /**
     * اعتبارسنجی اطلاعات تخفیف محصول.
     */
    private function validateDiscount(Request $request, int $price): array
    {
        $validated = $request->validate([
            'discount_percentage' => [
                'sometimes',
                'nullable',
                'integer',
                'between:1,100',
            ],
            'discount_price' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],
        ]);

        $percentage = isset($validated['discount_percentage'])
            ? (int) $validated['discount_percentage']
            : null;

        $discountPrice = isset($validated['discount_price'])
            ? (int) $validated['discount_price']
            : null;

        if (($percentage === null) !== ($discountPrice === null)) {
            throw ValidationException::withMessages([
                'discount' => 'برای ثبت تخفیف، درصد و قیمت تخفیف‌خورده باید هر دو مشخص باشند.',
            ]);
        }

        if ($percentage === null && $discountPrice === null) {
            return [
                'discount_percentage' => null,
                'discount_price' => null,
            ];
        }

        if ($discountPrice >= $price) {
            throw ValidationException::withMessages([
                'discount_price' => 'قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد.',
            ]);
        }

        $expectedPrice = (int) round(
            $price * (100 - $percentage) / 100
        );

        if ($discountPrice !== $expectedPrice) {
            throw ValidationException::withMessages([
                'discount_price' => "قیمت تخفیف‌خورده با درصد تخفیف مطابقت ندارد. قیمت صحیح: {$expectedPrice}",
            ]);
        }

        return [
            'discount_percentage' => $percentage,
            'discount_price' => $discountPrice,
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $this->prepareColors($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'is_special_offer' => ['sometimes', 'boolean'],
        ]);

        $validated = array_merge(
            $validated,
            $this->validateColors($request)
        );

        $validated = array_merge(
            $validated,
            $this->validateDiscount(
                $request,
                (int) $validated['price']
            )
        );

        $imagePath = null;

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = now()->format('Y-m-d_H-i-s')
                . '.'
                . $image->extension();

            $imagePath = $image->storeAs(
                'products',
                $imageName,
                'public'
            );
        }

        $validated['image'] = $imagePath;

        $product = Product::create($validated);

        $product->image = $product->image
            ? asset('storage/' . $product->image)
            : null;

        return response()->json([
            'message' => 'محصول با موفقیت ایجاد شد.',
            'data' => $product,
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        if (!$product->is_active) {
            abort(404, 'محصول پیدا نشد.');
        }

        $product->image = $product->image
            ? asset('storage/' . $product->image)
            : null;

        return response()->json([
            'data' => $product,
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->prepareColors($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'is_special_offer' => ['sometimes', 'boolean'],
        ]);

        $validated = array_merge(
            $validated,
            $this->validateColors($request)
        );

        $effectivePrice = (int) (
            $validated['price'] ?? $product->price
        );

        $discountFieldsSent =
            $request->exists('discount_percentage') ||
            $request->exists('discount_price');

        if ($discountFieldsSent) {
            $validated = array_merge(
                $validated,
                $this->validateDiscount($request, $effectivePrice)
            );
        } elseif (array_key_exists('price', $validated)) {
            $percentage = $product->discount_percentage !== null
                ? (int) $product->discount_percentage
                : null;

            $discountPrice = $product->discount_price !== null
                ? (int) $product->discount_price
                : null;

            if ($percentage !== null && $discountPrice !== null) {
                $expectedPrice = (int) round(
                    $effectivePrice * (100 - $percentage) / 100
                );

                if (
                    $discountPrice >= $effectivePrice ||
                    $discountPrice !== $expectedPrice
                ) {
                    throw ValidationException::withMessages([
                        'price' => 'قیمت اصلی جدید با تخفیف فعلی سازگار نیست. درصد و قیمت تخفیف را هم به‌روزرسانی کنید یا تخفیف را حذف کنید.',
                    ]);
                }
            }
        }

        if ($request->hasFile('image')) {
            if (
                $product->image &&
                !filter_var($product->image, FILTER_VALIDATE_URL)
            ) {
                Storage::disk('public')->delete($product->image);
            }

            $image = $request->file('image');
            $imageName = now()->format('Y-m-d_H-i-s')
                . '.'
                . $image->extension();

            $validated['image'] = $image->storeAs(
                'products',
                $imageName,
                'public'
            );
        }

        $product->update($validated);

        $product->image = $product->image
            ? asset('storage/' . $product->image)
            : null;

        return response()->json([
            'message' => 'محصول با موفقیت ویرایش شد.',
            'data' => $product,
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'محصول با موفقیت حذف شد.',
        ]);
    }
}
