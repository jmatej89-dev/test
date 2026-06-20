"""
FastAPI server — @matejjankovic Instagram Post Creator
"""

import io, json, base64
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import generator as gen

app = FastAPI(title="Instagram Post Creator — @matejjankovic", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def load_image(file: Optional[UploadFile]) -> Optional[Image.Image]:
    if file is None:
        return None
    try:
        data = file.file.read()
        if not data:
            return None
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        return None

def b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

def png_response(img: Image.Image, filename: str = "post.png") -> Response:
    return Response(
        content=gen.to_bytes(img),
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

def zip_response(images: List[Image.Image], filename: str = "carousel.zip") -> Response:
    return Response(
        content=gen.to_zip(images),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/")
async def index():
    from fastapi.responses import FileResponse
    return FileResponse("static/index.html")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── TYPE A / D: Info & Data ───────────────────────────────────────────────────

@app.post("/api/generate/info")
async def api_info(
    photo: Optional[UploadFile] = File(None),
    headline:     str   = Form(""),
    eyebrow:      str   = Form(""),
    cyan_phrases: str   = Form("[]"),
    fo0:          float = Form(0.72),
    fo1:          float = Form(0.96),
    font_size:    int   = Form(0),
    y_nudge:      int   = Form(0),
    preview:      bool  = Form(False),
):
    img     = load_image(photo)
    phrases = json.loads(cyan_phrases)
    scale   = 0.38 if preview else 1.0
    result  = gen.generate_info_post(img, headline, eyebrow, phrases, fo0, fo1, font_size, y_nudge, scale)
    if preview:
        return JSONResponse({"image": b64(result)})
    return png_response(result, "info_post.png")


@app.post("/api/generate/data")
async def api_data(
    photo:        Optional[UploadFile] = File(None),
    headline:     str   = Form(""),
    eyebrow:      str   = Form(""),
    cyan_phrases: str   = Form("[]"),
    chart_type:   str   = Form("bar"),
    chart_data:   str   = Form("[]"),
    footnote:     str   = Form(""),
    fo0:          float = Form(0.55),
    fo1:          float = Form(0.85),
    font_size:    int   = Form(0),
    y_nudge:      int   = Form(0),
    preview:      bool  = Form(False),
):
    img     = load_image(photo)
    phrases = json.loads(cyan_phrases)
    cdata   = json.loads(chart_data)
    scale   = 0.38 if preview else 1.0
    result  = gen.generate_data_post(img, headline, eyebrow, phrases, chart_type,
                                      cdata, footnote, fo0, fo1, font_size, y_nudge, scale)
    if preview:
        return JSONResponse({"image": b64(result)})
    return png_response(result, "data_post.png")


# ── TYPE B: Citation ──────────────────────────────────────────────────────────

@app.post("/api/generate/citation")
async def api_citation(
    photo:       Optional[UploadFile] = File(None),
    quote:       str   = Form(""),
    cyan_phrase: str   = Form(""),
    author_name: str   = Form(""),
    author_role: str   = Form(""),
    fo0:         float = Form(0.60),
    fo1:         float = Form(0.92),
    font_size:   int   = Form(0),
    y_nudge:     int   = Form(0),
    preview:     bool  = Form(False),
):
    img    = load_image(photo)
    scale  = 0.38 if preview else 1.0
    result = gen.generate_citation_post(img, quote, cyan_phrase, author_name,
                                         author_role, fo0, fo1, font_size, y_nudge, scale)
    if preview:
        return JSONResponse({"image": b64(result)})
    return png_response(result, "citation.png")


# ── TYPE C: Carousel ──────────────────────────────────────────────────────────

@app.post("/api/generate/carousel")
async def api_carousel(
    slides_json: str = Form("[]"),
    preview:     bool = Form(False),
    # photos come as photo_0, photo_1, ... (optional)
    photo_0: Optional[UploadFile] = File(None),
    photo_1: Optional[UploadFile] = File(None),
    photo_2: Optional[UploadFile] = File(None),
    photo_3: Optional[UploadFile] = File(None),
    photo_4: Optional[UploadFile] = File(None),
):
    raw_slides = json.loads(slides_json)
    photo_files = [photo_0, photo_1, photo_2, photo_3, photo_4]

    slides = []
    for i, s in enumerate(raw_slides):
        pf = photo_files[i] if i < len(photo_files) else None
        photo = load_image(pf)
        slides.append({
            "photo":        photo,
            "headline":     s.get("headline", ""),
            "eyebrow":      s.get("eyebrow", ""),
            "cyan_phrases": s.get("cyan_phrases", []),
            "fo0":          s.get("fo0", 0.72),
            "fo1":          s.get("fo1", 0.96),
            "font_size":    s.get("font_size", 0),
            "y_nudge":      s.get("y_nudge", 0),
            "is_last":      s.get("is_last", i == len(raw_slides) - 1),
        })

    scale   = 0.38 if preview else 1.0
    images  = gen.generate_carousel_slides(slides, scale)

    if preview:
        return JSONResponse({"images": [b64(img) for img in images]})
    return zip_response(images, "carousel.zip")


# ── TYPE E: Clean BG ─────────────────────────────────────────────────────────

@app.post("/api/generate/clean")
async def api_clean(
    color:   str  = Form("navy"),
    preview: bool = Form(False),
):
    scale  = 0.38 if preview else 1.0
    result = gen.generate_clean_bg(color, scale)
    if preview:
        return JSONResponse({"image": b64(result)})
    return png_response(result, "clean_bg.png")


# ─── STARTUP ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    gen.ensure_fonts()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
