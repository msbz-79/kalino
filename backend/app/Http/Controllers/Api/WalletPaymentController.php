<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use App\Services\ZarinpalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class WalletPaymentController extends Controller
{
    /**
     * شروع فرایند شارژ کیف پول
     */
    public function deposit(
        Request $request,
        ZarinpalService $zarinpal
    ): JsonResponse {
        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1000', 'max:50000000'],
        ]);

        $user = $request->user();
        $amount = (int) $validated['amount'];

        // ابتدا تراکنش را در وضعیت انتظار ثبت می‌کنیم.
        $transaction = $user->walletTransactions()->create([
            'type' => 'deposit',
            'amount' => $amount,
            'status' => 'pending',
            'payment_provider' => 'zarinpal',
        ]);

        try {
            $callbackUrl = route('wallet.zarinpal.callback');

            $payment = $zarinpal->requestPayment(
                $amount,
                $callbackUrl,
                'شارژ کیف پول کالینو',
                $user->mobile ?: null,
                $user->email
            );

            $transaction->update([
                'authority' => $payment['authority'],
            ]);

            return response()->json([
                'message' => 'درخواست پرداخت ایجاد شد.',
                'payment_url' => $payment['payment_url'],
                'transaction_id' => $transaction->id,
            ]);
        } catch (Throwable $exception) {
            $transaction->update([
                'status' => 'failed',
            ]);

            report($exception);

            return response()->json([
                'message' => 'ایجاد درخواست پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.',
            ], 502);
        }
    }

    /**
     * دریافت نتیجه پرداخت از زرین‌پال
     */
    public function callback(
        Request $request,
        ZarinpalService $zarinpal
    ) {
        $authority = $request->query('Authority');
        $status = $request->query('Status');

        $frontendUrl = rtrim(
            config('services.frontend_url', 'http://localhost:5173'),
            '/'
        );

        $transaction = WalletTransaction::query()
            ->where('authority', $authority)
            ->where('type', 'deposit')
            ->first();

        if (!$transaction) {
            return redirect(
                $frontendUrl . '/payment-result?status=failed&type=wallet'
            );
        }

        if ($transaction->status === 'completed') {
            return redirect(
                $frontendUrl . '/payment-result?status=success&type=wallet'
            );
        }

        if ($status !== 'OK' || $transaction->status !== 'pending') {
            $transaction->update([
                'status' => 'failed',
            ]);

            return redirect(
                $frontendUrl . '/payment-result?status=failed&type=wallet'
            );
        }

        try {
            // تأیید پرداخت باید از خود زرین‌پال دریافت شود.
            $verification = $zarinpal->verifyPayment(
                (int) $transaction->amount,
                $authority
            );

            DB::transaction(function () use (
                $transaction,
                $verification
            ) {
                $lockedTransaction = WalletTransaction::query()
                    ->whereKey($transaction->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // جلوگیری از افزایش موجودی برای یک تراکنش تکراری
                if ($lockedTransaction->status === 'completed') {
                    return;
                }

                if ($lockedTransaction->status !== 'pending') {
                    return;
                }

                $user = $lockedTransaction->user()
                    ->lockForUpdate()
                    ->firstOrFail();

                $user->wallet_balance =
                    (float) $user->wallet_balance
                    + (float) $lockedTransaction->amount;

                $user->save();

                $lockedTransaction->update([
                    'status' => 'completed',
                    'transaction_id' => (string) $verification['ref_id'],
                    'paid_at' => now(),
                ]);
            });

            $finalStatus = WalletTransaction::query()
                ->whereKey($transaction->id)
                ->value('status');

            return redirect(
                $frontendUrl . '/payment-result?status='
                . ($finalStatus === 'completed' ? 'success' : 'failed')
                . '&type=wallet'
            );
        } catch (Throwable $exception) {
            report($exception);

            return redirect(
                $frontendUrl . '/payment-result?status=failed&type=wallet'
            );
        }
    }
}
