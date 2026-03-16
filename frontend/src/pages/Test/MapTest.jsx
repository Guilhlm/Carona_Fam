import { useState } from "react";
import AddressSearch from "../../components/route/AddressSearch";
import RouteMap from "../../components/route/RouteMap";

export default function TestScreen() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [originNumber, setOriginNumber] = useState("");
  const [destinationNumber, setDestinationNumber] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      alert("Por favor, selecione a origem e o destino no mapa.");
      return;
    }

    setLoadingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full`,
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        const coords = route.geometry.coordinates;
        const lons = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        const bounds = [
          Math.min(...lons),
          Math.min(...lats),
          Math.max(...lons),
          Math.max(...lats),
        ];

        setRouteData({
          mapPreview: {
            geometry: route.geometry,
            bounds: bounds,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao traçar rota:", error);
      alert("Falha ao calcular a rota.");
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "350px",
          padding: "20px",
          borderRight: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ margin: 0, color: "#1f2937" }}>Teste de Carona</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{ fontSize: "14px", fontWeight: "bold", color: "#374151" }}
          >
            Partida
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <AddressSearch
                placeholder="Buscar endereço..."
                onAddressSelected={setOrigin}
              />
            </div>
            <input
              type="text"
              placeholder="Nº"
              value={originNumber}
              onChange={(e) => setOriginNumber(e.target.value)}
              style={{
                width: "60px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{ fontSize: "14px", fontWeight: "bold", color: "#374151" }}
          >
            Chegada
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <AddressSearch
                placeholder="Buscar endereço..."
                onAddressSelected={setDestination}
              />
            </div>
            <input
              type="text"
              placeholder="Nº"
              value={destinationNumber}
              onChange={(e) => setDestinationNumber(e.target.value)}
              style={{
                width: "60px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCalculateRoute}
          disabled={loadingRoute}
          style={{
            marginTop: "auto",
            padding: "12px",
            backgroundColor: loadingRoute ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loadingRoute ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            transition: "background-color 0.2s",
          }}
        >
          {loadingRoute ? "Calculando..." : "Traçar Rota"}
        </button>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            height: "100%",
            width: "100%",
            zIndex: 0,
            position: "absolute",
          }}
        >
          <RouteMap
            origin={origin}
            destination={destination}
            originNumber={originNumber}
            destinationNumber={destinationNumber}
            routeData={routeData}
          />
        </div>
      </div>
    </div>
  );
}
