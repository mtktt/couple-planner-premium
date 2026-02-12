"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Calendar() {
  const [currentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventText, setEventText] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const addEvent = async () => {
    if (!eventText || !selectedDate) return;
    await addDoc(collection(db, "events"), {
      date: selectedDate,
      text: eventText
    });
    setEventText("");
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">
        {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
      </h2>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="font-medium">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={"empty"+i}></div>
        ))}

        {days.map(day => {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvents = events.filter(e => e.date === dateStr);

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateStr)}
              className="h-24 border rounded-lg p-1 cursor-pointer hover:bg-gray-50"
            >
              <div className="text-xs font-medium">{day}</div>
              {dayEvents.map(e => (
                <div key={e.id} className="text-xs bg-blue-100 rounded px-1 mt-1 truncate">
                  {e.text}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4">
          <input
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="Add event..."
            className="border p-2 rounded w-full mb-2"
          />
          <button
            onClick={addEvent}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Event
          </button>
        </div>
      )}
    </div>
  );
}
