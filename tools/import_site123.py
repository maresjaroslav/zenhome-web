#!/usr/bin/env python3
"""Import the public ZENHOME SITE123 gallery into local, optimized assets.

The script is intentionally kept in the repository so the source material can
be refreshed while the old site remains online. It does not publish anything.
"""

from __future__ import annotations

import html
import io
import json
import re
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://www.zenhome.cz/"
USER_AGENT = "Mozilla/5.0 (compatible; ZENHOME-static-import/1.0)"


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def section(source: str, section_id: str) -> str:
    match = re.search(
        rf'<section id="{re.escape(section_id)}".*?</section>', source, re.S
    )
    if not match:
        raise RuntimeError(f"Section {section_id!r} was not found")
    return match.group(0)


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def save_webp(url: str, destination: Path, max_size: int, quality: int) -> tuple[int, int]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        with Image.open(destination) as existing:
            return existing.size

    with Image.open(io.BytesIO(fetch(url))) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=quality, method=6)
        return image.size


def save_gallery_pair(index: int, item: dict[str, object], prefix: str = "zenhome") -> tuple[int, dict[str, object]]:
    stem = f"{prefix}-{index:03d}"
    full = ROOT / "assets" / "gallery" / "full" / f"{stem}.webp"
    thumb = ROOT / "assets" / "gallery" / "thumbs" / f"{stem}.webp"
    full.parent.mkdir(parents=True, exist_ok=True)
    thumb.parent.mkdir(parents=True, exist_ok=True)

    if full.exists() and thumb.exists():
        with Image.open(full) as existing:
            width, height = existing.size
    else:
        content = fetch(str(item["source"]))
        with Image.open(io.BytesIO(content)) as source:
            original = ImageOps.exif_transpose(source)
            if original.mode not in ("RGB", "RGBA"):
                original = original.convert("RGB")
            large = original.copy()
            large.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            large.save(full, "WEBP", quality=84, method=6)
            width, height = large.size
            small = original.copy()
            small.thumbnail((720, 720), Image.Resampling.LANCZOS)
            small.save(thumb, "WEBP", quality=78, method=6)

    imported = dict(item)
    imported["full"] = f"assets/gallery/full/{stem}.webp"
    imported["thumb"] = f"assets/gallery/thumbs/{stem}.webp"
    imported["width"] = width
    imported["height"] = height
    return index, imported


def parse_gallery(source: str) -> list[dict[str, object]]:
    gallery = section(source, "section-58d0de94579f4")
    labels = {
        key: re.sub(r"<.*?>", "", html.unescape(label)).strip()
        for key, label in re.findall(
            r'<li data-filter="([^"]+)"[^>]*><a[^>]*>(.*?)</a>', gallery, re.S
        )
    }
    category_blocks = re.findall(
        r'<div class="gallery-category[^>]*data-filter="([^"]*)"[^>]*>'
        r'(.*?)(?=<div class="gallery-category|<!-- Show More)',
        gallery,
        re.S,
    )

    result: list[dict[str, object]] = []
    for category, block in category_blocks:
        category_title = labels.get(category, category)
        clean_category = slugify(category_title)
        images = re.findall(
            r'<div class="gallery-image([^>]*)>', block, re.S
        )
        for attributes in images:
            url_match = re.search(r'data-mfp-src="([^"]+)"', attributes)
            if not url_match:
                continue
            title_match = re.search(r'title="([^"]*)"', attributes)
            width_match = re.search(r'data-original-width="(\d+)"', attributes)
            height_match = re.search(r'data-original-height="(\d+)"', attributes)
            result.append(
                {
                    "category": clean_category,
                    "categoryTitle": category_title,
                    "title": html.unescape(title_match.group(1)).strip()
                    if title_match
                    else "",
                    "source": html.unescape(url_match.group(1)),
                    "sourceWidth": int(width_match.group(1)) if width_match else None,
                    "sourceHeight": int(height_match.group(1)) if height_match else None,
                }
            )
    return result


def parse_concepts(source: str) -> list[dict[str, object]]:
    concepts = section(source, "section-63033fa3bd975")
    result = []
    for attributes in re.findall(r'<div class="gallery-image([^>]*)>', concepts, re.S):
        url_match = re.search(r'data-mfp-src="([^"]+)"', attributes)
        if not url_match:
            continue
        width_match = re.search(r'data-original-width="(\d+)"', attributes)
        height_match = re.search(r'data-original-height="(\d+)"', attributes)
        result.append({
            "category": "concepts",
            "categoryTitle": "Koncepty",
            "title": "Koncept domu ZENHOME",
            "source": html.unescape(url_match.group(1)),
            "sourceWidth": int(width_match.group(1)) if width_match else None,
            "sourceHeight": int(height_match.group(1)) if height_match else None,
        })
    return result


def main() -> None:
    source = fetch(SOURCE_URL).decode("utf-8")
    gallery = parse_gallery(source)
    concepts = parse_concepts(source)
    imported_gallery: list[dict[str, object] | None] = [None] * len(gallery)
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [
            executor.submit(save_gallery_pair, index, item)
            for index, item in enumerate(gallery, start=1)
        ]
        complete = 0
        for future in as_completed(futures):
            index, imported = future.result()
            imported_gallery[index - 1] = imported
            complete += 1
            print(f"[{complete:03d}/{len(gallery)}] downloaded {index:03d}")
    gallery = [item for item in imported_gallery if item is not None]

    imported_concepts: list[dict[str, object] | None] = [None] * len(concepts)
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(save_gallery_pair, index, item, "concept")
            for index, item in enumerate(concepts, start=1)
        ]
        for future in as_completed(futures):
            index, imported = future.result()
            imported_concepts[index - 1] = imported
    concepts = [item for item in imported_concepts if item is not None]

    special_assets = {
        "hero-exterior.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54caf4687c1.png", 2000, 88),
        "hero-exterior-1400.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54caf4687c1.png", 1400, 80),
        "hero-exterior-900.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54caf4687c1.png", 900, 78),
        "hero-interior.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54df646fadd.png", 2000, 88),
        "hero-interior-1400.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54df646fadd.png", 1400, 80),
        "hero-interior-900.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54df646fadd.png", 900, 78),
        "life-at-home.webp": ("https://files.cdn-files-a.com/uploads/6189130/2000_6a54eb3528484.jpg", 2000, 88),
        "team.webp": ("https://files.cdn-files-a.com/uploads/6189130/normal_632081b0f1b98.png", 2000, 88),
        "logo.webp": ("https://files.cdn-files-a.com/uploads/6189130/400_filter_nobg_6942988fdcfda.png", 2000, 88),
        "podcast-cover.webp": ("https://img.youtube.com/vi/gSKuhpKDWy0/maxresdefault.jpg", 1280, 82),
    }
    for filename, (url, max_size, quality) in special_assets.items():
        save_webp(url, ROOT / "assets" / filename, max_size, quality)

    payload = {
        "source": SOURCE_URL,
        "count": len(gallery),
        "categories": list(dict.fromkeys(str(item["category"]) for item in gallery)),
        "images": gallery,
    }
    data_dir = ROOT / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    json_text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    (data_dir / "gallery.js").write_text(
        f"window.ZENHOME_GALLERY={json_text};\n", encoding="utf-8"
    )
    (data_dir / "gallery.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    concepts_payload = {"count": len(concepts), "images": concepts}
    concepts_json = json.dumps(concepts_payload, ensure_ascii=False, separators=(",", ":"))
    (data_dir / "concepts.js").write_text(
        f"window.ZENHOME_CONCEPTS={concepts_json};\n", encoding="utf-8"
    )
    print(f"Imported {len(gallery)} gallery images and {len(concepts)} concepts.")


if __name__ == "__main__":
    main()
