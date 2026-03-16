import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function AdjustCamera({ bounds }) {
  const map = useMap();
  if (bounds) {
    const leafletBounds = [
      [bounds[1], bounds[0]], // [lat, lng]
      [bounds[3], bounds[2]], // [lat, lng]
    ];
    map.fitBounds(leafletBounds, { padding: [50, 50] });
  }
  return null;
}

export default function RouteMap({
  origin,
  destination,
  originNumber,
  destinationNumber,
  routeData,
}) {
  // Default center focused on Americana/SP
  const defaultCenter = [-22.739, -47.3314];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {origin && (
        <CircleMarker
          center={[origin[1], origin[0]]}
          radius={7}
          pathOptions={{
            color: "white",
            fillColor: "#2563eb",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>Origin: No. {originNumber}</Popup>
        </CircleMarker>
      )}

      {destination && (
        <CircleMarker
          center={[destination[1], destination[0]]}
          radius={7}
          pathOptions={{
            color: "white",
            fillColor: "#10b981",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>Destination: No. {destinationNumber}</Popup>
        </CircleMarker>
      )}

      {routeData?.mapPreview && (
        <>
          <GeoJSON
            key={JSON.stringify(routeData.mapPreview.geometry.coordinates)}
            data={routeData.mapPreview.geometry}
            style={{ color: "#2563eb", weight: 5 }}
          />
          <AdjustCamera bounds={routeData.mapPreview.bounds} />
        </>
      )}
    </MapContainer>
  );
}
