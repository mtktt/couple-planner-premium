
import TopBar from "./components/TopBar";
import Calendar from "./components/Calendar";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <TopBar />
      <Calendar />
    </main>
  );
}
