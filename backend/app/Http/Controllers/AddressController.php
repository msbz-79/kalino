<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    /**
     * نمایش آدرس‌های کاربر واردشده
     */
    public function index(Request $request)
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return response()->json([
            'data' => $addresses,
        ]);
    }

    /**
     * ثبت آدرس جدید
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_name' => ['required', 'string', 'max:255'],
            'mobile' => ['required', 'string', 'max:20'],
            'province' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        $address = DB::transaction(function () use ($user, $validated) {
            // قفل رکورد کاربر برای کاهش احتمال تداخل درخواست‌های هم‌زمان
            $user = $user->newQuery()
                ->lockForUpdate()
                ->findOrFail($user->id);

            $hasAddresses = $user->addresses()->exists();

            $makeDefault = (bool) ($validated['is_default'] ?? false);

            // اولین آدرس حتماً پیش‌فرض است
            if (! $hasAddresses) {
                $makeDefault = true;
            }

            if ($makeDefault) {
                $user->addresses()->update([
                    'is_default' => false,
                ]);
            }

            $validated['is_default'] = $makeDefault;

            return $user->addresses()->create($validated);
        });

        return response()->json([
            'message' => 'آدرس با موفقیت ثبت شد.',
            'data' => $address,
        ], 201);
    }

    /**
     * نمایش یک آدرس متعلق به کاربر
     */
    public function show(Request $request, Address $address)
    {
        $address = $request->user()
            ->addresses()
            ->findOrFail($address->id);

        return response()->json([
            'data' => $address,
        ]);
    }

    /**
     * ویرایش آدرس
     */
    public function update(Request $request, Address $address)
    {
        $address = $request->user()
            ->addresses()
            ->findOrFail($address->id);

        $validated = $request->validate([
            'recipient_name' => ['sometimes', 'required', 'string', 'max:255'],
            'mobile' => ['sometimes', 'required', 'string', 'max:20'],
            'province' => ['sometimes', 'required', 'string', 'max:255'],
            'city' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['sometimes', 'required', 'string'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($address, $validated) {
            $user = $address->user;

            if (($validated['is_default'] ?? false) === true) {
                // ابتدا همه آدرس‌های کاربر از حالت پیش‌فرض خارج می‌شوند
                $user->addresses()->update([
                    'is_default' => false,
                ]);

                $validated['is_default'] = true;
            } elseif (
                array_key_exists('is_default', $validated)
                && $validated['is_default'] === false
                && $address->is_default
            ) {
                // اجازه نمی‌دهیم آدرس پیش‌فرض بدون جایگزین غیرفعال شود
                unset($validated['is_default']);
            }

            $address->update($validated);
        });

        return response()->json([
            'message' => 'آدرس با موفقیت ویرایش شد.',
            'data' => $address->fresh(),
        ]);
    }

    /**
     * حذف نرم آدرس
     */
    public function destroy(Request $request, Address $address)
    {
        $address = $request->user()
            ->addresses()
            ->findOrFail($address->id);

        DB::transaction(function () use ($address) {
            $user = $address->user;
            $wasDefault = $address->is_default;

            $address->delete();

            // اگر آدرس پیش‌فرض حذف شد، آدرس دیگری را انتخاب می‌کنیم
            if ($wasDefault) {
                $nextAddress = $user->addresses()
                    ->orderByDesc('created_at')
                    ->first();

                if ($nextAddress) {
                    $nextAddress->update([
                        'is_default' => true,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'آدرس با موفقیت حذف شد.',
        ]);
    }

    /**
     * تعیین آدرس پیش‌فرض
     */
    public function setDefault(Request $request, Address $address)
    {
        $address = $request->user()
            ->addresses()
            ->findOrFail($address->id);

        DB::transaction(function () use ($address) {
            $user = $address->user;

            $user->addresses()->update([
                'is_default' => false,
            ]);

            $address->update([
                'is_default' => true,
            ]);
        });

        return response()->json([
            'message' => 'آدرس پیش‌فرض با موفقیت تغییر کرد.',
            'data' => $address->fresh(),
        ]);
    }
}
