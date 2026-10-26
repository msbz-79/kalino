<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'address_id',
        'order_number',
        'status',
        'payment_status',
        'payment_provider',
        'transaction_id',
        'paid_at',
        'subtotal',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'shipping_name',
        'shipping_mobile',
        'shipping_province',
        'shipping_city',
        'shipping_address',
        'shipping_postal_code',
        'customer_note',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    // هر سفارش متعلق به یک کاربر است
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // آدرس ذخیره‌شده‌ای که هنگام خرید انتخاب شده است
    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    // هر سفارش می‌تواند چند قلم سفارش داشته باشد
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
