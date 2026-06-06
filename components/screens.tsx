"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Camera,
  Check,
  ChevronRight,
  Heart,
  ImagePlus,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Shirt,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";
import { BottomTabs } from "@/components/bottom-tabs";
import { AvatarPlaceholder, ImagePlaceholder } from "@/components/placeholders";
import { PhoneShell, ScreenHeader } from "@/components/phone-shell";
import type {
  AppData,
  AppScreen,
  ClothingItem,
  CommunityPost,
  OutfitRecommendation,
  PlaceholderTone
} from "@/lib/app-data";

type ScreenProps = {
  data: AppData;
  onNavigate: (screen: AppScreen) => void;
  onDataChange: () => Promise<void>;
};

const toneOptions: PlaceholderTone[] = ["cream", "green", "blue", "tan", "gray", "rose", "dark"];
const categories = ["上衣", "下装", "连衣裙", "外套", "鞋子", "包包", "配饰", "运动", "购物车"];

function iconButtonClass(active = false) {
  return [
    "flex h-10 w-10 items-center justify-center rounded-full border text-[#64685d]",
    active ? "border-leaf-300 bg-leaf-50 text-leaf-700" : "border-[#ece8dc] bg-white/72"
  ].join(" ");
}

function primaryButtonClass() {
  return "flex h-11 items-center justify-center gap-2 rounded-full bg-leaf-500 px-5 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(145,173,98,0.26)]";
}

function secondaryButtonClass() {
  return "flex h-11 items-center justify-center gap-2 rounded-full border border-[#e8e4d9] bg-white/82 px-5 text-[14px] font-medium text-[#62675a]";
}

function TextField({
  value,
  onChange,
  placeholder,
  multiline = false
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const classes =
    "w-full rounded-[14px] border border-[#e8e4d9] bg-white/82 px-4 py-3 text-[14px] text-ink outline-none placeholder:text-[#aaa79b] focus:border-leaf-300";

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${classes} min-h-[92px] resize-none`}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={classes}
    />
  );
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

function splitPrompt(input: string) {
  return input
    .split(/[，,。.\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Shell({
  active,
  onNavigate,
  children
}: {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  children: React.ReactNode;
}) {
  return (
    <PhoneShell>
      <div className="relative flex h-full flex-col">
        {children}
        <BottomTabs active={active} onNavigate={onNavigate} />
      </div>
    </PhoneShell>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className={iconButtonClass()} aria-label="返回">
      <ArrowLeft size={20} strokeWidth={2.2} />
    </button>
  );
}

function Content({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={["phone-scroll flex-1 overflow-y-auto px-6 pb-[104px]", compact ? "pt-2" : "pt-4"].join(" ")}>
      {children}
    </div>
  );
}

function WardrobeItemCard({
  item,
  onClick
}: {
  item: ClothingItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[16px] bg-white/78 p-3 text-left shadow-soft ring-1 ring-[#f0eadf]"
    >
      <ImagePlaceholder label={item.name} tone={item.tone} imageUrl={item.imageUrl} className="h-[126px] w-full" />
      <div className="mt-3 min-w-0">
        <p className="truncate text-[14px] font-semibold text-ink">{item.name}</p>
        <p className="mt-1 truncate text-[12px] text-muted">{item.color} · {item.scene}</p>
      </div>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#efe9dd] py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-muted">{label}</span>
      <span className="text-right text-[14px] font-medium leading-6 text-[#3d4138]">{value || "未填写"}</span>
    </div>
  );
}

export function WardrobeScreen({ data, onNavigate, onDataChange }: ScreenProps) {
  const [mode, setMode] = useState<"home" | "list" | "detail">("home");
  const [listTitle, setListTitle] = useState("全部衣物");
  const [items, setItems] = useState<ClothingItem[]>(data.wardrobe.items);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [busy, setBusy] = useState(false);

  const sortedRecent = useMemo(
    () => data.wardrobe.items.slice().sort((a, b) => String(b.addedAt || "").localeCompare(String(a.addedAt || ""))),
    [data.wardrobe.items]
  );

  function openList(title: string, nextItems: ClothingItem[]) {
    setListTitle(title);
    setItems(nextItems);
    setMode("list");
  }

  async function openItem(item: ClothingItem) {
    const response = await fetch(`/api/wardrobe/items/${item.id}`).catch(() => null);
    if (response?.ok) {
      setSelectedItem((await response.json()) as ClothingItem);
    } else {
      setSelectedItem(item);
    }
    setMode("detail");
  }

  async function generateWithItem(item: ClothingItem) {
    setBusy(true);
    await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: [item.name, item.category, item.scene] })
    }).catch(() => null);
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
    }).catch(() => null);
    await onDataChange();
    setBusy(false);
    onNavigate("community");
  }

  async function deleteItem(item: ClothingItem) {
    if (!window.confirm(`删除「${item.name}」？`)) return;
    setBusy(true);
    await fetch(`/api/wardrobe/items/${item.id}`, { method: "DELETE" }).catch(() => null);
    await onDataChange();
    setBusy(false);
    setSelectedItem(null);
    setMode("home");
  }

  if (mode === "detail" && selectedItem) {
    return (
      <Shell active="wardrobe" onNavigate={onNavigate}>
        <ScreenHeader title="衣物详情" left={<BackButton onClick={() => setMode("list")} />} />
        <Content compact>
          <ImagePlaceholder
            label={selectedItem.name}
            tone={selectedItem.tone}
            imageUrl={selectedItem.imageUrl}
            className="h-[316px] w-full rounded-[24px] shadow-soft"
          />
          <div className="mt-5 rounded-[18px] bg-white/80 p-5 shadow-soft ring-1 ring-[#f0eadf]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[22px] font-semibold text-ink">{selectedItem.name}</p>
                <p className="mt-1 text-[13px] text-muted">{selectedItem.category} · {selectedItem.brand || "我的衣柜"}</p>
              </div>
              <span className="rounded-full bg-leaf-50 px-3 py-1 text-[12px] font-medium text-leaf-700">
                {selectedItem.addedAt || "最近添加"}
              </span>
            </div>
            <div className="mt-4">
              <InfoRow label="颜色" value={selectedItem.color} />
              <InfoRow label="季节" value={selectedItem.season} />
              <InfoRow label="场景" value={selectedItem.scene} />
              <InfoRow label="材质" value={selectedItem.material} />
              {selectedItem.purchaseUrl ? (
                <div className="flex items-start justify-between gap-4 border-b border-[#efe9dd] py-3">
                  <span className="shrink-0 text-[13px] text-muted">链接</span>
                  <a
                    href={selectedItem.purchaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-right text-[14px] font-semibold text-leaf-700"
                  >
                    查看商品
                  </a>
                </div>
              ) : null}
              <InfoRow label="说明" value={selectedItem.detail} />
            </div>
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
        </Content>
      </Shell>
    );
  }

  if (mode === "list") {
    return (
      <Shell active="wardrobe" onNavigate={onNavigate}>
        <ScreenHeader
          title={listTitle}
          left={<BackButton onClick={() => setMode("home")} />}
          right={
            <button onClick={() => onNavigate("add")} className={iconButtonClass()} aria-label="添加衣物">
              <Plus size={20} />
            </button>
          }
        />
        <Content compact>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <WardrobeItemCard key={item.id} item={item} onClick={() => openItem(item)} />
            ))}
          </div>
          {!items.length ? <p className="pt-12 text-center text-[14px] text-muted">这里还没有衣物</p> : null}
        </Content>
      </Shell>
    );
  }

  return (
    <Shell active="wardrobe" onNavigate={onNavigate}>
      <ScreenHeader
        title="小小衣橱"
        left={<AvatarPlaceholder tone={data.user.avatarTone} imageUrl={data.user.avatarUrl} className="h-10 w-10" />}
        right={
          <button onClick={() => onNavigate("add")} className={iconButtonClass()} aria-label="添加衣物">
            <Plus size={20} />
          </button>
        }
      />
      <Content>
        <button
          onClick={() => onNavigate("mine")}
          className="flex w-full items-center justify-between rounded-[22px] bg-white/78 p-4 text-left shadow-soft ring-1 ring-[#f0eadf]"
        >
          <div>
            <p className="text-[18px] font-semibold text-ink">{data.user.name}</p>
            <p className="mt-1 max-w-[260px] truncate text-[13px] text-muted">{data.user.subtitle}</p>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </button>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {data.wardrobe.stats.map((stat) => (
            <button
              key={stat.label}
              onClick={() =>
                openList(
                  stat.label === "全部" ? "全部衣物" : `全部${stat.label}`,
                  stat.label === "全部" ? data.wardrobe.items : data.wardrobe.items.filter((item) => item.category === stat.label)
                )
              }
              className={[
                "rounded-[16px] px-2 py-3 text-center",
                stat.active ? "bg-leaf-500 text-white shadow-soft" : "bg-white/74 text-[#62675a] ring-1 ring-[#f0eadf]"
              ].join(" ")}
            >
              <p className="text-[17px] font-semibold">{stat.value}</p>
              <p className="mt-1 text-[11px]">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink">我的衣柜</h2>
          <button
            onClick={() => openList("全部衣物", data.wardrobe.items)}
            className="text-[13px] font-medium text-leaf-700"
          >
            全部
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {data.wardrobe.categories.map((category) => (
            <button
              key={category.name}
              onClick={() =>
                openList(`全部${category.name}`, data.wardrobe.items.filter((item) => item.category === category.name))
              }
              className="flex items-center gap-3 rounded-[18px] bg-white/78 p-3 text-left shadow-soft ring-1 ring-[#f0eadf]"
            >
              <ImagePlaceholder tone={category.tone} className="h-[64px] w-[64px] shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-ink">{category.name}</span>
                <span className="mt-1 block text-[12px] text-muted">{category.count}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink">最近添加</h2>
          <button onClick={() => openList("最近添加", sortedRecent)} className="text-[13px] font-medium text-leaf-700">
            全部
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {sortedRecent.slice(0, 4).map((item) => (
            <button key={item.id} onClick={() => openItem(item)}>
              <ImagePlaceholder label={item.name} tone={item.tone} imageUrl={item.imageUrl} className="h-[82px] w-full" />
            </button>
          ))}
        </div>
      </Content>
    </Shell>
  );
}

function OutfitPreview({ outfit }: { outfit: OutfitRecommendation }) {
  return (
    <div className="rounded-[24px] bg-white/80 p-4 shadow-soft ring-1 ring-[#f0eadf]">
      <ImagePlaceholder
        label={outfit.title}
        tone={outfit.previewTone}
        imageUrl={outfit.imageUrl}
        className="h-[288px] w-full rounded-[22px]"
      />
      <div className="mt-4">
        <p className="text-[20px] font-semibold text-ink">{outfit.title}</p>
        <p className="mt-2 text-[14px] leading-6 text-[#62675a]">{outfit.inspiration}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {outfit.promptTags.map((tag) => (
          <span key={tag} className="rounded-full bg-leaf-50 px-3 py-1 text-[12px] font-medium text-leaf-700">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {outfit.pieces.map((piece) => (
          <ImagePlaceholder key={piece.name} label={piece.name} tone={piece.tone} className="h-[68px] w-full" />
        ))}
      </div>
    </div>
  );
}

export function AiAssistantScreen({ data, onNavigate, onDataChange }: ScreenProps) {
  const [prompt, setPrompt] = useState("周末约会 25°C 温柔清新风");
  const [current, setCurrent] = useState<OutfitRecommendation>(data.outfitHistory[0] || data.ai);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function generate(nextPrompt = prompt) {
    setBusy(true);
    setNotice("");
    const tags = splitPrompt(nextPrompt);
    const response = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags })
    });
    if (response.ok) {
      const outfit = (await response.json()) as OutfitRecommendation;
      setCurrent(outfit);
      await onDataChange();
    }
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.title,
        desc: current.inspiration,
        tone: current.previewTone,
        imageUrl: current.imageUrl,
        source: "ai"
      })
    });
    if (response.ok) {
      await onDataChange();
      setNotice("已发布到穿搭社区");
    }
    setBusy(false);
  }

  const suggestions = [
    ...data.outfitHistory,
    data.ai,
    {
      ...data.ai,
      id: "soft-date",
      promptTags: ["奶油白", "约会", "轻法式"],
      previewTone: "rose" as PlaceholderTone
    },
    {
      ...data.ai,
      id: "commute-blue",
      promptTags: ["通勤", "蓝白", "利落"],
      previewTone: "blue" as PlaceholderTone
    }
  ].slice(0, 8);

  return (
    <Shell active="ai" onNavigate={onNavigate}>
      <ScreenHeader
        title="AI搭配"
        left={<Bot size={25} className="text-leaf-700" />}
        right={
          <button onClick={() => generate("通勤 会议 简约气质")} className={iconButtonClass()} aria-label="换一套">
            <RefreshCw size={18} />
          </button>
        }
      />
      <Content compact>
        <div className="rounded-[22px] bg-white/82 p-4 shadow-soft ring-1 ring-[#f0eadf]">
          <TextField value={prompt} onChange={setPrompt} placeholder="输入场景、天气、风格，例如周末约会 25°C" multiline />
          <button onClick={() => generate()} className={`${primaryButtonClass()} mt-3 w-full`} disabled={busy}>
            <Sparkles size={18} />
            {busy ? "生成中..." : "根据我的形象和衣柜生成"}
          </button>
        </div>

        <div className="mt-5">
          <OutfitPreview outfit={current} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={publish} className={primaryButtonClass()} disabled={busy}>
            <Send size={17} />
            发布社区
          </button>
          <button onClick={() => onNavigate("wardrobe")} className={secondaryButtonClass()}>
            <Shirt size={17} />
            看衣柜
          </button>
        </div>
        {notice ? <p className="mt-3 text-center text-[13px] font-medium text-leaf-700">{notice}</p> : null}

        <div className="mt-7">
          <h2 className="text-[18px] font-semibold text-ink">你可能还喜欢</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {suggestions.map((item, index) => (
              <button
                key={item.id || `${item.title}-${index}`}
                onClick={() => setCurrent(item)}
                className="rounded-[16px] bg-white/78 p-3 text-left shadow-soft ring-1 ring-[#f0eadf]"
              >
                <ImagePlaceholder tone={item.previewTone} imageUrl={item.imageUrl} className="h-[118px] w-full" />
                <p className="mt-3 truncate text-[14px] font-semibold text-ink">{item.promptTags.slice(0, 2).join(" · ")}</p>
              </button>
            ))}
          </div>
        </div>
      </Content>
    </Shell>
  );
}

function PostCard({
  post,
  onOpen,
  onLike
}: {
  post: CommunityPost;
  onOpen: () => void;
  onLike: () => void;
}) {
  return (
    <div className="rounded-[20px] bg-white/80 p-3 shadow-soft ring-1 ring-[#f0eadf]">
      <button onClick={onOpen} className="w-full text-left">
        <ImagePlaceholder label={post.title} tone={post.tone} imageUrl={post.imageUrl} className="h-[168px] w-full rounded-[18px]" />
        <p className="mt-3 text-[15px] font-semibold leading-5 text-ink">{post.title}</p>
        <p className="mt-1 min-h-[18px] truncate text-[12px] text-muted">{post.desc}</p>
      </button>
      <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
        <button onClick={onOpen} className="truncate font-medium text-[#62675a]">{post.author}</button>
        <div className="flex items-center gap-3">
          <button onClick={onLike} className="flex items-center gap-1">
            <Heart size={14} />
            {post.likes}
          </button>
          <button onClick={onOpen} className="flex items-center gap-1">
            <MessageCircle size={14} />
            {post.comments}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommunityScreen({ data, onNavigate, onDataChange }: ScreenProps) {
  const [activeTab, setActiveTab] = useState(data.community.tabs[0] || "推荐");
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [sharing, setSharing] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const visiblePosts = useMemo(() => {
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

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const upload = await uploadImage(file);
    setPhotoUrl(upload.url);
    setSharing(true);
  }

  async function publishCameraPost() {
    setBusy(true);
    const response = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "今日穿搭分享",
        desc: desc || "用拍照记录今天的搭配。",
        tone: "green",
        imageUrl: photoUrl || undefined,
        source: "camera"
      })
    });
    if (response.ok) {
      setTitle("");
      setDesc("");
      setPhotoUrl("");
      setSharing(false);
      await onDataChange();
    }
    setBusy(false);
  }

  if (selectedPost) {
    return (
      <Shell active="community" onNavigate={onNavigate}>
        <ScreenHeader title="帖子详情" left={<BackButton onClick={() => setSelectedPost(null)} />} />
        <Content compact>
          <ImagePlaceholder
            label={selectedPost.title}
            tone={selectedPost.tone}
            imageUrl={selectedPost.imageUrl}
            className="h-[340px] w-full rounded-[24px] shadow-soft"
          />
          <div className="mt-5 rounded-[20px] bg-white/82 p-5 shadow-soft ring-1 ring-[#f0eadf]">
            <p className="text-[13px] font-medium text-leaf-700">{selectedPost.author}</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-7 text-ink">{selectedPost.title}</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#62675a]">
              {selectedPost.desc || "这套搭配清爽耐看，适合日常出门和轻松聚会。"}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => updatePost(selectedPost.id, { likeDelta: 1 })} className={secondaryButtonClass()}>
                <Heart size={17} />
                获赞 {selectedPost.likes}
              </button>
              <button onClick={() => updatePost(selectedPost.id, { commentDelta: 1 })} className={secondaryButtonClass()}>
                <MessageCircle size={17} />
                评论 {selectedPost.comments}
              </button>
            </div>
          </div>
        </Content>
      </Shell>
    );
  }

  return (
    <Shell active="community" onNavigate={onNavigate}>
      <ScreenHeader
        title="穿搭社区"
        left={<MessageCircle size={25} className="text-leaf-700" />}
        right={
          <button onClick={() => fileRef.current?.click()} className={iconButtonClass()} aria-label="拍照分享">
            <Camera size={19} />
          </button>
        }
      />
      <Content compact>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="hidden" />
        <div className="phone-scroll -mx-6 overflow-x-auto px-6">
          <div className="flex w-max gap-2">
            {data.community.tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-full px-4 py-2 text-[13px] font-medium",
                  activeTab === tab ? "bg-leaf-500 text-white" : "bg-white/76 text-[#62675a] ring-1 ring-[#f0eadf]"
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {sharing ? (
          <div className="mt-4 rounded-[22px] bg-white/82 p-4 shadow-soft ring-1 ring-[#f0eadf]">
            {photoUrl ? <ImagePlaceholder imageUrl={photoUrl} tone="green" className="mb-3 h-[180px] w-full rounded-[18px]" /> : null}
            <TextField value={title} onChange={setTitle} placeholder="给这套穿搭起个标题" />
            <div className="mt-3">
              <TextField value={desc} onChange={setDesc} placeholder="写一点搭配想法" multiline />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button onClick={publishCameraPost} className={primaryButtonClass()} disabled={busy}>
                <Send size={17} />
                发布
              </button>
              <button onClick={() => setSharing(false)} className={secondaryButtonClass()}>
                取消
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => setSelectedPost(post)}
              onLike={() => updatePost(post.id, { likeDelta: 1 })}
            />
          ))}
        </div>
      </Content>
    </Shell>
  );
}

export function MineScreen({ data, onNavigate, onDataChange }: ScreenProps) {
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
    <Shell active="mine" onNavigate={onNavigate}>
      <ScreenHeader
        title="我的"
        left={<AvatarPlaceholder tone={data.user.avatarTone} imageUrl={data.user.avatarUrl} className="h-10 w-10" />}
        right={
          <button onClick={() => setEditing((value) => !value)} className={iconButtonClass(editing)} aria-label="编辑资料">
            <Pencil size={18} />
          </button>
        }
      />
      <Content>
        <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
        <div className="rounded-[24px] bg-white/82 p-5 text-center shadow-soft ring-1 ring-[#f0eadf]">
          <button onClick={() => fileRef.current?.click()} className="mx-auto block">
            <AvatarPlaceholder tone={data.user.avatarTone} imageUrl={data.user.avatarUrl} className="h-[96px] w-[96px]" />
          </button>
          {editing ? (
            <div className="mt-4 space-y-3">
              <TextField value={name} onChange={setName} placeholder="姓名" />
              <TextField value={subtitle} onChange={setSubtitle} placeholder="个人介绍" />
              <button onClick={saveTextProfile} className={`${primaryButtonClass()} mx-auto`} disabled={busy}>
                <Check size={17} />
                保存资料
              </button>
            </div>
          ) : (
            <>
              <p className="mt-4 text-[22px] font-semibold text-ink">{data.user.name}</p>
              <p className="mt-1 text-[13px] text-muted">{data.user.subtitle}</p>
              <button onClick={() => fileRef.current?.click()} className={`${secondaryButtonClass()} mx-auto mt-4`}>
                <Upload size={17} />
                上传头像
              </button>
            </>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-[18px] bg-cream-50 p-3">
            <div>
              <p className="text-[19px] font-semibold text-ink">{data.user.likes}</p>
              <p className="text-[12px] text-muted">获赞</p>
            </div>
            <div>
              <p className="text-[19px] font-semibold text-ink">{data.user.following}</p>
              <p className="text-[12px] text-muted">关注</p>
            </div>
            <div>
              <p className="text-[19px] font-semibold text-ink">{data.user.followers}</p>
              <p className="text-[12px] text-muted">粉丝</p>
            </div>
          </div>
        </div>

        {data.user.bodyImageUrl ? (
          <div className="mt-5 rounded-[24px] bg-white/82 p-4 shadow-soft ring-1 ring-[#f0eadf]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-ink">个人形象</h2>
              <span className="text-[12px] font-medium text-leaf-700">全身参考</span>
            </div>
            <ImagePlaceholder
              label="个人形象"
              tone="cream"
              imageUrl={data.user.bodyImageUrl}
              fit="contain"
              className="h-[300px] w-full rounded-[22px] bg-white"
            />
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-ink">我发布过的帖子</h2>
          <button onClick={() => onNavigate("community")} className="text-[13px] font-medium text-leaf-700">
            去社区
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(myPosts.length ? myPosts : data.community.posts.slice(0, 2)).map((post) => (
            <div key={post.id} className="rounded-[18px] bg-white/78 p-3 shadow-soft ring-1 ring-[#f0eadf]">
              <ImagePlaceholder label={post.title} tone={post.tone} imageUrl={post.imageUrl} className="h-[124px] w-full" />
              <p className="mt-3 truncate text-[14px] font-semibold text-ink">{post.title}</p>
              <p className="mt-1 text-[12px] text-muted">{post.likes} 赞 · {post.comments} 评论</p>
            </div>
          ))}
        </div>
      </Content>
    </Shell>
  );
}

export function AddItemScreen({ onNavigate, onDataChange }: ScreenProps) {
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
    <Shell active="add" onNavigate={onNavigate}>
      <ScreenHeader title="添加衣物" left={<BackButton onClick={() => onNavigate("wardrobe")} />} />
      <Content compact>
        <input ref={fileRef} type="file" accept="image/*" onChange={onImageChange} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-[220px] w-full flex-col items-center justify-center rounded-[24px] bg-white/78 shadow-soft ring-1 ring-[#f0eadf]"
        >
          {imageUrl ? (
            <ImagePlaceholder imageUrl={imageUrl} tone={tone} className="h-full w-full rounded-[24px]" />
          ) : (
            <>
              <ImagePlus size={34} className="text-leaf-700" />
              <span className="mt-3 text-[14px] font-medium text-[#62675a]">上传或拍照添加衣物</span>
            </>
          )}
        </button>

        <div className="mt-5 rounded-[22px] bg-white/82 p-4 shadow-soft ring-1 ring-[#f0eadf]">
          <div className="phone-scroll -mx-1 overflow-x-auto px-1">
            <div className="flex w-max gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={[
                    "rounded-full px-4 py-2 text-[13px] font-medium",
                    category === item ? "bg-leaf-500 text-white" : "bg-cream-50 text-[#62675a]"
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <TextField value={name} onChange={setName} placeholder="衣物名称" />
            <TextField value={color} onChange={setColor} placeholder="颜色" />
            <TextField value={season} onChange={setSeason} placeholder="适合季节" />
            <TextField value={scene} onChange={setScene} placeholder="适合场景" />
            <TextField value={material} onChange={setMaterial} placeholder="材质" />
            {category === "购物车" ? (
              <TextField value={purchaseUrl} onChange={setPurchaseUrl} placeholder="商品链接" />
            ) : null}
            <TextField value={detail} onChange={setDetail} placeholder="衣物说明" multiline />
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {toneOptions.map((item) => (
              <button
                key={item}
                onClick={() => setTone(item)}
                className={["rounded-[12px] p-1 ring-1", tone === item ? "ring-leaf-500" : "ring-transparent"].join(" ")}
                aria-label={`选择${item}`}
              >
                <ImagePlaceholder tone={item} className="h-9 w-full rounded-[10px]" />
              </button>
            ))}
          </div>
          <button onClick={saveItem} className={`${primaryButtonClass()} mt-5 w-full`} disabled={busy}>
            <Check size={17} />
            保存到我的衣柜
          </button>
        </div>
      </Content>
    </Shell>
  );
}
