import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { findNearestDistrict, BANGLADESH_GEO, ALL_DISTRICTS_LOOKUP } from '../data/bangladeshGeo';

interface InteractiveLocationMapProps {
  selectedDivision?: string;
  selectedDistrict?: string;
  selectedUpazila?: string;
  selectedArea?: string;
  onSelectLocation?: (location: {
    lat: number;
    lng: number;
    division: string;
    district: string;
    upazila?: string;
    formatted: string;
  }) => void;
  isBn?: boolean;
  height?: string;
}

// Google Maps & OSM tile layers configuration
const MAP_LAYERS = {
  googleRoads: {
    name: 'Google Streets',
    nameBn: 'গুগল ম্যাপস',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  googleSatellite: {
    name: 'Google Satellite',
    nameBn: 'স্যাটেলাইট ভিউ',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite',
  },
  osm: {
    name: 'OpenStreetMap',
    nameBn: 'ওপেন স্ট্রিট ম্যাপ',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  },
};

// Custom pulsing red blood marker icon
const createBloodDropIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(220, 38, 38, 0.4); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); transform: rotate(-45deg); box-shadow: 0 6px 18px rgba(185, 28, 28, 0.65); border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center;">
          <div style="width: 9px; height: 9px; border-radius: 50%; background: #ffffff; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 36],
    popupAnchor: [0, -36],
  });
};

const InteractiveLocationMap: React.FC<InteractiveLocationMapProps> = ({
  selectedDivision = '',
  selectedDistrict = '',
  selectedUpazila = '',
  onSelectLocation,
  isBn = false,
  height = '460px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activeLayer, setActiveLayer] = useState<'googleRoads' | 'googleSatellite' | 'osm'>('googleRoads');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 23.8103,
    lng: 90.4125,
  });
  const [pinnedLocationName, setPinnedLocationName] = useState<string>('Dhaka, Bangladesh');
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Helper to handle coordinates selection
  const handleCoordinatesSelected = useCallback((lat: number, lng: number, mapInstance?: L.Map) => {
    const map = mapInstance || mapInstanceRef.current;
    setCurrentCoords({ lat, lng });

    const nearest = findNearestDistrict(lat, lng);
    const distInfo = ALL_DISTRICTS_LOOKUP[nearest.district]?.district;
    const upazila = distInfo?.upazilas[0] || '';
    const formatted = `${nearest.district}, ${nearest.division}`;

    setPinnedLocationName(formatted);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current
        .bindPopup(
          `<div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
            <b style="color: #b91c1c; font-size: 14px;">📍 ${nearest.district}, ${nearest.division}</b><br/>
            <span style="color: #4b5563; font-size: 11px;">${isBn ? 'নিকটবর্তী জেলা' : 'Nearest District'} (~${nearest.distanceKm} km)</span><br/>
            <span style="color: #9ca3af; font-size: 11px; font-family: monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
          </div>`
        )
        .openPopup();
    }

    if (map) {
      map.panTo([lat, lng], { animate: true });
    }

    if (onSelectLocation) {
      onSelectLocation({
        lat,
        lng,
        division: nearest.division,
        district: nearest.district,
        upazila,
        formatted,
      });
    }
  }, [isBn, onSelectLocation]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Default to Google Maps Roadmap tiles
      const cfg = MAP_LAYERS.googleRoads;
      const layer = L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains,
        attribution: cfg.attribution,
      }).addTo(map);

      tileLayerRef.current = layer;

      // Marker
      const initialMarker = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: createBloodDropIcon(),
        draggable: true,
      }).addTo(map);

      initialMarker.bindPopup(
        `<div style="font-family: inherit; font-size: 13px;">
          <b style="color: #b91c1c;">📍 Dhaka, Bangladesh</b><br/>
          <span style="color: #6b7280; font-size: 11px;">${isBn ? 'ক্লিক বা ড্র্যাগ করে এলাকা নির্বাচন করুন' : 'Click or drag to select location'}</span>
        </div>`
      );

      markerRef.current = initialMarker;

      // Click event on map to select ANYWHERE
      map.on('click', (e: L.LeafletMouseEvent) => {
        handleCoordinatesSelected(e.latlng.lat, e.latlng.lng, map);
      });

      // Drag marker
      initialMarker.on('dragend', () => {
        const pos = initialMarker.getLatLng();
        handleCoordinatesSelected(pos.lat, pos.lng, map);
      });

      mapInstanceRef.current = map;

      // Ensure proper sizing immediately and after DOM stabilizes
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
      setTimeout(() => {
        map.invalidateSize();
      }, 600);
    }

    // ResizeObserver to automatically call invalidateSize when tabs switch or container resizes
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [currentCoords.lat, currentCoords.lng, handleCoordinatesSelected, isBn]);

  // Switch Tile Layer (Google Streets vs Google Satellite vs OSM)
  const handleSwitchLayer = (type: 'googleRoads' | 'googleSatellite' | 'osm') => {
    if (!mapInstanceRef.current) return;
    setActiveLayer(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const cfg = MAP_LAYERS[type];
    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains,
      attribution: cfg.attribution,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // Fly to location when Division/District props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    let targetLat = currentCoords.lat;
    let targetLng = currentCoords.lng;
    let zoomLevel = 8;

    if (selectedDistrict && ALL_DISTRICTS_LOOKUP[selectedDistrict]) {
      targetLat = ALL_DISTRICTS_LOOKUP[selectedDistrict].district.lat;
      targetLng = ALL_DISTRICTS_LOOKUP[selectedDistrict].district.lng;
      zoomLevel = 12;
    } else if (selectedDivision && BANGLADESH_GEO[selectedDivision]) {
      targetLat = BANGLADESH_GEO[selectedDivision].lat;
      targetLng = BANGLADESH_GEO[selectedDivision].lng;
      zoomLevel = 9;
    }

    if (selectedDistrict || selectedDivision) {
      setCurrentCoords({ lat: targetLat, lng: targetLng });
      map.flyTo([targetLat, targetLng], zoomLevel, { duration: 1.2 });

      if (markerRef.current) {
        markerRef.current.setLatLng([targetLat, targetLng]);
        const locLabel = [selectedUpazila, selectedDistrict, selectedDivision, 'Bangladesh'].filter(Boolean).join(', ');
        setPinnedLocationName(locLabel);
        markerRef.current
          .bindPopup(
            `<div style="font-family: inherit; font-size: 13px;">
              <b style="color: #b91c1c;">📍 ${locLabel}</b><br/>
              <span style="color: #6b7280; font-size: 11px;">Lat: ${targetLat.toFixed(5)}, Lng: ${targetLng.toFixed(5)}</span>
            </div>`
          )
          .openPopup();
      }
    }
  }, [selectedDivision, selectedDistrict, selectedUpazila]);

  // Geolocation (Locate Me)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(isBn ? 'আপনার ব্রাউজারে জিপিএস সমর্থিত নয়।' : 'Geolocation not supported by browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.5 });
          handleCoordinatesSelected(latitude, longitude);
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        alert(isBn ? 'আপনার অবস্থান পাওয়া যায়নি। অনুগ্রহ করে ম্যাপে ক্লিক করুন।' : 'Could not fetch device GPS. Click on the map to set location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search Address / Landmark via OpenStreetMap Geocoding API
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, Bangladesh`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.4 });
          handleCoordinatesSelected(lat, lng);
        }
      } else {
        alert(isBn ? 'কোনো এলাকা পাওয়া যায়নি। ম্যাপে ক্লিক করে বেছে নিন।' : 'No location found. Please click directly on the map.');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`;

  return (
    <div className="w-full rounded-3xl overflow-hidden border-2 border-red-100 shadow-xl bg-white flex flex-col">
      {/* Map Header with search bar, layer controls, and GPS */}
      <div className="p-4 bg-zinc-50 border-b border-zinc-200/80 flex flex-col gap-3">
        {/* Top row: search & GPS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box inside the map */}
          <form onSubmit={handleSearchAddress} className="flex-1 min-w-[240px] flex items-center gap-1.5">
            <div className="relative flex-1">
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'যেকোনো এলাকা, হাসপাতাল বা রোড লিখে খুঁজুন…' : 'Search any area, hospital, or street in Bangladesh…'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
            >
              {searching ? (isBn ? 'খুঁজছি…' : 'Searching…') : isBn ? 'খুঁজুন' : 'Search'}
            </button>
          </form>

          {/* Quick Actions: GPS & External Maps */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:border-red-400 text-xs font-bold text-zinc-700 hover:text-red-600 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title={isBn ? 'আমার বর্তমান জিপিএস অবস্থান' : 'Locate my GPS position'}
            >
              <svg
                className={`w-3.5 h-3.5 text-red-500 ${locating ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              <span>{locating ? (isBn ? 'শনাক্ত হচ্ছে…' : 'Locating…') : isBn ? 'আমার অবস্থান' : 'Locate Me'}</span>
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:border-red-400 text-xs font-bold text-zinc-700 hover:text-red-600 flex items-center gap-1.5 shadow-sm transition-all"
              title={isBn ? 'গুগল ম্যাপস অ্যাপ বা ওয়েবসাইটে খুলুন' : 'Open in Google Maps website/app'}
            >
              <span>🗺️ Google Maps</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom row: active pinned location & Layer Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold text-zinc-800">
              {isBn ? 'নির্বাচিত অবস্থান:' : 'Selected Location:'}
            </span>
            <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
              📍 {pinnedLocationName}
            </span>
          </div>

          {/* Layer switcher: Google Streets / Google Satellite / OSM */}
          <div className="inline-flex rounded-xl bg-zinc-200/80 p-0.5">
            <button
              type="button"
              onClick={() => handleSwitchLayer('googleRoads')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'googleRoads' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {isBn ? 'গুগল রোডম্যাপ' : 'Google Streets'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLayer('googleSatellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'googleSatellite' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {isBn ? 'স্যাটেলাইট' : 'Satellite'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLayer('osm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'osm' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              OSM
            </button>
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: height }} />

        {/* Floating guidance helper */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2 text-xs font-semibold text-zinc-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>
              {isBn
                ? 'ম্যাপের যেকোনো জায়গায় ক্লিক করুন অথবা লাল পিন টেনে অবস্থান নির্ধারণ করুন'
                : 'Click anywhere on the map or drag the red blood pin to select location'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-white border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div>
          <span className="font-semibold text-zinc-700">{isBn ? 'স্থানাঙ্ক:' : 'Coordinates:'}</span>{' '}
          <span className="font-mono text-zinc-800 font-bold">
            {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 font-bold">✓ {isBn ? '৬৪ জেলা লাইভ সংযুক্ত' : 'All 64 Districts Active'}</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLocationMap;
