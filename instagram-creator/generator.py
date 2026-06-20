"""
Instagram Post Generator — @matejjankovic brand
PIL-based rendering engine matching the full brand spec.
"""

import io
import os
import math
import requests
import numpy as np
import zipfile
from pathlib import Path
from typing import Optional, List, Tuple, Dict, Any
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# ─── BRAND COLOURS ────────────────────────────────────────────────────────────
BG_NAVY = (7, 15, 40)
WHITE   = (255, 255, 255)
CYAN    = (92, 225, 230)
MUTED   = (100, 132, 182)
BLACK   = (0, 0, 0)

# ─── CANVAS ───────────────────────────────────────────────────────────────────
W, H    = 1080, 1350
LEFT_X  = 68
RIGHT_X = 1012
MAXW    = 944

FONT_DIR = Path(__file__).parent / "fonts"
FONT_DIR.mkdir(exist_ok=True)

FONT_URLS = {
    "montserrat_bold":     "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf",
    "montserrat_semibold": "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-SemiBold.ttf",
    "worksans_regular":    "https://github.com/weiweihuanghuang/Work-Sans/raw/master/fonts/static/WorkSans-Regular.ttf",
}

SYSTEM_FONT_FALLBACKS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]

_fonts_loaded = False

def ensure_fonts():
    global _fonts_loaded
    if _fonts_loaded:
        return
    for name, url in FONT_URLS.items():
        path = FONT_DIR / f"{name}.ttf"
        if path.exists():
            try:
                ImageFont.truetype(str(path), 12)  # validate
                continue
            except Exception:
                path.unlink(missing_ok=True)
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            data = r.content
            # Validate it's a real font (not HTML redirect)
            if data[:4] not in (b'\x00\x01\x00\x00', b'OTTO', b'true', b'ttcf'):
                raise ValueError("Not a TTF file")
            path.write_bytes(data)
        except Exception:
            # Fall back to system font
            for sys_path in SYSTEM_FONT_FALLBACKS:
                if Path(sys_path).exists():
                    import shutil
                    shutil.copy(sys_path, path)
                    break
    _fonts_loaded = True

def get_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / f"{name}.ttf"
    return ImageFont.truetype(str(path), size)

# ─── TEXT UTILITIES ───────────────────────────────────────────────────────────

def text_width(text: str, font: ImageFont.FreeTypeFont) -> int:
    try:
        return int(font.getlength(text))
    except AttributeError:
        bbox = font.getbbox(text)
        return bbox[2] - bbox[0]

def text_height(font: ImageFont.FreeTypeFont) -> int:
    bbox = font.getbbox("Ag")
    return bbox[3] - bbox[1]

def draw_spaced(draw: ImageDraw.ImageDraw, pos: Tuple[int, int], text: str,
                font: ImageFont.FreeTypeFont, fill, spacing: int = 3):
    x, y = pos
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += text_width(ch, font) + spacing

def spaced_width(text: str, font: ImageFont.FreeTypeFont, spacing: int = 3) -> int:
    if not text:
        return 0
    total = sum(text_width(ch, font) for ch in text)
    total += spacing * (len(text) - 1)
    return total

def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int = MAXW) -> List[str]:
    words = text.split()
    lines: List[str] = []
    current = ""
    for word in words:
        trial = (current + " " + word).strip()
        if text_width(trial, font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]

def colorize_line(draw: ImageDraw.ImageDraw, x: int, y: int, line: str,
                  font: ImageFont.FreeTypeFont, cyan_phrases: List[str]) -> int:
    """Draw line with CYAN highlights. Returns final x position."""
    phrases = [p for p in cyan_phrases if p and p in line]
    if not phrases:
        draw.text((x, y), line, font=font, fill=WHITE)
        return x + text_width(line, font)

    remaining = line
    curr_x = x
    while remaining:
        matched = False
        for phrase in phrases:
            if remaining.startswith(phrase):
                draw.text((curr_x, y), phrase, font=font, fill=CYAN)
                curr_x += text_width(phrase, font)
                remaining = remaining[len(phrase):]
                matched = True
                break
        if not matched:
            next_pos = len(remaining)
            for phrase in phrases:
                idx = remaining.find(phrase)
                if idx > 0 and idx < next_pos:
                    next_pos = idx
            chunk = remaining[:next_pos]
            if chunk:
                draw.text((curr_x, y), chunk, font=font, fill=WHITE)
                curr_x += text_width(chunk, font)
            remaining = remaining[next_pos:]
    return curr_x

def calc_leading(size: int) -> int:
    return int(size * 1.24)

def auto_font_size(text: str, bold: bool = True, target_lines: Tuple[int, int] = (2, 3)) -> Tuple[int, List[str]]:
    """Find ideal font size giving target_lines lines."""
    ensure_fonts()
    fname = "montserrat_bold" if bold else "montserrat_semibold"
    for sz in [84, 78, 74, 68, 62, 56, 52, 48, 44, 40]:
        f = get_font(fname, sz)
        lines = wrap_text(text, f)
        if target_lines[0] <= len(lines) <= target_lines[1]:
            return sz, lines
    f = get_font(fname, 44)
    return 44, wrap_text(text, f)

# ─── GRADIENT ─────────────────────────────────────────────────────────────────

def apply_gradient(canvas: Image.Image, photo_height: int,
                   fo0_frac: float, fo1_frac: float) -> Image.Image:
    fo0 = photo_height * fo0_frac
    fo1 = photo_height * fo1_frac
    arr = np.array(canvas, dtype=np.float32)
    navy = np.array(BG_NAVY, dtype=np.float32)  # shape (3,)

    y_start = max(0, int(fo0))
    y_end   = min(arr.shape[0], int(fo1) + 1)

    ys = np.arange(y_start, y_end)
    t  = np.clip((ys - fo0) / max(fo1 - fo0, 1), 0, 1)
    alpha = t * t * (3 - 2 * t)            # shape (N,)
    alpha3 = alpha[:, np.newaxis, np.newaxis]  # shape (N, 1, 1) — broadcasts over W and C

    arr[y_start:y_end] = arr[y_start:y_end] * (1 - alpha3) + navy[np.newaxis, np.newaxis, :] * alpha3

    if y_end < arr.shape[0]:
        arr[y_end:] = navy

    return Image.fromarray(arr.astype(np.uint8))

# ─── PHOTO PROCESSING ─────────────────────────────────────────────────────────

def process_photo(img: Image.Image, fo0: float, fo1: float) -> Tuple[Image.Image, int]:
    """Returns (canvas 1080×1350, fo1_abs_px)."""
    img = img.convert("RGB")
    scale = W / img.width
    new_h = int(img.height * scale)
    img = img.resize((W, new_h), Image.LANCZOS)

    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.06)
    img = ImageEnhance.Sharpness(img).enhance(1.30)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.3, percent=75, threshold=3))

    canvas = Image.new("RGB", (W, H), BG_NAVY)
    paste_h = min(new_h, H)
    canvas.paste(img.crop((0, 0, W, paste_h)), (0, 0))

    canvas = apply_gradient(canvas, min(new_h, H), fo0, fo1)
    fo1_abs = min(int(min(new_h, H) * fo1), H - 200)
    return canvas, fo1_abs

# ─── COMPONENTS ───────────────────────────────────────────────────────────────

def draw_eyebrow(draw: ImageDraw.ImageDraw, x: int, y: int, text: str,
                 font: ImageFont.FreeTypeFont):
    accent_y = y + int(font.size * 0.42)
    draw.rectangle([x, accent_y, x + 22, accent_y + 4], fill=CYAN)
    draw_spaced(draw, (x + 34, y), text.upper(), font, CYAN, spacing=3)

def draw_watermark(draw: ImageDraw.ImageDraw, font: ImageFont.FreeTypeFont):
    text = "Matěj Jankovič"
    w = text_width(text, font)
    draw.text((W - LEFT_X - w, 1300), text, font=font, fill=MUTED)

def draw_arrows(draw: ImageDraw.ImageDraw):
    """3 chevrons on the right for carousel slides."""
    cx, cy = 1018, 675
    size   = 20
    gap    = 22
    for i, ox in enumerate([-gap, 0, gap]):
        bx = cx + ox
        pts = [(bx - size // 2, cy - size), (bx + size // 2, cy), (bx - size // 2, cy + size)]
        draw.line([pts[0], pts[1], pts[2]], fill=BLACK, width=7)
        draw.line([pts[0], pts[1], pts[2]], fill=WHITE, width=4)

def calc_y_start(fo1_abs: int, line_count: int, font_size: int,
                 extra_above: int = 0, y_nudge: int = 0) -> int:
    leading      = calc_leading(font_size)
    bottom_limit = H - 110
    avail        = bottom_limit - fo1_abs
    block_h      = (line_count - 1) * leading + font_size + extra_above
    y = fo1_abs + max(40, (avail - block_h) // 2)
    return y + extra_above + y_nudge

# ─── BAR CHART (PIL) ──────────────────────────────────────────────────────────

def draw_bar_chart(canvas: Image.Image, x: int, y: int, width: int, height: int,
                   data: List[Dict], font_bold: ImageFont.FreeTypeFont,
                   font_semi: ImageFont.FreeTypeFont) -> int:
    """Draw bar chart; returns bottom y of chart."""
    if not data:
        return y
    n = len(data)
    max_val = max(d.get("value", 0) for d in data) or 1

    label_zone = 50
    bar_h_total = height - label_zone

    # Semi-transparent grid via RGBA layer
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for frac in [0.25, 0.5, 0.75, 1.0]:
        gy = y + bar_h_total - int(bar_h_total * frac)
        od.line([(x, gy), (x + width, gy)], fill=MUTED + (40,), width=1)
    canvas_rgba = canvas.convert("RGBA")
    canvas_rgba = Image.alpha_composite(canvas_rgba, overlay)
    canvas.paste(canvas_rgba.convert("RGB"))

    draw = ImageDraw.Draw(canvas)

    bar_slot = width / n
    bar_w    = bar_slot * 0.62
    bar_gap  = (bar_slot - bar_w) / 2

    for i, d in enumerate(data):
        val   = d.get("value", 0)
        label = d.get("label", "")
        color = tuple(d.get("color", list(CYAN)))
        bx    = x + int(i * bar_slot + bar_gap)
        bh    = int(bar_h_total * val / max_val)
        by    = y + bar_h_total - bh

        # Bar body
        draw.rectangle([bx, by, bx + int(bar_w), y + bar_h_total], fill=color)

        # Value label above bar
        val_str = f"{val:g}%"
        vw = text_width(val_str, font_bold)
        draw.text((bx + int(bar_w) // 2 - vw // 2, by - 24), val_str, font=font_bold, fill=WHITE)

        # X-axis label
        lw = text_width(label, font_semi)
        draw.text((bx + int(bar_w) // 2 - lw // 2, y + bar_h_total + 10), label, font=font_semi, fill=MUTED)

    return y + height

def draw_comparison_table(draw: ImageDraw.ImageDraw, x: int, y: int,
                          data: List[Dict], font_semi: ImageFont.FreeTypeFont,
                          font_bold: ImageFont.FreeTypeFont) -> int:
    row_h = 80
    for d in data:
        label = d.get("label", "")
        value = d.get("value", "")
        # Dotted separator
        for dx in range(x, RIGHT_X, 8):
            draw.rectangle([dx, y + row_h - 2, dx + 4, y + row_h], fill=(30, 45, 80))
        draw.text((x, y + (row_h - font_semi.size) // 2), label, font=font_semi, fill=WHITE)
        vw = text_width(str(value), font_bold)
        draw.text((RIGHT_X - vw, y + (row_h - font_bold.size) // 2), str(value), font=font_bold, fill=CYAN)
        y += row_h
    return y

# ─── POST TYPE A — INFO POST ──────────────────────────────────────────────────

def generate_info_post(
    photo: Optional[Image.Image] = None,
    headline: str = "",
    eyebrow: str = "",
    cyan_phrases: Optional[List[str]] = None,
    fo0: float = 0.72,
    fo1: float = 0.96,
    font_size: int = 0,
    y_nudge: int = 0,
    scale: float = 1.0,
) -> Image.Image:
    ensure_fonts()
    cyan_phrases = cyan_phrases or []
    wm_font  = get_font("worksans_regular", 19)
    semi24   = get_font("montserrat_semibold", 24)

    if photo:
        canvas, fo1_abs = process_photo(photo, fo0, fo1)
    else:
        canvas  = Image.new("RGB", (W, H), BG_NAVY)
        fo1_abs = int(H * 0.30)

    draw = ImageDraw.Draw(canvas)

    if font_size == 0:
        font_size, lines = auto_font_size(headline)
    else:
        bold_font = get_font("montserrat_bold", font_size)
        lines = wrap_text(headline, bold_font)

    bold_font = get_font("montserrat_bold", font_size)
    lines     = wrap_text(headline, bold_font)
    leading   = calc_leading(font_size)

    eyebrow_h = (semi24.size + 26) if eyebrow else 0
    y_text = calc_y_start(fo1_abs, len(lines), font_size, eyebrow_h, y_nudge)

    if eyebrow:
        draw_eyebrow(draw, LEFT_X, y_text - eyebrow_h, eyebrow, semi24)

    y = y_text
    for line in lines:
        colorize_line(draw, LEFT_X, y, line, bold_font, cyan_phrases)
        y += leading

    draw_watermark(draw, wm_font)

    if scale != 1.0:
        canvas = canvas.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
    return canvas

# ─── POST TYPE B — CITATION ───────────────────────────────────────────────────

def generate_citation_post(
    photo: Optional[Image.Image] = None,
    quote: str = "",
    cyan_phrase: str = "",
    author_name: str = "",
    author_role: str = "",
    fo0: float = 0.60,
    fo1: float = 0.92,
    font_size: int = 0,
    y_nudge: int = 0,
    scale: float = 1.0,
) -> Image.Image:
    ensure_fonts()
    wm_font = get_font("worksans_regular", 19)
    bold32  = get_font("montserrat_bold", 32)
    semi21  = get_font("montserrat_semibold", 21)

    if photo:
        canvas, fo1_abs = process_photo(photo, fo0, fo1)
    else:
        canvas  = Image.new("RGB", (W, H), BG_NAVY)
        fo1_abs = int(H * 0.35)

    draw = ImageDraw.Draw(canvas)

    full_quote = f"„{quote}“"

    if font_size == 0:
        font_size, _ = auto_font_size(full_quote, target_lines=(2, 5))
        for sz in [66, 60, 56, 52, 48, 44]:
            f = get_font("montserrat_bold", sz)
            if len(wrap_text(full_quote, f)) <= 5:
                font_size = sz
                break

    bold_font = get_font("montserrat_bold", font_size)
    lines     = wrap_text(full_quote, bold_font)
    leading   = calc_leading(font_size)

    has_attr  = bool(author_name)
    attr_h    = (32 + 8 + 21 + 40) if has_attr else 0
    block_h   = (len(lines) - 1) * leading + font_size + attr_h + 20
    bottom_lim = H - 110
    avail      = bottom_lim - fo1_abs
    y = fo1_abs + max(40, (avail - block_h) // 2) + y_nudge

    phrases = [cyan_phrase] if cyan_phrase else []
    for line in lines:
        colorize_line(draw, LEFT_X, y, line, bold_font, phrases)
        y += leading

    if has_attr:
        bar_y = y + 36
        bar_h = 32 + 8 + 21
        draw.rectangle([LEFT_X, bar_y, LEFT_X + 4, bar_y + bar_h], fill=CYAN)
        draw.text((LEFT_X + 18, bar_y), author_name, font=bold32, fill=WHITE)
        if author_role:
            draw.text((LEFT_X + 18, bar_y + 40), author_role, font=semi21, fill=MUTED)

    draw_watermark(draw, wm_font)

    if scale != 1.0:
        canvas = canvas.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
    return canvas

# ─── POST TYPE C — CAROUSEL ───────────────────────────────────────────────────

def generate_carousel_slides(
    slides: List[Dict[str, Any]],
    scale: float = 1.0,
) -> List[Image.Image]:
    ensure_fonts()
    images = []
    n = len(slides)
    for i, s in enumerate(slides):
        is_last = s.get("is_last", i == n - 1)
        img = generate_info_post(
            photo=s.get("photo"),
            headline=s.get("headline", ""),
            eyebrow=s.get("eyebrow", ""),
            cyan_phrases=s.get("cyan_phrases", []),
            fo0=s.get("fo0", 0.72),
            fo1=s.get("fo1", 0.96),
            font_size=s.get("font_size", 0),
            y_nudge=s.get("y_nudge", 0),
            scale=1.0,
        )
        if not is_last:
            d = ImageDraw.Draw(img)
            draw_arrows(d)
        if scale != 1.0:
            img = img.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
        images.append(img)
    return images

# ─── POST TYPE D — DATA POST ──────────────────────────────────────────────────

def generate_data_post(
    photo: Optional[Image.Image] = None,
    headline: str = "",
    eyebrow: str = "",
    cyan_phrases: Optional[List[str]] = None,
    chart_type: str = "bar",      # "bar" | "table"
    chart_data: Optional[List[Dict]] = None,
    footnote: str = "",
    fo0: float = 0.55,
    fo1: float = 0.85,
    font_size: int = 0,
    y_nudge: int = 0,
    scale: float = 1.0,
) -> Image.Image:
    ensure_fonts()
    cyan_phrases = cyan_phrases or []
    chart_data   = chart_data or []
    wm_font  = get_font("worksans_regular", 19)
    semi24   = get_font("montserrat_semibold", 24)
    semi18   = get_font("montserrat_semibold", 18)
    semi16   = get_font("montserrat_semibold", 16)
    bold15   = get_font("montserrat_bold", 15)

    if photo:
        canvas, fo1_abs = process_photo(photo, fo0, fo1)
    else:
        canvas  = Image.new("RGB", (W, H), BG_NAVY)
        fo1_abs = 380

    draw = ImageDraw.Draw(canvas)

    # Headline sizing
    if font_size == 0:
        font_size, _ = auto_font_size(headline, target_lines=(2, 3))
    bold_font = get_font("montserrat_bold", font_size)
    lines     = wrap_text(headline, bold_font)
    leading   = calc_leading(font_size)

    eyebrow_h = (semi24.size + 26) if eyebrow else 0
    y = fo1_abs + 40 + y_nudge

    if eyebrow:
        draw_eyebrow(draw, LEFT_X, y, eyebrow, semi24)
        y += eyebrow_h

    for line in lines:
        colorize_line(draw, LEFT_X, y, line, bold_font, cyan_phrases)
        y += leading
    y += 24

    # Chart
    if chart_data:
        chart_h = 320 if chart_type == "bar" else len(chart_data) * 80
        chart_bottom_limit = H - 130 - (40 if footnote else 0)
        avail_chart = chart_bottom_limit - y
        chart_h = min(chart_h, avail_chart - 10)
        if chart_h > 80:
            if chart_type == "bar":
                draw_bar_chart(canvas, LEFT_X, y, MAXW, chart_h, chart_data, bold15, semi16)
            else:
                draw = ImageDraw.Draw(canvas)
                semi20 = get_font("montserrat_semibold", 20)
                bold20 = get_font("montserrat_bold", 20)
                draw_comparison_table(draw, LEFT_X, y, chart_data, semi20, bold20)
            y += chart_h + 20

    draw = ImageDraw.Draw(canvas)
    if footnote:
        draw.text((LEFT_X, H - 110), footnote, font=semi16, fill=MUTED)

    draw_watermark(draw, wm_font)

    if scale != 1.0:
        canvas = canvas.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
    return canvas

# ─── POST TYPE E — CLEAN BACKGROUND ──────────────────────────────────────────

def generate_clean_bg(color: str = "navy", scale: float = 1.0) -> Image.Image:
    bg = BG_NAVY if color == "navy" else (0, 0, 0)
    canvas = Image.new("RGB", (W, H), bg)
    if scale != 1.0:
        canvas = canvas.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
    return canvas

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def to_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)
    return buf.getvalue()

def to_zip(images: List[Image.Image]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, img in enumerate(images):
            img_buf = io.BytesIO()
            img.save(img_buf, "PNG")
            zf.writestr(f"slide_{i+1:02d}.png", img_buf.getvalue())
    buf.seek(0)
    return buf.getvalue()
