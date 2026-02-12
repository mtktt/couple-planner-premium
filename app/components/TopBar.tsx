"use client";

import { useEffect, useState } from "react";

export default function TopBar() {
  const [timeTH, setTimeTH] = useState("");
  const [timeKR, setTimeKR] = useState("");
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeTH(now.toLocaleString("en-GB", { timeZone: "Asia/Bangkok" }));
      setTimeKR(now.toLocaleString("en-GB", { timeZone: "Asia/Seoul" }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchWeather() {
      const key = "41dd791082d70da6db0ea79d4dc94406";

      const maeSai = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Mae Sai,TH&units=metric&appid=${key}`
      ).then(res => res.json());

      const seoul = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Seoul,KR&units=metric&appid=${key}`
      ).then(res => res.json());

      setWeather({
        maeSai: maeSai.main?.temp,
        seoul: seoul.main?.temp
      });
    }
    fetchWeather();
  }, []);

  return (
    <div className="card p-4 flex justify-between text-sm mb-6">
      <div>
        🇹🇭 {timeTH}
        <br />
        🇰🇷 {timeKR}
      </div>
      <div>
        🌤 Mae Sai {weather?.maeSai ?? "--"}°C
        <br />
        🌤 Seoul {weather?.seoul ?? "--"}°C
      </div>
    </div>
  );
}
