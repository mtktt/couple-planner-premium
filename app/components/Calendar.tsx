"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

const HOUR_HEIGHT = 60; // 1 ชั่วโมง = 60px

const minutesToPosition = (minutes: number) => {
  return (minutes / 60) * HOUR_HEIGHT;
};

export default function Calendar() {
  const year = 2026;
  const [month, setMonth] = useState(0);
  const [view, setView] = useState<"month"|"week"|"day">("month");

  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    color: colors[0]
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const saveEvent = async () => {
    if (!selectedDate || !form.title) return;

    await addDoc(collection(db, "events"), {
      ...form,
      date: selectedDate
    });

    setModalOpen(false);
    setForm({ title:"", start:"", end:"", color:colors[0] });
  };

  const deleteEvent = async (id:string) => {
    await deleteDoc(doc(db,"events",id));
  };

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const renderMonth = () => (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: firstDay }).map((_,i)=><div key={i}/>)}

      {Array.from({ length: daysInMonth }).map((_,i)=>{
        const day = i+1;
        const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const dayEvents = events.filter(e=>e.date===dateStr);

        return (
          <div
            key={day}
            onClick={()=>{setSelectedDate(dateStr);setModalOpen(true)}}
            className="h-28 border rounded-xl p-2 hover:bg-gray-50 cursor-pointer transition"
          >
            <div className="text-xs font-medium">{day}</div>
            {dayEvents.map(e=>(
              <div
                key={e.id}
                style={{background:e.color}}
                className="text-white text-xs rounded px-1 mt-1 truncate"
              >
                {e.start} {e.title}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  );

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={()=>setMonth(prev=>prev===0?11:prev-1)}>←</button>
        <h2 className="text-xl font-semibold">
          {new Date(year,month).toLocaleString("default",{month:"long"})} {year}
        </h2>
        <button onClick={()=>setMonth(prev=>prev===11?0:prev+1)}>→</button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        {["month","week","day"].map(v=>(
          <button
            key={v}
            onClick={()=>setView(v as any)}
            className={`px-3 py-1 rounded ${view===v?"bg-black text-white":"bg-gray-100"}`}
          >
            {v}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{x:50,opacity:0}}
          animate={{x:0,opacity:1}}
          exit={{x:-50,opacity:0}}
          transition={{duration:0.25}}
        >
          {view==="month" && renderMonth()}
          {view==="week" && (
            <div className="relative border rounded-xl overflow-hidden">
              <div className="grid grid-cols-8">
                {/* Time column */}
                <div className="border-r">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 pr-2 text-right"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      {String(i).padStart(2,"0")}:00
                    </div>
                  ))}
                </div>

                {/* 7 days */}
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const baseDate = new Date(year, month, 1);
                  const weekStart = new Date(baseDate);
                  weekStart.setDate(baseDate.getDate() - baseDate.getDay());

                  const currentDay = new Date(weekStart);
                  currentDay.setDate(weekStart.getDate() + dayIndex);

                  const dateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth()+1).padStart(2,"0")}-${String(currentDay.getDate()).padStart(2,"0")}`;

                  const dayEvents = events.filter(e => e.date === dateStr);

                  return (
                    <div key={dayIndex} className="relative border-l">
                      {/* hour lines */}
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          style={{ height: HOUR_HEIGHT }}
                          className="border-t"
                        />
                      ))}

                      {/* events */}
                      {dayEvents.map(e => (
                        <div
                          key={e.id}
                          style={{
                            position: "absolute",
                            top: minutesToPosition(e.startMinutes),
                            height: minutesToPosition(e.endMinutes - e.startMinutes),
                            background: e.color,
                          }}
                          className="left-1 right-1 rounded-lg text-white text-xs p-1 overflow-hidden"
                        >
                          {e.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {view==="day" && selectedDate && (
            <div className="relative border rounded-xl overflow-hidden">
              <div className="grid grid-cols-2">
                {/* Time column */}
                <div className="border-r">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-400 pr-2 text-right"
                      style={{ height: HOUR_HEIGHT }}
                    >
                      {String(i).padStart(2,"0")}:00
                    </div>
                  ))}
                </div>

                {/* Day column */}
                <div className="relative">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ height: HOUR_HEIGHT }}
                      className="border-t"
                    />
                  ))}

                  {events
                    .filter(e => e.date === selectedDate)
                    .map(e => (
                      <div
                        key={e.id}
                        style={{
                          position: "absolute",
                          top: minutesToPosition(e.startMinutes),
                          height: minutesToPosition(e.endMinutes - e.startMinutes),
                          background: e.color
                        }}
                        className="left-2 right-2 rounded-lg text-white text-xs p-1 overflow-hidden"
                      >
                        {e.title}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Add Event</h3>

            <input
              placeholder="Title"
              value={form.title}
              onChange={e=>setForm({...form,title:e.target.value})}
              className="border p-2 rounded w-full mb-2"
            />

            <div className="flex gap-2 mb-2">
              <input type="time"
                value={form.start}
                onChange={e=>setForm({...form,start:e.target.value})}
                className="border p-2 rounded w-full"
              />
              <input type="time"
                value={form.end}
                onChange={e=>setForm({...form,end:e.target.value})}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {colors.map(c=>(
                <div
                  key={c}
                  onClick={()=>setForm({...form,color:c})}
                  style={{background:c}}
                  className={`w-6 h-6 rounded-full cursor-pointer ${form.color===c?"ring-2 ring-black":""}`}
                />
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={()=>setModalOpen(false)}>Cancel</button>
              <button
                onClick={saveEvent}
                className="bg-black text-white px-4 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}