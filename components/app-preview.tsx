"use client";

import { useEffect, useState } from "react";
import { AddItemScreen, AiAssistantScreen, CommunityScreen, MineScreen, WardrobeScreen } from "@/components/screens";
import type { AppData, AppScreen } from "@/lib/app-data";

export function AppPreview({ initialData }: { initialData: AppData }) {
  const [data, setData] = useState(initialData);
  const [activeScreen, setActiveScreen] = useState<AppScreen>("wardrobe");

  async function refreshData() {
    return fetch("/api/app-data")
      .then((response) => response.json())
      .then((nextData: AppData) => setData(nextData))
      .catch(() => setData(initialData));
  }

  useEffect(() => {
    refreshData();
  }, [initialData]);

  function navigate(screen: AppScreen) {
    setActiveScreen(screen);
  }

  function renderMobileScreen() {
    if (activeScreen === "ai") {
      return <AiAssistantScreen data={data} onNavigate={navigate} onDataChange={refreshData} />;
    }

    if (activeScreen === "community") {
      return <CommunityScreen data={data} onNavigate={navigate} onDataChange={refreshData} />;
    }

    if (activeScreen === "mine") {
      return <MineScreen data={data} onNavigate={navigate} onDataChange={refreshData} />;
    }

    if (activeScreen === "add") {
      return <AddItemScreen data={data} onNavigate={navigate} onDataChange={refreshData} />;
    }

    return <WardrobeScreen data={data} onNavigate={navigate} onDataChange={refreshData} />;
  }

  return (
    <>
      {activeScreen === "mine" || activeScreen === "add" ? (
        <section className="mx-auto hidden w-max lg:block">{renderMobileScreen()}</section>
      ) : (
        <section className="mx-auto hidden w-max grid-cols-[454px_454px_454px] gap-[52px] lg:grid">
          <WardrobeScreen data={data} onNavigate={navigate} onDataChange={refreshData} />
          <AiAssistantScreen data={data} onNavigate={navigate} onDataChange={refreshData} />
          <CommunityScreen data={data} onNavigate={navigate} onDataChange={refreshData} />
        </section>
      )}

      <section className="mobile-phone-stage mx-auto flex justify-center lg:hidden">
        <div className="mobile-phone-scale">{renderMobileScreen()}</div>
      </section>
    </>
  );
}
