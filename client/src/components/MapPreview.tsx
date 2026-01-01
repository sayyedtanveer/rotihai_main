import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState, useEffect } from "react";

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  address: string;
  onLocationSelect: (latitude: number, longitude: number) => void;
}

// Interactive map event handler
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export default function MapPreview({
  latitude,
  longitude,
  address,
  onLocationSelect,
}: MapPreviewProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    latitude,
    longitude,
  ]);

  useEffect(() => {
    setMarkerPosition([latitude, longitude]);
  }, [latitude, longitude]);

  const handleMapClick = (lat: number, lon: number) => {
    setMarkerPosition([lat, lon]);
    onLocationSelect(lat, lon);
  };

  return (
    <div style={{ height: "300px", width: "100%", position: "relative" }}>
      <MapContainer
        center={[markerPosition[0], markerPosition[1]]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={markerPosition}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Your Delivery Location</p>
              <p className="text-xs text-gray-600 mt-1">{address}</p>
              <p className="text-xs text-gray-600 mt-1">
                {markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
              </p>
              <p className="text-xs text-blue-600 mt-2 font-semibold">
                Click anywhere to adjust location
              </p>
            </div>
          </Popup>
        </Marker>
        <MapClickHandler onLocationSelect={handleMapClick} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-3 py-2 rounded-md text-xs text-gray-700 pointer-events-none">
        <p className="font-semibold">Click on map to select exact location</p>
      </div>
    </div>
  );
}
