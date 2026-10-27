#!/usr/bin/env python3
"""
PDFMaxx Bundler Script for VS Code
Combines modular files in src/ (src/index.html, src/css/styles.css, src/js/*.js)
into the single-file root index.html and dist/index.html.
"""
import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(root_dir, "src")

with open(os.path.join(src_dir, "index.html"), "r", encoding="utf-8") as f:
    html = f.read()

with open(os.path.join(src_dir, "css", "styles.css"), "r", encoding="utf-8") as f:
    css = f.read()

js_files = ["tools-config.js", "state.js", "pdf-engine.js", "processor.js", "ui.js"]
js_combined = []
for jf in js_files:
    with open(os.path.join(src_dir, "js", jf), "r", encoding="utf-8") as f:
        js_combined.append(f.read())

html = html.replace('  <link rel="stylesheet" href="css/styles.css" />', f"  <style>\n{css}\n  </style>")
scripts_block = (
    '  <!-- Modular Application Scripts (Edit in src/js/ in VS Code) -->\n'
    '  <script src="js/tools-config.js"></script>\n'
    '  <script src="js/state.js"></script>\n'
    '  <script src="js/pdf-engine.js"></script>\n'
    '  <script src="js/processor.js"></script>\n'
    '  <script src="js/ui.js"></script>'
)
html = html.replace(scripts_block, "  <script>\n" + "\n\n".join(js_combined) + "\n  </script>")

with open(os.path.join(root_dir, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)

os.makedirs(os.path.join(root_dir, "dist"), exist_ok=True)
with open(os.path.join(root_dir, "dist", "index.html"), "w", encoding="utf-8") as f:
    f.write(html)

print("Successfully bundled src/ into index.html and dist/index.html!")
