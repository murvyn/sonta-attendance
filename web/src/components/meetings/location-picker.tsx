'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = {
  lat: 5.6037,
  lng: -0.1870,
};

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

export function LocationPicker({
  latitude,
  longitude,
  radius,
  locationName,
  locationAddress,
  onChange,
}: LocationPickerProps) {
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAutocompleteSelecting, setIsAutocompleteSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Attach Google Places Autocomplete directly to the input element
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        setIsAutocompleteSelecting(true);
        onChange({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          radius,
          locationName: place.name || place.formatted_address?.split(',')[0] || locationName,
          locationAddress: place.formatted_address || locationAddress,
        });
        setSearchError(null);
        setTimeout(() => setIsAutocompleteSelecting(false), 300);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded]); // Only run once when maps loads

  // Update the autocomplete callback refs when props change
  useEffect(() => {
    if (!autocompleteRef.current) return;

    google.maps.event.clearListeners(autocompleteRef.current, 'place_changed');
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.geometry?.location) {
        setIsAutocompleteSelecting(true);
        onChange({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          radius,
          locationName: place.name || place.formatted_address?.split(',')[0] || locationName,
          locationAddress: place.formatted_address || locationAddress,
        });
        setSearchError(null);
        setTimeout(() => setIsAutocompleteSelecting(false), 300);
      }
    });
  }, [radius, locationName, locationAddress, onChange]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (isAutocompleteSelecting) {
      return;
    }
    if (e.latLng) {
      onChange({
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng(),
        radius,
        locationName,
        locationAddress,
      });
    }
  }, [radius, locationName, locationAddress, onChange, isAutocompleteSelecting]);

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
          setSearchError(null);
        },
        () => {
          setSearchError('Unable to get current location');
        }
      );
    }
  };

  if (loadError) {
    return (
      <div className="h-75 rounded-md border bg-muted flex items-center justify-center">
        <p className="text-sm text-red-500">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-75 rounded-md border bg-muted flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const center = latitude && longitude
    ? { lat: latitude, lng: longitude }
    : defaultCenter;

  return (
    <div className="space-y-4">
      {/* Search with Google Places Autocomplete */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a location..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {searchError && (
        <p className="text-sm text-red-500">{searchError}</p>
      )}

      {/* Google Map */}
      <div className="rounded-md border overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={latitude ? 15 : 10}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {latitude && longitude && (
            <>
              <Marker position={{ lat: latitude, lng: longitude }} />
              <Circle
                center={{ lat: latitude, lng: longitude }}
                radius={radius}
                options={{
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2,
                }}
              />
            </>
          )}
        </GoogleMap>
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
