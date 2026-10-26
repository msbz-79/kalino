<?php

namespace App\Http\Controllers;

use App\Models\SpecialOfferSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SpecialOfferSettingController extends Controller
{
    /**
     * دریافت تنظیمات فعلی شگفت‌انگیزها
     */
    public function show(): JsonResponse
    {
        $setting = SpecialOfferSetting::query()->first();

        return response()->json([
            'message' => 'تنظیمات شگفت‌انگیزها دریافت شد.',
            'data' => $setting,
        ]);
    }

    /**
     * ایجاد یا ویرایش تنظیمات شگفت‌انگیزها
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'is_active' => ['required', 'boolean'],

            'start_at' => [
                'nullable',
                'required_if:is_active,1',
                'date',
            ],

            'end_at' => [
                'nullable',
                'required_if:is_active,1',
                'date',
                'after:start_at',
            ],
        ], [
            'is_active.required' => 'وضعیت کمپین الزامی است.',
            'is_active.boolean' => 'وضعیت کمپین معتبر نیست.',

            'start_at.required_if' => 'زمان شروع هنگام فعال‌سازی الزامی است.',
            'start_at.date' => 'زمان شروع معتبر نیست.',

            'end_at.required_if' => 'زمان پایان هنگام فعال‌سازی الزامی است.',
            'end_at.date' => 'زمان پایان معتبر نیست.',
            'end_at.after' => 'زمان پایان باید بعد از زمان شروع باشد.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'اطلاعات واردشده معتبر نیست.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $isActive = $request->boolean('is_active');

        // هنگام غیرفعال‌سازی، تاریخ‌ها پاک می‌شوند.
        $startAt = $isActive
            ? $request->input('start_at')
            : null;

        $endAt = $isActive
            ? $request->input('end_at')
            : null;

        $setting = SpecialOfferSetting::query()->first();

        $data = [
            'start_at' => $startAt,
            'end_at' => $endAt,
            'is_active' => $isActive,
        ];

        if ($setting) {
            $setting->update($data);
        } else {
            $setting = SpecialOfferSetting::create($data);
        }

        return response()->json([
            'message' => 'تنظیمات شگفت‌انگیزها با موفقیت ذخیره شد.',
            'data' => $setting->fresh(),
        ]);
    }
}
