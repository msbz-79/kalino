<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\SpecialOfferSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'min_price' => ['sometimes', 'integer', 'min:0'],
            'max_price' => ['sometimes', 'integer', 'min:0', 'gte:min_price'],
            'sort' => ['sometimes', 'in:newest,price_asc,price_desc'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'status' => ['sometimes', 'in:all,active,inactive'],
        ]);

        $user = $request->user();
        $isAdmin = $user && $user->role === 'admin';
        $status = $validated['status'] ?? 'active';

        if ($status !== 'active' && !$isAdmin) {
            abort(403, 'شما اجازه مشاهده این محصولات را ندارید.');
        }

        $query = Product::query();

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (isset($validated['min_price'])) {
            $query->where('price', '>=', $validated['min_price']);
        }

        if (isset($validated['max_price'])) {
            $query->where('price', '<=', $validated['max_price']);
        }

        $sort = $validated['sort'] ?? 'newest';

        if ($sort === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('price', 'desc');
        } else {
            $query->latest();
        }

        $products = $query
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

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
        // ابتدا JSON رنگ‌ها را به آرایه تبدیل می‌کنیم.
        $this->prepareColors($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'is_active' => ['sometimes', 'boolean'],
            'is_special_offer' => ['sometimes', 'boolean'],
        ]);

        // رنگ‌ها جداگانه اعتبارسنجی می‌شوند.
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
        // ابتدا JSON رنگ‌ها را به آرایه تبدیل می‌کنیم.
        $this->prepareColors($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
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

        // فقط در صورت ارسال colors، رنگ‌ها را اعتبارسنجی می‌کنیم.
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
            // اگر قیمت اصلی تغییر کرده، سازگاری تخفیف قبلی را بررسی می‌کنیم.
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