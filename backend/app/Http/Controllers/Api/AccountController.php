<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    /**
     * دریافت اطلاعات حساب کاربر واردشده
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'message' => 'اطلاعات حساب کاربری دریافت شد.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    /**
     * ویرایش اطلاعات پایه حساب کاربری
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'mobile' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'mobile')->ignore($user->id),
            ],
        ]);

        // ایمیل جدید نباید تأییدشده باقی بماند.
        if (
            array_key_exists('email', $validated) &&
            $validated['email'] !== $user->email
        ) {
            $validated['email_verified_at'] = null;
        }

        $user->fill($validated);
        $user->save();

        return response()->json([
            'message' => 'اطلاعات حساب کاربری با موفقیت به‌روزرسانی شد.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ]);

        $request->user()->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'رمز عبور با موفقیت تغییر کرد.',
        ]);
    }
}
