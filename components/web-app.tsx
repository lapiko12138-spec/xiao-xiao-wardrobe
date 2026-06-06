"use client";

import { CSSProperties, ChangeEvent, DragEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Camera,
  Check,
  Heart,
  ImagePlus,
  LayoutGrid,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";
import { AvatarPlaceholder, ImagePlaceholder } from "@/components/placeholders";
import type {
  AppData,
  AppScreen,
  ClothingItem,
  CommunityPost,
  OutfitRecommendation,
  PlaceholderTone
} from "@/lib/app-data";

type WebAppProps = {
  initialData: AppData;
};

type WebScreen = AppScreen;

type MountedPiece = {
  item: ClothingItem;
  imageUrl?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  skewX: number;
  skewY: number;
  zIndex: number;
  processing?: boolean;
};

type PieceMoveState = {
  slot: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const categories = ["全部", "上衣", "下装", "连衣裙", "外套", "鞋子", "包包", "配饰", "运动", "购物车"];
const clothingCategories = categories.filter((item) => item !== "全部");
const toneOptions: PlaceholderTone[] = ["cream", "green", "blue", "tan", "gray", "rose", "dark"];

const navItems: Array<{ key: WebScreen; label: string; icon: typeof LayoutGrid }> = [
  { key: "wardrobe", label: "衣柜", icon: LayoutGrid },
  { key: "ai", label: "AI搭配", icon: Bot },
  { key: "community", label: "穿搭社区", icon: MessageCircle },
  { key: "mine", label: "我的", icon: UserRound },
  { key: "add", label: "添加衣物", icon: Plus }
];

function primaryButtonClass() {
  return "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-leaf-500 px-5 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(145,173,98,0.24)] disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryButtonClass() {
  return "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e3dfd3] bg-white px-5 text-[14px] font-semibold text-[#5d6357] hover:border-leaf-300 disabled:cursor-not-allowed disabled:opacity-60";
}

function textFieldClass() {
  return "w-full rounded-[14px] border border-[#e3dfd3] bg-white px-4 py-3 text-[14px] text-ink outline-none placeholder:text-[#aaa79b] focus:border-leaf-300";
}

function splitPrompt(input: string) {
  return input
    .split(/[，,。.\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("图片上传失败");
  }

  return (await response.json()) as { url: string };
}

async function normalizeImage(kind: "avatar" | "clothing", imageUrl: string) {
  const response = await fetch("/api/right-code/normalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, imageUrl })
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return (await response.json()) as { imageUrl: string; description?: string };
}

function SectionTitle({
  title,
  action
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-[#686c61]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${textFieldClass()} min-h-[112px] resize-none`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={textFieldClass()}
        />
      )}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
      <p className="text-[26px] font-semibold text-ink">{value}</p>
      <p className="mt-1 text-[13px] text-muted">{label}</p>
    </div>
  );
}

function ItemTile({
  item,
  active,
  onClick
}: {
  item: ClothingItem;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "group rounded-[18px] bg-white p-3 text-left shadow-soft ring-1 transition",
        active ? "ring-leaf-300" : "ring-[#eee8dc] hover:ring-leaf-300"
      ].join(" ")}
    >
      <ImagePlaceholder label={item.name} tone={item.tone} imageUrl={item.imageUrl} className="h-[172px] w-full rounded-[14px]" />
      <div className="mt-3 min-w-0">
        <p className="truncate text-[15px] font-semibold text-ink">{item.name}</p>
        <p className="mt-1 truncate text-[13px] text-muted">{item.category} · {item.color}</p>
      </div>
    </button>
  );
}

function OutfitPanel({ outfit }: { outfit: OutfitRecommendation }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <ImagePlaceholder
          label={outfit.title}
          tone={outfit.previewTone}
          imageUrl={outfit.imageUrl}
          className="h-[420px] w-full rounded-[20px]"
        />
        <div className="min-w-0">
          <h2 className="text-[28px] font-semibold tracking-normal text-ink">{outfit.title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-[#5f655c]">{outfit.inspiration}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {outfit.promptTags.map((tag) => (
              <span key={tag} className="rounded-full bg-leaf-50 px-3 py-1 text-[13px] font-medium text-leaf-700">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-7 grid grid-cols-5 gap-3">
            {outfit.pieces.map((piece) => (
              <ImagePlaceholder key={piece.name} label={piece.name} tone={piece.tone} className="h-[120px] w-full rounded-[14px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WebApp({ initialData }: WebAppProps) {
  const [data, setData] = useState(initialData);
  const [activeScreen, setActiveScreen] = useState<WebScreen>("wardrobe");

  async function refreshData() {
    const response = await fetch("/api/app-data", { cache: "no-store" });
    if (response.ok) {
      setData((await response.json()) as AppData);
    }
  }

  useEffect(() => {
    refreshData().catch(() => setData(initialData));
  }, [initialData]);

  function renderScreen() {
    if (activeScreen === "ai") {
      return <WebAi data={data} onDataChange={refreshData} onNavigate={setActiveScreen} />;
    }
    if (activeScreen === "community") {
      return <WebCommunity data={data} onDataChange={refreshData} />;
    }
    if (activeScreen === "mine") {
      return <WebMine data={data} onDataChange={refreshData} onNavigate={setActiveScreen} />;
    }
    if (activeScreen === "add") {
      return <WebAddItem onDataChange={refreshData} onNavigate={setActiveScreen} />;
    }
    return <WebWardrobe data={data} onDataChange={refreshData} onNavigate={setActiveScreen} />;
  }

  return (
    <main className="min-h-screen px-6 py-6 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-[1480px] grid-cols-[260px_1fr] gap-6">
        <aside className="sticky top-6 flex h-[calc(100vh-48px)] flex-col rounded-[26px] bg-white/86 p-5 shadow-phone ring-1 ring-[#eee8dc] backdrop-blur">
          <div className="flex items-center gap-3">
            <AvatarPlaceholder tone={data.user.avatarTone} imageUrl={data.user.avatarUrl} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate text-[18px] font-semibold text-ink">小小衣橱</p>
              <p className="truncate text-[12px] text-muted">{data.user.name}</p>
            </div>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeScreen;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveScreen(item.key)}
                  className={[
                    "flex h-12 w-full items-center gap-3 rounded-[16px] px-4 text-[15px] font-semibold transition",
                    active ? "bg-leaf-500 text-white shadow-soft" : "text-[#61675d] hover:bg-cream-50"
                  ].join(" ")}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-[20px] bg-cream-50 p-4">
            <p className="text-[13px] text-muted">衣物总数</p>
            <p className="mt-1 text-[30px] font-semibold text-ink">{data.wardrobe.items.length}</p>
            <button onClick={() => setActiveScreen("add")} className={`${primaryButtonClass()} mt-4 w-full`}>
              <Plus size={17} />
              添加
            </button>
          </div>
        </aside>
        <section className="min-w-0 rounded-[26px] bg-[#fbfaf4]/88 p-6 shadow-phone ring-1 ring-white/70 backdrop-blur">
          {renderScreen()}
        </section>
      </div>
    </main>
  );
}

function WebHeader({
  title,
  children
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-5">
      <h1 className="text-[30px] font-semibold tracking-normal text-ink">{title}</h1>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </header>
  );
}

function WebWardrobe({
  data,
  onDataChange,
  onNavigate
}: {
  data: AppData;
  onDataChange: () => Promise<void>;
  onNavigate: (screen: WebScreen) => void;
}) {
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(data.wardrobe.items[0] || null);
  const [busy, setBusy] = useState(false);

  const filteredItems = useMemo(() => {
    const text = query.trim();
    return data.wardrobe.items.filter((item) => {
      const matchCategory = category === "全部" || item.category === category;
      const matchText = !text || `${item.name}${item.color}${item.scene}${item.detail}`.includes(text);
      return matchCategory && matchText;
    });
  }, [category, data.wardrobe.items, query]);

  const recentItems = useMemo(
    () => data.wardrobe.items.slice().sort((a, b) => String(b.addedAt || "").localeCompare(String(a.addedAt || ""))),
    [data.wardrobe.items]
  );

  async function generateWithItem(item: ClothingItem) {
    setBusy(true);
    await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: [item.name, item.category, item.scene] })
    });
    await onDataChange();
    setBusy(false);
    onNavigate("ai");
  }

  async function shareItem(item: ClothingItem) {
    setBusy(true);
    await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${item.name} 今日穿搭`,
        desc: item.detail,
        tone: item.tone,
        imageUrl: item.imageUrl,
        source: "camera"
      })
    });
    await onDataChange();
    setBusy(false);
    onNavigate("community");
  }

  async function deleteItem(item: ClothingItem) {
    if (!window.confirm(`删除「${item.name}」？`)) return;
    setBusy(true);
    await fetch(`/api/wardrobe/items/${item.id}`, { method: "DELETE" }).catch(() => null);
    setSelectedItem(null);
    await onDataChange();
    setBusy(false);
  }

  return (
    <>
      <WebHeader title="我的衣柜">
        <div className="relative w-[320px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索衣服、颜色、场景"
            className="h-11 w-full rounded-full border border-[#e3dfd3] bg-white pl-11 pr-4 text-[14px] outline-none focus:border-leaf-300"
          />
        </div>
        <button onClick={() => onNavigate("add")} className={primaryButtonClass()}>
          <Plus size={18} />
          添加衣物
        </button>
      </WebHeader>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="全部衣物" value={data.wardrobe.items.length} />
        <StatCard label="上衣" value={data.wardrobe.items.filter((item) => item.category === "上衣").length} />
        <StatCard label="下装" value={data.wardrobe.items.filter((item) => item.category === "下装").length} />
        <StatCard label="最近添加" value={recentItems.length} />
      </div>

      <div className="mt-6 grid grid-cols-[1fr_380px] gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={[
                  "rounded-full px-4 py-2 text-[14px] font-semibold",
                  category === item ? "bg-leaf-500 text-white" : "bg-white text-[#60665d] ring-1 ring-[#eee8dc]"
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 2xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemTile
                key={item.id}
                item={item}
                active={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </div>

        <aside className="sticky top-6 h-fit rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
          {selectedItem ? (
            <>
              <ImagePlaceholder
                label={selectedItem.name}
                tone={selectedItem.tone}
                imageUrl={selectedItem.imageUrl}
                className="h-[300px] w-full rounded-[20px]"
              />
              <div className="mt-5">
                <p className="text-[24px] font-semibold text-ink">{selectedItem.name}</p>
                <p className="mt-1 text-[13px] text-muted">{selectedItem.category} · {selectedItem.brand || "我的衣柜"}</p>
              </div>
              <div className="mt-5 space-y-3 text-[14px]">
                <InfoLine label="颜色" value={selectedItem.color} />
                <InfoLine label="季节" value={selectedItem.season} />
                <InfoLine label="场景" value={selectedItem.scene} />
                <InfoLine label="材质" value={selectedItem.material} />
                {selectedItem.purchaseUrl ? (
                  <div className="flex items-center justify-between gap-4 border-b border-[#eee8dc] pb-3">
                    <span className="text-muted">链接</span>
                    <a
                      href={selectedItem.purchaseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-leaf-700"
                    >
                      查看商品
                    </a>
                  </div>
                ) : null}
                <p className="rounded-[16px] bg-cream-50 p-4 leading-6 text-[#5f655c]">{selectedItem.detail}</p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <button onClick={() => generateWithItem(selectedItem)} className={primaryButtonClass()} disabled={busy}>
                  <Sparkles size={17} />
                  AI搭配
                </button>
                <button onClick={() => shareItem(selectedItem)} className={secondaryButtonClass()} disabled={busy}>
                  <Send size={17} />
                  分享
                </button>
                <button onClick={() => deleteItem(selectedItem)} className={secondaryButtonClass()} disabled={busy}>
                  <Trash2 size={17} />
                  删除
                </button>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-muted">选择一件衣物查看详情</p>
          )}
        </aside>
      </div>
    </>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eee8dc] pb-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-[#454a40]">{value || "未填写"}</span>
    </div>
  );
}

function WebAi({
  data,
  onDataChange,
  onNavigate
}: {
  data: AppData;
  onDataChange: () => Promise<void>;
  onNavigate: (screen: WebScreen) => void;
}) {
  const [prompt, setPrompt] = useState("奶油色 通勤 温柔 法式 包包");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [tryOnItems, setTryOnItems] = useState<Record<string, MountedPiece>>({});
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [generatedMaterials, setGeneratedMaterials] = useState<ClothingItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const moveRef = useRef<PieceMoveState | null>(null);

  const tryOnSlots = ["上衣", "下装", "连衣裙", "外套", "鞋子", "包包", "配饰", "运动", "购物车"];
  const personImageUrl = data.user.bodyImageUrl || data.user.avatarUrl;
  const selectedPieces = Object.entries(tryOnItems).map(([, piece]) => piece.item);
  const selectedMountedPiece = selectedSlot ? tryOnItems[selectedSlot] : null;
  const resourceItems = useMemo(() => [...generatedMaterials, ...data.wardrobe.items], [data.wardrobe.items, generatedMaterials]);
  const visibleResources = useMemo(() => {
    return resourceItems.filter((item) => activeCategory === "全部" || item.category === activeCategory);
  }, [activeCategory, resourceItems]);

  function toneFromPrompt(text: string): PlaceholderTone {
    if (/黑|酷|暗|all\s*black/i.test(text)) return "dark";
    if (/蓝|牛仔|清爽/.test(text)) return "blue";
    if (/绿|春|森|自然/.test(text)) return "green";
    if (/粉|甜|约会|浪漫/.test(text)) return "rose";
    if (/米|卡其|风衣|包/.test(text)) return "tan";
    if (/灰|运动|极简/.test(text)) return "gray";
    return "cream";
  }

  function namePrefix(text: string) {
    const words = splitPrompt(text);
    return words.slice(0, 2).join("") || "AI";
  }

  function createMountedPiece(item: ClothingItem): MountedPiece {
    return {
      item,
      imageUrl: item.cutoutImageUrl || item.imageUrl,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      skewX: 0,
      skewY: 0,
      zIndex: 1
    };
  }

  function updateMountedPiece(slot: string, patch: Partial<MountedPiece>) {
    setTryOnItems((currentItems) => {
      const currentPiece = currentItems[slot];
      if (!currentPiece) return currentItems;

      return {
        ...currentItems,
        [slot]: {
          ...currentPiece,
          ...patch
        }
      };
    });
  }

  function addToTryOn(item: ClothingItem, slot = item.category) {
    const safeSlot = tryOnSlots.includes(slot) ? slot : item.category;
    setTryOnItems((currentItems) => {
      const topLayer = Math.max(0, ...Object.values(currentItems).map((piece) => piece.zIndex || 1));
      return {
        ...currentItems,
        [safeSlot]: {
          ...createMountedPiece(item),
          zIndex: topLayer + 1
        }
      };
    });
    setSelectedSlot(safeSlot);
    setNotice(`${item.name} 已同步到左侧试穿区`);
    void cutoutPiece(safeSlot, item);
  }

  function removeTryOn(slot: string) {
    setTryOnItems((currentItems) => {
      const nextItems = { ...currentItems };
      delete nextItems[slot];
      return nextItems;
    });
    setSelectedSlot((currentSlot) => (currentSlot === slot ? "" : currentSlot));
  }

  function moveLayer(slot: string, delta: number) {
    setTryOnItems((currentItems) => {
      const currentPiece = currentItems[slot];
      if (!currentPiece) return currentItems;

      return {
        ...currentItems,
        [slot]: {
          ...currentPiece,
          zIndex: Math.max(1, currentPiece.zIndex + delta)
        }
      };
    });
  }

  function mountedStyle(slot: string): CSSProperties {
    const styles: Record<string, CSSProperties> = {
      上衣: { left: "35%", top: "27%", width: "30%", height: "22%" },
      下装: { left: "34%", top: "48%", width: "32%", height: "27%" },
      连衣裙: { left: "31%", top: "32%", width: "38%", height: "42%" },
      外套: { left: "28%", top: "24%", width: "44%", height: "38%" },
      鞋子: { left: "35%", top: "79%", width: "30%", height: "12%" },
      包包: { left: "63%", top: "44%", width: "18%", height: "24%" },
      配饰: { left: "43%", top: "17%", width: "14%", height: "10%" },
      运动: { left: "31%", top: "30%", width: "38%", height: "45%" },
      购物车: { left: "30%", top: "34%", width: "40%", height: "34%" }
    };

    return styles[slot] || styles.上衣;
  }

  async function createLocalCutoutBlob(imageUrl: string) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.crossOrigin = "anonymous";
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = reject;
      nextImage.src = imageUrl;
    });
    const canvas = document.createElement("canvas");
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const backgroundMask = new Uint8Array(width * height);
    const queue: number[] = [];
    const isBackgroundCandidate = (pixelIndex: number) => {
      const offset = pixelIndex * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);

      return max > 238 && min > 222 && max - min < 34;
    };
    const enqueue = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const pixelIndex = y * width + x;
      if (backgroundMask[pixelIndex] || !isBackgroundCandidate(pixelIndex)) return;
      backgroundMask[pixelIndex] = 1;
      queue.push(pixelIndex);
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }

    for (let y = 1; y < height - 1; y += 1) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const pixelIndex = queue[cursor];
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    for (let pixelIndex = 0; pixelIndex < backgroundMask.length; pixelIndex += 1) {
      if (backgroundMask[pixelIndex]) {
        pixels[pixelIndex * 4 + 3] = 0;
      }
    }

    context.putImageData(imageData, 0, 0);

    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function saveCutoutToWardrobe(item: ClothingItem, cutoutImageUrl: string) {
    if (item.id.startsWith("ai-")) {
      return;
    }

    await fetch(`/api/wardrobe/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cutoutImageUrl })
    }).catch(() => null);
    await onDataChange().catch(() => undefined);
  }

  async function cutoutPiece(slot: string, item: ClothingItem, force = false) {
    const sourceImageUrl = force ? item.imageUrl : item.cutoutImageUrl || item.imageUrl;
    if (!sourceImageUrl) return;

    if (item.cutoutImageUrl && !force) {
      updateMountedPiece(slot, { imageUrl: item.cutoutImageUrl, processing: false });
      return;
    }

    updateMountedPiece(slot, { processing: true });
    const response = await fetch("/api/images/cutout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: sourceImageUrl })
    }).catch(() => null);

    if (response?.ok) {
      const result = (await response.json()) as { imageUrl?: string; processed?: boolean; message?: string };

      if (result.processed && result.imageUrl) {
        updateMountedPiece(slot, { imageUrl: result.imageUrl, processing: false });
        await saveCutoutToWardrobe(item, result.imageUrl);
        return;
      }
    }

    const localCutout = await createLocalCutoutBlob(sourceImageUrl).catch(() => null);
    if (!localCutout) {
      updateMountedPiece(slot, { processing: false });
      return;
    }

    const upload = await uploadImage(new File([localCutout], `${item.id}-cutout.png`, { type: "image/png" })).catch(() => null);
    const cutoutImageUrl = upload?.url || sourceImageUrl;
    updateMountedPiece(slot, { imageUrl: cutoutImageUrl, processing: false });
    await saveCutoutToWardrobe(item, cutoutImageUrl);
    setNotice(`${item.name} 已生成抠图并保存到衣橱数据库`);
  }

  function onPiecePointerDown(event: PointerEvent<HTMLDivElement>, slot: string) {
    const piece = tryOnItems[slot];
    if (!piece) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedSlot(slot);
    moveRef.current = {
      slot,
      startX: event.clientX,
      startY: event.clientY,
      originX: piece.x,
      originY: piece.y
    };
  }

  function onCanvasPointerMove(event: PointerEvent<HTMLDivElement>) {
    const moveState = moveRef.current;
    if (!moveState) return;

    updateMountedPiece(moveState.slot, {
      x: moveState.originX + event.clientX - moveState.startX,
      y: moveState.originY + event.clientY - moveState.startY
    });
  }

  function onCanvasPointerUp() {
    moveRef.current = null;
  }

  function onDragStart(event: DragEvent<HTMLButtonElement>, item: ClothingItem) {
    event.dataTransfer.setData("text/plain", item.id);
    event.dataTransfer.effectAllowed = "copy";
  }

  function findResource(id: string) {
    return resourceItems.find((item) => item.id === id);
  }

  function onDropToPerson(event: DragEvent<HTMLDivElement>, slot?: string) {
    event.preventDefault();
    const item = findResource(event.dataTransfer.getData("text/plain"));
    if (item) {
      addToTryOn(item, slot);
    }
  }

  function pickArkTaskId(result: unknown) {
    const data = result as Record<string, any>;
    return (
      data?.id ||
      data?.task_id ||
      data?.taskId ||
      data?.data?.id ||
      data?.data?.task_id ||
      data?.data?.taskId ||
      data?.result?.id ||
      data?.result?.task_id ||
      data?.result?.taskId
    );
  }

  async function generateMaterials() {
    const text = prompt.trim();
    const tone = toneFromPrompt(text);
    const prefix = namePrefix(text);
    const now = Date.now();
    const wantsBag = /包|bag/i.test(text);
    const wantsDress = /裙|dress|连衣裙/i.test(text);
    const wantsCoat = /外套|风衣|coat|trench/i.test(text);
    const wantsSport = /运动|瑜伽|健身/i.test(text);
    const nextMaterials: ClothingItem[] = [
      {
        id: `ai-top-${now}`,
        category: wantsSport ? "运动" : "上衣",
        name: `${prefix}${wantsSport ? "运动上装" : "上衣素材"}`,
        color: text || "按关键词生成",
        season: "按需搭配",
        scene: text || "日常",
        material: "AI素材",
        detail: "由关键词生成的试穿素材，可拖拽到左侧人物试穿区。",
        tone,
        brand: "AI素材库"
      },
      {
        id: `ai-${wantsDress ? "dress" : "bottom"}-${now}`,
        category: wantsDress ? "连衣裙" : "下装",
        name: `${prefix}${wantsDress ? "裙装素材" : "下装素材"}`,
        color: text || "按关键词生成",
        season: "按需搭配",
        scene: text || "日常",
        material: "AI素材",
        detail: "由关键词生成的试穿素材，可与自有衣物组合。",
        tone: wantsDress ? tone : "blue",
        brand: "AI素材库"
      },
      {
        id: `ai-${wantsBag ? "bag" : "coat"}-${now}`,
        category: wantsBag ? "包包" : wantsCoat ? "外套" : "包包",
        name: `${prefix}${wantsBag ? "包包素材" : wantsCoat ? "外套素材" : "单肩包素材"}`,
        color: text || "按关键词生成",
        season: "按需搭配",
        scene: text || "日常",
        material: "AI素材",
        detail: "由关键词生成的配套素材，后续可替换为外部 AI 图片模型结果。",
        tone: wantsBag || wantsCoat ? tone : "tan",
        brand: "AI素材库"
      }
    ];

    setGeneratedMaterials((currentItems) => [...nextMaterials, ...currentItems].slice(0, 12));
    setBusy(true);
    const rightCodeResponse = await fetch("/api/right-code/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `生成一件适合虚拟试衣的单件服饰或包包素材。关键词：${text || "日常通勤"}。要求：当前小小衣橱的柔和2D插画风格，白色或透明背景，单品居中，无模特，无文字，无水印，适合后续抠图贴到人物身上。`,
        size: "1024x1024"
      })
    }).catch(() => null);

    if (rightCodeResponse?.ok) {
      const result = (await rightCodeResponse.json()) as { imageUrl?: string };

      if (result.imageUrl) {
        const rightCodeItem: ClothingItem = {
          id: `right-code-${Date.now()}`,
          category: wantsBag ? "包包" : wantsDress ? "连衣裙" : wantsCoat ? "外套" : wantsSport ? "运动" : "上衣",
          name: `${prefix}AI生成素材`,
          color: text || "按关键词生成",
          season: "按需搭配",
          scene: text || "日常",
          material: "Right Code AI",
          detail: "由 Right Code 图片生成接口创建的衣橱素材，可拖拽到左侧人物试穿区。",
          tone,
          brand: "Right Code",
          imageUrl: result.imageUrl,
          cutoutImageUrl: result.imageUrl
        };
        setGeneratedMaterials((currentItems) => [rightCodeItem, ...currentItems].slice(0, 12));
        setNotice("已通过 Right Code 生成图片素材，并同步到右侧衣橱素材区");
        setBusy(false);
        return;
      }
    }

    const response = await fetch("/api/ark/generation-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `为虚拟试衣生成服饰和包包素材，关键词：${text || "日常通勤"}。画面聚焦单品，干净背景，适合后续抠图贴合人物试穿。`,
        ratio: "1:1",
        duration: 5,
        watermark: false
      })
    }).catch(() => null);

    if (!response?.ok) {
      const result = response ? await response.json().catch(() => null) : null;
      setNotice(`已生成 3 个本地素材；Ark 任务提交失败${result?.error ? `：${result.error}` : ""}`);
      setBusy(false);
      return;
    }

    const result = await response.json();
    const taskId = pickArkTaskId(result);
    setNotice(`已生成 3 个本地素材，并提交 Ark 生成任务${taskId ? `：${taskId}` : ""}`);
    setBusy(false);
  }

  async function generateOutfitNote(nextPrompt = prompt) {
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: splitPrompt(nextPrompt) })
    });
    if (response.ok) {
      const outfit = (await response.json()) as OutfitRecommendation;
      const nextItems = outfit.pieces.reduce<Record<string, MountedPiece>>((acc, piece) => {
        const match = data.wardrobe.items.find((item) => item.name === piece.name);
        if (match) {
          acc[match.category] = createMountedPiece(match);
        }
        return acc;
      }, {});
      setTryOnItems((currentItems) => ({ ...currentItems, ...nextItems }));
      await onDataChange();
      setNotice(outfit.inspiration);
    }
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    const names = selectedPieces.map((item) => item.name).join(" + ");
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "我的试穿搭配",
        desc: names ? `本次试穿：${names}` : "基于个人形象和衣橱资源库生成的试穿搭配。",
        tone: selectedPieces[0]?.tone || "cream",
        imageUrl: personImageUrl,
        source: "ai"
      })
    });
    if (response.ok) {
      setNotice("已发布到穿搭社区");
      await onDataChange();
    }
    setBusy(false);
  }

  function ResourceCard({ item, badge }: { item: ClothingItem; badge?: string }) {
    return (
      <button
        draggable
        onDragStart={(event) => onDragStart(event, item)}
        onClick={() => addToTryOn(item)}
        className="group flex w-full gap-3 rounded-[16px] bg-white p-3 text-left shadow-soft ring-1 ring-[#eee8dc] transition hover:ring-leaf-300"
      >
        <ImagePlaceholder
          label={item.name}
          tone={item.tone}
          imageUrl={item.imageUrl}
          className="h-[92px] w-[92px] shrink-0 rounded-[14px]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-ink">{item.name}</span>
            {badge ? <span className="shrink-0 rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] font-semibold text-leaf-700">{badge}</span> : null}
          </span>
          <span className="mt-1 block truncate text-[12px] text-muted">{item.category} · {item.color}</span>
          <span className="mt-2 line-clamp-2 block text-[12px] leading-5 text-[#697066]">{item.detail}</span>
        </span>
      </button>
    );
  }

  return (
    <>
      <WebHeader title="AI搭配">
        <button onClick={() => generateOutfitNote("周末 约会 温柔 清新")} className={secondaryButtonClass()} disabled={busy}>
          <Sparkles size={17} />
          智能选衣
        </button>
        <button onClick={publish} className={primaryButtonClass()} disabled={busy}>
          <Send size={17} />
          发布试穿
        </button>
      </WebHeader>

      <div onPointerDown={() => setSelectedSlot("")} className="mb-5 rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="输入服饰关键词或氛围关键词，例如奶油色 通勤 法式 包包"
            className={textFieldClass()}
          />
          <button onClick={generateMaterials} className={primaryButtonClass()} disabled={busy}>
            <Bot size={17} />
            {busy ? "提交中..." : "生成素材"}
          </button>
          <button onClick={() => generateOutfitNote()} className={secondaryButtonClass()} disabled={busy}>
            <RefreshCw size={17} />
            {busy ? "生成中..." : "调用衣橱搭配"}
          </button>
        </div>
        {notice ? <p className="mt-3 text-[13px] font-semibold text-leaf-700">{notice}</p> : null}
      </div>

      <div className="grid h-[calc(100vh-250px)] min-h-[690px] grid-cols-[minmax(520px,1fr)_520px] gap-6 overflow-hidden">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
          <div className="flex items-center justify-between gap-4">
            <SectionTitle title="人物基础形象区" />
            <button onClick={() => setTryOnItems({})} className="text-[13px] font-semibold text-leaf-700">
              清空试穿
            </button>
          </div>
          <div className="mt-3 min-h-[112px] rounded-[18px] bg-cream-50 p-3 ring-1 ring-[#eee8dc]">
            {selectedMountedPiece ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] font-semibold text-ink">{selectedMountedPiece.item.name}</p>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    <button
                      onClick={() => moveLayer(selectedSlot, 1)}
                      className="text-[12px] font-semibold text-leaf-700"
                    >
                      上移一层
                    </button>
                    <button
                      onClick={() => moveLayer(selectedSlot, -1)}
                      className="text-[12px] font-semibold text-leaf-700"
                    >
                      下移一层
                    </button>
                    <button
                      onClick={() => cutoutPiece(selectedSlot, selectedMountedPiece.item, true)}
                      className="text-[12px] font-semibold text-leaf-700"
                    >
                      重新抠图
                    </button>
                    <button onClick={() => setSelectedSlot("")} className="text-[12px] font-semibold text-leaf-700">
                      收起
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3 text-[12px] font-semibold text-[#62675a]">
                  <label className="block">
                    尺寸
                    <input
                      type="range"
                      min="0.45"
                      max="1.9"
                      step="0.05"
                      value={selectedMountedPiece.scale}
                      onChange={(event) => updateMountedPiece(selectedSlot, { scale: Number(event.target.value) })}
                      className="mt-2 w-full accent-[#91ad62]"
                    />
                  </label>
                  <label className="block">
                    朝向
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      step="1"
                      value={selectedMountedPiece.rotation}
                      onChange={(event) => updateMountedPiece(selectedSlot, { rotation: Number(event.target.value) })}
                      className="mt-2 w-full accent-[#91ad62]"
                    />
                  </label>
                  <label className="block">
                    横向
                    <input
                      type="range"
                      min="-28"
                      max="28"
                      step="1"
                      value={selectedMountedPiece.skewX}
                      onChange={(event) => updateMountedPiece(selectedSlot, { skewX: Number(event.target.value) })}
                      className="mt-2 w-full accent-[#91ad62]"
                    />
                  </label>
                  <label className="block">
                    纵向
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={selectedMountedPiece.skewY}
                      onChange={(event) => updateMountedPiece(selectedSlot, { skewY: Number(event.target.value) })}
                      className="mt-2 w-full accent-[#91ad62]"
                    />
                  </label>
                  <label className="block">
                    X
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedMountedPiece.x}
                      onChange={(event) => updateMountedPiece(selectedSlot, { x: Number(event.target.value) })}
                      className="mt-2 w-full accent-[#91ad62]"
                    />
                  </label>
                  <label className="block">
                    Y
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedMountedPiece.y}
                      onChange={(event) => updateMountedPiece(selectedSlot, { y: Number(event.target.value) })}
                      className="mt-2 w-full accent-[#91ad62]"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[86px] items-center justify-center text-[13px] font-semibold text-[#62675a]">
                选中或拖入一件服饰后，可在这里调整位置、尺寸、朝向和外形
              </div>
            )}
          </div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDropToPerson}
            onPointerDown={() => setSelectedSlot("")}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerLeave={onCanvasPointerUp}
            className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[22px] bg-cream-50 ring-1 ring-[#eee8dc]"
          >
            <ImagePlaceholder
              label="人物形象"
              tone="cream"
              imageUrl={personImageUrl}
              fit="contain"
              className="h-full w-full rounded-[22px] bg-white"
            />
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-[12px] font-semibold text-[#596052] shadow-soft">
              从右侧衣橱拖拽服饰到人物身上
            </div>
            {tryOnSlots.map((slot) => {
              const piece = tryOnItems[slot];
              if (!piece) return null;
              const item = piece.item;

              return (
                <div
                  key={slot}
                  onPointerDown={(event) => onPiecePointerDown(event, slot)}
                  className="absolute cursor-move touch-none"
                  style={{
                    ...mountedStyle(slot),
                    transform: `translate(${piece.x}px, ${piece.y}px) rotate(${piece.rotation}deg) scale(${piece.scale}) skew(${piece.skewX}deg, ${piece.skewY}deg)`,
                    transformOrigin: "center",
                    zIndex: piece.zIndex
                  }}
                >
                  <div
                    className={[
                      "group relative h-full w-full",
                      selectedSlot === slot ? "outline outline-2 outline-offset-2 outline-leaf-500" : ""
                    ].join(" ")}
                  >
                    {piece.imageUrl || item.imageUrl ? (
                      <img
                        src={piece.imageUrl || item.imageUrl}
                        alt={item.name}
                        draggable={false}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImagePlaceholder
                        label={item.name}
                        tone={item.tone}
                        fit="contain"
                        className="h-full w-full rounded-[14px]"
                      />
                    )}
                    {piece.processing ? (
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-leaf-700 shadow-soft">
                        抠形中
                      </span>
                    ) : null}
                    <button
                      onClick={() => removeTryOn(slot)}
                      className="absolute right-1 top-1 hidden rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-leaf-700 shadow-soft group-hover:block"
                    >
                      移除
                    </button>
                  </div>
                </div>
              );
            })}
            {selectedPieces.length ? (
              <div className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-white/90 p-3 shadow-soft backdrop-blur">
                <p className="truncate text-[13px] font-semibold text-ink">
                  当前搭配：{selectedPieces.map((item) => item.name).join(" / ")}
                </p>
              </div>
            ) : (
              <div className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-white/86 p-3 text-center text-[13px] font-semibold text-[#60665d] shadow-soft backdrop-blur">
                拖入衣物后会按类别贴合挂载到人物对应区域
              </div>
            )}
          </div>
        </section>

        <aside
          onPointerDown={() => setSelectedSlot("")}
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]"
        >
          <SectionTitle
            title="人物衣橱库存"
            action={
              <button onClick={() => onNavigate("wardrobe")} className="text-[13px] font-semibold text-leaf-700">
                管理衣柜
              </button>
            }
          />
          <div className="mt-4 shrink-0 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setActiveCategory(item)}
                className={[
                  "rounded-full px-4 py-2 text-[13px] font-semibold",
                  activeCategory === item ? "bg-leaf-500 text-white" : "bg-cream-50 text-[#60665d]"
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="phone-scroll mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[18px] bg-cream-50 p-3 ring-1 ring-[#eee8dc]">
            <div className="grid gap-3">
              {visibleResources.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  badge={item.brand === "AI素材库" ? "AI" : undefined}
                />
              ))}
            </div>
            {!visibleResources.length ? (
              <p className="mt-12 text-center text-[14px] text-muted">当前分类暂无衣物素材</p>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}

function WebCommunity({
  data,
  onDataChange
}: {
  data: AppData;
  onDataChange: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState(data.community.tabs[0] || "推荐");
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(data.community.posts[0] || null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const posts = useMemo(() => {
    if (activeTab === "推荐") {
      return data.community.posts;
    }
    return data.community.posts.filter((post) => `${post.title}${post.desc}`.includes(activeTab.replace("风", "")) || post.isMine);
  }, [activeTab, data.community.posts]);

  async function updatePost(id: string, input: { likeDelta?: number; commentDelta?: number }) {
    const response = await fetch(`/api/community/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (response.ok) {
      const next = (await response.json()) as CommunityPost;
      setSelectedPost((currentPost) => (currentPost?.id === id ? next : currentPost));
      await onDataChange();
    }
  }

  async function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const upload = await uploadImage(file);
    setImageUrl(upload.url);
    setComposerOpen(true);
  }

  async function publishPost() {
    setBusy(true);
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "今日穿搭分享",
        desc: desc || "用拍照记录今天的搭配。",
        tone: "green",
        imageUrl: imageUrl || undefined,
        source: "camera"
      })
    });
    if (response.ok) {
      const post = (await response.json()) as CommunityPost;
      setSelectedPost(post);
      setTitle("");
      setDesc("");
      setImageUrl("");
      setComposerOpen(false);
      await onDataChange();
    }
    setBusy(false);
  }

  return (
    <>
      <WebHeader title="穿搭社区">
        <input ref={fileRef} type="file" accept="image/*" onChange={onImageChange} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className={secondaryButtonClass()}>
          <Camera size={17} />
          拍照分享
        </button>
        <button onClick={() => setComposerOpen((value) => !value)} className={primaryButtonClass()}>
          <Plus size={17} />
          发布
        </button>
      </WebHeader>

      <div className="grid grid-cols-[1fr_420px] gap-6">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-2">
            {data.community.tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-full px-4 py-2 text-[14px] font-semibold",
                  activeTab === tab ? "bg-leaf-500 text-white" : "bg-white text-[#60665d] ring-1 ring-[#eee8dc]"
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

          {composerOpen ? (
            <div className="mb-5 rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <button onClick={() => fileRef.current?.click()} className="h-[220px] rounded-[18px] bg-cream-50">
                  {imageUrl ? (
                    <ImagePlaceholder imageUrl={imageUrl} tone="green" className="h-full w-full rounded-[18px]" />
                  ) : (
                    <span className="flex h-full flex-col items-center justify-center text-[14px] font-semibold text-[#63685d]">
                      <ImagePlus size={30} className="mb-2 text-leaf-700" />
                      选择图片
                    </span>
                  )}
                </button>
                <div className="space-y-4">
                  <Field label="标题" value={title} onChange={setTitle} placeholder="今日穿搭分享" />
                  <Field label="内容" value={desc} onChange={setDesc} placeholder="写一点搭配想法" multiline />
                  <div className="flex gap-3">
                    <button onClick={publishPost} className={primaryButtonClass()} disabled={busy}>
                      <Send size={17} />
                      发布
                    </button>
                    <button onClick={() => setComposerOpen(false)} className={secondaryButtonClass()}>
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-4 2xl:grid-cols-4">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={[
                  "rounded-[20px] bg-white p-3 text-left shadow-soft ring-1 transition",
                  selectedPost?.id === post.id ? "ring-leaf-300" : "ring-[#eee8dc] hover:ring-leaf-300"
                ].join(" ")}
              >
                <ImagePlaceholder label={post.title} tone={post.tone} imageUrl={post.imageUrl} className="h-[190px] w-full rounded-[16px]" />
                <p className="mt-3 truncate text-[15px] font-semibold text-ink">{post.title}</p>
                <p className="mt-1 truncate text-[13px] text-muted">{post.author}</p>
                <div className="mt-3 flex items-center gap-4 text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Heart size={14} />
                    {post.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={14} />
                    {post.comments}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="sticky top-6 h-fit rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
          {selectedPost ? (
            <>
              <ImagePlaceholder
                label={selectedPost.title}
                tone={selectedPost.tone}
                imageUrl={selectedPost.imageUrl}
                className="h-[360px] w-full rounded-[20px]"
              />
              <p className="mt-5 text-[13px] font-semibold text-leaf-700">{selectedPost.author}</p>
              <h2 className="mt-2 text-[24px] font-semibold leading-8 text-ink">{selectedPost.title}</h2>
              <p className="mt-3 text-[14px] leading-7 text-[#5f655c]">
                {selectedPost.desc || "这套搭配清爽耐看，适合日常出门和轻松聚会。"}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => updatePost(selectedPost.id, { likeDelta: 1 })} className={secondaryButtonClass()}>
                  <Heart size={17} />
                  {selectedPost.likes}
                </button>
                <button onClick={() => updatePost(selectedPost.id, { commentDelta: 1 })} className={secondaryButtonClass()}>
                  <MessageCircle size={17} />
                  {selectedPost.comments}
                </button>
              </div>
            </>
          ) : (
            <p className="text-[14px] text-muted">选择帖子查看详情</p>
          )}
        </aside>
      </div>
    </>
  );
}

function WebMine({
  data,
  onDataChange,
  onNavigate
}: {
  data: AppData;
  onDataChange: () => Promise<void>;
  onNavigate: (screen: WebScreen) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.user.name);
  const [subtitle, setSubtitle] = useState(data.user.subtitle);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const myPosts = data.community.posts.filter((post) => post.isMine);

  async function saveProfile(next: { name?: string; subtitle?: string; avatarUrl?: string; bodyImageUrl?: string }) {
    setBusy(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
    await onDataChange();
    setBusy(false);
  }

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const upload = await uploadImage(file);
    const normalized = await normalizeImage("avatar", upload.url);
    await saveProfile({
      avatarUrl: upload.url,
      bodyImageUrl: normalized?.imageUrl || upload.url
    });
  }

  async function saveTextProfile() {
    await saveProfile({ name, subtitle });
    setEditing(false);
  }

  return (
    <>
      <WebHeader title="我的">
        <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
        <button onClick={() => setEditing((value) => !value)} className={secondaryButtonClass()}>
          <Pencil size={17} />
          编辑资料
        </button>
        <button onClick={() => fileRef.current?.click()} className={primaryButtonClass()}>
          <Upload size={17} />
          上传头像
        </button>
      </WebHeader>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[24px] bg-white p-6 shadow-soft ring-1 ring-[#eee8dc]">
          <button onClick={() => fileRef.current?.click()} className="block">
            <AvatarPlaceholder tone={data.user.avatarTone} imageUrl={data.user.avatarUrl} className="h-[128px] w-[128px]" />
          </button>
          {editing ? (
            <div className="mt-6 space-y-4">
              <Field label="姓名" value={name} onChange={setName} placeholder="姓名" />
              <Field label="简介" value={subtitle} onChange={setSubtitle} placeholder="个人介绍" multiline />
              <button onClick={saveTextProfile} className={primaryButtonClass()} disabled={busy}>
                <Check size={17} />
                保存
              </button>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-[28px] font-semibold text-ink">{data.user.name}</p>
              <p className="mt-2 text-[15px] leading-7 text-[#5f655c]">{data.user.subtitle}</p>
            </div>
          )}
          <div className="mt-7 grid grid-cols-3 gap-3">
            <StatCard label="获赞" value={data.user.likes} />
            <StatCard label="关注" value={data.user.following} />
            <StatCard label="粉丝" value={data.user.followers} />
          </div>
          {data.user.bodyImageUrl ? (
            <div className="mt-7">
              <SectionTitle title="个人形象" />
              <ImagePlaceholder
                label="个人形象"
                tone="cream"
                imageUrl={data.user.bodyImageUrl}
                fit="contain"
                className="mt-4 h-[360px] w-full rounded-[20px] bg-white"
              />
            </div>
          ) : null}
        </section>

        <section className="min-w-0">
          <SectionTitle
            title="我发布过的帖子"
            action={
              <button onClick={() => onNavigate("community")} className="text-[13px] font-semibold text-leaf-700">
                去社区
              </button>
            }
          />
          <div className="mt-4 grid grid-cols-3 gap-4">
            {(myPosts.length ? myPosts : data.community.posts.slice(0, 3)).map((post) => (
              <div key={post.id} className="rounded-[20px] bg-white p-3 shadow-soft ring-1 ring-[#eee8dc]">
                <ImagePlaceholder label={post.title} tone={post.tone} imageUrl={post.imageUrl} className="h-[196px] w-full rounded-[16px]" />
                <p className="mt-3 truncate text-[15px] font-semibold text-ink">{post.title}</p>
                <p className="mt-1 text-[13px] text-muted">{post.likes} 赞 · {post.comments} 评论</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function WebAddItem({
  onDataChange,
  onNavigate
}: {
  onDataChange: () => Promise<void>;
  onNavigate: (screen: WebScreen) => void;
}) {
  const [category, setCategory] = useState("上衣");
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("四季");
  const [scene, setScene] = useState("");
  const [material, setMaterial] = useState("");
  const [detail, setDetail] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [tone, setTone] = useState<PlaceholderTone>("cream");
  const [imageUrl, setImageUrl] = useState("");
  const [cutoutImageUrl, setCutoutImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const upload = await uploadImage(file);
    setImageUrl(upload.url);
    const normalized = await normalizeImage("clothing", upload.url);
    if (normalized?.imageUrl) {
      setImageUrl(normalized.imageUrl);
      setCutoutImageUrl(normalized.imageUrl);
    }
  }

  async function saveItem() {
    setBusy(true);
    const response = await fetch("/api/wardrobe/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        name: name || "新衣物",
        color: color || "未填写",
        season,
        scene: scene || "日常",
        material: material || "未填写",
        detail: detail || "这是一件新加入小小衣橱的单品。",
        tone,
        imageUrl: imageUrl || undefined,
        cutoutImageUrl: cutoutImageUrl || undefined,
        purchaseUrl: category === "购物车" ? purchaseUrl || undefined : undefined
      })
    });
    if (response.ok) {
      await onDataChange();
      onNavigate("wardrobe");
    }
    setBusy(false);
  }

  return (
    <>
      <WebHeader title="添加衣物">
        <button onClick={() => onNavigate("wardrobe")} className={secondaryButtonClass()}>
          返回衣柜
        </button>
        <button onClick={saveItem} className={primaryButtonClass()} disabled={busy}>
          <Check size={17} />
          保存衣物
        </button>
      </WebHeader>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-[#eee8dc]">
          <input ref={fileRef} type="file" accept="image/*" onChange={onImageChange} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-[520px] w-full flex-col items-center justify-center rounded-[22px] bg-cream-50"
          >
            {imageUrl ? (
              <ImagePlaceholder imageUrl={imageUrl} tone={tone} className="h-full w-full rounded-[22px]" />
            ) : (
              <>
                <ImagePlus size={42} className="text-leaf-700" />
                <span className="mt-3 text-[15px] font-semibold text-[#62675a]">上传或拍照添加衣物</span>
              </>
            )}
          </button>
        </section>
        <section className="rounded-[24px] bg-white p-6 shadow-soft ring-1 ring-[#eee8dc]">
          <div className="flex flex-wrap gap-2">
            {clothingCategories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={[
                  "rounded-full px-4 py-2 text-[14px] font-semibold",
                  category === item ? "bg-leaf-500 text-white" : "bg-cream-50 text-[#60665d]"
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="衣物名称" value={name} onChange={setName} placeholder="奶油色衬衫" />
            <Field label="颜色" value={color} onChange={setColor} placeholder="奶油白" />
            <Field label="季节" value={season} onChange={setSeason} placeholder="春 / 夏" />
            <Field label="场景" value={scene} onChange={setScene} placeholder="约会、通勤" />
            <Field label="材质" value={material} onChange={setMaterial} placeholder="棉麻混纺" />
            {category === "购物车" ? (
              <Field label="链接" value={purchaseUrl} onChange={setPurchaseUrl} placeholder="https://..." />
            ) : null}
            <div>
              <span className="mb-2 block text-[13px] font-medium text-[#686c61]">色调</span>
              <div className="grid grid-cols-7 gap-2">
                {toneOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setTone(item)}
                    className={["rounded-[14px] p-1 ring-1", tone === item ? "ring-leaf-500" : "ring-transparent"].join(" ")}
                    aria-label={`选择${item}`}
                  >
                    <ImagePlaceholder tone={item} className="h-11 w-full rounded-[12px]" />
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Field label="衣物说明" value={detail} onChange={setDetail} placeholder="这件衣服适合的搭配和场景" multiline />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
