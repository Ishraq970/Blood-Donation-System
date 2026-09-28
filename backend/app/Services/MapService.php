<?php

namespace App\Services;

class MapService
{
    /**
     * Get front-facing map tile configuration.
     *
     * @return array<string, mixed>
     */
    public function getMapConfig(): array
    {
        return [
            'provider' => config('map.provider', 'osm'),
            'tileUrl' => config('map.tile_url', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            'attribution' => config('map.attribution', '&copy; OpenStreetMap contributors'),
            'subdomains' => config('map.subdomains', ['a', 'b', 'c']),
            'maxZoom' => config('map.max_zoom', 19),
            'defaultCenter' => [
                'lat' => config('map.default_center.latitude', 23.684994),
                'lng' => config('map.default_center.longitude', 90.356331),
                'zoom' => config('map.default_center.zoom', 7),
            ],
        ];
    }

    /**
     * Calculate Great Circle Haversine distance between two points in kilometers.
     *
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distance in kilometers rounded to two decimal places.
     */
    public function calculateDistanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        if ($lat1 === $lat2 && $lon1 === $lon2) {
            return 0.0;
        }

        $earthRadiusKm = 6371.0;

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(
            pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)
        ));

        return round($angle * $earthRadiusKm, 2);
    }
}
