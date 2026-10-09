import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';
import { hapticImpact } from '../../utils/telegram';

// Fix Leaflet standard marker icon URL issue in React/Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  address: string;
  onChange: (lat: number, lng: number, address: string) => void;
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      hapticImpact('light');
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return (
    <Marker
      position={position}
      icon={defaultIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          hapticImpact('light');
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    />
  );
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  address,
  onChange,
}) => {
  const [position, setPosition] = useState<[number, number]>([
    lat || 41.311081,
    lng || 69.240562,
  ]); // Default Tashkent coordinates
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Reverse geocoding helper using OpenStreetMap Nominatim
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'uz,ru,en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          return data.display_name;
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding error', e);
    }
    return `Lokatsiya: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  };

  const handlePositionChange = async (newPos: [number, number]) => {
    setPosition(newPos);
    const newAddress = await reverseGeocode(newPos[0], newPos[1]);
    onChange(newPos[0], newPos[1], newAddress);
  };

  const handleGetCurrentLocation = () => {
    hapticImpact('medium');
    if (!navigator.geolocation) {
      alert('Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        await handlePositionChange(newPos);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert('Geolokatsiyani aniqlab bo\'lmadi. Xaritadan nuqtani tanlang.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          Xaritadan manzilni belgilang
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
        >
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Aniqlanmoqda...' : 'Mening joylashuvim'}
        </button>
      </div>

      {/* Map View */}
      <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      {/* Address Manual Edit / Confirmation */}
      <div className="space-y-1">
        <textarea
          rows={2}
          value={address}
          onChange={(e) => onChange(position[0], position[1], e.target.value)}
          placeholder="Aniq manzil, ko'cha, xonadon, eshik kodi..."
          className="w-full text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="text-[10px] text-slate-400 flex justify-between px-1">
          <span>Lat: {position[0].toFixed(5)}</span>
          <span>Lng: {position[1].toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
};
