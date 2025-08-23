import { useEffect, useRef, useState } from 'react';

interface MapLocation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface GoogleMapProps {
  locations: MapLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMap({ 
  locations, 
  center = { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
  zoom = 12,
  height = "400px",
  className = ""
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCQhJUXilyfLmEe1okRqy8U03KxugVX3g4'}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setMapLoaded(true);
      initializeMap();
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    setMap(mapInstance);

    // Add markers for each location
    locations.forEach((location, index) => {
      if (location.lat && location.lng) {
        addMarker(mapInstance, location, index);
      } else {
        // Geocode the address to get coordinates
        geocodeAddress(mapInstance, location, index);
      }
    });

    // Fit map to show all markers if we have multiple locations
    if (locations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(location => {
        if (location.lat && location.lng) {
          bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
        }
      });
      mapInstance.fitBounds(bounds);
    }
  };

  const geocodeAddress = (mapInstance: any, location: MapLocation, index: number) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: `${location.address}, ${location.name}` }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const position = results[0].geometry.location;
        addMarker(mapInstance, {
          ...location,
          lat: position.lat(),
          lng: position.lng()
        }, index);
      } else {
        console.warn(`Geocoding failed for ${location.name}: ${status}`);
      }
    });
  };

  const addMarker = (mapInstance: any, location: MapLocation & { lat: number; lng: number }, index: number) => {
    const marker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstance,
      title: location.name,
      label: (index + 1).toString(),
      animation: window.google.maps.Animation.DROP
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold;">${location.name}</h3>
          <p style="margin: 0; font-size: 14px; color: #666;">${location.address}</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstance, marker);
    });
  };

  if (!mapLoaded && !window.google) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg shadow-md ${className}`}
      style={{ height }}
    />
  );
}
