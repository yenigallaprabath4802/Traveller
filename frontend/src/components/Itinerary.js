import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MapboxDirections from './MapboxDirections';
import { MapPin, Navigation } from 'lucide-react';

function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { places = [], searchType = 'hotels' } = location.state || {};

  if (!places.length) {
    return (
      <div className="p-8">
        <p>No itinerary data found. Please search first.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-travel-blue via-cyan-500 to-travel-green p-8">
      <button
        onClick={() => navigate('/')}
        className="mb-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        &larr; Back to Search
      </button>

      <h1 className="text-white text-3xl font-bold mb-6">
        Your {searchType.charAt(0).toUpperCase() + searchType.slice(1)} Itinerary
      </h1>

      <MapboxDirections
        places={places.map(p => ({
          name: p.name,
          lat: p.geocodes.main.latitude,
          lng: p.geocodes.main.longitude,
        }))}
      />

      <div className="mt-8 bg-white/20 rounded-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-white text-xl mb-4">Places List</h2>
        <ul className="list-disc list-inside text-white/90">
          {places.map(p => (
            <li key={p.fsq_id} className="mb-2">
              <strong>{p.name}</strong> — {p.location?.formatted_address || 'No address'} <MapPin className="inline h-4 w-4 ml-2" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Itinerary;
