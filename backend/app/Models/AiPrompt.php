<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiPrompt extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'version',
        'prompt_text',
        'is_active',
    ];

    protected $casts = [
        'version' => 'integer',
        'is_active' => 'boolean',
    ];
}
