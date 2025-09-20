import { Header } from "./_components/Header";
import Footer from "./_components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header />
      <main className="flex-grow"></main>

      <Footer />
    </div>
  );
}
