export function getCurrentPositionAsync(options) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation API indisponível'), { code: 0 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function getCurrentPositionCached(maxAgeMs, timeoutMs) {
  return getCurrentPositionAsync({
    enableHighAccuracy: false,
    maximumAge: maxAgeMs,
    timeout: timeoutMs,
  });
}

function getPositionWatchOnce(options, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation API indisponível'), { code: 0 }));
      return;
    }
    let settled = false;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(id);
        resolve(pos);
      },
      (err) => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(id);
        reject(err);
      },
      options
    );
    setTimeout(() => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(id);
      reject(Object.assign(new Error('watch timeout'), { code: 3 }));
    }, timeoutMs);
  });
}

export async function getBestEffortPosition() {
  const attempts = [
    { enableHighAccuracy: false, maximumAge: 0, timeout: 50000 },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 40000 },
    () => getCurrentPositionCached(600000, 12000),
    () => getCurrentPositionCached(3600000, 12000),
    () => getPositionWatchOnce({ enableHighAccuracy: false, maximumAge: 0, timeout: 20000 }, 22000),
  ];

  let lastError = new Error('unknown');
  for (const step of attempts) {
    try {
      if (typeof step === 'function') {
        return await step();
      }
      return await getCurrentPositionAsync(step);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function fetchApproximateLocationFromIp() {
  const tryGeoJs = async () => {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!res.ok) return null;
    const data = await res.json();
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon };
  };

  const tryIpApi = async () => {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon };
  };

  try {
    return (await tryGeoJs()) ?? (await tryIpApi());
  } catch {
    return null;
  }
}

export function geolocationErrorMessage(code) {
  switch (code) {
    case 1:
      return 'Permissão de localização negada. Você pode informar o endereço de partida manualmente.';
    case 2:
      return 'Não foi possível usar GPS/rede do dispositivo. No Windows: Configurações → Privacidade → Localização (ativada). Ou busque o endereço de partida no campo acima.';
    case 3:
      return 'Tempo esgotado ao obter a localização. Tente de novo ou informe o endereço manualmente.';
    default:
      return 'Não foi possível obter sua localização. Informe o local de partida na busca.';
  }
}