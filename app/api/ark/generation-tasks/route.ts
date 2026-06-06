import { NextResponse } from "next/server";

const defaultTaskUrl = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.ARK_API_KEY),
    taskUrl: process.env.ARK_GENERATION_TASK_URL || defaultTaskUrl,
    model: process.env.ARK_SEEDANCE_MODEL || "doubao-seedance-1-5-pro-251215"
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiKey = process.env.ARK_API_KEY;
  const taskUrl = process.env.ARK_GENERATION_TASK_URL || defaultTaskUrl;
  const model = String(body.model || process.env.ARK_SEEDANCE_MODEL || "doubao-seedance-1-5-pro-251215");
  const prompt = String(body.prompt || "");
  const content = Array.isArray(body.content)
    ? body.content
    : [
        {
          type: "text",
          text: prompt || "生成一组适合试穿搭配的服饰素材。"
        }
      ];

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "未配置 ARK_API_KEY",
        message: "请在 .env.local 中配置 ARK_API_KEY 后重启服务。"
      },
      { status: 501 }
    );
  }

  const response = await fetch(taskUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      content,
      generate_audio: Boolean(body.generate_audio),
      ratio: body.ratio || "1:1",
      duration: Number(body.duration || 5),
      watermark: Boolean(body.watermark)
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Ark 任务提交失败",
        status: response.status,
        result
      },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
