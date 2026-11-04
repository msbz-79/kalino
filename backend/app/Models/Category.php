<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // محصولات متعلق به این دسته‌بندی
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    // دسته‌بندی والد
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // دسته‌بندی‌های زیرمجموعه
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
