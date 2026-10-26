<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Address extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'recipient_name',
        'mobile',
        'province',
        'city',
        'address',
        'postal_code',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    // هر آدرس متعلق به یک کاربر است
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // هر آدرس ممکن است در چند سفارش استفاده شده باشد
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
