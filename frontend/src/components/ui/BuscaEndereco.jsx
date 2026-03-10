import { useState, useEffect } from "react";

export default function BuscaEndereco({ placeholder, onEnderecoSelecionado }) {
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [foco, setFoco] = useState(false);

  useEffect(() => {
    if (busca.length < 3) {
      setSugestoes([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCarregando(true);
      try {
        // A busca continua priorizando a região de Americana via viewbox
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${busca}&bounded=0&viewbox=-47.50,-22.80,-47.20,-22.60&limit=5`,
        );
        const data = await response.json();
        setSugestoes(data);
      } catch (error) {
        console.error("Erro ao buscar endereço:", error);
      } finally {
        setCarregando(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  // Função para formatar o endereço de forma simplificada
  const formatarEndereco = (local) => {
    const ad = local.address;
    if (!ad) return local.display_name.split(",")[0];

    // Tenta pegar o nome da via (road), se não tiver, pega o nome principal do local
    const rua =
      ad.road || ad.pedestrian || ad.suburb || local.display_name.split(",")[0];
    const numero = ad.house_number ? `, ${ad.house_number}` : "";
    const bairro = ad.neighbourhood || ad.suburb || "";

    return `${rua}${numero}${bairro ? " - " + bairro : ""}`;
  };

  const selecionarEndereco = (local) => {
    const enderecoLimpo = formatarEndereco(local);

    setBusca(enderecoLimpo); // Define o texto limpo no input
    setSugestoes([]);
    setFoco(false);

    onEnderecoSelecionado([parseFloat(local.lon), parseFloat(local.lat)]);
  };

  return (
    <div style={{ position: "relative", width: "300px" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onFocus={() => setFoco(true)}
        style={{
          padding: "10px",
          width: "100%",
          boxSizing: "border-box",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />

      {foco && sugestoes.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            listStyle: "none",
            padding: 0,
            margin: "5px 0 0 0",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {carregando && (
            <li style={{ padding: "10px", color: "#666", fontSize: "13px" }}>
              Buscando...
            </li>
          )}

          {sugestoes.map((local) => {
            const enderecoCurto = formatarEndereco(local);
            const cidade =
              local.address.city ||
              local.address.town ||
              local.address.village ||
              "";

            return (
              <li
                key={local.place_id}
                onClick={() => selecionarEndereco(local)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseOut={(e) => (e.currentTarget.style.background = "white")}
              >
                <div
                  style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
                >
                  {enderecoCurto}
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  {cidade}{" "}
                  {local.address.state ? `- ${local.address.state}` : ""}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
