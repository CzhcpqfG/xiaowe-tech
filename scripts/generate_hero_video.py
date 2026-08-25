"""首页 Hero 区域 15s 宣传视频生成脚本 (v2, 5 镜×3s + Pixabay BGM)。

工作流:
  Stage 1: 上传产品参考图到 imgbb 获取公网 URL
  Stage 2: 用 gpt-image-2 并行生成 5 张 16:9 分镜关键帧 (以产品图为参考)
  Stage 3: 用 google_omni (Gemini Omni) 串行将每张分镜转为 4s 视频
  Stage 4: 用 imageio-ffmpeg 将每段裁剪为 3s, 拼接 15s, 混入 BGM
  Stage 5: 验证输出 + 打印摘要

用法:
  python scripts/generate_hero_video.py --stage all
  python scripts/generate_hero_video.py --stage storyboard
  python scripts/generate_hero_video.py --stage clips
  python scripts/generate_hero_video.py --stage concat --bgm path/to/bgm.mp3

依赖:
  - 速创API (api.wuyinkeji.com) gpt-image-2 + google_omni
  - img skill 脚本 (utils.py / upload_image.py / generate_image.py) 位于
    c:\\Users\\15927\\.trae-cn\\skills\\img\\scripts\\
  - Python 包: requests, imageio-ffmpeg, Pillow
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List, Optional

# 项目根目录 (脚本位于 <root>/scripts/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# img skill 脚本目录 (跨项目共享 API key + 上传逻辑)
SKILL_SCRIPTS_DIR = Path(r"c:\Users\15927\.trae-cn\skills\img\scripts")
sys.path.insert(0, str(SKILL_SCRIPTS_DIR))

# 现在可以导入 img skill 的工具函数
from utils import load_config, log, print_result  # noqa: E402
from upload_image import upload_image  # noqa: E402
from generate_image import generate_image, _http_get, _http_post_json  # noqa: E402

# 速创API 视频生成 endpoint (官方文档 https://api.wuyinkeji.com/doc/72)
VIDEO_ENDPOINT = "/api/async/video_google_omni"
VIDEO_POLL_ENDPOINT = "/api/async/detail"

# 工作目录
WORK_DIR = PROJECT_ROOT / "aigpic" / "20260726_hero_video"
STORYBOARD_DIR = WORK_DIR / "storyboard"
CLIPS_DIR = WORK_DIR / "clips"
INTERMEDIATE_DIR = WORK_DIR / "intermediate"
BGM_DIR = WORK_DIR / "bgm"
PROGRESS_FILE = WORK_DIR / "progress.json"
DEFAULT_BGM = BGM_DIR / "bgm.mp3"
DEFAULT_PLAN = PROJECT_ROOT / "scripts" / "hero_video_plan.json"
FINAL_OUTPUT = PROJECT_ROOT / "public" / "videos" / "promo_v2.mp4"


# ============================================================
# 视频生成相关函数
# ============================================================

def submit_video_task(base_url: str, api_key: str, prompt: str,
                      image_url: str, size: str = "1280x720",
                      duration: str = "4", timeout: int = 60) -> Dict:
    """提交视频生成任务到 google_omni endpoint。

    请求体 (按官方文档):
      {
        "prompt": "<动效描述>",
        "size": "1280x720",
        "images": "<公网参考图URL>",   # 多个用英文逗号隔开, 这里单张
        "duration": "4"
      }
    """
    url = f"{base_url}{VIDEO_ENDPOINT}?key={urllib.parse.quote(api_key)}"
    payload = {
        "prompt": prompt,
        "size": size,
        "images": image_url,
        "duration": str(duration),
    }
    headers = {"Authorization": api_key}
    resp = _http_post_json(url, payload, headers, timeout)
    if not resp["ok"]:
        return {"ok": False, "error": f"提交失败: {resp.get('error')}", "detail": resp.get("data")}

    data = resp["data"]
    if not isinstance(data, dict):
        return {"ok": False, "error": "返回格式异常", "detail": data}
    if data.get("code") != 200:
        return {"ok": False, "error": f"速创API返回错误: {data.get('msg')}", "detail": data}

    task_id = data.get("data", {}).get("id") if isinstance(data.get("data"), dict) else None
    if not task_id:
        return {"ok": False, "error": "未返回 task id", "detail": data}
    return {"ok": True, "task_id": task_id, "raw": data}


def poll_video_result(base_url: str, api_key: str, task_id: str,
                      max_wait: int = 600, interval: int = 5) -> Dict:
    """轮询视频任务结果, 返回视频 URL。

    视频生成比图片慢 (通常 1-3 分钟), 默认 max_wait=600s, interval=5s。
    """
    url = f"{base_url}{VIDEO_POLL_ENDPOINT}?key={urllib.parse.quote(api_key)}&id={urllib.parse.quote(task_id)}"
    headers = {"Authorization": api_key, "Content-Type": "application/json"}

    start = time.time()
    last_status = -1
    cur_interval = interval
    max_interval = 30
    consecutive_net_err = 0
    last_log_time = start

    while time.time() - start < max_wait:
        resp = _http_get(url, headers, timeout=30)
        if not resp["ok"]:
            consecutive_net_err += 1
            cur_interval = min(interval * (2 ** min(consecutive_net_err, 4)), max_interval)
            log(f"轮询网络错误 #{consecutive_net_err}: {resp.get('error')}, {cur_interval}s 后重试 (已等待 {int(time.time()-start)}s)", "WARN")
            time.sleep(cur_interval)
            continue

        if consecutive_net_err > 0:
            log(f"网络恢复, 重置轮询间隔为 {interval}s", "OK")
            consecutive_net_err = 0
            cur_interval = interval

        data = resp["data"]
        if not isinstance(data, dict) or data.get("code") != 200:
            log(f"轮询返回异常: {data}, {cur_interval}s 后重试...", "WARN")
            time.sleep(cur_interval)
            continue

        payload = data.get("data", {})
        if not isinstance(payload, dict):
            time.sleep(cur_interval)
            continue

        status = payload.get("status")
        if status != last_status:
            status_text = {0: "初始化", 1: "进行中", 2: "成功", 3: "失败"}.get(status, str(status))
            log(f"  任务状态: {status_text} (已等待 {int(time.time()-start)}s)")
            last_status = status
            last_log_time = time.time()

        if status == 2:
            return {"ok": True, "data": payload}
        if status == 3:
            return {"ok": False, "error": f"任务失败: {payload.get('message')}", "detail": payload}

        if time.time() - last_log_time > 60:
            log(f"  仍在进行中... (已等待 {int(time.time()-start)}s/{max_wait}s)")
            last_log_time = time.time()

        time.sleep(cur_interval)

    return {"ok": False, "error": f"轮询超时 ({max_wait}s)", "task_id": task_id}


def extract_video_url(payload: Dict) -> List[str]:
    """从轮询结果中提取视频 URL, 兼容多种字段名。"""
    urls: List[str] = []
    for key in ("videos", "video_url", "video", "images", "url", "result"):
        v = payload.get(key)
        if isinstance(v, list):
            urls.extend([u for u in v if isinstance(u, str) and u.startswith("http")])
        elif isinstance(v, str) and v.startswith("http"):
            urls.append(v)
    # 去重保序
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def download_file(url: str, save_path: Path, timeout: int = 180) -> bool:
    """下载文件 (视频/图片) 到本地。"""
    try:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "suichuang-skill/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            save_path.write_bytes(resp.read())
        return True
    except Exception as e:
        log(f"下载失败 {url}: {e}", "ERROR")
        return False


# ============================================================
# 进度文件读写
# ============================================================

def load_progress() -> Dict:
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"stage1": None, "stage2": {}, "stage3": {}, "stage4": None, "stage5": None}


def save_progress(data: Dict) -> None:
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = PROGRESS_FILE.with_suffix(PROGRESS_FILE.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(PROGRESS_FILE)


# ============================================================
# Stage 函数
# ============================================================

def stage1_upload_product_ref(plan: Dict, config: Dict, progress: Dict) -> Optional[str]:
    """Stage 1: 上传产品参考图到 imgbb。"""
    log("=" * 60)
    log("Stage 1: 上传产品参考图到 imgbb")
    log("=" * 60)

    if (progress.get("stage1") or {}).get("product_url"):
        url = progress["stage1"]["product_url"]
        log(f"已存在 product_url, 跳过: {url}", "OK")
        return url

    product_rel = plan.get("product_reference", "public/images/products/product_bigsound_br.png")
    product_path = PROJECT_ROOT / product_rel
    if not product_path.exists():
        log(f"产品图不存在: {product_path}", "ERROR")
        return None

    log(f"上传 {product_path.name} 到 imgbb ...")
    result = upload_image(str(product_path), config_path=str(SKILL_SCRIPTS_DIR / "config.json"))
    if not result.get("success"):
        log(f"上传失败: {result.get('error')}", "ERROR")
        return None

    url = result["public_url"]
    log(f"已上传: {url}", "OK")
    progress["stage1"] = {"product_url": url, "local_path": str(product_path)}
    save_progress(progress)
    return url


def stage2_generate_storyboards(plan: Dict, config: Dict, progress: Dict,
                                product_url: str) -> Dict[str, Path]:
    """Stage 2: 并行生成 5 张分镜关键帧 (gpt-image-2, concurrency=3)。"""
    log("=" * 60)
    log("Stage 2: 并行生成 5 张分镜关键帧 (gpt-image-2)")
    log("=" * 60)

    shots = plan["shots"]
    name_to_path: Dict[str, Path] = {}

    # 检查已完成的
    pending = []
    for shot in shots:
        name = shot["name"]
        out_path = STORYBOARD_DIR / f"{name}.png"
        existing = progress.get("stage2", {}).get(name)
        if existing and out_path.exists():
            log(f"  {name}: 已存在, 跳过 ({out_path.name})", "OK")
            name_to_path[name] = out_path
        else:
            pending.append(shot)

    if not pending:
        log("所有分镜图已完成", "OK")
        return name_to_path

    log(f"待生成: {len(pending)} 张, 并发=3")

    def _gen_one(shot: Dict) -> Dict:
        name = shot["name"]
        out_path = STORYBOARD_DIR / f"{name}.png"
        prompt = shot["image_prompt"]
        start = time.time()
        log(f"  [{name}] 开始生成...")
        result = generate_image(
            prompt=prompt,
            ref_images=[product_url],
            size="16:9",
            out_path=str(out_path),
            config_path=str(SKILL_SCRIPTS_DIR / "config.json"),
            upload_refs=False,  # product_url 已是公网 URL
        )
        result["_name"] = name
        result["_out_path"] = str(out_path)
        result["_cost"] = round(time.time() - start, 1)
        return result

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(_gen_one, shot): shot for shot in pending}
        for fut in as_completed(futures):
            shot = futures[fut]
            name = shot["name"]
            try:
                result = fut.result()
            except Exception as e:
                log(f"  [{name}] 异常: {e}", "ERROR")
                continue

            if not result.get("success"):
                log(f"  [{name}] 失败: {result.get('error')}", "ERROR")
                log(f"          detail: {str(result.get('detail'))[:200]}", "WARN")
                continue

            out_path = Path(result["_out_path"])
            image_urls = result.get("image_urls", [])
            public_url = image_urls[0] if image_urls else None
            log(f"  [{name}] 完成 ({result['_cost']}s) -> {out_path.name} | public_url={public_url}", "OK")

            name_to_path[name] = out_path
            progress.setdefault("stage2", {})[name] = {
                "local_path": str(out_path),
                "public_url": public_url,
                "task_id": result.get("task_id"),
            }
            save_progress(progress)

    if len(name_to_path) != len(shots):
        log(f"警告: 仅完成 {len(name_to_path)}/{len(shots)} 张分镜图", "WARN")
    else:
        log("全部 5 张分镜图生成完成", "OK")
    return name_to_path


def stage3_generate_clips(plan: Dict, config: Dict, progress: Dict,
                          name_to_path: Dict[str, Path]) -> Dict[str, Path]:
    """Stage 3: 串行生成 5 段视频片段 (google_omni)。"""
    log("=" * 60)
    log("Stage 3: 串行生成 5 段视频片段 (google_omni)")
    log("=" * 60)

    api_cfg = config["api_relay"]
    base_url = api_cfg.get("base_url", "https://api.wuyinkeji.com").rstrip("/")
    api_key = api_cfg.get("api_key", "")
    timeout = api_cfg.get("timeout", 180)
    max_retries = api_cfg.get("max_retries", 3)
    poll_max_wait = 900  # 视频生成最长等待 15 分钟

    shots = plan["shots"]
    name_to_clip: Dict[str, Path] = {}

    for idx, shot in enumerate(shots, 1):
        name = shot["name"]
        clip_path = CLIPS_DIR / f"{name}_4s.mp4"

        existing = progress.get("stage3", {}).get(name)
        if existing and clip_path.exists():
            log(f"  [{idx}/5] {name}: 已存在, 跳过 ({clip_path.name})", "OK")
            name_to_clip[name] = clip_path
            continue

        # 获取分镜图公网 URL (从 stage2 进度)
        sb_progress = progress.get("stage2", {}).get(name, {})
        image_url = sb_progress.get("public_url")
        if not image_url:
            log(f"  [{idx}/5] {name}: 缺少分镜图公网 URL, 跳过", "ERROR")
            continue

        log(f"  [{idx}/5] {name}: 提交视频任务...")
        video_prompt = shot["video_prompt"]

        task_id = None
        last_err = None
        for attempt in range(1, max_retries + 1):
            result = submit_video_task(
                base_url, api_key, video_prompt, image_url,
                size=plan.get("resolution", "1280x720"),
                duration="4", timeout=timeout,
            )
            if result["ok"]:
                task_id = result["task_id"]
                log(f"  [{idx}/5] {name}: 任务已提交 (id={task_id})", "OK")
                break
            last_err = result
            wait = min(5 * attempt, 20)
            log(f"  [{idx}/5] {name}: 提交失败 (attempt {attempt}/{max_retries}), {wait}s 后重试... 错误: {result.get('error')}", "WARN")
            time.sleep(wait)

        if not task_id:
            log(f"  [{idx}/5] {name}: 提交彻底失败, 跳过. detail={str(last_err.get('detail'))[:200] if last_err else ''}", "ERROR")
            continue

        # 轮询
        log(f"  [{idx}/5] {name}: 开始轮询 (最长 {poll_max_wait}s)...")
        poll = poll_video_result(base_url, api_key, task_id, max_wait=poll_max_wait, interval=5)
        if not poll["ok"]:
            log(f"  [{idx}/5] {name}: 轮询失败 - {poll.get('error')}", "ERROR")
            continue

        video_urls = extract_video_url(poll["data"])
        if not video_urls:
            log(f"  [{idx}/5] {name}: 任务成功但未返回视频 URL, detail={str(poll['data'])[:200]}", "ERROR")
            continue

        # 下载
        log(f"  [{idx}/5] {name}: 下载视频 -> {clip_path.name}")
        if not download_file(video_urls[0], clip_path):
            continue

        size_kb = clip_path.stat().st_size / 1024
        log(f"  [{idx}/5] {name}: 完成 ({size_kb:.1f} KB)", "OK")
        name_to_clip[name] = clip_path
        progress.setdefault("stage3", {})[name] = {
            "local_path": str(clip_path),
            "video_url": video_urls[0],
            "task_id": task_id,
        }
        save_progress(progress)

    if len(name_to_clip) != len(shots):
        log(f"警告: 仅完成 {len(name_to_clip)}/{len(shots)} 段视频", "WARN")
    else:
        log("全部 5 段视频生成完成", "OK")
    return name_to_clip


def stage4_concat_with_bgm(plan: Dict, progress: Dict,
                           name_to_clip: Dict[str, Path],
                           bgm_path: Optional[Path] = None) -> Optional[Path]:
    """Stage 4: 用 imageio-ffmpeg 裁剪 + 拼接 + 混 BGM。"""
    log("=" * 60)
    log("Stage 4: 裁剪 + 拼接 + BGM 混音 (imageio-ffmpeg)")
    log("=" * 60)

    try:
        import imageio_ffmpeg
    except ImportError:
        log("未安装 imageio-ffmpeg, 请运行: pip install imageio-ffmpeg", "ERROR")
        return None

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    log(f"ffmpeg binary: {ffmpeg}")

    shots = plan["shots"]
    duration_per_shot = plan.get("duration_per_shot", 3)

    # 4.1 裁剪每段到 duration_per_shot 秒 (取中间段, 跳过首尾过渡)
    INTERMEDIATE_DIR.mkdir(parents=True, exist_ok=True)
    trimmed_paths: List[Path] = []
    for idx, shot in enumerate(shots, 1):
        name = shot["name"]
        clip = name_to_clip.get(name)
        if not clip or not clip.exists():
            log(f"  [{idx}/5] {name}: 源视频缺失, 跳过", "ERROR")
            return None

        trimmed = INTERMEDIATE_DIR / f"{name}_{duration_per_shot}s.mp4"
        if trimmed.exists() and trimmed.stat().st_size > 10 * 1024:
            log(f"  [{idx}/5] {name}: 已裁剪, 跳过")
            trimmed_paths.append(trimmed)
            continue

        # 跳过前 0.5s, 取中间 duration_per_shot 秒
        ss = 0.5
        cmd = [
            ffmpeg, "-y", "-loglevel", "error",
            "-ss", str(ss),
            "-i", str(clip),
            "-t", str(duration_per_shot),
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-an",  # 移除原音轨
            str(trimmed),
        ]
        log(f"  [{idx}/5] {name}: 裁剪 {duration_per_shot}s -> {trimmed.name}")
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if r.returncode != 0:
            log(f"  [{idx}/5] {name}: 裁剪失败 - {r.stderr[:300]}", "ERROR")
            return None
        trimmed_paths.append(trimmed)

    # 4.2 拼接 5 段 (concat demuxer)
    concat_list = INTERMEDIATE_DIR / "concat_list.txt"
    concat_list.write_text(
        "\n".join(f"file '{p.as_posix()}'" for p in trimmed_paths) + "\n",
        encoding="utf-8",
    )

    silent_concat = INTERMEDIATE_DIR / "concat_silent.mp4"
    log(f"拼接 {len(trimmed_paths)} 段 -> {silent_concat.name}")
    cmd = [
        ffmpeg, "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(silent_concat),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        # concat demuxer + copy 有时因时间戳不连续失败, 退到 re-encode
        log(f"  copy 模式失败, 切换到 re-encode: {r.stderr[:200]}", "WARN")
        cmd = [
            ffmpeg, "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_list),
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-an",
            str(silent_concat),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if r.returncode != 0:
            log(f"拼接失败 - {r.stderr[:300]}", "ERROR")
            return None

    # 4.3 混入 BGM (若提供且存在)
    FINAL_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if bgm_path and bgm_path.exists():
        log(f"混入 BGM: {bgm_path.name}")
        # BGM: 音量降到 0.15 (~-20dB), 1s 淡入 + 1s 淡出 (14s 开始淡出)
        cmd = [
            ffmpeg, "-y", "-loglevel", "error",
            "-i", str(silent_concat),
            "-i", str(bgm_path),
            "-filter_complex",
            f"[1:a]volume=0.15,afade=t=in:d=1,afade=t=out:st={max(plan.get('video_total_duration', 15) - 1, 0)}:d=1[a]",
            "-map", "0:v", "-map", "[a]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest",
            str(FINAL_OUTPUT),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if r.returncode != 0:
            log(f"BGM 混音失败 - {r.stderr[:300]}, 改用无音轨输出", "WARN")
            # fallback: 直接复制 silent_concat
            import shutil
            shutil.copy2(str(silent_concat), str(FINAL_OUTPUT))
            bgm_path = None
    else:
        log("未提供 BGM 文件, 输出无音轨视频", "WARN")
        import shutil
        shutil.copy2(str(silent_concat), str(FINAL_OUTPUT))

    # 校验时长
    probe = subprocess.run(
        [ffmpeg, "-i", str(FINAL_OUTPUT), "-hide_banner"],
        capture_output=True, text=True, timeout=30,
    )
    log(f"ffmpeg probe stderr:\n{probe.stderr[:600]}", "INFO")

    size_mb = FINAL_OUTPUT.stat().st_size / (1024 * 1024)
    log(f"最终输出: {FINAL_OUTPUT} ({size_mb:.2f} MB)", "OK")
    progress["stage4"] = {
        "output": str(FINAL_OUTPUT),
        "size_mb": round(size_mb, 2),
        "bgm_used": bool(bgm_path and bgm_path.exists()),
    }
    save_progress(progress)
    return FINAL_OUTPUT


def stage5_verify(plan: Dict, progress: Dict, final_output: Path) -> None:
    """Stage 5: 打印摘要。"""
    log("=" * 60)
    log("Stage 5: 验证 + 摘要")
    log("=" * 60)

    if not final_output.exists():
        log(f"输出文件不存在: {final_output}", "ERROR")
        return

    size_mb = final_output.stat().st_size / (1024 * 1024)
    log(f"\n最终视频: {final_output}")
    log(f"文件大小: {size_mb:.2f} MB")
    log(f"\n分镜图位置:")
    for name in [s["name"] for s in plan["shots"]]:
        p = STORYBOARD_DIR / f"{name}.png"
        if p.exists():
            log(f"  - {p}")
    log(f"\n视频片段位置:")
    for name in [s["name"] for s in plan["shots"]]:
        p = CLIPS_DIR / f"{name}_4s.mp4"
        if p.exists():
            log(f"  - {p}")
    log(f"\n进度文件: {PROGRESS_FILE}")
    log(f"\n下一步:")
    log(f"  1. 在浏览器打开 http://localhost:5173/ 验证 Hero 视频")
    log(f"  2. 若需添加/更换 BGM, 将 mp3 放到 {BGM_DIR}/bgm.mp3 后重跑:")
    log(f"     python scripts/generate_hero_video.py --stage concat")
    log(f"  3. 更新 DEV_LOG.md 记录本次开发")


# ============================================================
# 主入口
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="生成首页 Hero 15s 宣传视频")
    parser.add_argument("--stage", default="all",
                        choices=["all", "storyboard", "clips", "concat", "verify"],
                        help="执行阶段 (默认 all)")
    parser.add_argument("--plan", default=str(DEFAULT_PLAN),
                        help=f"分镜计划 JSON (默认 {DEFAULT_PLAN})")
    parser.add_argument("--bgm", default=str(DEFAULT_BGM),
                        help=f"BGM 文件路径 (默认 {DEFAULT_BGM})")
    args = parser.parse_args()

    # 加载计划
    plan_path = Path(args.plan)
    if not plan_path.exists():
        log(f"计划文件不存在: {plan_path}", "ERROR")
        sys.exit(1)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    log(f"已加载计划: {plan_path.name} | version={plan.get('version')} | shots={len(plan['shots'])}")

    # 加载速创API 配置
    config = load_config(str(SKILL_SCRIPTS_DIR / "config.json"))

    # 确保工作目录存在
    for d in (WORK_DIR, STORYBOARD_DIR, CLIPS_DIR, INTERMEDIATE_DIR, BGM_DIR):
        d.mkdir(parents=True, exist_ok=True)

    progress = load_progress()

    # Stage 1: 上传产品参考图
    product_url = None
    if args.stage in ("all", "storyboard", "clips"):
        product_url = stage1_upload_product_ref(plan, config, progress)
        if not product_url and args.stage in ("all", "storyboard"):
            log("Stage 1 失败, 终止", "ERROR")
            sys.exit(1)

    # Stage 2: 生成分镜图
    name_to_path: Dict[str, Path] = {}
    if args.stage in ("all", "storyboard"):
        if not product_url:
            product_url = (progress.get("stage1") or {}).get("product_url")
        if not product_url:
            log("缺少 product_url, 无法生成分镜图", "ERROR")
            sys.exit(1)
        name_to_path = stage2_generate_storyboards(plan, config, progress, product_url)
    elif args.stage in ("clips", "concat", "verify"):
        # 从进度文件恢复
        for name in [s["name"] for s in plan["shots"]]:
            p = STORYBOARD_DIR / f"{name}.png"
            if p.exists():
                name_to_path[name] = p

    # Stage 3: 生成视频片段
    name_to_clip: Dict[str, Path] = {}
    if args.stage in ("all", "clips"):
        if not name_to_path:
            log("缺少分镜图, 无法生成视频", "ERROR")
            sys.exit(1)
        name_to_clip = stage3_generate_clips(plan, config, progress, name_to_path)
    elif args.stage in ("concat", "verify"):
        for name in [s["name"] for s in plan["shots"]]:
            p = CLIPS_DIR / f"{name}_4s.mp4"
            if p.exists():
                name_to_clip[name] = p

    # Stage 4: 拼接 + BGM
    final_output: Optional[Path] = None
    if args.stage in ("all", "concat"):
        if not name_to_clip:
            log("缺少视频片段, 无法拼接", "ERROR")
            sys.exit(1)
        bgm_path = Path(args.bgm) if args.bgm else None
        final_output = stage4_concat_with_bgm(plan, progress, name_to_clip, bgm_path)
        if not final_output:
            log("Stage 4 失败", "ERROR")
            sys.exit(1)
    elif args.stage == "verify":
        final_output = FINAL_OUTPUT

    # Stage 5: 验证
    if args.stage in ("all", "concat", "verify"):
        if final_output and final_output.exists():
            stage5_verify(plan, progress, final_output)
        else:
            log(f"未找到最终输出: {FINAL_OUTPUT}", "ERROR")
            sys.exit(1)


if __name__ == "__main__":
    main()
