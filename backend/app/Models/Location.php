<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_id',
        'type',
        'name_en',
        'name_bn',
        'official_code',
        'postal_code',
        'latitude',
        'longitude',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Parent location in the administrative tree.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    /**
     * Immediate children locations.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Location::class, 'parent_id')->orderBy('sort_order')->orderBy('name_en');
    }

    /**
     * Active children only.
     */
    public function activeChildren(): HasMany
    {
        return $this->children()->where('is_active', true);
    }

    /**
     * Dynamic localized name based on current session locale.
     */
    public function getNameAttribute(): string
    {
        return app()->getLocale() === 'bn' ? $this->name_bn : $this->name_en;
    }

    /**
     * Get the full ancestral hierarchy chain (from root down to current).
     */
    public function getAncestors(): Collection
    {
        $ancestors = collect();
        $current = $this->parent;

        while ($current) {
            $ancestors->prepend($current);
            $current = $current->parent;
        }

        return $ancestors;
    }

    /**
     * Formatted string of complete administrative hierarchy.
     */
    public function getHierarchyPathAttribute(): string
    {
        $chain = $this->getAncestors()->push($this);

        return $chain->map(fn (Location $loc) => $loc->name)->implode(' › ');
    }

    /* ---------------------------------------------------------
       Query Scopes
    --------------------------------------------------------- */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', strtoupper($type));
    }

    public function scopeDivisions(Builder $query): Builder
    {
        return $query->ofType('DIVISION');
    }

    public function scopeDistricts(Builder $query): Builder
    {
        return $query->ofType('DISTRICT');
    }

    public function scopeUpazilas(Builder $query): Builder
    {
        return $query->ofType('UPAZILA');
    }

    public function scopeUnions(Builder $query): Builder
    {
        return $query->ofType('UNION');
    }
}
