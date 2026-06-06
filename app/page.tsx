import { AppPreview } from "@/components/app-preview";
import { appData } from "@/lib/app-data";

export default function Home() {
  return (
    <main className="phone-scroll min-h-screen overflow-x-auto px-3 py-[14px] lg:px-5 lg:py-[22px]">
      <AppPreview initialData={appData} />
    </main>
  );
}
