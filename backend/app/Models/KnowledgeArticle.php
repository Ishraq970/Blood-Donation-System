<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class KnowledgeArticle extends Model
{
    protected $fillable = [
        'category',
        'title_en',
        'title_bn',
        'content_en',
        'content_bn',
        'keywords',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'keywords'     => 'array',
        'is_published' => 'boolean',
        'sort_order'   => 'integer',
    ];

    /* -----------------------------------------------------------------------
       Scopes
    ----------------------------------------------------------------------- */

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /* -----------------------------------------------------------------------
       Helpers
    ----------------------------------------------------------------------- */

    /** All available article categories. */
    public static function categories(): array
    {
        return [
            'Account', 'Donors', 'Requests', 'Volunteers',
            'Safety', 'Privacy', 'Notifications', 'Maps', 'Donation', 'General',
        ];
    }

    /**
     * Score how relevant this article is to a given query string (0-100).
     * Higher = more relevant. Pure PHP — no external deps required.
     */
    public function relevanceScore(string $query): int
    {
        $query = mb_strtolower(trim($query));
        $words = preg_split('/\s+/', $query);

        $haystack = mb_strtolower(
            ($this->title_en ?? '') . ' ' .
            ($this->content_en ?? '') . ' ' .
            implode(' ', $this->keywords ?? [])
        );

        $score = 0;

        // Title exact match — highest weight
        if (mb_strpos(mb_strtolower($this->title_en ?? ''), $query) !== false) {
            $score += 50;
        }

        // Keyword match
        foreach (($this->keywords ?? []) as $kw) {
            if (mb_strpos($query, mb_strtolower($kw)) !== false) {
                $score += 20;
            }
        }

        // Word-by-word match in full text
        foreach ($words as $word) {
            if (mb_strlen($word) < 3) {
                continue;
            }
            if (mb_strpos($haystack, $word) !== false) {
                $score += 5;
            }
        }

        return min(100, $score);
    }
}
