import os
from PIL import Image, ImageDraw, ImageFont

icons_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'icons')
os.makedirs(icons_dir, exist_ok=True)

ico_path = os.path.join(os.path.dirname(__file__), 'pdfmaxx.ico')

def generate_brand_icon(size):
    # Create smooth rounded gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background with vibrant crimson gradient
    radius = int(size * 0.22)
    # Background fill
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(225, 29, 72, 255))

    # Inner document symbol (folded corner sheet + PDFMaxx 'P')
    margin = int(size * 0.22)
    doc_w = size - margin * 2
    doc_h = size - margin * 2
    doc_x = margin
    doc_y = margin
    doc_radius = int(size * 0.08)

    # White page base
    draw.rounded_rectangle([doc_x, doc_y, doc_x + doc_w, doc_y + doc_h], radius=doc_radius, fill=(255, 255, 255, 240))

    # Crimson accent bars representing document content
    bar_x = doc_x + int(doc_w * 0.20)
    bar_w = int(doc_w * 0.60)
    bar_h = max(3, int(size * 0.045))
    bar_r = max(2, bar_h // 2)

    y1 = doc_y + int(doc_h * 0.30)
    draw.rounded_rectangle([bar_x, y1, bar_x + bar_w, y1 + bar_h], radius=bar_r, fill=(225, 29, 72, 230))

    y2 = y1 + int(bar_h * 2.2)
    draw.rounded_rectangle([bar_x, y2, bar_x + int(bar_w * 0.8), y2 + bar_h], radius=bar_r, fill=(234, 88, 12, 230))

    y3 = y2 + int(bar_h * 2.2)
    draw.rounded_rectangle([bar_x, y3, bar_x + int(bar_w * 0.5), y3 + bar_h], radius=bar_r, fill=(202, 138, 4, 230))

    return img

# Try loading from ICO or generate fresh crisp icons
loaded = False
if os.path.exists(ico_path):
    try:
        ico_img = Image.open(ico_path)
        # Check size
        if ico_img.size[0] >= 128:
            ico_img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, 'icon-192.png'))
            ico_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, 'icon-512.png'))
            loaded = True
            print("Exported from ICO successfully")
    except Exception as e:
        print("Could not load ico:", e)

if not loaded:
    img192 = generate_brand_icon(192)
    img192.save(os.path.join(icons_dir, 'icon-192.png'), 'PNG')
    img512 = generate_brand_icon(512)
    img512.save(os.path.join(icons_dir, 'icon-512.png'), 'PNG')
    print("Generated brand icons 192x192 and 512x512 successfully")

