"""Generate crisp SVG and multi-resolution PNG icons for the WhatsApp Web Sidebar Toggle extension."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / "assets"
ICONS_DIR = ROOT / "extension" / "icons"


SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="28" fill="#111B21"/>
  <rect x="6" y="6" width="116" height="116" rx="23" stroke="#00A884" stroke-width="4" stroke-opacity="0.45"/>
  <!-- Left sidebar panel -->
  <rect x="18" y="22" width="34" height="84" rx="10" fill="#00A884"/>
  <!-- Sidebar chat lines -->
  <rect x="25" y="34" width="20" height="5" rx="2.5" fill="#111B21" fill-opacity="0.85"/>
  <rect x="25" y="46" width="16" height="5" rx="2.5" fill="#111B21" fill-opacity="0.7"/>
  <rect x="25" y="58" width="20" height="5" rx="2.5" fill="#111B21" fill-opacity="0.7"/>
  <!-- Right chat area -->
  <rect x="58" y="22" width="52" height="84" rx="10" fill="#202C33"/>
  <!-- Collapse chevron arrow pointing left -->
  <path d="M88 50L74 64L88 78" stroke="#00A884" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
"""


def render_png(size: int, out_path: Path) -> None:
    scale = 8
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def s(val: float) -> int:
        return round(val * canvas_size / 128.0)

    # Outer rounded background (#111B21 WhatsApp dark surface)
    draw.rounded_rectangle(
        [s(0), s(0), s(128) - 1, s(128) - 1],
        radius=s(28),
        fill=(17, 27, 33, 255),
    )

    # Subtle accent border (#00A884)
    border_w = max(2, s(4))
    draw.rounded_rectangle(
        [s(5), s(5), s(123), s(123)],
        radius=s(24),
        outline=(0, 168, 132, 130),
        width=border_w,
    )

    # Left sidebar block (#00A884 WhatsApp green)
    draw.rounded_rectangle(
        [s(18), s(22), s(52), s(106)],
        radius=s(10),
        fill=(0, 168, 132, 255),
    )

    # Simulated chat rows inside sidebar (skip on tiny 16px if cramped, keep clean)
    if size >= 24:
        for y, w in [(35, 20), (48, 15), (61, 19)]:
            draw.rounded_rectangle(
                [s(25), s(y), s(25 + w), s(y + 5.5)],
                radius=s(2.5),
                fill=(17, 27, 33, 215),
            )

    # Right main conversation panel (#202C33)
    draw.rounded_rectangle(
        [s(58), s(22), s(110), s(106)],
        radius=s(10),
        fill=(32, 44, 51, 255),
    )

    # Crisp left-pointing chevron inside main panel
    stroke = max(4, s(9 if size <= 16 else 8))
    pts = [(s(89), s(49)), (s(74), s(64)), (s(89), s(79))]
    draw.line([pts[0], pts[1]], fill=(0, 215, 168, 255), width=stroke, joint="curve")
    draw.line([pts[1], pts[2]], fill=(0, 215, 168, 255), width=stroke, joint="curve")
    r = stroke // 2
    for px, py in pts:
        draw.ellipse([px - r, py - r, px + r, py + r], fill=(0, 215, 168, 255))

    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    resized.save(out_path, format="PNG", optimize=True)


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    (ASSETS_DIR / "icon.svg").write_text(SVG_CONTENT, encoding="utf-8")
    for sz in (16, 32, 48, 128):
        render_png(sz, ICONS_DIR / f"icon-{sz}.png")
    print("Generated SVG and PNG icons successfully.")


if __name__ == "__main__":
    main()
