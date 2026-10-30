<p align="center">
  <img src="https://raw.githubusercontent.com/ArjunDineshMenon/PDFMaxx/main/desktop/pdfmaxx_icon_preview.png" alt="PDFMaxx Icon" width="128" />
</p>

<h1 align="center">PDFMaxx</h1>
<p align="center"><strong>All-in-One 32-Tool PDF Converter, Editor, Image Suite &amp; AI for Windows</strong></p>

<p align="center">
  <a href="https://github.com/ArjunDineshMenon/PDFMaxx/releases/latest/download/PDFMaxx.exe">
    <img src="https://img.shields.io/badge/⬇_Download-PDFMaxx.exe-E11D48?style=for-the-badge&logo=windows&logoColor=white" alt="Download PDFMaxx.exe" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/size-~1.2_MB-38BDF8?style=for-the-badge" alt="Size" />
  &nbsp;
  <img src="https://img.shields.io/badge/platform-Windows_10/11-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform" />
  &nbsp;
  <img src="https://img.shields.io/badge/license-Proprietary_(All_Rights_Reserved)-E11D48?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <em>No installation required • 100% offline & client-side • Your files never leave your device</em>
</p>

---

## ⬇️ Download & Run

### Direct Download Links:

| Source | Download Link | Description |
|--------|---------------|-------------|
| 🚀 **GitHub Release** | [**Download PDFMaxx.exe (Latest Release)**](https://github.com/ArjunDineshMenon/PDFMaxx/releases/latest/download/PDFMaxx.exe) | Recommended standalone build |
| ⚡ **Direct Repo Mirror** | [**Download PDFMaxx.exe (Direct Mirror)**](https://github.com/ArjunDineshMenon/PDFMaxx/raw/main/PDFMaxx.exe) | Instant direct download from repo |
| 📦 **All Releases** | [**View GitHub Releases**](https://github.com/ArjunDineshMenon/PDFMaxx/releases) | Release notes, changelog & tags |

### How to use:
1. **Download** `PDFMaxx.exe` (only ~1.2 MB — self-contained, no installer!)
2. **Double-click** to launch — works on any Windows PC
3. If Windows SmartScreen appears on first run, click **"More info"** → **"Run anyway"**
4. The app opens in your browser (Google Chrome, Microsoft Edge, or Brave) in standalone desktop app mode

> **Requirements:** Windows 10/11 with Google Chrome, Microsoft Edge, or Brave Browser installed. Internet connection needed on first use (libraries load from CDN).

---

## ✨ Features — 32 Built-In Tools

| Category | Tools |
|----------|-------|
| **📁 Organize** | Merge PDF, Split PDF, Rotate Pages, Delete Pages, Reorder Pages, Page Numbers |
| **🔄 Convert from PDF** | PDF → Word, PDF → Excel, PDF → PowerPoint, PDF → Images, PDF → Text, PDF → Markdown |
| **📥 Convert to PDF** | Images → PDF, Word → PDF, Excel → PDF, HTML → PDF |
| **✏️ Edit & Annotate** | Add Watermark, Redact Text, Add Signature, Fill PDF Forms, Flatten PDF |
| **🔐 Security** | Encrypt PDF, Unlock PDF |
| **📊 Optimize** | Compress PDF, Compress Image (New!), Repair PDF, Compare PDFs |
| **🤖 AI & Smart** | AI Summarizer, OCR (Text Recognition), PDF Translator, Accessibility Checker, Auto-Crop, Batch Convert |

---

## 🖼️ Screenshots

The app features a beautiful, modern UI with **dark mode** and **light mode** support:

- 🎨 Color-coded tool cards for each category
- 🔍 Instant search to find any tool
- 📄 Live document preview with page thumbnails
- ⚡ Drag & drop file upload
- 📱 Fully responsive layout

---

## 🏗️ How It Works

PDFMaxx is a **single-file Windows executable** (~1.2 MB) that contains the entire application embedded inside it:

1. On launch, it extracts the HTML app to `%LOCALAPPDATA%\PDFMaxx\`
2. Opens it in your Chromium browser (Chrome/Edge/Brave) in **app mode** — no browser tabs, just a clean window
3. All PDF processing happens **100% client-side in your browser** — your files never leave your computer
4. Libraries (PDF.js, pdf-lib, JSZip, Tesseract.js, etc.) load from CDN on first use

### Tech Stack
- **Frontend**: HTML5, Tailwind CSS, vanilla JavaScript
- **PDF Engine**: [pdf-lib](https://pdf-lib.js.org/) + [PDF.js](https://mozilla.github.io/pdf.js/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Office Export**: [JSZip](https://stuk.github.io/jszip/) + [SheetJS](https://sheetjs.com/) + [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)
- **Desktop Wrapper**: .NET Framework C# (no dependencies — uses built-in Windows .NET)

---

## 🛠️ For Developers

### Project Structure

```text
PDFMaxx/
├── src/                          ← EDIT SOURCE CODE HERE
│   ├── index.html                # Main HTML layout & UI shell
│   ├── css/styles.css            # Custom CSS, Light/Dark mode & animations
│   └── js/
│       ├── tools-config.js       # 31 tool definitions, colors, icons & categories
│       ├── state.js              # Global application state & file queue
│       ├── pdf-engine.js         # PDF.js parser, DOCX/XLSX/PPTX builders
│       ├── processor.js          # Execution engine for all 31 tools
│       └── ui.js                 # Search, tool cards, live preview & listeners
├── desktop/
│   ├── PDFMaxxDesktop.cs         # C# desktop app launcher (embeds HTML at build)
│   ├── pdfmaxx.ico               # Application icon
│   ├── build_standalone.py       # Builds self-contained PDFMaxx.exe
│   ├── build_exe.py              # Bundles src/ into single-file index.html
│   └── main.js                   # Electron wrapper (alternative)
├── dist/                         # Production output
├── .github/workflows/            # CI/CD — auto-builds on push
├── Build_and_Launch_PDFMaxx.bat  # One-click build & launch
├── PDFMaxx.exe                   # Standalone executable
└── package.json                  # NPM / Electron config
```

### Build from Source

```bash
# Clone the repo
git clone https://github.com/ArjunDineshMenon/PDFMaxx.git
cd PDFMaxx

# Build standalone self-contained EXE (recommended)
python desktop/build_standalone.py

# Or build developer-mode EXE (requires src/ folder alongside)
python desktop/build_standalone.py --dev

# Or just double-click:
# Build_and_Launch_PDFMaxx.bat
```

### VS Code Integration

- **`Ctrl+Shift+B`** — Build & launch PDFMaxx.exe
- **`F5`** — Launch in Edge debugger / Electron
- Edit any file in `src/` and changes take effect on next launch (dev mode)

### Requirements for Building
- **Python 3.8+** (for the build scripts)
- **Windows 10/11** with .NET Framework 4 (included in Windows)
- No other dependencies needed!

---

## 📱 Mobile App (Android & iOS)

PDFMaxx includes a native mobile implementation powered by **Capacitor 6** and **Ionic**:

- **Package ID**: `com.arjundineshmenon.pdfmaxx`
- **Native Android Project**: [`android/`](android/) (Google Play Store ready)
- **Native iOS Project**: [`ios/`](ios/) (Apple App Store ready)
- **Native Plugins**: Document Camera Scanner, Native Share Sheet, Device Filesystem, Status Bar & Splash Screen

```bash
# Sync web build to native Android and iOS projects
npm run mobile:prepare

# Open in Android Studio
npm run mobile:android

# Open in Xcode (on macOS)
npm run mobile:ios
```

📖 **Detailed step-by-step instructions for publishing to Google Play and Apple App Store**: [**Mobile Deployment Guide (`MOBILE_GUIDE.md`)**](MOBILE_GUIDE.md)

---

## 📄 License

Proprietary (All Rights Reserved) — see [LICENSE](LICENSE) for details.

Built by [Arjun Dinesh Menon](https://github.com/ArjunDineshMenon)
