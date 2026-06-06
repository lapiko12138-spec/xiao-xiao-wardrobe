import { readStoreFile, saveUploadedFile, writeStoreFile } from "@/lib/storage";
import {
  appData,
  generateOutfit,
  type AppData,
  type ClothingItem,
  type CommunityPost,
  type OutfitRecommendation,
  type PlaceholderTone
} from "@/lib/app-data";

type StoredProfile = {
  name: string;
  subtitle: string;
  days: number;
  avatarTone: PlaceholderTone;
  avatarUrl?: string;
  bodyImageUrl?: string;
  likes: number;
  following: number;
  followers: number;
};

type StoredState = {
  profile: StoredProfile;
  wardrobeItems: ClothingItem[];
  posts: CommunityPost[];
  outfitHistory: OutfitRecommendation[];
};

let writeQueue = Promise.resolve();

const initialStore: StoredState = {
  profile: appData.user,
  wardrobeItems: appData.wardrobe.items,
  posts: appData.community.posts,
  outfitHistory: appData.outfitHistory
};

async function ensureStore() {
  const existing = await readStoreFile();

  if (!existing) {
    await writeStoreFile(JSON.stringify(initialStore, null, 2));
  }
}

export async function readStore(): Promise<StoredState> {
  await ensureStore();
  const raw = (await readStoreFile()) || "";
  let parsed: Partial<StoredState>;

  try {
    parsed = raw.trim() ? (JSON.parse(raw) as Partial<StoredState>) : {};
  } catch {
    parsed = {};
  }

  const migrated: StoredState = {
    profile: {
      ...initialStore.profile,
      ...(parsed.profile || {})
    },
    wardrobeItems: parsed.wardrobeItems?.length ? parsed.wardrobeItems : initialStore.wardrobeItems,
    posts: parsed.posts?.length ? parsed.posts : initialStore.posts,
    outfitHistory: parsed.outfitHistory || initialStore.outfitHistory
  };

  if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
    await writeStore(migrated);
  }

  return migrated;
}

async function writeStore(nextStore: StoredState) {
  writeQueue = writeQueue.then(async () => {
    await writeStoreFile(JSON.stringify(nextStore, null, 2));
  });

  return writeQueue;
}

export async function getRuntimeAppData(): Promise<AppData> {
  const store = await readStore();
  const categories = appData.wardrobe.categories.map((category) => {
    const count = store.wardrobeItems.filter((item) => item.category === category.name).length;
    const suffix = category.name === "鞋子" ? "双" : category.name === "包包" ? "个" : "件";

    return {
      ...category,
      count: `${count}${suffix}`
    };
  });
  const recentItems = store.wardrobeItems
    .slice()
    .sort((a, b) => String(b.addedAt || "").localeCompare(String(a.addedAt || "")))
    .slice(0, 4)
    .map((item) => ({
      label: item.addedAt === new Date().toISOString().slice(0, 10) ? "今天" : item.name,
      tone: item.tone
    }));
  const categoryStats = ["全部", "上衣", "下装", "连衣裙", "外套"].map((label, index) => ({
    label,
    value: String(label === "全部" ? store.wardrobeItems.length : store.wardrobeItems.filter((item) => item.category === label).length),
    active: index === 0
  }));

  return {
    ...appData,
    user: store.profile,
    wardrobe: {
      ...appData.wardrobe,
      stats: categoryStats,
      categories,
      recentItems,
      items: store.wardrobeItems
    },
    community: {
      ...appData.community,
      posts: store.posts
    },
    outfitHistory: store.outfitHistory
  };
}

export async function updateProfile(profile: Partial<StoredProfile>) {
  const store = await readStore();
  const cleanProfile = Object.fromEntries(
    Object.entries(profile).filter(([, value]) => value !== undefined)
  ) as Partial<StoredProfile>;
  const nextStore: StoredState = {
    ...store,
    profile: {
      ...store.profile,
      ...cleanProfile
    }
  };

  await writeStore(nextStore);
  return nextStore.profile;
}

export async function getWardrobeItems(category?: string) {
  const store = await readStore();
  return category ? store.wardrobeItems.filter((item) => item.category === category) : store.wardrobeItems;
}

export async function getWardrobeItem(id: string) {
  const store = await readStore();
  return store.wardrobeItems.find((item) => item.id === id) || null;
}

export async function updateWardrobeItem(id: string, input: Partial<ClothingItem>) {
  const store = await readStore();
  const existing = store.wardrobeItems.find((item) => item.id === id);

  if (!existing) {
    return null;
  }

  const cleanInput = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<ClothingItem>;
  const nextItems = store.wardrobeItems.map((item) =>
    item.id === id
      ? {
          ...item,
          ...cleanInput,
          id: item.id,
          addedAt: item.addedAt
        }
      : item
  );
  const nextStore: StoredState = {
    ...store,
    wardrobeItems: nextItems
  };

  await writeStore(nextStore);
  return nextItems.find((item) => item.id === id) || null;
}

export async function deleteWardrobeItem(id: string) {
  const store = await readStore();
  const existing = store.wardrobeItems.find((item) => item.id === id);

  if (!existing) {
    return null;
  }

  const nextStore: StoredState = {
    ...store,
    wardrobeItems: store.wardrobeItems.filter((item) => item.id !== id)
  };

  await writeStore(nextStore);
  return existing;
}

export async function addWardrobeItem(input: Omit<ClothingItem, "id" | "addedAt"> & { imageUrl?: string }) {
  const store = await readStore();
  const item: ClothingItem = {
    ...input,
    id: `item-${Date.now()}`,
    addedAt: new Date().toISOString().slice(0, 10)
  };

  const nextStore: StoredState = {
    ...store,
    wardrobeItems: [item, ...store.wardrobeItems]
  };

  await writeStore(nextStore);
  return item;
}

export async function saveOutfitRecommendation(input: OutfitRecommendation) {
  const store = await readStore();
  const recommendation: OutfitRecommendation = {
    ...input,
    id: input.id || `outfit-${Date.now()}`,
    createdAt: input.createdAt || new Date().toISOString()
  };
  const nextStore: StoredState = {
    ...store,
    outfitHistory: [recommendation, ...store.outfitHistory].slice(0, 30)
  };

  await writeStore(nextStore);
  return recommendation;
}

async function createOutfitImage(input: OutfitRecommendation) {
  const filename = `${input.id || `outfit-${Date.now()}`}.svg`;
  const tones: Record<PlaceholderTone, string> = {
    cream: "#ede4d2",
    green: "#cddbb6",
    blue: "#cad9e1",
    tan: "#d7c2a3",
    gray: "#d8d8d2",
    rose: "#e4c9bf",
    dark: "#3f4439"
  };
  const bg = tones[input.previewTone] || tones.cream;
  const pieceShapes = input.pieces
    .slice(0, 5)
    .map((piece, index) => {
      const x = 58 + index * 62;
      const fill = tones[piece.tone] || tones.cream;
      return `<g><rect x="${x}" y="284" width="48" height="68" rx="14" fill="${fill}"/><text x="${x + 24}" y="372" text-anchor="middle" font-size="11" fill="#4f534b">${piece.name.slice(0, 4)}</text></g>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">
  <rect width="420" height="560" rx="28" fill="#fbfaf4"/>
  <rect x="30" y="30" width="360" height="500" rx="26" fill="${bg}" opacity="0.62"/>
  <circle cx="210" cy="112" r="40" fill="#f9eee6"/>
  <path d="M154 195c10-48 102-48 112 0l25 108H129l25-108z" fill="#fff8ec" opacity="0.86"/>
  <path d="M176 172h68l24 96H152l24-96z" fill="${bg}"/>
  <path d="M151 268h118l-24 150h-70l-24-150z" fill="#ffffff" opacity="0.74"/>
  ${pieceShapes}
  <text x="210" y="476" text-anchor="middle" font-size="24" font-weight="700" fill="#34362f">${input.title}</text>
  <text x="210" y="510" text-anchor="middle" font-size="14" fill="#72766d">${input.promptTags.slice(0, 4).join(" · ")}</text>
</svg>`;

  return saveUploadedFile(filename, svg, "image/svg+xml");
}

export function buildLocalOutfit(tags: string[], data: AppData): OutfitRecommendation {
  const fallback = generateOutfit(tags);
  const text = tags.join(" ");
  const pick = (category: string, pattern?: RegExp) => {
    const categoryItems = data.wardrobe.items.filter((item) => item.category === category);
    return (
      categoryItems.find((item) => (pattern ? pattern.test(`${item.name} ${item.color} ${item.scene} ${item.detail}`) : false)) ||
      categoryItems[0]
    );
  };
  const top = pick("上衣", /温柔|约会|春|白|奶油|绿/);
  const bottom = pick(/裙/.test(text) ? "连衣裙" : "下装", /通勤|约会|日常|白|蓝|绿/);
  const bag = pick("包包");
  const shoes = pick("鞋子");
  const accessory = pick("配饰");
  const pieces = [top, bottom, bag, shoes, accessory]
    .filter(Boolean)
    .map((item) => ({ name: item!.name, tone: item!.tone }));

  return {
    ...fallback,
    id: `outfit-${Date.now()}`,
    promptTags: tags.length ? tags : fallback.promptTags,
    pieces: pieces.length ? pieces : fallback.pieces,
    previewTone: pieces[0]?.tone || fallback.previewTone,
    likedTones: data.wardrobe.items.slice(0, 5).map((item) => item.tone),
    createdAt: new Date().toISOString()
  };
}

export async function withGeneratedOutfitImage(input: OutfitRecommendation) {
  const recommendation = {
    ...input,
    id: input.id || `outfit-${Date.now()}`
  };

  return {
    ...recommendation,
    imageUrl: input.imageUrl || (await createOutfitImage(recommendation))
  };
}

export async function addPost(input: {
  author: string;
  title: string;
  desc: string;
  tone: PlaceholderTone;
  imageUrl?: string;
  source?: "seed" | "ai" | "camera";
}) {
  const store = await readStore();
  const post: CommunityPost = {
    id: `post-${Date.now()}`,
    author: input.author || store.profile.name,
    title: input.title || "我的 AI 穿搭笔记",
    desc: input.desc || "这是一条来自小小衣橱的穿搭分享。",
    likes: 0,
    comments: 0,
    tone: input.tone,
    imageUrl: input.imageUrl,
    source: input.source || "camera",
    isMine: true,
    createdAt: new Date().toISOString()
  };

  const nextStore: StoredState = {
    ...store,
    posts: [post, ...store.posts]
  };

  await writeStore(nextStore);
  return post;
}

export async function updateCommunityPost(
  id: string,
  input: {
    likeDelta?: number;
    commentDelta?: number;
    title?: string;
    desc?: string;
  }
) {
  const store = await readStore();
  const post = store.posts.find((item) => item.id === id);

  if (!post) {
    return null;
  }

  const nextPosts = store.posts.map((item) =>
    item.id === id
      ? {
          ...item,
          title: input.title ?? item.title,
          desc: input.desc ?? item.desc,
          likes: Math.max(0, item.likes + (input.likeDelta || 0)),
          comments: Math.max(0, item.comments + (input.commentDelta || 0))
        }
      : item
  );
  const nextStore: StoredState = {
    ...store,
    posts: nextPosts
  };

  await writeStore(nextStore);
  return nextPosts.find((item) => item.id === id) || null;
}
