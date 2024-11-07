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

const MapComponent: React.FC<MapProps> = ({ lat, lon, zoom, points }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

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

    // Only add the heat layer when the map is fully initialized
    mapRef.current?.whenReady(() => {
      if (mapRef.current) {
        // Clear existing heat layer if it exists
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.heatLayer) {
            mapRef.current?.removeLayer(layer);
          }
        });

        // Add heat layer with the provided points
        const heatLayer = L.heatLayer(
          points.map((point) => [point.lat, point.lng, point.intensity]),
          {
            radius: 50,
            blur: 15,
            maxZoom: 15,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' },
          }
        );

        heatLayer.addTo(mapRef.current);
      }
    });

    return () => {
      // Clean up map on unmount
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, zoom, points]);

  return <MapContainer ref={mapContainerRef} />;
};

export default MapComponent;
