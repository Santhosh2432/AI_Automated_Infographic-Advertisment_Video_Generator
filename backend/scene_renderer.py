"""
Scene Renderer Pillow-based animation engine that renders scene plan JSON
into numbered PNG frames for FFmpeg to composite into video.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ─── Defaults ───
WIDTH = 1920
HEIGHT = 1080
FPS = 30
FONT_TITLE_SIZE = 72
FONT_BULLET_SIZE = 40
FONT_WATERMARK_SIZE = 24
PADDING = 120
BULLET_SPACING = 70
ICON_SIZE = 200
MAX_BULLETS = 5


# ─── Font helpers ───

def _get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Try to load a nice system font; fall back to default."""
    font_candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for path in font_candidates:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    # Ultimate fallback
    return ImageFont.load_default()


# ─── Color utilities ───

def _hex_to_rgb(hex_color: str) -> tuple:
    """Convert '#RRGGBB' to (R, G, B)."""
    h = hex_color.lstrip("#")
    if len(h) == 8:  # RGBA
        h = h[:6]
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _rgba(rgb: tuple, alpha: int) -> tuple:
    """Combine RGB tuple with alpha value."""
    return (*rgb[:3], max(0, min(255, alpha)))


def _lerp_color(c1: tuple, c2: tuple, t: float) -> tuple:
    """Linearly interpolate between two RGB colors."""
    t = max(0.0, min(1.0, t))
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def _ease_out_cubic(t: float) -> float:
    """Ease-out cubic easing function for smooth animations."""
    return 1 - (1 - t) ** 3


def _ease_in_out(t: float) -> float:
    """Ease-in-out quadratic."""
    if t < 0.5:
        return 2 * t * t
    return 1 - (-2 * t + 2) ** 2 / 2


# ─── Icon drawing ───

def _draw_icon(draw: ImageDraw.Draw, icon_name: str, x: int, y: int,
               size: int, color: tuple, alpha: int):
    """Draw a simple geometric icon."""
    c = _rgba(color, alpha)
    cx, cy = x + size // 2, y + size // 2
    r = size // 2 - 10

    if icon_name == "chart_up":
        # Upward trending line chart
        points = [
            (x + 20, y + size - 30),
            (x + size // 3, y + size // 2),
            (x + size * 2 // 3, y + size // 3 + 20),
            (x + size - 20, y + 30),
        ]
        draw.line(points, fill=c, width=5)
        # Arrow head
        draw.polygon([
            (x + size - 20, y + 30),
            (x + size - 50, y + 30),
            (x + size - 20, y + 60),
        ], fill=c)
        # Axis lines
        draw.line([(x + 15, y + 15), (x + 15, y + size - 15)], fill=c, width=3)
        draw.line([(x + 15, y + size - 15), (x + size - 15, y + size - 15)], fill=c, width=3)

    elif icon_name == "chart_bar":
        # Bar chart
        bar_w = size // 6
        bars = [0.4, 0.7, 0.5, 0.9]
        for i, h_pct in enumerate(bars):
            bx = x + 20 + i * (bar_w + 15)
            bar_h = int((size - 60) * h_pct)
            by = y + size - 30 - bar_h
            draw.rectangle([bx, by, bx + bar_w, y + size - 30], fill=c)
        draw.line([(x + 15, y + size - 25), (x + size - 15, y + size - 25)], fill=c, width=3)

    elif icon_name == "globe":
        # Circle with cross lines
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=4)
        draw.ellipse([cx - r // 2, cy - r, cx + r // 2, cy + r], outline=c, width=2)
        draw.line([(cx - r, cy), (cx + r, cy)], fill=c, width=2)
        draw.line([(cx, cy - r), (cx, cy + r)], fill=c, width=2)

    elif icon_name == "people":
        # Two person silhouettes
        head_r = size // 8
        for offset in [-size // 5, size // 5]:
            hx = cx + offset
            draw.ellipse([hx - head_r, cy - r + 10, hx + head_r, cy - r + 10 + 2 * head_r],
                         fill=c)
            draw.arc([hx - head_r - 10, cy - 10, hx + head_r + 10, cy + r - 10],
                     start=0, end=180, fill=c, width=4)

    elif icon_name == "star":
        # Five-pointed star
        points = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            rad = r if i % 2 == 0 else r // 2
            points.append((cx + rad * math.cos(angle), cy + rad * math.sin(angle)))
        draw.polygon(points, fill=c)

    elif icon_name == "rocket":
        # Simple rocket shape
        draw.polygon([(cx, cy - r), (cx - 20, cy + r // 2), (cx + 20, cy + r // 2)], fill=c)
        draw.rectangle([cx - 15, cy + r // 2, cx + 15, cy + r - 10], fill=c)
        # Flame
        flame = _rgba((255, 165, 0), alpha)
        draw.polygon([(cx - 10, cy + r - 10), (cx, cy + r + 10), (cx + 10, cy + r - 10)],
                     fill=flame)

    elif icon_name == "shield":
        # Shield shape
        draw.polygon([
            (cx, cy - r),
            (cx + r, cy - r // 2),
            (cx + r, cy + r // 4),
            (cx, cy + r),
            (cx - r, cy + r // 4),
            (cx - r, cy - r // 2),
        ], fill=c)

    elif icon_name == "lightbulb":
        # Bulb + base
        draw.ellipse([cx - r + 15, cy - r + 10, cx + r - 15, cy + 20], fill=c)
        draw.rectangle([cx - 20, cy + 20, cx + 20, cy + r - 10], fill=c)
        for i in range(3):
            ly = cy + 25 + i * 12
            draw.line([(cx - 15, ly), (cx + 15, ly)], fill=_rgba((0, 0, 0), alpha // 2), width=2)

    elif icon_name == "target":
        # Concentric circles
        for i in range(3):
            ri = r - i * (r // 3)
            draw.ellipse([cx - ri, cy - ri, cx + ri, cy + ri],
                         outline=c, width=4 if i == 0 else 3)
        draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=c)

    elif icon_name == "gear":
        # Gear shape (circle with notches)
        draw.ellipse([cx - r + 20, cy - r + 20, cx + r - 20, cy + r - 20], outline=c, width=6)
        draw.ellipse([cx - r // 3, cy - r // 3, cx + r // 3, cy + r // 3], fill=c)
        for i in range(8):
            angle = math.radians(i * 45)
            x1 = cx + int((r - 25) * math.cos(angle))
            y1 = cy + int((r - 25) * math.sin(angle))
            x2 = cx + int((r + 5) * math.cos(angle))
            y2 = cy + int((r + 5) * math.sin(angle))
            draw.line([(x1, y1), (x2, y2)], fill=c, width=12)

    else:
        # Fallback circle
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=4)


# ─── Scene frame drawing ───

def _draw_gradient_bg(img: Image.Image, color1: tuple, color2: tuple):
    """Draw a vertical gradient background."""
    draw = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        t = y / HEIGHT
        c = _lerp_color(color1, color2, t)
        draw.line([(0, y), (WIDTH, y)], fill=c)


def _draw_decorative_elements(draw: ImageDraw.Draw, accent: tuple, alpha: int):
    """Draw subtle decorative geometric elements."""
    c = _rgba(accent, alpha // 6)
    # Top-right circle
    draw.ellipse([WIDTH - 300, -100, WIDTH + 100, 300], outline=c, width=2)
    draw.ellipse([WIDTH - 250, -50, WIDTH + 50, 250], outline=c, width=1)
    # Bottom-left circle
    draw.ellipse([-150, HEIGHT - 250, 250, HEIGHT + 150], outline=c, width=2)
    # Subtle horizontal lines
    for i in range(3):
        y = HEIGHT - 80 + i * 15
        draw.line([(WIDTH - 400, y), (WIDTH - 100, y)],
                  fill=_rgba(accent, alpha // 8), width=1)


def _draw_glow_orb(img: Image.Image, center_x: int, center_y: int,
                   radius: int, color: tuple, alpha: int):
    """Draw a soft radial orb to add motion and depth."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    for step in range(5, 0, -1):
        current_radius = int(radius * step / 5)
        current_alpha = max(0, alpha // (6 - step))
        overlay_draw.ellipse(
            [
                center_x - current_radius,
                center_y - current_radius,
                center_x + current_radius,
                center_y + current_radius,
            ],
            fill=_rgba(color, current_alpha),
        )

    img.alpha_composite(overlay)


def _draw_highlight_chip(draw: ImageDraw.Draw, text: str,
                         accent: tuple, progress: float):
    """Draw an animated highlight tag near the top right."""
    if not text:
        return

    chip_progress = _ease_out_cubic(min(progress / 0.35, 1.0))
    chip_alpha = int(220 * chip_progress)
    chip_font = _get_font(24, bold=True)
    text_bbox = draw.textbbox((0, 0), text, font=chip_font)
    chip_width = text_bbox[2] - text_bbox[0] + 46
    chip_height = 52
    x2 = WIDTH - PADDING
    x1 = x2 - chip_width
    y = 130 + int((1 - chip_progress) * -30)

    draw.rounded_rectangle(
        [x1, y, x2, y + chip_height],
        radius=20,
        fill=_rgba(accent, chip_alpha),
    )
    draw.text((x1 + 23, y + 13), text, font=chip_font,
              fill=_rgba((255, 255, 255), int(255 * chip_progress)))


def _draw_metric_card(draw: ImageDraw.Draw, scene: dict,
                      accent: tuple, progress: float):
    """Draw a metric card with animated numeric emphasis."""
    stat_value = scene.get("stat_value", "")
    if not stat_value:
        return

    stat_progress = _ease_out_cubic(max(0.0, min((progress - 0.2) / 0.35, 1.0)))
    stat_alpha = int(220 * stat_progress)
    card_x1 = WIDTH - 560
    card_y1 = HEIGHT - 320
    card_x2 = WIDTH - 200
    card_y2 = HEIGHT - 170

    draw.rounded_rectangle(
        [card_x1, card_y1, card_x2, card_y2],
        radius=28,
        fill=_rgba((255, 255, 255), max(100, stat_alpha // 2)),
        outline=_rgba(accent, stat_alpha),
        width=3,
    )

    value_font = _get_font(52, bold=True)
    label_font = _get_font(22)
    draw.text((card_x1 + 32, card_y1 + 28), stat_value, font=value_font,
              fill=_rgba((255, 255, 255), int(255 * stat_progress)))
    draw.text((card_x1 + 34, card_y1 + 96), scene.get("stat_label", "Key metric"),
              font=label_font, fill=_rgba((230, 230, 230), int(230 * stat_progress)))


def _draw_footer_note(draw: ImageDraw.Draw, note: str,
                      accent: tuple, progress: float):
    """Draw a lower-third support line for added visual density."""
    if not note:
        return

    footer_progress = _ease_out_cubic(max(0.0, min((progress - 0.55) / 0.2, 1.0)))
    footer_alpha = int(220 * footer_progress)
    footer_font = _get_font(22, bold=True)
    band_y1 = HEIGHT - 120
    band_y2 = HEIGHT - 72
    band_x2 = 760
    band_x1 = band_x2 - int(620 * footer_progress)

    draw.rounded_rectangle(
        [band_x1, band_y1, band_x2, band_y2],
        radius=16,
        fill=_rgba(accent, footer_alpha // 2),
    )
    draw.text((band_x1 + 20, band_y1 + 11), note, font=footer_font,
              fill=_rgba((255, 255, 255), footer_alpha))


def _draw_scene_progress(draw: ImageDraw.Draw, scene: dict,
                         progress: float, accent: tuple):
    """Draw a persistent progress bar at the bottom of each scene."""
    bar_x1 = PADDING
    bar_x2 = WIDTH - PADDING
    bar_y1 = HEIGHT - 38
    bar_y2 = HEIGHT - 28
    fill_x2 = bar_x1 + int((bar_x2 - bar_x1) * progress)

    draw.rounded_rectangle([bar_x1, bar_y1, bar_x2, bar_y2], radius=8,
                           fill=_rgba((255, 255, 255), 50))
    draw.rounded_rectangle([bar_x1, bar_y1, fill_x2, bar_y2], radius=8,
                           fill=_rgba(accent, 220))

    duration_label = f"{int(round(scene.get('duration_sec', 0)))}s"
    label_font = _get_font(18, bold=True)
    draw.text((bar_x2 - 42, bar_y1 - 26), duration_label, font=label_font,
              fill=_rgba((255, 255, 255), 180))


def _draw_visual_style_overlay(img: Image.Image, draw: ImageDraw.Draw,
                               scene: dict, accent: tuple,
                               progress: float, frame_idx: int):
    """Render per-scene visual variations for a less repetitive long-form video."""
    style = scene.get("visual_style", "spotlight")

    if style == "spotlight":
        orb_x = WIDTH - 360 + int(18 * math.sin(frame_idx * 0.04))
        orb_y = HEIGHT // 2 + int(12 * math.cos(frame_idx * 0.03))
        _draw_glow_orb(img, orb_x, orb_y, 220, accent, 55)
        return

    if style == "timeline":
        rail_y = HEIGHT - 180
        rail_x1 = PADDING
        rail_x2 = WIDTH - PADDING - 120
        draw.line([(rail_x1, rail_y), (rail_x2, rail_y)], fill=_rgba(accent, 90), width=4)
        steps = 4
        active_steps = max(1, min(steps, int(progress * steps) + 1))
        for step in range(steps):
            x = rail_x1 + int((rail_x2 - rail_x1) * step / max(steps - 1, 1))
            alpha = 220 if step < active_steps else 90
            draw.ellipse([x - 11, rail_y - 11, x + 11, rail_y + 11], fill=_rgba(accent, alpha))
        return

    if style == "comparison":
        split_x = WIDTH // 2 + int(25 * math.sin(frame_idx * 0.02))
        draw.rounded_rectangle([split_x - 8, 220, split_x + 8, HEIGHT - 190], radius=8,
                               fill=_rgba(accent, 110))
        draw.rounded_rectangle([split_x - 240, 250, split_x - 40, HEIGHT - 220], radius=24,
                               outline=_rgba((255, 255, 255), 120), width=3)
        draw.rounded_rectangle([split_x + 40, 250, split_x + 240, HEIGHT - 220], radius=24,
                               outline=_rgba(accent, 160), width=3)
        return

    if style == "roadmap":
        base_y = HEIGHT - 220
        for step in range(4):
            offset = step * 120
            step_height = 40 + step * 30
            x1 = PADDING + 120 + offset
            y1 = base_y - step_height
            x2 = x1 + 150
            y2 = base_y - step_height + 56
            alpha = 90 + step * 25
            draw.rounded_rectangle([x1, y1, x2, y2], radius=18, fill=_rgba(accent, alpha))
        return

    if style == "stats":
        for idx in range(3):
            panel_x1 = WIDTH - 640 + idx * 120
            panel_y1 = 220 + idx * 40
            panel_x2 = panel_x1 + 88
            panel_y2 = panel_y1 + 220
            draw.rounded_rectangle([panel_x1, panel_y1, panel_x2, panel_y2], radius=20,
                                   fill=_rgba(accent, 40 + idx * 25))


def _draw_scene_frame(scene: dict, progress: float, frame_idx: int,
                      brand_kit: dict = None, logo_img: Image.Image = None) -> Image.Image:
    """Draw a single frame for a scene.

    Args:
        scene:    Scene dict with title, bullets, colors, icon, etc.
        progress: 0.0 → 1.0 how far into this scene's duration we are.
        frame_idx: Global frame number (for subtle animation variation).

    Returns:
        PIL Image (RGBA, 1920×1080).
    """
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    bg_color = _hex_to_rgb(scene.get("bg_color", "#1A1A2E"))
    accent = _hex_to_rgb(scene.get("accent_color", "#E94560"))
    title = scene.get("title", "")
    bullets = scene.get("bullets", [])
    icon_name = scene.get("icon", "star")

    # ── Gradient background ──
    bg_dark = _lerp_color(bg_color, (0, 0, 0), 0.3)
    _draw_gradient_bg(img, bg_color, bg_dark)

    # Re-create draw after gradient
    draw = ImageDraw.Draw(img)
    _draw_visual_style_overlay(img, draw, scene, accent, progress, frame_idx)

    # ── Decorative elements (fade in first 20% of scene) ──
    deco_alpha = int(255 * min(progress / 0.2, 1.0))
    _draw_decorative_elements(draw, accent, deco_alpha)

    # ── Accent bar on left ──
    bar_progress = _ease_out_cubic(min(progress / 0.15, 1.0))
    bar_height = int((HEIGHT - 200) * bar_progress)
    draw.rectangle([40, 100, 55, 100 + bar_height], fill=_rgba(accent, 230))

    # ── Title (slides in from left, 0% → 25% of scene) ──
    title_font = _get_font(FONT_TITLE_SIZE, bold=True)
    title_progress = _ease_out_cubic(min(progress / 0.25, 1.0))
    title_alpha = int(255 * title_progress)
    title_x = int(PADDING + (1 - title_progress) * (-200))
    title_y = 120

    # Title underline
    if title_progress > 0.5:
        underline_p = _ease_out_cubic((title_progress - 0.5) / 0.5)
        bbox = draw.textbbox((title_x, title_y), title, font=title_font)
        line_w = int((bbox[2] - bbox[0]) * underline_p)
        draw.line(
            [(title_x, bbox[3] + 10), (title_x + line_w, bbox[3] + 10)],
            fill=_rgba(accent, title_alpha), width=4
        )

    draw.text((title_x, title_y), title, font=title_font,
              fill=_rgba((255, 255, 255), title_alpha))

    _draw_highlight_chip(draw, scene.get("highlight", ""), accent, progress)

    # ── Bullets (staggered fade-in, each starts 15% after the previous) ──
    bullet_font = _get_font(FONT_BULLET_SIZE)
    bullet_start_y = 280

    for i, bullet_text in enumerate(bullets[:MAX_BULLETS]):
        # Each bullet starts animating at (25% + i*12%) of scene progress
        b_start = 0.25 + i * 0.12
        b_progress = max(0, min((progress - b_start) / 0.15, 1.0))
        b_progress = _ease_out_cubic(b_progress)

        if b_progress <= 0:
            continue

        b_alpha = int(255 * b_progress)
        b_x = int(PADDING + 30 + (1 - b_progress) * 80)
        b_y = bullet_start_y + i * BULLET_SPACING

        # Bullet dot
        dot_r = 6
        draw.ellipse(
            [b_x - 25, b_y + 18, b_x - 25 + dot_r * 2, b_y + 18 + dot_r * 2],
            fill=_rgba(accent, b_alpha)
        )

        # Bullet text
        draw.text((b_x, b_y), bullet_text, font=bullet_font,
                  fill=_rgba((230, 230, 230), b_alpha))

    # ── Icon (fades in at 40-70% of scene, positioned right side) ──
    icon_start = 0.35
    icon_prog = max(0, min((progress - icon_start) / 0.3, 1.0))
    icon_prog = _ease_out_cubic(icon_prog)

    if icon_prog > 0:
        icon_alpha = int(255 * icon_prog)
        icon_x = WIDTH - PADDING - ICON_SIZE - 60
        icon_y = HEIGHT // 2 - ICON_SIZE // 2
        # Subtle floating animation
        float_offset = int(8 * math.sin(frame_idx * 0.05))
        _draw_icon(draw, icon_name, icon_x, icon_y + float_offset,
                   ICON_SIZE, accent, icon_alpha)

    # ── Scene number badge ──
    scene_id = scene.get("id", 1)
    badge_font = _get_font(28, bold=True)
    badge_alpha = int(255 * min(progress / 0.3, 1.0))
    badge_text = f"0{scene_id}" if scene_id < 10 else str(scene_id)
    draw.rounded_rectangle(
        [WIDTH - 160, 50, WIDTH - 70, 100],
        radius=8,
        fill=_rgba(accent, badge_alpha // 2)
    )
    draw.text((WIDTH - 145, 55), badge_text, font=badge_font,
              fill=_rgba((255, 255, 255), badge_alpha))

    _draw_footer_note(draw, scene.get("footer_note", ""), accent, progress)

    # ── Brand Logo Overlay ──
    if logo_img:
        try:
            # logo_img is already pre-resized and converted to RGBA
            # Paste logo bottom-right with 60px margin from edges
            MARGIN = 60
            lw, lh = logo_img.size
            pos_x = WIDTH - lw - MARGIN
            pos_y = HEIGHT - lh - MARGIN
            img.paste(logo_img, (pos_x, pos_y), logo_img)
            
            if frame_idx == 0:
                print(f"DEBUG: Logo pasted on frame {frame_idx} at bottom-right ({pos_x}, {pos_y})")
        except Exception as e:
            print(f"DEBUG: Failed to overlay logo: {e}")
    elif frame_idx == 0:
        print("DEBUG: No logo_img to paste in scene_renderer")

    return img.convert("RGB")


# ─── Transition frames ───

def _draw_transition_frame(from_scene: dict, to_scene: dict,
                           progress: float, brand_kit: dict = None, logo_img: Image.Image = None) -> Image.Image:
    """Draw a crossfade transition frame between two scenes."""
    img1 = _draw_scene_frame(from_scene, 1.0, 0, brand_kit=brand_kit, logo_img=logo_img)
    img2 = _draw_scene_frame(to_scene, 0.0, 0, brand_kit=brand_kit, logo_img=logo_img)

    t = _ease_in_out(progress)
    return Image.blend(img1, img2, t)


# ─── Main renderer ───

def render_scenes(scene_plan: dict, output_dir: Path,
                  fps: int = FPS, transition_sec: float = 0.5,
                  brand_kit: dict = None, logo_img: Image.Image = None) -> int:
    """Render all scenes to numbered PNG frames.

    Args:
        scene_plan:     Dict with "scenes" list from OpenAI.
        output_dir:     Directory to save frame PNGs.
        fps:            Frames per second.
        transition_sec: Duration of crossfade between scenes.

    Returns:
        Total number of frames rendered.
    """
    scenes = scene_plan.get("scenes", [])
    if not scenes:
        raise ValueError("No scenes in plan")

    output_dir.mkdir(parents=True, exist_ok=True)
    frame_num = 0
    transition_frames = int(transition_sec * fps)

    for s_idx, scene in enumerate(scenes):
        duration = scene.get("duration_sec", 5)
        scene_frames = int(duration * fps)

        print(f"DEBUG: Rendering scene {s_idx + 1}/{len(scenes)}: "
              f"'{scene.get('title', '?')}' ({scene_frames} frames) ...")

        for f in range(scene_frames):
            progress = f / max(scene_frames - 1, 1)
            img = _draw_scene_frame(scene, progress, frame_num, brand_kit=brand_kit, logo_img=logo_img)

            frame_path = output_dir / f"{frame_num:06d}.png"
            img.save(frame_path, "PNG")
            frame_num += 1

        # Crossfade transition to next scene (except after last scene)
        if s_idx < len(scenes) - 1:
            next_scene = scenes[s_idx + 1]
            print(f"DEBUG: Rendering transition ({transition_frames} frames) ...")
            for t in range(transition_frames):
                t_progress = t / max(transition_frames - 1, 1)
                img = _draw_transition_frame(scene, next_scene, t_progress, brand_kit=brand_kit, logo_img=logo_img)

                frame_path = output_dir / f"{frame_num:06d}.png"
                img.save(frame_path, "PNG")
                frame_num += 1

    print(f"DEBUG: Total frames rendered: {frame_num}")
    return frame_num
