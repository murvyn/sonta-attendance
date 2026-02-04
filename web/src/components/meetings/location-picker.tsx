'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMapEvents } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  radius: number;
  locationName: string;
  locationAddress?: string;
  onChange: (data: {
    latitude: number;
    longitude: number;
    radius: number;
    locationName: string;
    locationAddress?: string;
  }) => void;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  radius,
  locationName,
  locationAddress,
  onChange,
}: LocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Fix default marker icon
    import('leaflet').then((L) => {
      // Import CSS
      require('leaflet/dist/leaflet.css');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    onChange({
      latitude: lat,
      longitude: lng,
      radius,
      locationName,
      locationAddress,
    });
  }, [radius, locationName, locationAddress, onChange]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        onChange({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          radius,
          locationName: result.display_name.split(',')[0],
          locationAddress: result.display_name,
        });
      } else {
        setSearchError('Location not found');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radius,
            locationName: locationName || 'Current Location',
            locationAddress,
          });
        },
        (error) => {
          setSearchError('Unable to get current location');
        }
      );
    }
  };

  if (!isClient) {
    return (
      <div className="h-[300px] rounded-md border bg-muted flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
        <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {searchError && (
        <p className="text-sm text-red-500">{searchError}</p>
      )}

      {/* Map */}
      <div className="h-[300px] rounded-md border overflow-hidden">
        <MapContainer
          center={[latitude || 5.6037, longitude || -0.1870]}
          zoom={latitude ? 15 : 10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latitude && longitude && (
            <>
              <Marker position={[latitude, longitude]} />
              <Circle
                center={[latitude, longitude]}
                radius={radius}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
              />
            </>
          )}
          <MapClickHandler onClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Coordinates display */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Latitude:</span>{' '}
          <span className="font-mono">{latitude?.toFixed(6) || '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Longitude:</span>{' '}
          <span className="font-mono">{longitude?.toFixed(6) || '-'}</span>
        </div>
      </div>

      {/* Geofence Radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Geofence Radius</Label>
          <span className="text-sm text-muted-foreground">{radius}m</span>
        </div>
        <Slider
          value={[radius]}
          onValueChange={([value]) => onChange({
            latitude,
            longitude,
            radius: value,
            locationName,
            locationAddress,
          })}
          min={10}
          max={500}
          step={10}
        />
        <p className="text-xs text-muted-foreground">
          Users must be within this radius to check in
        </p>
      </div>

      {/* Location Name */}
      <div className="space-y-2">
        <Label htmlFor="locationName">Location Name</Label>
        <Input
          id="locationName"
          placeholder="e.g., Main Conference Room"
          value={locationName}
          onChange={(e) => onChange({
            latitude,
            longitude,
            radius,
            locationName: e.target.value,
            locationAddress,
          })}
        />
      </div>

      {/* Location Address */}
      <div className="space-y-2">
        <Label htmlFor="locationAddress">Address (optional)</Label>
        <Input
          id="locationAddress"
          placeholder="Full address..."
          value={locationAddress || ''}
          onChange={(e) => onChange({
            latitude,
            longitude,
            radius,
            locationName,
            locationAddress: e.target.value,
          })}
        />
      </div>
    </div>
  );
}
