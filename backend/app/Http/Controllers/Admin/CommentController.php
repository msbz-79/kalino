<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    /**
     * دریافت و جست‌وجوی نظرات برای پنل مدیریت
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'string',
                Rule::in(['pending', 'approved', 'rejected']),
            ],
            'search' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        $comments = Comment::query()
            ->with([
                'user:id,name',
                'product:id,name',
            ])
            ->when(
                isset($validated['status']),
                fn ($query) => $query->where(
                    'status',
                    $validated['status']
                )
            )
            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {
                    $search = $validated['search'];

                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('text', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($userQuery) use ($search) {
                                $userQuery->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                );
                            })
                            ->orWhereHas('product', function ($productQuery) use ($search) {
                                $productQuery->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                );
                            });
                    });
                }
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 50);

        return response()->json($comments);
    }

    /**
     * تغییر وضعیت نظر توسط مدیر
     */
    public function updateStatus(
        Request $request,
        Comment $comment
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in(['approved', 'rejected']),
            ],
        ]);

        $comment->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'نظر با موفقیت تأیید شد.'
                : 'نظر با موفقیت رد شد.',
            'comment' => $comment->load([
                'user:id,name',
                'product:id,name',
            ]),
        ]);
    }

    /**
     * حذف نظر توسط مدیر
     */
    public function destroy(Comment $comment): JsonResponse
    {
        $comment->delete();

        return response()->json([
            'message' => 'نظر با موفقیت حذف شد.',
        ]);
    }
}