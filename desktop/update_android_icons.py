import os
from PIL import Image

res_dir = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')
src_icon_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'icons', 'icon-512.png')

if not os.path.exists(src_icon_path):
    src_icon_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'icons', 'icon-192.png')

base_img = Image.open(src_icon_path).convert('RGBA')

mipmap_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

for folder, size in mipmap_sizes.items():
    target_folder = os.path.join(res_dir, folder)
    if os.path.exists(target_folder):
        resized = base_img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(target_folder, 'ic_launcher.png'))
        resized.save(os.path.join(target_folder, 'ic_launcher_round.png'))
        resized.save(os.path.join(target_folder, 'ic_launcher_foreground.png'))
        print(f"Updated {folder} ({size}x{size})")

print("Android launcher icons updated successfully!")
