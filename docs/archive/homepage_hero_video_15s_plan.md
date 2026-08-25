# 首页 Hero 区域 15 秒宣传视频生成计划

## 摘要

为小维健康科技官网 3.0 首页 Hero 区域生成全新的 15 秒宣传视频，采用 **5 镜 × 3s** 全新分镜概念。工作流：① 用速创API `gpt-image-2` 以产品图 `product_bigsound_br.png` 为参考生成 5 张 16:9 分镜关键帧 → ② 用速创API `google_omni` (Veo 3.1) 将每张分镜图转为 4s 视频片段 → ③ 用 `imageio-ffmpeg` 将每段裁剪为 3s 并拼接成 15s 视频 → ④ 混入 Pixabay Music CC0 背景音乐 → ⑤ 输出到 `public/videos/promo_v2.mp4` 并更新 `VideoEntry.tsx` 引用。

旧视频 `promo.mp4` 保留不动，便于回滚对比。

---

## 当前状态分析

### 现有视频组件

**文件**: `d:\VibeTest\bigsound\src\components\home\VideoEntry.tsx`（62 行）

关键代码（第 38-61 行）：
```tsx
<section
  className="relative overflow-hidden cursor-pointer w-full h-[420px] sm:h-[520px] md:h-[620px] lg:w-[100vw] lg:h-[720px] lg:ml-[calc((1200px-100vw)/2)]"
  onClick={handleToggleFullscreen}
  ...
>
  <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline preload="auto">
    <source src="/videos/promo.mp4" type="video/mp4" />
  </video>
</section>
```

- 视频源硬编码为 `/videos/promo.mp4`
- 无遮罩、无文字、无按钮覆盖（符合项目规范）
- 点击进入/退出全屏
- 桌面端通过 `lg:ml-[calc((1200px-100vw)/2)]` 突破 1200px wrapper 铺满视口

### 现有视频文件

- `d:\VibeTest\bigsound\public\videos\promo.mp4`（10s 旧视频，保留不动）

### 速创API 现有能力

来自 `c:\Users\15927\.trae-cn\skills\img\scripts\generate_image.py`：

- **图片 endpoint**（已确认）: `POST https://api.wuyinkeji.com/api/async/image_gpt?key=<KEY>`，Body: `{"prompt": "...", "size": "16:9", "urls": ["公网参考图URL"]}`
- **轮询 endpoint**: `GET https://api.wuyinkeji.com/api/async/detail?key=<KEY>&id=<task_id>`
- **状态码**: 0=初始化 / 1=进行中 / 2=成功 / 3=失败
- **Auth 双通道**: URL query `?key=` + Header `Authorization: <key>`（无 Bearer 前缀）
- **API Key**（已配置在 `config.json`）: `cvjyzgyU9Xp2kEkoDjq09ivWG3`
- **imgbb Key**: `2a5af8f3b4221fbad52066465158e74d`（用于上传产品图和分镜图到公网）
- **视频 endpoint**（**需执行时验证**）: 推测为 `/api/async/video_google_omni`，参数推测为 `{"prompt": "...", "image": "<公网图URL>", "duration": 4, "aspect_ratio": "16:9"}`。执行者需先访问速创API 官方文档 `https://doc.wuyinkeji.com/` 或控制台确认确切路径与参数名

### 现有可复用工具

`c:\Users\15927\.trae-cn\skills\img\scripts\` 提供：
- `utils.py` — `load_config()` / `log()` / `print_result()` 等工具函数
- `upload_image.py` — imgbb 上传逻辑（可调用获取公网 URL）
- `generate_image.py` — 异步轮询模式参考实现
- `batch_generate.py` — `ThreadPoolExecutor` 并行 + 进度文件 + fallback prompt 模式参考

### 项目内缺失

- **无视频生成脚本**：整个项目与 img skill 中均无 google_omni / Veo / ffmpeg 拼接 / BGM 混音相关代码
- **无 BGM 资源**：`public/` 下无任何音频文件
- **无 Pixabay 集成**：项目内无 Pixabay API 调用代码

---

## 提议变更

### 1. 新建主脚本：`d:\VibeTest\bigsound\scripts\generate_hero_video.py`

**目的**: 一站式执行「分镜图生成 → 视频片段生成 → 拼接 → 混 BGM → 输出」全流程，支持分阶段断点续跑。

**关键设计**：
- 命令行参数：`--stage all|storyboard|clips|concat|bgm`（默认 `all`）
- `--plan`：分镜计划 JSON 文件路径（默认 `scripts/hero_video_plan.json`）
- `--bgm`：本地 BGM 文件路径（默认 `aigpic/20260726_hero_video/bgm/bgm.mp3`）
- 复用 img skill 的 `utils.load_config()` 读取 API key
- 进度文件 `aigpic/20260726_hero_video/progress.json` 记录每阶段完成状态，支持断点续跑

**5 个阶段**：

#### Stage 1: 上传产品参考图
- 读取 `public/images/products/product_bigsound_br.png`
- 上传到 imgbb（参考 `upload_image.py` 实现）获取 `product_url`
- 写入 `progress.json`

#### Stage 2: 生成 5 张分镜关键帧（gpt-image-2，并行）
- 并发数 `concurrency=3`（速创API 友好值）
- 每张图参数：`model=gpt-image-2`, `size=16:9`, `urls=[product_url]`
- 5 个分镜 prompt（详见下方"分镜计划"小节）
- 保存到 `aigpic/20260726_hero_video/storyboard/shot_N.png`
- 每张图末尾追加 `no text, no watermark, no garbled characters`（项目全局约束）

#### Stage 3: 生成 5 段 4s 视频片段（google_omni，串行避免限流）
- 每张分镜图先上传 imgbb 获取 `frame_url`
- 调用 `POST /api/async/video_google_omni?key=<KEY>`，Body: `{"prompt": "<动效描述>", "image": "<frame_url>", "duration": 4, "aspect_ratio": "16:9"}`
- 轮询 `GET /api/async/detail?key=<KEY>&id=<task_id>` 直至 `status=2`
- 下载视频到 `aigpic/20260726_hero_video/clips/shot_N_4s.mp4`
- 单镜失败自动重试 3 次（沿用 `max_retries=3`）
- 串行而非并行：视频生成算力大，避免触发限流；每镜完成后写进度

#### Stage 4: 拼接 + BGM 混音（imageio-ffmpeg）
- 用 `imageio-ffmpeg` 自带的 ffmpeg binary
- 对每段 4s 视频取中间 3s（`-ss 0.5 -t 3`，跳过首尾可能的过渡帧）
- 5 段拼接为 15s 主视频（`concat` demuxer）
- BGM 处理：
  - 若 `--bgm` 指定的本地文件存在：直接使用
  - 否则提示用户手动下载（详见"Phase 2 BGM 获取"小节）
  - BGM 音量降至 -20dB（背景音级别，不抢主画面）
  - 1s 淡入 + 1s 淡出（`afade=t=in:d=1, afade=t=out:st=14:d=1`）
  - 视频本身无音轨，BGM 作为唯一音轨
- 输出参数：H.264 video codec, AAC audio, 1280×720, 30fps, CRF 23
- 中间产物：`aigpic/20260726_hero_video/intermediate/trimmed_shot_N.mp4` × 5
- 最终输出：`public/videos/promo_v2.mp4`

#### Stage 5: 验证 + 摘要
- 用 `imageio-ffmpeg` 读取输出视频元数据（时长、分辨率、码率）
- 校验时长在 14.5s~15.5s 之间
- 打印最终文件路径、大小、5 个分镜图路径
- 在 `DEV_LOG.md` 顶部插入本次开发日志条目

### 2. 新建分镜计划文件：`d:\VibeTest\bigsound\scripts\hero_video_plan.json`

**5 个分镜定义**（每个包含 `name` / `image_prompt` / `video_prompt`）：

```json
{
  "version": "v2_15s",
  "duration_per_shot": 3,
  "total_shots": 5,
  "video_total_duration": 15,
  "aspect_ratio": "16:9",
  "resolution": "1280x720",
  "product_reference": "public/images/products/product_bigsound_br.png",
  "shots": [
    {
      "name": "shot1_product_macro",
      "image_prompt": "High-end commercial product photography, extreme macro close-up of a modern behind-the-ear hearing aid in soft pearl white and silver finish, resting on a clean white surface with subtle green accent reflection, soft studio lighting from upper left creating gentle highlights on the device, shallow depth of field with creamy bokeh, shot on Canon EOS R5 with 100mm macro lens, f/4, premium medical device magazine aesthetic, white and light gray tones with brand green accent, no text, no watermark, no garbled characters",
      "video_prompt": "Slow smooth push-in camera movement toward the hearing aid, ultra subtle parallax, soft light shift, luxury product reveal, 4 seconds"
    },
    {
      "name": "shot2_wearing_scene",
      "image_prompt": "High-end lifestyle editorial photography, a dignified 65-year-old Asian man gently placing a hearing aid behind his ear in a bright modern bedroom, soft natural morning daylight from large windows, calm and dignified mood, neutral white and light gray interior with subtle green plant accent, shot on Sony A7R IV with 85mm f/1.4 lens, shallow depth of field, premium lifestyle magazine aesthetic, no text, no watermark, no garbled characters",
      "video_prompt": "Slow gentle camera dolly-in, the man carefully places the device behind his ear with a soft smile, natural subtle movement, 4 seconds"
    },
    {
      "name": "shot3_family_moment",
      "image_prompt": "High-end lifestyle editorial photography, a multi-generation Asian family gathered in a bright modern living room, an elderly person smiling warmly while conversing with adult children and grandchildren, soft natural daylight streaming through large windows, warm cozy inviting atmosphere, genuine emotional connection, shot on Sony A7R IV with 35mm f/1.4 lens, shallow depth of field with creamy bokeh, premium lifestyle magazine aesthetic, earthy neutral tones with subtle green accents, no text, no watermark, no garbled characters",
      "video_prompt": "Subtle slow camera lateral movement from left to right, family members naturally laughing and conversing, warm emotional atmosphere, 4 seconds"
    },
    {
      "name": "shot4_audiologist_service",
      "image_prompt": "High-end interior architectural photography, a professional female audiologist in clean white coat assisting an elderly client in a modern audiology clinic room, large floor-to-ceiling windows with soft diffused natural daylight, clean white walls and light oak wood floor, minimalist modern medical equipment, professional calm and trustworthy atmosphere, shot on Nikon Z9 with 24mm f/1.8 lens, f/5.6, architectural digest medical space aesthetic, sterile yet welcoming, subtle green plant accent, no text, no watermark, no garbled characters",
      "video_prompt": "Slow subtle camera orbit around the audiologist and client, professional fitting interaction, gentle hand movements, 4 seconds"
    },
    {
      "name": "shot5_brand_finale",
      "image_prompt": "High-end commercial product photography, a single hearing aid centered on a pure white seamless background with a soft shadow underneath, a subtle green gradient glow behind the device suggesting brand identity, minimalist composition with negative space, shot on Phase One XF with 80mm lens, f/8, ultra sharp, premium brand reveal aesthetic, white and light gray with brand green accent, no text, no watermark, no garbled characters",
      "video_prompt": "Slow gentle zoom-out from the device, soft green glow subtly pulses, premium brand reveal moment, 4 seconds"
    }
  ]
}
```

### 3. 更新视频组件：`d:\VibeTest\bigsound\src\components\home\VideoEntry.tsx`

唯一改动：将 `<source src="/videos/promo.mp4" type="video/mp4" />` 改为 `<source src="/videos/promo_v2.mp4" type="video/mp4" />`（约第 58 行）。

其余属性（autoPlay / muted / loop / playsInline / className / 点击全屏逻辑）保持不变。

### 4. 新建 BGM 获取说明文件：`d:\VibeTest\bigsound\aigpic\20260726_hero_video\bgm\README.md`

**内容**: 指导用户从 Pixabay Music 手动下载 CC0 背景音乐的步骤（不依赖 Pixabay API，因为 API 需注册且曲库筛选更适合人工）：

1. 访问 `https://pixabay.com/music/`
2. 搜索关键词：`corporate inspirational` / `calm technology` / `medical ambient` / `uplifting minimalist`
3. 筛选 License: `CC0`（Pixabay 全站 CC0，但仍建议核对）
4. 推荐曲风：instrumental、无vocals、节奏舒缓（80-100 BPM）、时长 ≥ 15s
5. 下载 MP3，重命名为 `bgm.mp3` 放到本目录
6. 运行 `python scripts/generate_hero_video.py --stage concat` 触发拼接混音

**说明**: 此 README 是为了让用户人工选择最贴合品牌调性的 BGM，而非脚本自动抓取（自动抓取无法保证曲风匹配）。

### 5. 更新开发日志：`d:\VibeTest\bigsound\DEV_LOG.md`

在文件顶部（第 6 行 `---` 之后、当前第 7 行 `## [2026-07-26]` 之前）插入新条目，遵循现有模板格式：

```markdown
## [2026-07-26] Hero 视频 | 首页 Hero 15s 宣传视频 v2 生成（5 镜×3s + Pixabay BGM）

**类型**: 视频生成 + 组件更新

**摘要**
为首页 Hero 区域生成全新 15s 宣传视频，采用 5 镜×3s 全新分镜概念...
（详细变更、影响范围、关联文件等按现有模板填写）
```

---

## 假设与决策

### 已确认决策（用户 Phase 2 回复）
1. **分镜结构**: 5 镜 × 3s 全新概念
2. **BGM 来源**: Pixabay Music（CC0）
3. **输出文件**: 新文件名 `promo_v2.mp4`（保留旧 `promo.mp4`）

### 关键假设
1. **速创API video_google_omni endpoint**: 现有 img skill 代码无记录，推测为 `/api/async/video_google_omni`。执行者必须先访问速创API 官方文档或控制台 `https://doc.wuyinkeji.com/` 确认确切路径、HTTP 方法、请求参数（`prompt` / `image` / `duration` / `aspect_ratio`）与响应格式。若实际 endpoint 不同，调整 `generate_hero_video.py` 中的常量即可。
2. **Veo 3.1 单次输出 4s**: 基于项目记忆中"video_google_omni (Veo 3.1) 各生成 4s 视频"的历史记录。若 API 现在支持 8s 输出，可考虑改为 `--duration 8` 后裁剪 3s（更易得到稳定画面），但默认仍按 4s 设计。
3. **imageio-ffmpeg 可用**: 项目记忆显示上次视频拼接已成功使用 imageio-ffmpeg，本次沿用。需 `pip install imageio-ffmpeg`（若环境已安装则跳过）。
4. **Pixabay 全站 CC0**: Pixabay Music 全站内容遵循 CC0 协议（含 Pixabay License），可商用、无需署名。但仍建议在 BGM README 中提示用户核对单首曲目的协议说明。
5. **视频无音轨 → BGM 为唯一音轨**: 速创API Veo 3.1 生成视频默认无音轨（待执行时确认）。若实际有音轨，需在 ffmpeg 命令中加 `-an` 移除原音轨再混入 BGM。
6. **1280×720 分辨率**: 与旧视频一致（项目记忆"1280×720"），保持 Hero 区域性能与质量平衡。
7. **5 个分镜的 prompt 风格**: 严格遵循项目记忆"AI 配图全局基础风格"——真实、高端、商业摄影风格、医疗专业感、白/灰为主、品牌绿点缀、每个分镜都含产品或产品相关场景。

### 不做的事（避免过度工程）
- ❌ 不写 Pixabay API 自动抓取脚本（人工挑选 BGM 曲风更准）
- ❌ 不做多个 BGM 候选对比页（用户已选定 Pixabay 单一来源）
- ❌ 不重构 VideoEntry.tsx（仅改 source 路径）
- ❌ 不删除/覆盖旧 `promo.mp4`（用户明确要求保留）
- ❌ 不为视频生成结果做 HTML 对比预览页（视频文件本身即最终交付物，可在浏览器直接预览）
- ❌ 不新增 i18n 翻译键（视频路径变更不影响 i18n）
- ❌ 不做 8s 长镜头变体（用户已选 4s×5 镜方案）

---

## 验证步骤

### 单元验证（每个 Stage 完成后）

1. **Stage 1 完成**: `progress.json` 中 `product_url` 字段非空，imgbb URL 可在浏览器访问到产品图
2. **Stage 2 完成**: `aigpic/20260726_hero_video/storyboard/` 下有 5 个 `shot_N.png` 文件，每个文件 > 100KB，肉眼检查风格统一性（白灰主调 + 品牌绿点缀 + 含产品元素）
3. **Stage 3 完成**: `aigpic/20260726_hero_video/clips/` 下有 5 个 `shot_N_4s.mp4` 文件，每个可播放，时长在 3.8s~4.2s 之间
4. **Stage 4 完成**: `public/videos/promo_v2.mp4` 存在，时长 14.5s~15.5s，文件大小预期 1.5~3 MB

### 集成验证

1. **TypeScript 编译**: 在 `d:\VibeTest\bigsound\` 运行 `npx tsc --noEmit`，确认 VideoEntry.tsx 改动无类型错误
2. **浏览器验证**: 启动 dev server `npm run dev`，访问 `http://localhost:5173/`，确认：
   - Hero 视频自动播放（muted + loop + playsInline）
   - 视频铺满视口（桌面端 ≥1024px 时宽度=100vw，高度=720px）
   - 无遮罩、无文字、无按钮覆盖
   - 点击视频区域进入/退出全屏
   - 视频内容连贯、BGM 音量适中（不抢主画面）
   - 控制台无 404 / 加载错误
3. **移动端验证**: 在 1024px 以下视口（DevTools 模拟移动端）确认视频高度自适应（420/520/620px 三档）
4. **DEV_LOG.md**: 检查新条目已插入到顶部，格式与现有条目一致

### 回滚方案

若新视频效果不佳：
1. 将 `VideoEntry.tsx` 第 58 行 `/videos/promo_v2.mp4` 改回 `/videos/promo.mp4`
2. 删除 `public/videos/promo_v2.mp4`
3. 旧 `promo.mp4` 从未改动，可直接复用

---

## 实施顺序（执行者参考）

1. **前置准备**（5 分钟）
   - 访问速创API 官方文档，确认 `video_google_omni` endpoint 路径与参数
   - 确认 Python 环境已安装 `imageio-ffmpeg`、`requests`、`Pillow`
   - 创建目录：`aigpic/20260726_hero_video/{storyboard,clips,intermediate,bgm}`

2. **BGM 准备**（用户人工，10 分钟）
   - 用户按 `aigpic/20260726_hero_video/bgm/README.md` 指引从 Pixabay 下载 MP3
   - 重命名为 `bgm.mp3` 放入目录

3. **写脚本**（20 分钟）
   - 创建 `scripts/hero_video_plan.json`
   - 创建 `scripts/generate_hero_video.py`
   - 创建 `aigpic/20260726_hero_video/bgm/README.md`

4. **执行生成**（10~30 分钟，取决于速创API 响应速度）
   - `python scripts/generate_hero_video.py --stage all`
   - 若中途失败：修复后用 `--stage clips` 等参数断点续跑

5. **更新组件**（1 分钟）
   - 编辑 `src/components/home/VideoEntry.tsx` 第 58 行的 source 路径

6. **验证 + 日志**（5 分钟）
   - 运行 `npx tsc --noEmit`
   - 启动 dev server 浏览器验证
   - 在 `DEV_LOG.md` 顶部插入开发日志条目

**预估总耗时**: 40~70 分钟（含速创API 异步轮询等待时间）
