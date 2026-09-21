__mods["js/weatherService.js"] = (() => {
const WEATHER_ENDPOINT='https://api.open-meteo.com/v1/forecast';
const WEATHER_TIMEOUT_MS=8000;
let currentWeatherPromise=null;

function weatherCondition(code) {
  if(code===0) return '맑음';
  if(code===1 || code===2) return '구름 조금';
  if(code===3 || code===45 || code===48) return '흐림';
  if((code>=51 && code<=67) || (code>=80 && code<=82) || code>=95) return '비';
  if((code>=71 && code<=77) || code===85 || code===86) return '눈';
  return '';
}

function requestCurrentPosition(geolocation) {
  return new Promise((resolve,reject)=>{
    if(!geolocation?.getCurrentPosition) {reject(new Error('Geolocation unavailable'));return;}
    geolocation.getCurrentPosition(
      position=>resolve(position?.coords),
      reject,
      {enableHighAccuracy:false,timeout:8000,maximumAge:30*60*1000}
    );
  });
}

async function fetchCurrentWeather(coords,{fetchImpl=globalThis.fetch,setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  const latitude=Number(coords?.latitude),longitude=Number(coords?.longitude);
  if(!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180 || typeof fetchImpl!=='function') throw new Error('Invalid weather request');
  const params=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:'temperature_2m,weather_code',forecast_days:'1'});
  const controller=new AbortController();
  const timer=setTimer(()=>controller.abort(),WEATHER_TIMEOUT_MS);
  try {
    const response=await fetchImpl(`${WEATHER_ENDPOINT}?${params}`,{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response?.ok) throw new Error('Weather request failed');
    const payload=await response.json();
    const temperature=Number(payload?.current?.temperature_2m);
    const condition=weatherCondition(Number(payload?.current?.weather_code));
    if(!Number.isFinite(temperature) || !condition) throw new Error('Invalid weather response');
    return {condition,temperature:Math.round(temperature)};
  } finally {
    clearTimer(timer);
  }
}

function loadCurrentWeather({geolocation=globalThis.navigator?.geolocation,fetchImpl=globalThis.fetch,setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  if(!currentWeatherPromise) {
    currentWeatherPromise=requestCurrentPosition(geolocation)
      .then(coords=>fetchCurrentWeather(coords,{fetchImpl,setTimer,clearTimer}))
      .catch(()=>null);
  }
  return currentWeatherPromise;
}

return { weatherCondition, requestCurrentPosition, fetchCurrentWeather, loadCurrentWeather };
})();
