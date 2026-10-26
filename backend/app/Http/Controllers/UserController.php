<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'mobile',
                'role',
                'created_at',
            ])
            ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(
            [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'mobile' => [
                    'required',
                    'regex:/^09\d{9}$/',
                    'unique:users,mobile',
                ],
                'role' => 'required|in:user,admin',
            ],
            [
                'name.required' => 'وارد کردن نام و نام خانوادگی الزامی است.',
                'name.string' => 'نام و نام خانوادگی باید متن باشد.',
                'name.max' => 'نام و نام خانوادگی نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد.',

                'email.required' => 'وارد کردن ایمیل الزامی است.',
                'email.email' => 'ایمیل واردشده معتبر نیست.',
                'email.unique' => 'این ایمیل قبلاً در سیستم ثبت شده است.',

                'password.required' => 'وارد کردن رمز عبور الزامی است.',
                'password.min' => 'رمز عبور باید حداقل ۸ کاراکتر داشته باشد.',

                'mobile.required' => 'وارد کردن شماره موبایل الزامی است.',
                'mobile.regex' => 'شماره موبایل باید با 09 شروع شود و ۱۱ رقم داشته باشد.',
                'mobile.unique' => 'این شماره موبایل قبلاً ثبت شده است.',

                'role.required' => 'انتخاب نقش کاربر الزامی است.',
                'role.in' => 'نقش انتخاب‌شده معتبر نیست.',
            ]
        );

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'mobile' => $validated['mobile'],
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'کاربر با موفقیت ثبت شد.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate(
            [
                'name' => 'required|string|max:255',

                'email' => [
                    'required',
                    'email',
                    Rule::unique('users', 'email')->ignore($user->id),
                ],

                'password' => 'nullable|string|min:8',

                'mobile' => [
                    'required',
                    'regex:/^09\d{9}$/',
                    Rule::unique('users', 'mobile')->ignore($user->id),
                ],

                'role' => 'required|in:user,admin',
            ],
            [
                'name.required' => 'وارد کردن نام و نام خانوادگی الزامی است.',
                'name.string' => 'نام و نام خانوادگی باید متن باشد.',
                'name.max' => 'نام و نام خانوادگی نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد.',

                'email.required' => 'وارد کردن ایمیل الزامی است.',
                'email.email' => 'ایمیل واردشده معتبر نیست.',
                'email.unique' => 'این ایمیل قبلاً توسط کاربر دیگری ثبت شده است.',

                'password.min' => 'رمز عبور جدید باید حداقل ۸ کاراکتر داشته باشد.',

                'mobile.required' => 'وارد کردن شماره موبایل الزامی است.',
                'mobile.regex' => 'شماره موبایل باید با 09 شروع شود و ۱۱ رقم داشته باشد.',
                'mobile.unique' => 'این شماره موبایل قبلاً توسط کاربر دیگری ثبت شده است.',

                'role.required' => 'انتخاب نقش کاربر الزامی است.',
                'role.in' => 'نقش انتخاب‌شده معتبر نیست.',
            ]
        );

        // اطلاعات معمول کاربر را به‌روزرسانی می‌کنیم.
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->mobile = $validated['mobile'];
        $user->role = $validated['role'];

        // رمز عبور فقط در صورت وارد شدن رمز جدید تغییر می‌کند.
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'اطلاعات کاربر با موفقیت ویرایش شد.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'message' => 'کاربر با موفقیت حذف شد.',
        ]);
    }
}
