<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ZarinpalService
{
    private string $baseUrl;

    private string $merchantId;

    private bool $sandbox;

    public function __construct()
    {
        $this->merchantId = (string) config(
            'services.zarinpal.merchant_id',
            ''
        );

        $this->sandbox = filter_var(
            config('services.zarinpal.sandbox', true),
            FILTER_VALIDATE_BOOLEAN
        );

        $this->baseUrl = $this->sandbox
            ? 'https://sandbox.zarinpal.com/pg/v4/payment'
            : 'https://payment.zarinpal.com/pg/v4/payment';

        if ($this->merchantId === '') {
            throw new RuntimeException(
                'شناسه پذیرنده زرین‌پال تنظیم نشده است.'
            );
        }
    }

    /**
     * ایجاد درخواست پرداخت.
     */
    public function requestPayment(
        int $amountInToman,
        string $callbackUrl,
        string $description,
        ?string $mobile = null,
        ?string $email = null
    ): array {
        if ($amountInToman < 1) {
            throw new RuntimeException('مبلغ پرداخت معتبر نیست.');
        }

        if (!filter_var($callbackUrl, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('آدرس بازگشت پرداخت معتبر نیست.');
        }

        $metadata = array_filter([
            'mobile' => $mobile,
            'email' => $email,
        ], fn ($value) => $value !== null && $value !== '');

        $payload = [
            'merchant_id' => $this->merchantId,
            // مبلغ دیتابیس تومان است؛ زرین‌پال مبلغ را به ریال می‌گیرد.
            'amount' => $amountInToman * 10,
            'callback_url' => $callbackUrl,
            'description' => $description,
        ];

        if ($metadata !== []) {
            $payload['metadata'] = $metadata;
        }

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout(20)
                ->post($this->baseUrl . '/request.json', $payload);
        } catch (ConnectionException $exception) {
            Log::error('Zarinpal connection failed', [
                'endpoint' => 'request',
                'exception' => $exception::class,
                'error' => $exception->getMessage(),
            ]);

            throw new RuntimeException(
                'اتصال به درگاه زرین‌پال برقرار نشد. لطفاً دوباره تلاش کنید.',
                0,
                $exception
            );
        }

        $result = $response->json();

        if (!$response->successful()) {
            Log::error('Zarinpal HTTP request failed', [
                'endpoint' => 'request',
                'http_status' => $response->status(),
                'response' => $result ?? $response->body(),
            ]);

            throw new RuntimeException(
                'درخواست پرداخت به زرین‌پال ناموفق بود.'
            );
        }

        if (!is_array($result)) {
            Log::error('Zarinpal returned invalid JSON', [
                'endpoint' => 'request',
                'http_status' => $response->status(),
            ]);

            throw new RuntimeException(
                'پاسخ دریافتی از زرین‌پال معتبر نیست.'
            );
        }

        $data = $result['data'] ?? [];
        $code = (int) ($data['code'] ?? 0);
        $authority = $data['authority'] ?? null;

        if (
            $code !== 100 ||
            !is_string($authority) ||
            $authority === ''
        ) {
            Log::error('Zarinpal rejected payment request', [
                'endpoint' => 'request',
                'http_status' => $response->status(),
                'code' => $data['code'] ?? null,
                'message' => $data['message'] ?? null,
                'errors' => $result['errors'] ?? null,
            ]);

            throw new RuntimeException(
                'زرین‌پال درخواست پرداخت را نپذیرفت.'
            );
        }

        return [
            'authority' => $authority,
            'payment_url' => $this->paymentUrl($authority),
        ];
    }

    /**
     * تأیید پرداخت پس از بازگشت از درگاه.
     */
    public function verifyPayment(
        int $amountInToman,
        string $authority
    ): array {
        if ($amountInToman < 1) {
            throw new RuntimeException('مبلغ پرداخت معتبر نیست.');
        }

        if ($authority === '') {
            throw new RuntimeException('شناسه پرداخت معتبر نیست.');
        }

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout(20)
                ->post($this->baseUrl . '/verify.json', [
                    'merchant_id' => $this->merchantId,
                    'amount' => $amountInToman * 10,
                    'authority' => $authority,
                ]);
        } catch (ConnectionException $exception) {
            Log::error('Zarinpal verification connection failed', [
                'endpoint' => 'verify',
                'exception' => $exception::class,
                'error' => $exception->getMessage(),
            ]);

            throw new RuntimeException(
                'اتصال به سرویس تأیید پرداخت زرین‌پال برقرار نشد.',
                0,
                $exception
            );
        }

        $result = $response->json();

        if (!$response->successful()) {
            Log::error('Zarinpal verification HTTP request failed', [
                'endpoint' => 'verify',
                'http_status' => $response->status(),
                'response' => $result ?? $response->body(),
            ]);

            throw new RuntimeException(
                'درخواست تأیید پرداخت به زرین‌پال ناموفق بود.'
            );
        }

        if (!is_array($result)) {
            Log::error('Zarinpal verification returned invalid JSON', [
                'endpoint' => 'verify',
                'http_status' => $response->status(),
            ]);

            throw new RuntimeException(
                'پاسخ تأیید پرداخت زرین‌پال معتبر نیست.'
            );
        }

        $data = $result['data'] ?? [];
        $code = (int) ($data['code'] ?? 0);
        $refId = $data['ref_id'] ?? null;

        // کد 100 پرداخت موفق و کد 101 پرداختی است که قبلاً تأیید شده.
        if (!in_array($code, [100, 101], true)) {
            Log::warning('Zarinpal verification rejected', [
                'endpoint' => 'verify',
                'code' => $data['code'] ?? null,
                'message' => $data['message'] ?? null,
                'errors' => $result['errors'] ?? null,
            ]);

            throw new RuntimeException(
                'پرداخت توسط زرین‌پال تأیید نشد.'
            );
        }

        if ($refId === null || $refId === '') {
            Log::error('Zarinpal verification returned no reference ID', [
                'endpoint' => 'verify',
                'code' => $code,
            ]);

            throw new RuntimeException(
                'شناسه پیگیری پرداخت از زرین‌پال دریافت نشد.'
            );
        }

        return [
            'code' => $code,
            'ref_id' => (string) $refId,
        ];
    }

    /**
     * ساخت آدرس درگاه بر اساس محیط فعال.
     */
    public function paymentUrl(string $authority): string
    {
        $baseUrl = $this->sandbox
            ? 'https://sandbox.zarinpal.com/pg/StartPay/'
            : 'https://www.zarinpal.com/pg/StartPay/';

        return $baseUrl . $authority;
    }
}
