import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { MapContainer } from './DashboardStyles';

interface MapProps {
  lat: number;
  lon: number;
  zoom: number;
  points: Array<{ lat: number; lng: number; intensity: number }>;
}

const MapComponent: React.FC<MapProps> = React.memo(({ lat, lon, zoom, points }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize the map and add a tile layer
      mapRef.current = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: zoom,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }
    // Handle window resize to prevent errors
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [lat, lon, zoom]);

  useEffect(() => {
    if (mapRef.current) {
      // Remove existing heat layer if it exists
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
      }

      // Create a new heat layer with updated points and add it to the map
      heatLayerRef.current = L.heatLayer(
        points.map((point) => [point.lat, point.lng, point.intensity]),
        {
          radius: 30,
          blur: 15,
          maxZoom: 15,
          gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
        }
      );

      heatLayerRef.current.addTo(mapRef.current);
    }
  }, [points]); // Re-run this effect only when `points` changes

  // Clean up map and heat layer on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <MapContainer ref={mapContainerRef} />;
});

export default MapComponent;
