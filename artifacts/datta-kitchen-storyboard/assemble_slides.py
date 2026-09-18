#!/usr/bin/env python3
"""Composite 4:3 storyboard panels onto 16:9 production boards."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
PANELS = ROOT / "panels"
SLIDES = ROOT / "slides"
W, H = 1920, 1080
MARGIN = 28
HEADER_H = 64
CAP_H = 42
GAP = 14

SLIDES.mkdir(exist_ok=True)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Courier New Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Courier New.ttf",
        "/Library/Fonts/Courier New.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F_HEAD = font(22, bold=True)
F_META = font(18, bold=True)
F_CAP = font(16)
F_NUM = font(14, bold=True)


def load(name: str) -> Image.Image:
    img = Image.open(PANELS / name).convert("RGB")
    return img


def fit(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    tw, th = x1 - x0, y1 - y0
    return ImageOps.fit(img, (tw, th), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def ink_overlay(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    """White paper becomes transparent; black ink stays."""
    g = ImageOps.grayscale(src.resize(size, Image.Resampling.LANCZOS))
    rgba = Image.new("RGBA", size, (0, 0, 0, 0))
    px = g.load()
    out = rgba.load()
    for y in range(size[1]):
        for x in range(size[0]):
            v = px[x, y]
            if v < 170:
                out[x, y] = (20, 20, 20, 255 - v)
    return rgba


def new_board() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGB", (W, H), (250, 250, 248))
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, W, HEADER_H], fill=(255, 255, 255))
    dr.line([(0, HEADER_H), (W, HEADER_H)], fill=(30, 30, 30), width=2)
    return im, dr


def header(dr: ImageDraw.ImageDraw, slide: str, time: str, title: str) -> None:
    dr.text((MARGIN, 12), "DATTA KITCHEN", font=F_HEAD, fill=(20, 20, 20))
    dr.text((320, 14), f"SLIDE {slide}", font=F_META, fill=(20, 20, 20))
    dr.text((560, 14), time, font=F_META, fill=(20, 20, 20))
    dr.text((980, 14), "18 SEP 2026  ·  PROD BOARD", font=F_META, fill=(20, 20, 20))
    dr.text((MARGIN, 38), title.upper(), font=F_NUM, fill=(80, 80, 80))


def paste_panel(
    board: Image.Image,
    dr: ImageDraw.ImageDraw,
    img: Image.Image,
    box: tuple[int, int, int, int],
    caption: str,
    num: str,
) -> None:
    x0, y0, x1, y1 = box
    fitted = fit(img, box)
    board.paste(fitted, (x0, y0))
    dr.rectangle([x0, y0, x1, y1], outline=(30, 30, 30), width=2)
    # overshoot ticks like a ruler slip
    dr.line([(x0 - 6, y0), (x0 + 10, y0)], fill=(30, 30, 30), width=1)
    dr.line([(x1 - 10, y1), (x1 + 6, y1)], fill=(30, 30, 30), width=1)
    dr.text((x0 + 4, y0 + 4), num, font=F_NUM, fill=(20, 20, 20))
    # wrap caption
    cap_box = [x0, y1 + 4, x1, min(H - 8, y1 + CAP_H)]
    words = caption.split()
    lines: list[str] = []
    line = ""
    for w in words:
        trial = f"{line} {w}".strip()
        if F_CAP.getlength(trial) <= (x1 - x0):
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    ty = y1 + 6
    for ln in lines[:2]:
        dr.text((x0, ty), ln, font=F_CAP, fill=(25, 25, 25))
        ty += 16


def apply_hand_pass(board: Image.Image, doodle: Image.Image, notes: Image.Image, kind: str) -> None:
    """Stamp ink doodles in the header gutter only — never over panel drawings."""
    overlay = Image.new("RGBA", board.size, (0, 0, 0, 0))
    header_doodle = ink_overlay(doodle, (220, 56))
    overlay.paste(header_doodle, (W - 250, 4), header_doodle)
    if kind == "top_notes":
        tiny = ink_overlay(notes, (420, 28))
        overlay.paste(tiny, (W - 680, 18), tiny)
    else:
        tick = ink_overlay(doodle.crop((0, 0, doodle.width // 3, doodle.height // 4)), (80, 40))
        overlay.paste(tick, (8, H - 48), tick)
    board.paste(Image.alpha_composite(board.convert("RGBA"), overlay).convert("RGB"))


def grid_cells(kind: str) -> list[tuple[int, int, int, int]]:
    top = HEADER_H + 10
    bottom = H - 8
    left = MARGIN
    right = W - MARGIN
    usable_h = bottom - top
    usable_w = right - left

    def split(n: int, total: int, gap: int) -> list[tuple[int, int]]:
        cell = (total - gap * (n - 1)) // n
        out = []
        x = 0
        for i in range(n):
            out.append((x, x + cell))
            x += cell + gap
        return out

    if kind == "D":  # 3x2
        cols = split(3, usable_w, GAP)
        # caption space per row
        row_h = (usable_h - GAP - CAP_H * 2) // 2
        rows = [(top, top + row_h), (top + row_h + GAP + CAP_H, top + 2 * row_h + GAP + CAP_H)]
        cells = []
        for ry0, ry1 in rows:
            for cx0, cx1 in cols:
                cells.append((left + cx0, ry0, left + cx1, ry1))
        return cells

    if kind == "A":  # 2x2
        cols = split(2, usable_w, GAP)
        row_h = (usable_h - GAP - CAP_H * 2) // 2
        rows = [(top, top + row_h), (top + row_h + GAP + CAP_H, top + 2 * row_h + GAP + CAP_H)]
        cells = []
        for ry0, ry1 in rows:
            for cx0, cx1 in cols:
                cells.append((left + cx0, ry0, left + cx1, ry1))
        return cells

    if kind == "B":  # wide + 3
        row_h_top = int((usable_h - GAP - CAP_H * 2) * 0.48)
        top_box = (left, top, right, top + row_h_top)
        y2 = top + row_h_top + GAP + CAP_H
        bot_h = bottom - CAP_H - y2
        cols = split(3, usable_w, GAP)
        cells = [top_box]
        for cx0, cx1 in cols:
            cells.append((left + cx0, y2, left + cx1, y2 + bot_h))
        return cells

    if kind == "C":  # tall left + 2x2
        left_w = int(usable_w * 0.38)
        tall = (left, top, left + left_w, bottom - CAP_H)
        rx = left + left_w + GAP
        rw = right - rx
        cols = split(2, rw, GAP)
        row_h = (usable_h - GAP - CAP_H * 2) // 2
        rows = [(top, top + row_h), (top + row_h + GAP + CAP_H, top + 2 * row_h + GAP + CAP_H)]
        cells = [tall]
        for ry0, ry1 in rows:
            for cx0, cx1 in cols:
                cells.append((rx + cx0, ry0, rx + cx1, ry1))
        return cells

    if kind == "E":  # 2 / wide / 2
        band = (usable_h - GAP * 2 - CAP_H * 3) // 3
        y1 = top + band
        y2 = y1 + GAP + CAP_H
        y3 = y2 + int(band * 1.15)
        y4 = y3 + GAP + CAP_H
        cols_top = split(2, usable_w, GAP)
        cols_bot = split(2, usable_w, GAP)
        cells = [
            (left + cols_top[0][0], top, left + cols_top[0][1], y1),
            (left + cols_top[1][0], top, left + cols_top[1][1], y1),
            (left, y2, right, y3),
            (left + cols_bot[0][0], y4, left + cols_bot[0][1], y4 + band),
            (left + cols_bot[1][0], y4, left + cols_bot[1][1], y4 + band),
        ]
        return cells

    raise ValueError(kind)


def build(spec: dict, doodle: Image.Image, notes: Image.Image) -> None:
    board, dr = new_board()
    header(dr, spec["n"], spec["time"], spec["title"])
    cells = grid_cells(spec["grid"])
    for i, panel in enumerate(spec["panels"]):
        paste_panel(board, dr, load(panel["file"]), cells[i], panel["cap"], panel["num"])
    apply_hand_pass(board, doodle, notes, spec.get("hand", "side"))
    out = SLIDES / spec["out"]
    board.save(out, "PNG", optimize=True)
    print(out.name)


SPECS = [
    {
        "n": "01",
        "time": "DAY 0  ·  19:42",
        "title": "The list wrote itself",
        "grid": "D",
        "hand": "side",
        "out": "SLIDE-01.png",
        "panels": [
            {"file": "S01-P1-empty-kitchen-dusk.png", "num": "1", "cap": "Nobody is cooking. The kitchen is still working."},
            {"file": "S01-P2-fridge-shelf.png", "num": "2", "cap": "Second shelf: eggs, shrivelled lau, oil running out."},
            {"file": "S01-P3-lau-weeks.png", "num": "3", "cap": "Three weeks. Same plate. Lau returned."},
            {"file": "S01-P4-machine-shelf.png", "num": "4", "cap": "The shelf, counted. Nobody reported it."},
            {"file": "S01-P5-list-veranda.png", "num": "5", "cap": "Rou, kumro, lai xaak — and grated lau, last try."},
            {"file": "S01-P6-mira-smile.png", "num": "6", "cap": "It stopped buying what he never ate."},
        ],
    },
    {
        "n": "02",
        "time": "DAY 1  ·  06:05",
        "title": "Five ways to start the day",
        "grid": "B",
        "hand": "top_notes",
        "out": "SLIDE-02.png",
        "panels": [
            {"file": "S02-P1-mira-switch.png", "num": "1", "cap": "She hits the switch. The wall comes up with the light."},
            {"file": "S02-P2-five-recipe-cards.png", "num": "2", "cap": "Five cards. Pantry, leftovers, Dadi, Anup, Raju, twelve minutes."},
            {"file": "S02-P3-ei-ta.png", "num": "3", "cap": "ei ta."},
            {"file": "S02-P4-card-enlarges.png", "num": "4", "cap": "Five options. One word. No scrolling."},
        ],
    },
    {
        "n": "03",
        "time": "06:11",
        "title": "The wall teaches",
        "grid": "C",
        "hand": "side",
        "out": "SLIDE-03.png",
        "panels": [
            {"file": "S03-P1-wall-teaches.png", "num": "1", "cap": "Hands in the batter. Phone face-down."},
            {"file": "S03-P2-wet-hand-phone.png", "num": "2", "cap": "Nobody touches a phone with batter on their hands."},
            {"file": "S03-P3-step-wipe.png", "num": "3", "cap": "The step advances by itself."},
            {"file": "S03-P4-substitution.png", "num": "4", "cap": "curry patta nei — skip, taste holds."},
            {"file": "S03-P5-dadi-squint.png", "num": "5", "cap": "eta ki? The wall is ignored. Keep this beat."},
        ],
    },
    {
        "n": "04",
        "time": "06:24",
        "title": "The katori that declares itself",
        "grid": "A",
        "hand": "top_notes",
        "out": "SLIDE-04.png",
        "panels": [
            {"file": "S04-P1-lift-katori.png", "num": "1", "cap": "Kal ka bhat comes out of the fridge."},
            {"file": "S04-P2-katori-lands.png", "num": "2", "cap": "Set down. Two ticks of light, not a glow."},
            {"file": "S04-P3-katori-readout.png", "num": "3", "cap": "Leftover rice is an ingredient with a number."},
            {"file": "S04-P4-two-bowls.png", "num": "4", "cap": "Two bowls. One answer."},
        ],
    },
    {
        "n": "05",
        "time": "06:31",
        "title": "Raju ka lunch banana hai",
        "grid": "A",
        "hand": "side",
        "out": "SLIDE-05.png",
        "panels": [
            {"file": "S05-P1-tiffin-speak.png", "num": "1", "cap": "Raju ka lunch banana hai."},
            {"file": "S05-P2-wall-wipe.png", "num": "2", "cap": "The wall wipes. Three quick, under fifteen."},
            {"file": "S05-P3-three-lunches.png", "num": "3", "cap": "Only what he has actually finished before."},
            {"file": "S05-P4-raju-asleep.png", "num": "4", "cap": "He is still asleep. The kitchen already knows his mouth."},
        ],
    },
    {
        "n": "06",
        "time": "06:38",
        "title": "The cart that filled itself",
        "grid": "C",
        "hand": "top_notes",
        "out": "SLIDE-06.png",
        "panels": [
            {"file": "S06-P1-empty-posto.png", "num": "1", "cap": "The posto jar tips. Almost nothing."},
            {"file": "S06-P2-she-says-it.png", "num": "2", "cap": "posto nei, chana dal bhi shesh."},
            {"file": "S06-P3-cart-toast.png", "num": "3", "cap": "Cart mein daal diya."},
            {"file": "S06-P4-cart-kirana.png", "num": "4", "cap": "Fatak Bazar se jaldi — Ratan-da ko bhejun?"},
            {"file": "S06-P5-ignored-phone.png", "num": "5", "cap": "Awaiting checkout. Not awaiting her."},
        ],
    },
    {
        "n": "07",
        "time": "06:52",
        "title": "Green peas, second shelf",
        "grid": "A",
        "hand": "side",
        "out": "SLIDE-07.png",
        "panels": [
            {"file": "S07-P1-stirring.png", "num": "1", "cap": "Sambar on. Three curls of steam."},
            {"file": "S07-P2-peas-nudge.png", "num": "2", "cap": "Green peas — fridge, 2nd shelf. Ma is 40% short this week."},
            {"file": "S07-P3-second-shelf.png", "num": "3", "cap": "Count the shelves. Her hand finds the second one."},
            {"file": "S07-P4-peas-sambar.png", "num": "4", "cap": "The nudge arrived at the only second it was useful."},
        ],
    },
    {
        "n": "08",
        "time": "08:05",
        "title": "The table does the arithmetic",
        "grid": "E",
        "hand": "top_notes",
        "out": "SLIDE-08.png",
        "panels": [
            {"file": "S08-P1-plates-land.png", "num": "1", "cap": "Four plates. The table blooms dashed rings."},
            {"file": "S08-P3-anup-plate.png", "num": "3", "cap": "Low GI theek hai — 2 idli, sambar zyada."},
            {"file": "S08-P2-table-arithmetic.png", "num": "2", "cap": "One pot. Four bars. Dadi, Anup, Mira, Raju."},
            {"file": "S08-P4-raju-reach.png", "num": "4", "cap": "Third idli. His bar updates mid-reach."},
            {"file": "S08-P5-anup-looks.png", "num": "5", "cap": "Nobody was told what to eat. Everybody could see."},
        ],
    },
    {
        "n": "09",
        "time": "08:07",
        "title": "Dadi's second idli",
        "grid": "C",
        "hand": "side",
        "out": "SLIDE-09.png",
        "panels": [
            {"file": "S09-P1-first-idli.png", "num": "1", "cap": "One idli going down."},
            {"file": "S09-P2-readout.png", "num": "2", "cap": "Ek aur. Raat ko halka khati hain."},
            {"file": "S09-P3-mira-looks.png", "num": "3", "cap": "She looks at Dadi, not at the wall."},
            {"file": "S09-P4-second-idli.png", "num": "4", "cap": "The cook decides. The machine only advised her."},
            {"file": "S09-P5-two-idlis.png", "num": "5", "cap": "She was not managed. She was served properly."},
        ],
    },
    {
        "n": "10",
        "time": "13:40  /  19:30",
        "title": "The empty tiffin closes the loop",
        "grid": "B",
        "hand": "top_notes",
        "out": "SLIDE-10.png",
        "panels": [
            {"file": "S10-P1-school-step.png", "num": "1", "cap": "Corridor. He opens the box."},
            {"file": "S10-P2-eats-inset-grate.png", "num": "2", "cap": "He eats without inspecting. Inset: she grated the lau at 6:40."},
            {"file": "S10-P3-empty-tiffin.png", "num": "3", "cap": "Empty. 1:40 PM."},
            {"file": "S10-P4-loop-closes.png", "num": "4", "cap": "Tonight's list already knows. Same angle as 01.1."},
        ],
    },
]


def main() -> None:
    doodle = load("HAND-arrows-doodles.png")
    notes = load("HAND-margin-notes.png")
    for spec in SPECS:
        build(spec, doodle, notes)


if __name__ == "__main__":
    main()
