from PIL import Image, ImageDraw

SIZES = [16, 48, 128]

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = size * 0.1
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=size * 0.15,
        fill=(36, 41, 47, 255),
        outline=(88, 166, 255, 255),
        width=max(1, size // 16)
    )
    cx, cy = size // 2, size // 2
    r = size * 0.25
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(88, 166, 255, 255))
    img.save(f'/tmp/opencode/github-issue-tracker/icons/icon-{size}.png')

print("Icons generated.")
