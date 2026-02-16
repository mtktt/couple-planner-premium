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

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = Jan
  const year = 2026;

  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [eventText, setEventText] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🔄 realtime sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  const firstDay = new Date(year, currentMonth, 1).getDay();

  const addOrUpdateEvent = async () => {
    if (!eventText || !selectedDate) return;

    if (editingId) {
      await updateDoc(doc(db, "events", editingId), {
        text: eventText,
        time: eventTime
      });
    } else {
      await addDoc(collection(db, "events"), {
        date: selectedDate,
        text: eventText,
        time: eventTime
      });
    }

    resetModal();
  };

  const editEvent = (event: any) => {
    setSelectedDate(event.date);
    setEventText(event.text);
    setEventTime(event.time);
    setEditingId(event.id);
    setModalOpen(true);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, "events", id));
  };

  const resetModal = () => {
    setModalOpen(false);
    setEventText("");
    setEventTime("");
    setEditingId(null);
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newMonth = prev + direction;
      if (newMonth < 0) return 11;
      if (newMonth > 11) return 0;
      return newMonth;
    });
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)}>←</button>
        <h2 className="text-xl font-semibold">
          {new Date(year, currentMonth).toLocaleString("default", {
            month: "long"
          })} {year}
        </h2>
        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="font-medium">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={"empty"+i}></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvents = events.filter(e => e.date === dateStr);

          return (
            <div
              key={day}
              onClick={() => {
                setSelectedDate(dateStr);
                setModalOpen(true);
              }}
              className="h-28 border rounded-xl p-2 cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="text-xs font-medium mb-1">{day}</div>
              {dayEvents.map(e => (
                <div
                  key={e.id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    editEvent(e);
                  }}
                  className="text-xs bg-blue-100 rounded px-1 py-0.5 mb-1 truncate"
                >
                  {e.time} {e.text}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl animate-fade">
            <h3 className="text-lg font-semibold mb-3">
              {editingId ? "Edit Event" : "Add Event"}
            </h3>

            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />

            <input
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              placeholder="Event title"
              className="border p-2 rounded w-full mb-4"
            />

            <div className="flex justify-between">
              {editingId && (
                <button
                  onClick={() => deleteEvent(editingId)}
                  className="text-red-500"
                >
                  Delete
                </button>
              )}

              <div className="flex gap-2 ml-auto">
                <button onClick={resetModal}>Cancel</button>
                <button
                  onClick={addOrUpdateEvent}
                  className="bg-black text-white px-3 py-1 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}