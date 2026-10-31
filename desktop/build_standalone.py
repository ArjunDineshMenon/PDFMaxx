#!/usr/bin/env python3
"""
PDFMaxx Standalone Builder
--------------------------
1. Bundles modular src/ files into a single index.html (like build_exe.py)
2. Embeds the bundled HTML both as an assembly manifest resource and as base64 inside PDFMaxxDesktop.cs
3. Compiles a self-contained PDFMaxx.exe with the app icon

Usage:
    python desktop/build_standalone.py          # Build self-contained PDFMaxx.exe
    python desktop/build_standalone.py --dev    # Build developer-mode PDFMaxx.exe (no embedding)
"""
import os, sys, base64, shutil, subprocess

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, "src")
DESKTOP_DIR = os.path.join(ROOT_DIR, "desktop")
DIST_DIR = os.path.join(ROOT_DIR, "dist")
CS_TEMPLATE = os.path.join(DESKTOP_DIR, "PDFMaxxDesktop.cs")
CS_GENERATED = os.path.join(DESKTOP_DIR, "_PDFMaxxDesktop_Generated.cs")
ICO_PATH = os.path.join(DESKTOP_DIR, "pdfmaxx.ico")
EXE_OUTPUT = os.path.join(ROOT_DIR, "PDFMaxx.exe")

DEV_MODE = "--dev" in sys.argv
WEB_ONLY = "--web-only" in sys.argv or "--pwa-only" in sys.argv

def step(num, total, msg):
    print(f"  [{num}/{total}] {msg}")

def bundle_src():
    """Bundle modular src/ files into single-file index.html."""
    with open(os.path.join(SRC_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
    with open(os.path.join(SRC_DIR, "css", "styles.css"), "r", encoding="utf-8") as f:
        css = f.read()

    js_files = ["tools-config.js", "state.js", "pdf-engine.js", "processor.js", "ui.js"]
    js_combined = []
    for jf in js_files:
        with open(os.path.join(SRC_DIR, "js", jf), "r", encoding="utf-8") as f:
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
    return html

def find_csc():
    """Find the .NET Framework C# compiler."""
    windir = os.environ.get("WINDIR", r"C:\Windows")
    candidates = [
        os.path.join(windir, "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe"),
        os.path.join(windir, "Microsoft.NET", "Framework", "v4.0.30319", "csc.exe"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def main():
    total = 5 if not DEV_MODE else 3
    mode_label = "Developer" if DEV_MODE else "Standalone (self-contained)"
    print(f"\n  PDFMaxx Build — {mode_label} Mode")
    print(f"  {'=' * 45}")

    # Step 1: Bundle src/
    step(1, total, "Bundling modular src/ files...")
    bundled_html = bundle_src()

    # Write bundled HTML to root and dist
    root_html_path = os.path.join(ROOT_DIR, "index.html")
    with open(root_html_path, "w", encoding="utf-8") as f:
        f.write(bundled_html)
    os.makedirs(DIST_DIR, exist_ok=True)
    with open(os.path.join(DIST_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(bundled_html)

    # Sync manifest, service worker and icons for mobile/PWA
    manifest_src = os.path.join(SRC_DIR, "manifest.json")
    if os.path.exists(manifest_src):
        shutil.copy2(manifest_src, os.path.join(ROOT_DIR, "manifest.json"))
        shutil.copy2(manifest_src, os.path.join(DIST_DIR, "manifest.json"))
    sw_src = os.path.join(SRC_DIR, "sw.js")
    if os.path.exists(sw_src):
        shutil.copy2(sw_src, os.path.join(ROOT_DIR, "sw.js"))
        shutil.copy2(sw_src, os.path.join(DIST_DIR, "sw.js"))
    icons_src = os.path.join(SRC_DIR, "icons")
    if os.path.exists(icons_src):
        shutil.copytree(icons_src, os.path.join(ROOT_DIR, "icons"), dirs_exist_ok=True)
        shutil.copytree(icons_src, os.path.join(DIST_DIR, "icons"), dirs_exist_ok=True)

    # Add .nojekyll for GitHub Pages
    with open(os.path.join(ROOT_DIR, ".nojekyll"), "w") as f:
        pass
    with open(os.path.join(DIST_DIR, ".nojekyll"), "w") as f:
        pass

    html_size_kb = len(bundled_html.encode("utf-8")) / 1024
    print(f"        Bundled index.html: {html_size_kb:.0f} KB")

    if WEB_ONLY:
        print("\n  [Done] Web and PWA assets bundled into root and dist/ successfully!")
        return

    # Step 2: Generate C# with embedded HTML
    if not DEV_MODE:
        step(2, total, "Embedding HTML into C# source...")
        html_b64 = base64.b64encode(bundled_html.encode("utf-8")).decode("ascii")
        with open(CS_TEMPLATE, "r", encoding="utf-8") as f:
            cs_source = f.read()

        # Replace ONLY the declaration placeholder, not anything else
        placeholder_def = 'static string EMBEDDED_HTML_B64 = "__PDFMAXX_HTML_B64_PLACEHOLDER__";'
        replacement_def = f'static string EMBEDDED_HTML_B64 = "{html_b64}";'
        if placeholder_def in cs_source:
            cs_source = cs_source.replace(placeholder_def, replacement_def, 1)
        else:
            # Fallback if whitespace differs
            cs_source = cs_source.replace('__PDFMAXX_HTML_B64_PLACEHOLDER__', html_b64, 1)

        with open(CS_GENERATED, "w", encoding="utf-8") as f:
            f.write(cs_source)
        b64_size_kb = len(html_b64) / 1024
        print(f"        Embedded {b64_size_kb:.0f} KB of base64 data")
    else:
        step(2, total, "Skipping embedding (developer mode)")
        shutil.copy2(CS_TEMPLATE, CS_GENERATED)

    # Step 3: Find compiler
    step_num = 3 if DEV_MODE else 3
    step(step_num, total, "Locating C# compiler...")
    csc = find_csc()
    if not csc:
        print("        ERROR: Could not find csc.exe (.NET Framework 4 required)")
        sys.exit(1)
    print(f"        Found: {csc}")

    # Step 4: Compile
    step_num = 3 if DEV_MODE else 4
    step(step_num, total, "Compiling PDFMaxx.exe with icon and embedded resources...")
    cmd = [
        csc,
        "/target:winexe",
        f"/out:{EXE_OUTPUT}",
        "/r:System.Windows.Forms.dll",
        "/optimize+",
    ]
    if not DEV_MODE:
        # Dual-layer embedding: manifest resource index.html + base64 string in binary
        cmd.append(f"/resource:{root_html_path},PDFMaxx.index.html")

    if os.path.exists(ICO_PATH):
        cmd.append(f"/win32icon:{ICO_PATH}")
    cmd.append(CS_GENERATED)

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"        COMPILE ERROR:\n{result.stderr}\n{result.stdout}")
        sys.exit(1)

    exe_size = os.path.getsize(EXE_OUTPUT)
    exe_size_str = f"{exe_size / (1024*1024):.1f} MB" if exe_size > 1024*1024 else f"{exe_size / 1024:.0f} KB"
    print(f"        Built PDFMaxx.exe: {exe_size_str}")

    # Copy to dist
    shutil.copy2(EXE_OUTPUT, os.path.join(DIST_DIR, "PDFMaxx.exe"))

    # Update Desktop copy if present
    desktop_exe = os.path.join(os.path.expanduser("~"), "Desktop", "PDFMaxx.exe")
    if os.path.exists(desktop_exe):
        try:
            shutil.copy2(EXE_OUTPUT, desktop_exe)
            print(f"        Updated Desktop copy: {desktop_exe}")
        except Exception as e:
            print(f"        Notice: Could not copy to Desktop ({e})")

    # Clean up generated C# (don't leave huge file in repo)
    if os.path.exists(CS_GENERATED):
        os.remove(CS_GENERATED)

    # Step 5: Done
    final_step = total
    step(final_step, total, "Build complete!")
    print(f"\n  Output: {EXE_OUTPUT}")
    print(f"  Size:   {exe_size_str}")
    if not DEV_MODE:
        print(f"  Mode:   Standalone — runs anywhere on any computer, no extra files needed!")
    else:
        print(f"  Mode:   Developer — requires src/ or index.html alongside the EXE")
    print()

if __name__ == "__main__":
    main()
