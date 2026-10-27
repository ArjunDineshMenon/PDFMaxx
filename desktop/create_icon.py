#!/usr/bin/env python3
"""Convert a source image to a multi-resolution Windows .ico file for PDFMaxx."""
import sys, os
from PIL import Image

def create_ico(source_path, output_path):
    img = Image.open(source_path).convert("RGBA")
    # Standard Windows icon sizes
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    frames = []
    for size in sizes:
        frame = img.copy()
        frame.thumbnail(size, Image.LANCZOS)
        # Paste onto exact-size canvas (thumbnail may be slightly off)
        canvas = Image.new("RGBA", size, (0, 0, 0, 0))
        offset = ((size[0] - frame.width) // 2, (size[1] - frame.height) // 2)
        canvas.paste(frame, offset)
        frames.append(canvas)
    frames[0].save(output_path, format="ICO", sizes=[(s[0], s[1]) for s in sizes], append_images=frames[1:])
    print(f"Created {output_path} ({os.path.getsize(output_path)} bytes) with {len(sizes)} sizes")

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "pdfmaxx_icon.jpg")
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "desktop", "pdfmaxx.ico")
    create_ico(src, out)
