<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Sluggable\Attributes\Sluggable;

#[Sluggable(from: 'name', to: 'slug')]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category_id',
        'brand',
        'colors',
        'price',
        'discount_percentage',
        'discount_price',
        'stock',
        'image',
        'is_active',
        'is_special_offer',
    ];

    protected function casts(): array
    {
        return [
            'colors' => 'array',
            'price' => 'integer',
            'discount_percentage' => 'integer',
            'discount_price' => 'integer',
            'is_active' => 'boolean',
            'is_special_offer' => 'boolean',
        ];
    }

    // دسته‌بندی متعلق به این محصول
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // اقلام سفارش‌های مربوط به این محصول
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // نظرات مربوط به این محصول
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
