<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'string',
                Rule::in(['pending', 'approved', 'rejected']),
            ],
        ]);

        $comments = Comment::query()
            ->with(['user:id,name', 'product:id,name'])
            ->when(
                isset($validated['status']),
                fn ($query) => $query->where(
                    'status',
                    $validated['status']
                )
            )
            ->latest()
            ->paginate(15);

        return response()->json($comments);
    }

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
            'message' => 'وضعیت نظر با موفقیت تغییر کرد.',
            'comment' => $comment,
        ]);
    }
}
