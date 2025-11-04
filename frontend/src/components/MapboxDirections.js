import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your Mapbox token

const MapboxDirections = ({ places }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) map.current.remove(); // Destroy previous map

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: places.length ? [places[0].lng, places[0].lat] : [0, 0],
      zoom: 12
    });

    places.forEach(p => {
      new mapboxgl.Marker()
        .setLngLat([p.lng, p.lat])
        .setPopup(new mapboxgl.Popup().setText(p.name))
        .addTo(map.current);
    });

    // You can add routing/directions logic here as needed.

    return () => map.current.remove();
  }, [places]);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px', borderRadius: '1rem' }} />;
};

export default MapboxDirections;
