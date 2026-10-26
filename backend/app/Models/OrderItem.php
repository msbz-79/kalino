<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_image',
        'unit_price',
        'quantity',
        'line_total',
        'selected_color',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'quantity' => 'integer',
            'line_total' => 'decimal:2',
        ];
    }

    // این قلم متعلق به کدام سفارش است؟
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // محصول اصلی مرتبط با این قلم
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
