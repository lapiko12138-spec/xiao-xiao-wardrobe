# Right Code 图片生成接入说明

## 接口信息

- 基础地址：`https://www.right.codes/draw`
- 图片生成接口：`/v1/images/generations`
- 聊天接口：`/v1/chat/completions`
- 鉴权方式：`Authorization: Bearer sk-xxxxx`
- 图片生成支持参考图：`image`，可传 base64 或 URL
- 推荐返回格式：`response_format: "url"`

当前项目已接入图片生成接口，后端代理路径：

```text
POST /api/right-code/images/generations
```

## 本地环境变量

在项目根目录创建或编辑 `.env.local`：

```env
RIGHT_CODE_API_KEY=你的RightCodeKey
RIGHT_CODE_BASE_URL=https://www.right.codes/draw
RIGHT_CODE_IMAGE_MODEL=gpt-image-2
```

保存后重启开发服务：

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## 状态检查

浏览器或终端访问：

```text
GET http://127.0.0.1:3000/api/right-code/images/generations
```

配置成功时应返回：

```json
{
  "configured": true,
  "baseUrl": "https://www.right.codes/draw",
  "model": "gpt-image-2"
}
```

## 前端使用方式

进入：

```text
http://127.0.0.1:3000/web
```

打开 `AI搭配`，点击顶部 `生成素材`：

1. 优先调用 Right Code 图片生成接口。
2. 成功后会把图片保存到 `public/uploads`。
3. 生成素材会出现在右侧衣橱素材区。
4. 可拖拽到左侧人物身上试穿。

如果没有配置 `RIGHT_CODE_API_KEY`，系统会自动回退到本地素材和 Ark 任务逻辑。

## 上传图片风格内化

项目还接入了：

```text
POST /api/right-code/normalize
```

用途：

- 上传全身照后，生成统一 2D 人物形象。
- 上传衣服图片后，生成统一 2D 衣服素材。

该接口会把上传图转成 base64，作为 `image` 参考图传给 Right Code：

```json
{
  "model": "gpt-image-2",
  "prompt": "参考输入图片生成小小衣橱统一风格素材",
  "image": ["data:image/png;base64,..."],
  "size": "1024x1024",
  "response_format": "url"
}
```
