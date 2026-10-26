<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * نمایش نظرات تأییدشده یک محصول
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
        ]);

        $comments = Comment::query()
            ->where('product_id', $validated['product_id'])
            ->where('status', 'approved')
            ->with('user:id,name')
            ->latest()
            ->paginate(10);

        return response()->json($comments);
    }

    /**
     * نمایش نظرات کاربر واردشده
     */
    public function myComments(Request $request): JsonResponse
    {
        $comments = $request->user()
            ->comments()
            ->with('product:id,name')
            ->latest()
            ->paginate(10);

        return response()->json($comments);
    }

    /**
     * ثبت نظر جدید
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
            'rating' => [
                'required',
                'integer',
                'min:1',
                'max:5',
            ],
            'text' => [
                'required',
                'string',
                'min:3',
                'max:3000',
            ],
        ]);

        $comment = $request->user()->comments()->create([
            'product_id' => $validated['product_id'],
            'rating' => $validated['rating'],
            'text' => $validated['text'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
            'comment' => $comment,
        ], 201);
    }

    /**
     * ویرایش نظر توسط صاحب آن
     */
    public function update(
        Request $request,
        Comment $comment
    ): JsonResponse {
        abort_unless(
            $request->user()->id === $comment->user_id,
            403,
            'شما اجازه ویرایش این نظر را ندارید.'
        );

        $validated = $request->validate([
            'rating' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                'max:5',
            ],
            'text' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:3000',
            ],
        ]);

        $comment->update([
            ...$validated,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'نظر ویرایش شد و دوباره در انتظار بررسی است.',
            'comment' => $comment,
        ]);
    }

    /**
     * حذف نظر توسط صاحب آن
     */
    public function destroy(
        Request $request,
        Comment $comment
    ): JsonResponse {
        abort_unless(
            $request->user()->id === $comment->user_id,
            403,
            'شما اجازه حذف این نظر را ندارید.'
        );

        $comment->delete();

        return response()->json([
            'message' => 'نظر با موفقیت حذف شد.',
        ]);
    }
}
