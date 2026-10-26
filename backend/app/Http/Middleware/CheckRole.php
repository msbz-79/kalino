<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'احراز هویت الزامی است.',
            ], 401);
        }

        if ($request->user()->role !== $role) {
            return response()->json([
                'message' => 'شما اجازه دسترسی به این بخش را ندارید.',
            ], 403);
        }

        return $next($request);
    }
}
