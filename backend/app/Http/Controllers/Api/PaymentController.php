<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\ZarinpalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class PaymentController extends Controller
{
    /**
     * شروع پرداخت سفارش.
     */
    public function pay(Order $order, ZarinpalService $zarinpal)
    {
        abort_unless(
            (int) $order->user_id === (int) auth()->id(),
            403,
            'شما اجازه پرداخت این سفارش را ندارید.'
        );

        try {
            $result = DB::transaction(function () use (
                $order,
                $zarinpal
            ) {
                $lockedOrder = Order::query()
                    ->whereKey($order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedOrder->payment_status === 'paid') {
                    return [
                        'error' => 'این سفارش قبلاً پرداخت شده است.',
                        'status' => 422,
                    ];
                }

                if ($lockedOrder->status !== 'pending') {
                    return [
                        'error' => 'این سفارش در وضعیت قابل پرداخت نیست.',
                        'status' => 422,
                    ];
                }

                $amount = (int) round(
                    (float) $lockedOrder->total_amount
                );

                if ($amount < 1) {
                    return [
                        'error' => 'مبلغ سفارش معتبر نیست.',
                        'status' => 422,
                    ];
                }

                if ($lockedOrder->payment_authority) {
                    return [
                        'payment_url' => $zarinpal->paymentUrl(
                            $lockedOrder->payment_authority
                        ),
                    ];
                }

                $payment = $zarinpal->requestPayment(
                    $amount,
                    route('zarinpal.callback'),
                    'پرداخت سفارش ' . $lockedOrder->order_number,
                    $lockedOrder->shipping_mobile,
                    $lockedOrder->user?->email
                );

                $lockedOrder->payment_authority = $payment['authority'];
                $lockedOrder->payment_provider = 'zarinpal';
                $lockedOrder->save();

                return [
                    'payment_url' => $payment['payment_url'],
                ];
            }, 3);

            if (isset($result['error'])) {
                return response()->json([
                    'message' => $result['error'],
                ], $result['status']);
            }

            return response()->json([
                'message' => 'درخواست پرداخت آماده است.',
                'payment_url' => $result['payment_url'],
            ]);
        } catch (Throwable $exception) {
            Log::error('Zarinpal payment request failed', [
                'order_id' => $order->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'ایجاد درخواست پرداخت ناموفق بود. لطفاً وضعیت سفارش را بررسی و دوباره تلاش کنید.',
            ], 502);
        }
    }

    /**
     * بازگشت کاربر از زرین‌پال.
     */
    public function callback(
        Request $request,
        ZarinpalService $zarinpal
    ) {
        $authority = $request->query('Authority');
        $status = $request->query('Status');

        $frontendUrl = rtrim(
            (string) config(
                'services.frontend_url',
                'http://localhost:5173'
            ),
            '/'
        );

        if (!is_string($authority) || $authority === '') {
            return redirect(
                $frontendUrl . '/payment-result?status=failed'
            );
        }

        $order = Order::query()
            ->where('payment_authority', $authority)
            ->first();

        if (!$order) {
            return redirect(
                $frontendUrl . '/payment-result?status=failed'
            );
        }

        if ($order->payment_status === 'paid') {
            return $this->paymentResultRedirect(
                $frontendUrl,
                'success',
                $order->order_number
            );
        }

        if ($status !== 'OK') {
            return $this->paymentResultRedirect(
                $frontendUrl,
                'failed',
                $order->order_number
            );
        }

        try {
            // ابتدا صحت پرداخت را از خود زرین‌پال استعلام می‌گیریم.
            $verification = $zarinpal->verifyPayment(
                (int) round((float) $order->total_amount),
                $authority
            );

            DB::transaction(function () use (
                $order,
                $verification,
                $authority
            ) {
                $lockedOrder = Order::query()
                    ->whereKey($order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedOrder->payment_status === 'paid') {
                    return;
                }

                // اطمینان از اینکه authority سفارش تغییر نکرده است.
                if ($lockedOrder->payment_authority !== $authority) {
                    throw new \RuntimeException(
                        'شناسه پرداخت با سفارش مطابقت ندارد.'
                    );
                }

                $lockedOrder->payment_status = 'paid';
                $lockedOrder->transaction_id = $verification['ref_id'];
                $lockedOrder->paid_at = now();

                // وضعیت سفارش را فعلاً pending نگه می‌داریم؛
                // وضعیت ارسال/پردازش باید طبق منطق فروشگاه تعیین شود.
                $lockedOrder->save();
            }, 3);

            return $this->paymentResultRedirect(
                $frontendUrl,
                'success',
                $order->order_number
            );
        } catch (Throwable $exception) {
            Log::error('Zarinpal payment verification failed', [
                'order_id' => $order->id,
                'error' => $exception->getMessage(),
            ]);

            return $this->paymentResultRedirect(
                $frontendUrl,
                'failed',
                $order->order_number
            );
        }
    }

    /**
     * انتقال کاربر به صفحه نتیجه پرداخت.
     */
    private function paymentResultRedirect(
        string $frontendUrl,
        string $status,
        ?string $orderNumber = null
    ) {
        $query = ['status' => $status];

        if ($orderNumber !== null && $orderNumber !== '') {
            $query['order'] = $orderNumber;
        }

        return redirect(
            $frontendUrl . '/payment-result?' . http_build_query($query)
        );
    }
}
