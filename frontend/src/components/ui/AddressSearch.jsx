import { useState, useEffect } from "react";

export default function AddressSearch({ placeholder, onAddressSelected }) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (search.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // The search continues to prioritize the Americana region via viewbox
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${search}&bounded=0&viewbox=-47.50,-22.80,-47.20,-22.60&limit=5`,
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching address:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Function to format the address in a simplified way
  const formatAddress = (location) => {
    const ad = location.address;
    if (!ad) return location.display_name.split(",")[0];

    // Tries to get the road name, if not available, gets the main name of the location
    const street =
      ad.road ||
      ad.pedestrian ||
      ad.suburb ||
      location.display_name.split(",")[0];
    const number = ad.house_number ? `, ${ad.house_number}` : "";
    const neighborhood = ad.neighbourhood || ad.suburb || "";

    return `${street}${number}${neighborhood ? " - " + neighborhood : ""}`;
  };

  const selectAddress = (location) => {
    const cleanAddress = formatAddress(location);

    setSearch(cleanAddress); // Sets the clean text in the input
    setSuggestions([]);
    setIsFocused(false);

    onAddressSelected([parseFloat(location.lon), parseFloat(location.lat)]);
  };

  return (
    <div style={{ position: "relative", width: "300px" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsFocused(true)}
        style={{
          padding: "10px",
          width: "100%",
          boxSizing: "border-box",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />

      {isFocused && suggestions.length > 0 && (
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
          {loading && (
            <li style={{ padding: "10px", color: "#666", fontSize: "13px" }}>
              Searching...
            </li>
          )}

          {suggestions.map((location) => {
            const shortAddress = formatAddress(location);
            const city =
              location.address.city ||
              location.address.town ||
              location.address.village ||
              "";

            return (
              <li
                key={location.place_id}
                onClick={() => selectAddress(location)}
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
                  {shortAddress}
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  {city}{" "}
                  {location.address.state ? `- ${location.address.state}` : ""}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
