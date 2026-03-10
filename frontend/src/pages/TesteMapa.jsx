import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import BuscaEndereco from "../components/ui/BuscaEndereco.jsx";

// Componente para focar a câmera na rota automaticamente
function AjustarCamera({ limites }) {
  const map = useMap();
  if (limites) {
    const bounds = [
      [limites[1], limites[0]], // Sudoeste
      [limites[3], limites[2]], // Nordeste
    ];
    map.fitBounds(bounds, { padding: [50, 50] });
  }
  return null;
}

export default function TesteMapa() {
  const [dadosRota, setDadosRota] = useState(null); // Agora guarda o objeto 'data' inteiro (com km e tempo)
  const [carregando, setCarregando] = useState(false);

  const [coordsOrigem, setCoordsOrigem] = useState(null);
  const [coordsDestino, setCoordsDestino] = useState(null);

  const buscarRotaNoBackend = async () => {
    if (!coordsOrigem || !coordsDestino) {
      alert("Por favor, selecione a origem e o destino nas listas.");
      return;
    }

    setCarregando(true);
    try {
      const response = await fetch("http://localhost:4000/api/mapa/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordenadas: [coordsOrigem, coordsDestino],
        }),
      });

      const json = await response.json();

      if (json.success) {
        // Guardamos o objeto 'data' que contém distanciaKm, tempoMinutos e mapaPreview
        setDadosRota(json.data);
      } else {
        alert("Erro na resposta da API");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: "15px",
        fontFamily: "sans-serif",
      }}
    >
      <header>
        <h2 style={{ margin: 0 }}>Simulador de Carona FAM</h2>
        <p style={{ color: "#666", fontSize: "14px" }}>
          Defina o trajeto para ver os detalhes da carona.
        </p>
      </header>

      {/* Painel de Busca */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          background: "#f8f9fa",
          padding: "15px",
          borderRadius: "12px",
          alignItems: "flex-end",
          flexWrap: "wrap",
          border: "1px solid #eee",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Partida
          </label>
          <BuscaEndereco
            placeholder="Onde você está?"
            onEnderecoSelecionado={setCoordsOrigem}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            Destino
          </label>
          <BuscaEndereco
            placeholder="Para onde vai?"
            onEnderecoSelecionado={setCoordsDestino}
          />
        </div>

        <button
          onClick={buscarRotaNoBackend}
          disabled={carregando}
          style={{
            padding: "10px 25px",
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            height: "40px",
          }}
        >
          {carregando ? "Calculando..." : "Ver Rota"}
        </button>
      </div>

      {/* Container do Mapa */}
      <div
        style={{
          flex: 1,
          position: "relative",
          borderRadius: "15px",
          overflow: "hidden",
          border: "1px solid #ddd",
        }}
      >
        {/* Card de Informações Flutuante (Só aparece se houver rota) */}
        {dadosRota && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              zIndex: 1000,
              background: "white",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
              border: "1px solid #eee",
              minWidth: "180px",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
              Resumo da Viagem
            </h4>
            <div style={{ fontSize: "14px", color: "#555" }}>
              <p style={{ margin: "5px 0" }}>
                <b>Distância:</b> {dadosRota.distanciaKm} km
              </p>
              <p style={{ margin: "5px 0" }}>
                <b>Tempo:</b> {dadosRota.tempoMinutos} min
              </p>
            </div>
          </div>
        )}

        <MapContainer
          center={[-22.739, -47.3314]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {/* Bolinha de Origem */}
          {coordsOrigem && (
            <CircleMarker
              center={[coordsOrigem[1], coordsOrigem[0]]}
              radius={7}
              pathOptions={{
                color: "white",
                fillColor: "#2563eb",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>Início</Popup>
            </CircleMarker>
          )}

          {/* Bolinha de Destino */}
          {coordsDestino && (
            <CircleMarker
              center={[coordsDestino[1], coordsDestino[0]]}
              radius={7}
              pathOptions={{
                color: "white",
                fillColor: "#10b981",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>FAM</Popup>
            </CircleMarker>
          )}

          {/* Rota GeoJSON */}
          {dadosRota?.mapaPreview && (
            <>
              <GeoJSON
                key={JSON.stringify(
                  dadosRota.mapaPreview.geometria.coordinates,
                )}
                data={dadosRota.mapaPreview.geometria}
                style={{ color: "#2563eb", weight: 5 }}
              />
              <AjustarCamera limites={dadosRota.mapaPreview.limites} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
