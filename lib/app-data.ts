export type PlaceholderTone = "cream" | "green" | "blue" | "tan" | "gray" | "rose" | "dark";

export type AppScreen = "wardrobe" | "ai" | "community" | "mine" | "add";

export type WardrobeCategory = {
  name: string;
  count: string;
  tone: PlaceholderTone;
};

export type ClothingItem = {
  id: string;
  category: string;
  name: string;
  color: string;
  season: string;
  scene: string;
  material: string;
  detail: string;
  tone: PlaceholderTone;
  imageUrl?: string;
  cutoutImageUrl?: string;
  purchaseUrl?: string;
  brand?: string;
  addedAt?: string;
};

export type RecentItem = {
  label: string;
  tone: PlaceholderTone;
};

export type OutfitPiece = {
  name: string;
  tone: PlaceholderTone;
};

export type OutfitRecommendation = {
  id?: string;
  title: string;
  promptTags: string[];
  pieces: OutfitPiece[];
  inspiration: string;
  previewTone: PlaceholderTone;
  likedTones: PlaceholderTone[];
  imageUrl?: string;
  createdAt?: string;
};

export type CommunityPost = {
  id: string;
  author: string;
  title: string;
  desc: string;
  likes: number;
  comments: number;
  tone: PlaceholderTone;
  imageUrl?: string;
  source?: "seed" | "ai" | "camera";
  isMine?: boolean;
  createdAt?: string;
};

export type AppData = {
  user: {
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
  wardrobe: {
    stats: Array<{ label: string; value: string; active?: boolean }>;
    categories: WardrobeCategory[];
    recentItems: RecentItem[];
    items: ClothingItem[];
  };
  ai: OutfitRecommendation;
  community: {
    tabs: string[];
    posts: CommunityPost[];
    popularItems: Array<{ name: string; tone: PlaceholderTone }>;
  };
  outfitHistory: OutfitRecommendation[];
};

export const appData: AppData = {
  user: {
    name: "小美",
    subtitle: "记录生活 · 发现美好 · 穿出自我",
    days: 128,
    avatarTone: "green",
    likes: 386,
    following: 42,
    followers: 128,
    avatarUrl: "/uploads/avatar-hello-kitty.png",
    bodyImageUrl: "/uploads/profile-person.png"
  },
  wardrobe: {
    stats: [
      { label: "全部", value: "236", active: true },
      { label: "上衣", value: "128" },
      { label: "下装", value: "88" },
      { label: "连衣裙", value: "96" },
      { label: "外套", value: "54" }
    ],
    categories: [
      { name: "上衣", count: "128件", tone: "cream" },
      { name: "下装", count: "88件", tone: "blue" },
      { name: "连衣裙", count: "96件", tone: "green" },
      { name: "外套", count: "54件", tone: "tan" },
      { name: "鞋子", count: "36双", tone: "gray" },
      { name: "包包", count: "28个", tone: "tan" },
      { name: "配饰", count: "45件", tone: "cream" },
      { name: "运动", count: "22件", tone: "gray" },
      { name: "购物车", count: "0件", tone: "rose" }
    ],
    recentItems: [
      { label: "今天", tone: "green" },
      { label: "今天", tone: "tan" },
      { label: "今天", tone: "cream" },
      { label: "今天", tone: "green" }
    ],
    items: [
      {
        id: "top-cream-shirt",
        category: "上衣",
        name: "奶油色衬衫",
        color: "奶油白",
        season: "春 / 夏",
        scene: "约会、通勤",
        material: "棉麻混纺",
        detail: "柔软垂顺的基础衬衫，适合搭配半身裙或浅色长裤。",
        tone: "cream",
        brand: "日常基础款",
        imageUrl: "/uploads/wardrobe-cream-shirt.jpg",
        addedAt: "2026-06-06"
      },
      {
        id: "top-green-cardigan",
        category: "上衣",
        name: "浅绿针织开衫",
        color: "浅绿色",
        season: "春 / 秋",
        scene: "日常、出游",
        material: "细针织",
        detail: "轻薄开衫，能和碎花裙、白色打底衫形成温柔层次。",
        tone: "green",
        brand: "春日针织",
        imageUrl: "/uploads/wardrobe-green-cardigan.jpg",
        addedAt: "2026-06-05"
      },
      {
        id: "top-white-tee",
        category: "上衣",
        name: "白色短袖T恤",
        color: "白色",
        season: "夏",
        scene: "休闲、运动",
        material: "纯棉",
        detail: "干净百搭的短袖，适合叠穿或单穿。",
        tone: "cream",
        brand: "基础衣橱",
        imageUrl: "/uploads/wardrobe-white-tee.jpg",
        addedAt: "2026-06-04"
      },
      {
        id: "bottom-jeans",
        category: "下装",
        name: "浅蓝直筒牛仔裤",
        color: "浅蓝",
        season: "四季",
        scene: "日常、通勤",
        material: "牛仔布",
        detail: "版型利落，能平衡甜美上衣的柔软感。",
        tone: "blue",
        brand: "牛仔系列",
        imageUrl: "/uploads/wardrobe-light-blue-jeans.jpg",
        addedAt: "2026-06-03"
      },
      {
        id: "bottom-cream-pants",
        category: "下装",
        name: "米白阔腿裤",
        color: "米白",
        season: "春 / 夏",
        scene: "通勤、约会",
        material: "垂感西装料",
        detail: "高腰阔腿设计，适合搭配衬衫和开衫。",
        tone: "cream",
        brand: "通勤精选",
        imageUrl: "/uploads/wardrobe-cream-wide-pants.jpg",
        addedAt: "2026-06-02"
      },
      {
        id: "dress-floral",
        category: "连衣裙",
        name: "碎花半身裙",
        color: "浅绿碎花",
        season: "春 / 夏",
        scene: "约会、出游",
        material: "雪纺",
        detail: "轻盈碎花元素，和奶油色上衣搭配很接近设计稿风格。",
        tone: "green",
        brand: "温柔风",
        imageUrl: "/uploads/wardrobe-floral-skirt.png",
        addedAt: "2026-06-01"
      },
      {
        id: "coat-trench",
        category: "外套",
        name: "米色风衣",
        color: "米色",
        season: "春 / 秋",
        scene: "通勤、旅行",
        material: "棉质斜纹",
        detail: "经典通勤外套，适合浅色内搭。",
        tone: "tan",
        brand: "外套系列",
        imageUrl: "/uploads/wardrobe-beige-trench.png",
        addedAt: "2026-05-31"
      },
      {
        id: "shoe-white",
        category: "鞋子",
        name: "小白鞋",
        color: "白色",
        season: "四季",
        scene: "日常、出游",
        material: "皮革",
        detail: "干净舒适，适合大多数浅色穿搭。",
        tone: "gray",
        brand: "鞋履",
        imageUrl: "/uploads/wardrobe-white-sneakers.jpg",
        addedAt: "2026-05-30"
      },
      {
        id: "bag-shoulder",
        category: "包包",
        name: "米色单肩包",
        color: "米色",
        season: "四季",
        scene: "约会、通勤",
        material: "PU皮",
        detail: "小巧轻便，适合温柔风和通勤风。",
        tone: "tan",
        brand: "包袋",
        imageUrl: "/uploads/wardrobe-beige-shoulder-bag.png",
        addedAt: "2026-05-29"
      },
      {
        id: "accessory-pearl",
        category: "配饰",
        name: "珍珠耳环",
        color: "珍珠白",
        season: "四季",
        scene: "约会、聚会",
        material: "仿珍珠",
        detail: "增加精致感的小配饰，适合浅色系搭配。",
        tone: "cream",
        brand: "配饰",
        imageUrl: "/uploads/wardrobe-pearl-earrings.png",
        addedAt: "2026-05-28"
      },
      {
        id: "sport-set",
        category: "运动",
        name: "灰绿运动套装",
        color: "灰绿色",
        season: "春 / 夏",
        scene: "运动、居家",
        material: "速干面料",
        detail: "舒适轻便，适合轻运动和周末出门。",
        tone: "gray",
        brand: "运动系列",
        imageUrl: "/uploads/wardrobe-gray-green-sport-set.png",
        addedAt: "2026-05-27"
      }
    ]
  },
  ai: {
    title: "为你生成的穿搭",
    promptTags: ["周末约会", "25°C左右", "温柔清新风", "春天"],
    pieces: [
      { name: "奶油色衬衫", tone: "cream" },
      { name: "碎花半身裙", tone: "green" },
      { name: "米色单肩包", tone: "tan" },
      { name: "小白鞋", tone: "gray" },
      { name: "珍珠耳环", tone: "cream" }
    ],
    inspiration: "温柔清新的春日约会穿搭，浅色系搭配碎花元素，给人一种轻盈舒适的感觉 🌸",
    previewTone: "cream",
    likedTones: ["rose", "cream", "blue", "tan", "green"],
    imageUrl: "/uploads/outfit-ai-generated.png"
  },
  community: {
    tabs: ["推荐", "温柔风", "通勤风", "法式风", "韩系风", "日常休闲"],
    posts: [
      {
        id: "post-1",
        author: "甜橙不甜",
        title: "春日碎花裙穿搭 🌿",
        desc: "温柔治愈的颜色太爱了！",
        likes: 128,
        comments: 12,
        tone: "green",
        imageUrl: "/uploads/post-spring-floral.png",
        source: "seed"
      },
      {
        id: "post-2",
        author: "奶油小方",
        title: "通勤日常穿搭分享",
        desc: "简约舒适又气质~",
        likes: 96,
        comments: 8,
        tone: "blue",
        imageUrl: "/uploads/outfit-ai-generated.png",
        source: "seed"
      },
      {
        id: "post-3",
        author: "小鹿酱",
        title: "休闲出游穿搭｜轻松又自在",
        desc: "",
        likes: 74,
        comments: 6,
        tone: "tan",
        imageUrl: "/uploads/post-casual-outing.png",
        source: "seed"
      },
      {
        id: "post-4",
        author: "花花哔",
        title: "All Black 也可以很温柔 ❤",
        desc: "",
        likes: 88,
        comments: 9,
        tone: "dark",
        imageUrl: "/uploads/post-all-black.png",
        source: "seed"
      }
    ],
    popularItems: [
      { name: "碎花裙", tone: "green" },
      { name: "衬衫", tone: "blue" },
      { name: "开衫", tone: "green" },
      { name: "小白鞋", tone: "gray" },
      { name: "包包", tone: "tan" }
    ]
  },
  outfitHistory: []
};

export function generateOutfit(tags: string[]): OutfitRecommendation {
  const text = tags.join(" ");
  const isCommute = /通勤|上班|会议/.test(text);
  const isCool = /冷|秋|冬|外套/.test(text);

  if (isCommute) {
    return {
      title: "为你生成的穿搭",
      promptTags: tags.length ? tags : ["通勤", "25°C左右", "简约气质"],
      pieces: [
        { name: "浅蓝衬衫", tone: "blue" },
        { name: "米色阔腿裤", tone: "tan" },
        { name: "奶油色托特包", tone: "cream" },
        { name: "白色乐福鞋", tone: "gray" },
        { name: "细链项链", tone: "cream" }
      ],
      inspiration: "干净的蓝白色调适合通勤场景，米色下装让整体更柔和，利落但不生硬。",
      previewTone: "blue",
      likedTones: ["blue", "cream", "tan", "gray", "green"]
    };
  }

  if (isCool) {
    return {
      title: "为你生成的穿搭",
      promptTags: tags.length ? tags : ["微凉天气", "温柔风", "出门"],
      pieces: [
        { name: "浅绿针织开衫", tone: "green" },
        { name: "奶油打底衫", tone: "cream" },
        { name: "棕色半身裙", tone: "tan" },
        { name: "米色单肩包", tone: "tan" },
        { name: "短靴", tone: "gray" }
      ],
      inspiration: "微凉天气适合叠穿针织开衫，浅绿色延续柔和气质，棕色半裙增加暖意。",
      previewTone: "green",
      likedTones: ["green", "tan", "cream", "gray", "rose"]
    };
  }

  return appData.ai;
}
