'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Circle, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onChange({
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng(),
        radius,
        locationName,
        locationAddress,
      });
    }
  }, [radius, locationName, locationAddress, onChange]);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        onChange({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          radius,
          locationName: place.name || place.formatted_address?.split(',')[0] || locationName,
          locationAddress: place.formatted_address || locationAddress,
        });
        setSearchError(null);
      }
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
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete;
            }}
            onPlaceChanged={handlePlaceChanged}
          >
            <Input
              placeholder="Search for a location..."
              className="w-full"
            />
          </Autocomplete>
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
