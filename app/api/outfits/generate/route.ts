import { NextResponse } from "next/server";
import { generateOutfit } from "@/lib/app-data";
import { buildLocalOutfit, getRuntimeAppData, saveOutfitRecommendation, withGeneratedOutfitImage } from "@/lib/store";

async function callDomesticAi(tags: string[]) {
  const apiUrl = process.env.DOMESTIC_AI_API_URL;
  const apiKey = process.env.DOMESTIC_AI_API_KEY;
  const model = process.env.DOMESTIC_AI_MODEL || "deepseek-ai/DeepSeek-V3";

  if (!apiUrl || !apiKey) {
    return null;
  }

  const data = await getRuntimeAppData();
  const wardrobeText = data.wardrobe.items
    .map((item) => `${item.name}：${item.category}，${item.color}，${item.scene}，${item.detail}`)
    .join("\n");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是小小衣橱的穿搭助手。根据用户输入和衣橱数据库，输出一段不超过80字的中文穿搭灵感。"
        },
        {
          role: "user",
          content: `用户输入：${tags.join("、")}\n\n衣橱数据库：\n${wardrobeText}`
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  return {
    ...buildLocalOutfit(tags, data),
    inspiration: String(content).slice(0, 120)
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({ tags: [] }));
  const tags = Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : [];
  const aiResult = await callDomesticAi(tags).catch(() => null);
  const data = await getRuntimeAppData();
  const recommendation = aiResult || buildLocalOutfit(tags, data) || generateOutfit(tags);
  const withImage = await withGeneratedOutfitImage(recommendation);
  const saved = await saveOutfitRecommendation(withImage);

  return NextResponse.json(saved);
}
