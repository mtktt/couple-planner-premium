"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../lib/firebase";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4"
];

const HOUR_HEIGHT = 60;

export default function Calendar() {

  const year = 2026;
  const [month,setMonth] = useState(1);
  const [events,setEvents] = useState<any[]>([]);
  const [selectedDate,setSelectedDate] = useState<string|null>(null);
  const [editingId,setEditingId] = useState<string|null>(null);

  const [form,setForm] = useState({
    title:"",
    start:"",
    end:"",
    color:COLORS[0]
  });

  const [thTime,setThTime]=useState("");
  const [krTime,setKrTime]=useState("");
  const [thTemp,setThTemp]=useState<number|null>(null);
  const [krTemp,setKrTemp]=useState<number|null>(null);

  /* ================= FIRESTORE REALTIME ================= */
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"events"),snap=>{
      setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[]);

  /* ================= REALTIME CLOCK ================= */
  useEffect(()=>{
    const interval=setInterval(()=>{
      setThTime(new Date().toLocaleString("en-GB",{timeZone:"Asia/Bangkok"}));
      setKrTime(new Date().toLocaleString("en-GB",{timeZone:"Asia/Seoul"}));
    },1000);
    return ()=>clearInterval(interval);
  },[]);

  /* ================= REALTIME WEATHER ================= */
  useEffect(()=>{

    const fetchWeather = async () => {
      try {

        const thRes = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=20.432&longitude=99.876&current_weather=true"
        );
        const thData = await thRes.json();
        setThTemp(thData.current_weather.temperature);

        const krRes = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current_weather=true"
        );
        const krData = await krRes.json();
        setKrTemp(krData.current_weather.temperature);

      } catch (err) {
        console.log("Weather error", err);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return ()=>clearInterval(interval);

  },[]);

  /* ================= SAVE EVENT ================= */
  const saveEvent=async()=>{
    if(!selectedDate||!form.title||!form.start||!form.end) return;

    const [sh,sm]=form.start.split(":").map(Number);
    const [eh,em]=form.end.split(":").map(Number);

    const startMinutes=sh*60+sm;
    const endMinutes=eh*60+em;

    if(endMinutes<=startMinutes) return;

    if(editingId){
      await updateDoc(doc(db,"events",editingId),{
        title:form.title,
        startMinutes,
        endMinutes,
        color:form.color
      });
    } else {
      await addDoc(collection(db,"events"),{
        date:selectedDate,
        title:form.title,
        startMinutes,
        endMinutes,
        color:form.color
      });
    }

    setEditingId(null);
    setForm({title:"",start:"",end:"",color:COLORS[0]});
  };

  const editEvent=(e:any)=>{
    setEditingId(e.id);
    setForm({
      title:e.title,
      start:formatTime(e.startMinutes),
      end:formatTime(e.endMinutes),
      color:e.color
    });
  };

  const deleteEventHandler=async()=>{
    if(!editingId) return;
    await deleteDoc(doc(db,"events",editingId));
    setEditingId(null);
  };

  const formatTime=(mins:number)=>{
    const h=Math.floor(mins/60);
    const m=mins%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  };

  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=new Date(year,month,1).getDay();

  return (
    <div>

      {/* HEADER */}
      <div className="header flex justify-between items-center px-6 md:px-20 py-6 md:py-8">
        <button onClick={()=>setMonth(m=>m===0?11:m-1)}>←</button>
        <h1 className="text-3xl md:text-6xl font-bold text-[#3E256A] text-center">
          {new Date(year,month).toLocaleString("default",{month:"long"})} {year}
        </h1>
        <button onClick={()=>setMonth(m=>m===11?0:m+1)}>→</button>
      </div>

      <div className="w-full px-6 md:px-20 mt-10 flex flex-col md:flex-row gap-10 md:gap-16">

        {/* ================= MONTH VIEW ================= */}
        <div className="flex-1">

          <div className="grid grid-cols-7 mb-6 text-center font-semibold text-[#3E256A] text-xl">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-6">
            {Array.from({length:firstDay}).map((_,i)=>(<div key={i}/>))}

            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1;
              const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayEvents=events.filter(e=>e.date===dateStr);

              return(
                <div key={day}
                  className="month-cell"
                  onClick={()=>setSelectedDate(dateStr)}>
                  <div className="day-number">{day}</div>

                  {dayEvents.slice(0,3).map(e=>(
                    <div key={e.id}
                      style={{background:e.color}}
                      className="event-pill">
                      {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="w-full md:w-[480px] flex flex-col gap-10">

          {/* TIME + WEATHER CARD */}
          <div className="info-card">

            <div className="flex items-center gap-4">
              <img src="https://flagcdn.com/w40/th.png" className="w-8"/>
              <div>
                <div className="text-[#3E256A] font-semibold">
                  TH {thTime}
                </div>
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm mt-1 inline-block">
                  Mae Sai {thTemp !== null ? `${thTemp}°C` : "..."}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <img src="https://flagcdn.com/w40/kr.png" className="w-8"/>
              <div>
                <div className="text-[#3E256A] font-semibold">
                  KR {krTime}
                </div>
                <div className="bg-black text-white px-3 py-1 rounded-full text-sm mt-1 inline-block">
                  Seoul {krTemp !== null ? `${krTemp}°C` : "..."}
                </div>
              </div>
            </div>

          </div>

          {/* DAY TIMELINE */}
          {selectedDate && (
            <div>

              <div className="text-3xl font-bold text-[#3E256A] mb-4">
                {selectedDate}
              </div>

              <div className="timeline-panel max-h-[400px] md:max-h-[520px]">
                <div className="relative h-[1440px]">

                  {Array.from({length:24}).map((_,i)=>(
                    <div key={i} className="hour-line">
                      {String(i).padStart(2,"0")}:00
                    </div>
                  ))}

                  {events
                    .filter(e=>e.date===selectedDate)
                    .map((e,index,arr)=>{

                      const overlapping = arr.filter(other =>
                        !(other.endMinutes <= e.startMinutes || other.startMinutes >= e.endMinutes)
                      );

                      const overlapIndex = overlapping.findIndex(o=>o.id===e.id);
                      const widthPercent = 70 / overlapping.length;
                      const leftPercent = 20 + (overlapIndex * widthPercent);

                      const top = e.startMinutes/60*HOUR_HEIGHT;
                      const height = ((e.endMinutes-e.startMinutes)/60*HOUR_HEIGHT)-2;

                      return(
                        <div key={e.id}
                          onClick={()=>editEvent(e)}
                          style={{
                            position:"absolute",
                            top,
                            left:`${leftPercent}%`,
                            width:`${widthPercent}%`,
                            height,
                            background:e.color,
                            borderRadius:16,
                            padding:12,
                            color:"white",
                            cursor:"pointer",
                            overflow:"hidden"
                          }}>
                          {e.title}
                        </div>
                      );
                    })}

                </div>
              </div>

              {/* FORM */}
              <div className="mt-10 bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-lg space-y-5 border border-white/40">

                {/* TITLE */}
                <input
                  placeholder="Event Title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="
                    w-full 
                    px-5 py-4 
                    text-lg 
                    rounded-2xl 
                    border border-gray-200
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-purple-400
                    transition
                    shadow-sm
                    bg-white
                  "
                />

                {/* TIME */}
                <div className="flex gap-4">

                  <input
                    type="time"
                    value={form.start}
                    onChange={e => setForm({ ...form, start: e.target.value })}
                    className="
                      w-full 
                      px-4 py-3 
                      rounded-xl 
                      border border-gray-200
                      shadow-sm
                      text-lg
                      focus:ring-2 focus:ring-purple-400
                      outline-none
                    "
                  />

                  <input
                    type="time"
                    value={form.end}
                    onChange={e => setForm({ ...form, end: e.target.value })}
                    className="
                      w-full 
                      px-4 py-3 
                      rounded-xl 
                      border border-gray-200
                      shadow-sm
                      text-lg
                      focus:ring-2 focus:ring-purple-400
                      outline-none
                    "
                  />

                </div>

                {/* COLOR PICKER */}
                <div className="flex gap-3 mt-2">

                  {COLORS.map(color => (

                    <div
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      style={{
                        backgroundColor: color,
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        cursor: "pointer",
                        boxShadow: form.color === color
                          ? "0 0 0 4px black"
                          : "0 2px 6px rgba(255, 252, 252, 0.15)"
                      }}
                    />

                  ))}

                </div>

                {/* SAVE BUTTON */}
                <button
                  onClick={saveEvent}
                  className="
                    w-full
                    py-4
                    rounded-2xl
                    text-lg
                    font-bold
                    bg-gradient-to-r from-purple-500 to-indigo-500
                    text-white
                    shadow-md
                    hover:scale-[1.02]
                    hover:shadow-lg
                    transition
                  "
                >
                  {editingId ? "Update Event" : "Save Event"}
                </button>

                {/* DELETE */}
                {editingId && (
                  <button
                    onClick={deleteEventHandler}
                    className="
                      w-full
                      py-3
                      rounded-2xl
                      text-lg
                      font-bold
                      bg-red-500
                      text-white
                      shadow
                      hover:bg-red-600
                      transition
                    "
                  >
                    Delete Event
                  </button>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}