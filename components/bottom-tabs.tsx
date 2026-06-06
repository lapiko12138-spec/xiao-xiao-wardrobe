import { Bot, Home, MessageCircleHeart, Plus, Shirt, UserRound } from "lucide-react";
import type { AppScreen } from "@/lib/app-data";

const tabs = [
  { key: "wardrobe", label: "衣柜", icon: Home },
  { key: "ai", label: "AI搭配", icon: Shirt },
  { key: "add", label: "", icon: Plus },
  { key: "community", label: "社区", icon: MessageCircleHeart },
  { key: "mine", label: "我的", icon: UserRound }
];

export function BottomTabs({
  active,
  onNavigate
}: {
  active: AppScreen;
  onNavigate?: (screen: AppScreen) => void;
}) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 h-[82px] rounded-t-[18px] bg-white/92 px-8 shadow-[0_-8px_24px_rgba(116,128,98,0.08)] backdrop-blur">
      <div className="grid h-full grid-cols-5 items-center">
        {tabs.map((tab) => {
          const Icon = tab.key === "ai" ? Bot : tab.icon;
          const isActive = tab.key === active;

          if (tab.key === "add") {
            return (
              <button
                key={tab.key}
                onClick={() => onNavigate?.("add")}
                className="mx-auto flex h-[44px] w-[68px] items-center justify-center rounded-full bg-leaf-500 text-white shadow-[0_8px_18px_rgba(145,173,98,0.35)]"
                aria-label="添加"
              >
                <Plus size={31} strokeWidth={2.3} />
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => onNavigate?.(tab.key as AppScreen)}
              className={[
                "flex h-[60px] flex-col items-center justify-center gap-1 text-[12px]",
                isActive ? "font-medium text-leaf-700" : "text-[#777a70]"
              ].join(" ")}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.4 : 1.9}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "text-leaf-500" : ""}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
