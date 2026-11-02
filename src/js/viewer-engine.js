/**
 * PDFMaxx — Universal File Viewer ("Omni Viewer") Engine
 * Client-side reader for PDF, Word, PowerPoint, Excel, Images, Code, Audio, Video, Archives & Hex inspection.
 * 100% Offline & Private in browser, PWA, Capacitor mobile, and Windows desktop.
 */
(function(window) {
  'use strict';

  // Viewer runtime state
  const state = {
    file: null,
    fileType: 'binary',
    mode: 'render', // 'render' | 'text' | 'hex' | 'meta'
    page: 1,
    totalPages: 1,
    slide: 1,
    totalSlides: 1,
    activeSheetIndex: 0,
    sheets: [],
    zoom: 1.0,
    rotation: 0,
    invert: false,
    searchQuery: '',
    sidebarOpen: true,
    mdRendered: true,
    hexOffset: 0,
    hexPageSize: 1024,
    hexTab: 'dump', // 'dump' | 'strings'
    pdfDoc: null,
    pdfRendering: false,
    extractedStrings: null
  };

  // Known file magic signatures
  const MAGIC_SIGNATURES = [
    { magic: [0x25, 0x50, 0x44, 0x46], name: 'PDF Document', ext: 'pdf' },
    { magic: [0x50, 0x4B, 0x03, 0x04], name: 'ZIP / Office OpenXML (DOCX, PPTX, XLSX)', ext: 'zip' },
    { magic: [0x89, 0x50, 0x4E, 0x47], name: 'PNG Image', ext: 'png' },
    { magic: [0xFF, 0xD8, 0xFF], name: 'JPEG Image', ext: 'jpg' },
    { magic: [0x47, 0x49, 0x46, 0x38], name: 'GIF Image', ext: 'gif' },
    { magic: [0x52, 0x49, 0x46, 0x46], name: 'RIFF Container (WebP / AVI / WAV)', ext: 'webp' },
    { magic: [0x4D, 0x5A], name: 'DOS / Windows Executable (PE)', ext: 'exe' },
    { magic: [0x7F, 0x45, 0x4C, 0x46], name: 'Linux Executable (ELF)', ext: 'elf' },
    { magic: [0x53, 0x51, 0x4C, 0x69], name: 'SQLite 3 Database', ext: 'sqlite' },
    { magic: [0x42, 0x4D], name: 'BMP Bitmap Image', ext: 'bmp' },
    { magic: [0x1F, 0x8B], name: 'GZIP Compressed Archive', ext: 'gz' },
    { magic: [0x37, 0x7A, 0xBC, 0xAF], name: '7-Zip Archive', ext: '7z' },
    { magic: [0x52, 0x61, 0x72, 0x21], name: 'RAR Archive', ext: 'rar' }
  ];

  function detectFileType(file) {
    const ext = (file.ext || (file.name ? file.name.split('.').pop() : '')).toLowerCase();
    const mime = (file.type || '').toLowerCase();

    if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
    if (['docx', 'doc'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return 'docx';
    if (['pptx', 'ppt'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'pptx';
    if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) return 'xlsx';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'tiff', 'avif'].includes(ext) || mime.startsWith('image/')) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'weba'].includes(ext) || mime.startsWith('audio/')) return 'audio';
    if (['mp4', 'webm', 'ogv', 'mov', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/')) return 'video';
    if (['zip', 'epub', 'cbz'].includes(ext) || mime.includes('zip')) return 'zip';
    if (['txt', 'md', 'markdown', 'json', 'js', 'mjs', 'ts', 'jsx', 'tsx', 'html', 'htm', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'bat', 'ps1', 'xml', 'yaml', 'yml', 'ini', 'toml', 'env', 'log', 'config', 'gitignore'].includes(ext) || mime.startsWith('text/')) return 'code';

    return 'binary';
  }

  function detectMagicHeader(bytes) {
    if (!bytes || bytes.length === 0) return 'Empty Data';
    for (const entry of MAGIC_SIGNATURES) {
      let match = true;
      for (let i = 0; i < entry.magic.length; i++) {
        if (bytes[i] !== entry.magic[i]) {
          match = false;
          break;
        }
      }
      if (match) return `${entry.name} [Detected by Magic Signature]`;
    }
    // Check if mostly printable ASCII/UTF-8
    let printable = 0;
    const sampleLen = Math.min(bytes.length, 256);
    for (let i = 0; i < sampleLen; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) printable++;
    }
    if (printable / sampleLen > 0.85) {
      return 'Plain Text / Structured Script (UTF-8 / ASCII)';
    }
    return 'Generic Binary Data Stream';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Simple Markdown parser for client-side rendering without heavy external dependencies
  function parseMarkdownToHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // Code blocks ```
    html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
      return `<pre class="my-3 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-gray-800 font-mono text-xs text-rose-600 dark:text-rose-400">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-gray-800">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b-2 border-rose-500">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-rose-500 pl-3 my-2 text-slate-600 dark:text-slate-300 italic bg-rose-50/50 dark:bg-rose-950/20 py-1 rounded-r">$1</blockquote>');

    // Horizontal Rule
    html = html.replace(/^---$/gim, '<hr class="my-4 border-slate-200 dark:border-gray-800" />');

    // Lists
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-300 my-0.5">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-slate-700 dark:text-slate-300 my-0.5">$1</li>');

    // Paragraph line breaks
    html = html.replace(/\n\n/g, '<div class="my-2.5"></div>');

    return html;
  }

  // =========================================================================
  // CORE VIEWER CONTROLLER
  // =========================================================================
  const Viewer = {
    init() {
      this.bindEvents();
    },

    bindEvents() {
      // Close button & Esc key
      const closeBtn = document.getElementById('closeViewerBtn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      const backdrop = document.getElementById('universalViewerModal');
      if (backdrop) {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) this.close();
        });
      }

      window.addEventListener('keydown', (e) => {
        const modal = document.getElementById('universalViewerModal');
        if (!modal || modal.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          this.prevPageOrSlide();
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          this.nextPageOrSlide();
        } else if (e.key === '+' || e.key === '=') {
          this.changeZoom(0.15);
        } else if (e.key === '-') {
          this.changeZoom(-0.15);
        } else if (e.key === '0') {
          this.setZoom(1.0);
        }
      });

      // Mode Switcher buttons
      const modeRender = document.getElementById('omniModeRender');
      const modeText = document.getElementById('omniModeText');
      const modeHex = document.getElementById('omniModeHex');
      const modeMeta = document.getElementById('omniModeMeta');

      if (modeRender) modeRender.addEventListener('click', () => this.setMode('render'));
      if (modeText) modeText.addEventListener('click', () => this.setMode('text'));
      if (modeHex) modeHex.addEventListener('click', () => this.setMode('hex'));
      if (modeMeta) modeMeta.addEventListener('click', () => this.setMode('meta'));

      // Zoom Controls
      const zoomIn = document.getElementById('omniZoomIn');
      const zoomOut = document.getElementById('omniZoomOut');
      const zoomReset = document.getElementById('omniZoomReset');
      const zoomFit = document.getElementById('omniZoomFit');

      if (zoomIn) zoomIn.addEventListener('click', () => this.changeZoom(0.15));
      if (zoomOut) zoomOut.addEventListener('click', () => this.changeZoom(-0.15));
      if (zoomReset) zoomReset.addEventListener('click', () => this.setZoom(1.0));
      if (zoomFit) zoomFit.addEventListener('click', () => this.setZoom('fit'));

      // Rotate & Invert
      const rotBtn = document.getElementById('omniRotateBtn');
      const invBtn = document.getElementById('omniInvertBtn');
      if (rotBtn) rotBtn.addEventListener('click', () => this.rotate());
      if (invBtn) invBtn.addEventListener('click', () => this.toggleInvert());

      // Navigation Prev / Next
      const prevBtn = document.getElementById('omniPrevBtn');
      const nextBtn = document.getElementById('omniNextBtn');
      if (prevBtn) prevBtn.addEventListener('click', () => this.prevPageOrSlide());
      if (nextBtn) nextBtn.addEventListener('click', () => this.nextPageOrSlide());

      // Search input
      const searchInp = document.getElementById('omniSearchInput');
      if (searchInp) {
        searchInp.addEventListener('input', (e) => {
          state.searchQuery = e.target.value.trim().toLowerCase();
          this.applySearch();
        });
      }

      // Sidebar Toggle
      const sideToggle = document.getElementById('omniSidebarToggle');
      if (sideToggle) {
        sideToggle.addEventListener('click', () => {
          state.sidebarOpen = !state.sidebarOpen;
          const sidebar = document.getElementById('omniSidebar');
          if (sidebar) sidebar.classList.toggle('hidden', !state.sidebarOpen);
        });
      }

      // Download & Print
      const dlBtn = document.getElementById('omniDownloadBtn');
      if (dlBtn) dlBtn.addEventListener('click', () => this.downloadCurrentFile());

      const printBtn = document.getElementById('omniPrintBtn');
      if (printBtn) printBtn.addEventListener('click', () => this.printCurrentDocument());

      // Convert shortcut button in modal footer
      const convertBtn = document.getElementById('omniConvertShortcutBtn');
      if (convertBtn) {
        convertBtn.addEventListener('click', () => {
          this.close();
          const targetTool = state.fileType === 'pdf' ? 'pdf-to-word' : 'word-to-pdf';
          const toolEl = document.querySelector(`[data-tool-id="${targetTool}"]`);
          if (toolEl) toolEl.click();
        });
      }
    },

    open(fileObj, options = {}) {
      if (!fileObj) return;
      state.file = fileObj;
      state.fileType = detectFileType(fileObj);
      state.mode = options.mode || 'render';
      state.page = options.page || 1;
      state.totalPages = fileObj.pageCount || (fileObj.pagesMeta ? fileObj.pagesMeta.length : 1) || 1;
      state.slide = 1;
      state.totalSlides = (fileObj.pagesData && fileObj.pagesData.length) ? fileObj.pagesData.length : state.totalPages;
      state.activeSheetIndex = 0;
      state.zoom = 1.0;
      state.rotation = 0;
      state.invert = false;
      state.searchQuery = '';
      state.hexOffset = 0;
      state.hexTab = 'dump';
      state.pdfDoc = null;
      state.extractedStrings = null;

      const modal = document.getElementById('universalViewerModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      // Update Header info
      document.getElementById('omniFileName').textContent = fileObj.name || 'Untitled Document';
      document.getElementById('omniFileSize').textContent = formatBytes(fileObj.size || (fileObj.bytes ? fileObj.bytes.length : 0));
      const badge = document.getElementById('omniFormatBadge');
      badge.textContent = (fileObj.ext || state.fileType).toUpperCase();

      const searchInp = document.getElementById('omniSearchInput');
      if (searchInp) searchInp.value = '';

      this.updateModeTabs();
      this.render();
    },

    close() {
      const modal = document.getElementById('universalViewerModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      state.file = null;
      state.pdfDoc = null;
    },

    setMode(newMode) {
      state.mode = newMode;
      this.updateModeTabs();
      this.render();
    },

    updateModeTabs() {
      const tabs = [
        { id: 'omniModeRender', mode: 'render' },
        { id: 'omniModeText', mode: 'text' },
        { id: 'omniModeHex', mode: 'hex' },
        { id: 'omniModeMeta', mode: 'meta' }
      ];
      tabs.forEach(t => {
        const el = document.getElementById(t.id);
        if (!el) return;
        if (t.mode === state.mode) {
          el.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-gray-700 transition-all';
        } else {
          el.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all';
        }
      });
    },

    changeZoom(delta) {
      if (typeof state.zoom === 'number') {
        state.zoom = Math.max(0.3, Math.min(3.5, state.zoom + delta));
      } else {
        state.zoom = 1.0;
      }
      this.applyZoom();
    },

    setZoom(val) {
      state.zoom = val;
      this.applyZoom();
    },

    applyZoom() {
      const zoomLabel = document.getElementById('omniZoomLevel');
      if (zoomLabel) {
        zoomLabel.textContent = typeof state.zoom === 'number' ? Math.round(state.zoom * 100) + '%' : 'Fit';
      }

      const viewportStage = document.getElementById('omniViewportStage');
      if (viewportStage) {
        const zoomableTarget = viewportStage.querySelector('.omni-zoom-target');
        if (zoomableTarget) {
          if (state.zoom === 'fit') {
            zoomableTarget.style.transform = 'scale(1)';
            zoomableTarget.style.maxWidth = '100%';
            zoomableTarget.style.width = '100%';
          } else {
            zoomableTarget.style.maxWidth = 'none';
            zoomableTarget.style.transform = `scale(${state.zoom}) rotate(${state.rotation}deg)`;
            zoomableTarget.style.transformOrigin = 'top center';
          }
        }
      }

      if (state.fileType === 'pdf' && state.mode === 'render') {
        this.renderPdfPage();
      }
    },

    rotate() {
      state.rotation = (state.rotation + 90) % 360;
      this.applyZoom();
    },

    toggleInvert() {
      state.invert = !state.invert;
      const viewportStage = document.getElementById('omniViewportStage');
      if (viewportStage) {
        viewportStage.classList.toggle('invert-filter', state.invert);
      }
      const invBtn = document.getElementById('omniInvertBtn');
      if (invBtn) {
        invBtn.classList.toggle('text-rose-500', state.invert);
        invBtn.classList.toggle('bg-rose-50', state.invert);
      }
    },

    prevPageOrSlide() {
      if (state.fileType === 'pptx') {
        if (state.slide > 1) {
          state.slide--;
          this.renderPptxSlide();
        }
      } else if (state.page > 1) {
        state.page--;
        if (state.fileType === 'pdf') this.renderPdfPage();
        else this.render();
      }
    },

    nextPageOrSlide() {
      if (state.fileType === 'pptx') {
        if (state.slide < state.totalSlides) {
          state.slide++;
          this.renderPptxSlide();
        }
      } else if (state.page < state.totalPages) {
        state.page++;
        if (state.fileType === 'pdf') this.renderPdfPage();
        else this.render();
      }
    },

    render() {
      const stage = document.getElementById('omniViewportStage');
      const sidebar = document.getElementById('omniSidebar');
      const navControls = document.getElementById('omniNavControls');
      if (!stage) return;

      // Reset transformations
      stage.innerHTML = '';
      if (navControls) navControls.classList.remove('hidden');

      if (state.mode === 'render') {
        this.renderVisual();
      } else if (state.mode === 'text') {
        this.renderText();
      } else if (state.mode === 'hex') {
        this.renderHex();
      } else if (state.mode === 'meta') {
        this.renderMetadata();
      }
    },

    // =========================================================================
    // VISUAL RENDERERS PER FORMAT
    // =========================================================================
    async renderVisual() {
      const stage = document.getElementById('omniViewportStage');
      const sidebar = document.getElementById('omniSidebar');
      const pageInfo = document.getElementById('omniPageCounter');

      switch (state.fileType) {
        case 'pdf':
          await this.setupPdf();
          break;
        case 'docx':
          await this.renderDocx();
          break;
        case 'pptx':
          await this.renderPptx();
          break;
        case 'xlsx':
          await this.renderXlsx();
          break;
        case 'image':
          this.renderImage();
          break;
        case 'audio':
        case 'video':
          this.renderMedia();
          break;
        case 'zip':
          await this.renderZip();
          break;
        case 'code':
          this.renderCode();
          break;
        default:
          // Fallback: Show Hex Dump with Notice
          this.renderHexFallback();
          break;
      }
    },

    // 1. PDF Renderer using pdf.js
    async setupPdf() {
      const stage = document.getElementById('omniViewportStage');
      const sidebar = document.getElementById('omniSidebar');
      const file = state.file;

      if (!file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">PDF bytes unavailable</div>`;
        return;
      }

      stage.innerHTML = `
        <div class="omni-zoom-target flex flex-col items-center justify-center min-h-full py-4 transition-transform duration-150">
          <canvas id="omniPdfCanvas" class="shadow-2xl rounded-xl border border-slate-200 dark:border-gray-800 bg-white max-w-full"></canvas>
        </div>
      `;

      if (window.pdfjsLib) {
        try {
          if (!state.pdfDoc) {
            const loadingTask = window.pdfjsLib.getDocument({ data: file.bytes.slice() });
            state.pdfDoc = await loadingTask.promise;
            state.totalPages = state.pdfDoc.numPages;
          }
          this.renderPdfPage();
          this.populatePdfSidebar();
        } catch (err) {
          stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Error rendering PDF: ${escapeHtml(err.message)}</div>`;
        }
      } else {
        stage.innerHTML = `<div class="p-8 text-center text-amber-500">PDF.js engine loading...</div>`;
      }
    },

    async renderPdfPage() {
      if (!state.pdfDoc || state.pdfRendering) return;
      state.pdfRendering = true;

      const canvas = document.getElementById('omniPdfCanvas');
      const pageInfo = document.getElementById('omniPageCounter');
      if (!canvas) {
        state.pdfRendering = false;
        return;
      }

      try {
        const page = await state.pdfDoc.getPage(state.page);
        const desiredScale = (typeof state.zoom === 'number' ? state.zoom : 1.0) * (window.devicePixelRatio || 1.5);
        const viewport = page.getViewport({ scale: desiredScale, rotation: state.rotation });

        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1.5)}px`;
        canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1.5)}px`;

        const renderContext = { canvasContext: ctx, viewport: viewport };
        await page.render(renderContext).promise;

        if (pageInfo) {
          pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
        }
      } catch (e) {
        console.error('PDF render error:', e);
      } finally {
        state.pdfRendering = false;
      }
    },

    populatePdfSidebar() {
      const sidebar = document.getElementById('omniSidebar');
      if (!sidebar) return;

      let thumbsHtml = `
        <div class="p-3 border-b border-slate-200 dark:border-gray-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span>Pages (${state.totalPages})</span>
          <span class="text-[10px] text-slate-400 font-normal">Click to jump</span>
        </div>
        <div class="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
      `;

      for (let i = 1; i <= state.totalPages; i++) {
        const isCurrent = i === state.page;
        thumbsHtml += `
          <button type="button" data-jump-page="${i}" class="w-full text-left p-2 rounded-xl border transition-all flex items-center gap-2.5 ${isCurrent ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 font-bold text-rose-600 dark:text-rose-400' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'}">
            <span class="w-5 h-5 rounded-md bg-slate-100 dark:bg-gray-800 text-[10px] flex items-center justify-center shrink-0 font-mono">${i}</span>
            <div class="truncate text-xs">
              <span>Page ${i}</span>
            </div>
          </button>
        `;
      }
      thumbsHtml += `</div>`;
      sidebar.innerHTML = thumbsHtml;

      sidebar.querySelectorAll('[data-jump-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.page = parseInt(btn.getAttribute('data-jump-page'), 10);
          this.renderPdfPage();
          this.populatePdfSidebar();
        });
      });
    },

    // 2. Word DOCX Renderer (Native XML Parser)
    async renderDocx() {
      const stage = document.getElementById('omniViewportStage');
      const sidebar = document.getElementById('omniSidebar');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!window.JSZip || !file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">DOCX decompression engine unavailable.</div>`;
        return;
      }

      stage.innerHTML = `<div class="p-8 text-center text-slate-400">Unpacking Word document structure...</div>`;

      try {
        const zip = await window.JSZip.loadAsync(file.bytes);
        const docXmlFile = zip.file('word/document.xml');
        if (!docXmlFile) {
          throw new Error('Invalid DOCX: word/document.xml missing');
        }

        // Extract embedded media
        const mediaMap = {};
        const mediaKeys = Object.keys(zip.files).filter(k => /^word\/media\//i.test(k));
        for (const mk of mediaKeys) {
          const imgBytes = await zip.file(mk).async('uint8array');
          const ext = mk.split('.').pop().toLowerCase();
          const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          const blob = new Blob([imgBytes], { type: mime });
          mediaMap[mk] = URL.createObjectURL(blob);
        }

        const xmlStr = await docXmlFile.async('string');
        const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
        const bodyNodes = Array.from(xmlDoc.getElementsByTagName('w:body')[0]?.childNodes || []);

        const outlineHeadings = [];
        let htmlContent = '';

        for (const node of bodyNodes) {
          if (node.nodeName === 'w:p') {
            const pStyle = node.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
            const isHeading1 = /Heading1|Title/i.test(pStyle);
            const isHeading2 = /Heading2/i.test(pStyle);
            const isHeading3 = /Heading3/i.test(pStyle);

            const rNodes = Array.from(node.getElementsByTagName('w:r'));
            let pText = '';
            for (const r of rNodes) {
              const isBold = r.getElementsByTagName('w:b').length > 0;
              const isItalic = r.getElementsByTagName('w:i').length > 0;
              const isUnderline = r.getElementsByTagName('w:u').length > 0;
              const tStr = Array.from(r.getElementsByTagName('w:t')).map(t => t.textContent).join('');

              let styledSpan = escapeHtml(tStr);
              if (isBold) styledSpan = `<strong>${styledSpan}</strong>`;
              if (isItalic) styledSpan = `<em>${styledSpan}</em>`;
              if (isUnderline) styledSpan = `<u>${styledSpan}</u>`;
              pText += styledSpan;
            }

            if (!pText.trim()) continue;

            if (isHeading1) {
              const hId = 'docx_h_' + outlineHeadings.length;
              outlineHeadings.push({ id: hId, text: pText.replace(/<[^>]+>/g, ''), level: 1 });
              htmlContent += `<h1 id="${hId}" class="text-2xl font-black text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b-2 border-rose-500">${pText}</h1>`;
            } else if (isHeading2) {
              const hId = 'docx_h_' + outlineHeadings.length;
              outlineHeadings.push({ id: hId, text: pText.replace(/<[^>]+>/g, ''), level: 2 });
              htmlContent += `<h2 id="${hId}" class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-1 border-b border-slate-200 dark:border-gray-800">${pText}</h2>`;
            } else if (isHeading3) {
              const hId = 'docx_h_' + outlineHeadings.length;
              outlineHeadings.push({ id: hId, text: pText.replace(/<[^>]+>/g, ''), level: 3 });
              htmlContent += `<h3 id="${hId}" class="text-base font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2">${pText}</h3>`;
            } else {
              htmlContent += `<p class="my-2.5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">${pText}</p>`;
            }
          } else if (node.nodeName === 'w:tbl') {
            // Render Table
            const rows = Array.from(node.getElementsByTagName('w:tr'));
            let tblHtml = `<div class="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm"><table class="w-full text-xs text-left">`;
            rows.forEach((tr, rIdx) => {
              const cells = Array.from(tr.getElementsByTagName('w:tc'));
              tblHtml += `<tr class="${rIdx === 0 ? 'bg-slate-100 dark:bg-gray-800 font-bold border-b border-slate-200 dark:border-gray-700' : 'border-b border-slate-100 dark:border-gray-800/60 hover:bg-slate-50/50'}">`;
              cells.forEach(tc => {
                const cellText = Array.from(tc.getElementsByTagName('w:t')).map(t => t.textContent).join(' ');
                tblHtml += `<td class="p-3 border-r border-slate-100 dark:border-gray-800/40 last:border-r-0">${escapeHtml(cellText)}</td>`;
              });
              tblHtml += `</tr>`;
            });
            tblHtml += `</table></div>`;
            htmlContent += tblHtml;
          }
        }

        // Render images if present
        if (mediaKeys.length > 0) {
          let mediaGallery = `<div class="mt-8 pt-6 border-t border-slate-200 dark:border-gray-800"><h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Embedded Document Media (${mediaKeys.length})</h4><div class="grid grid-cols-2 sm:grid-cols-3 gap-3">`;
          for (const mk of mediaKeys) {
            mediaGallery += `
              <div class="rounded-xl border border-slate-200 dark:border-gray-800 p-2 bg-slate-50 dark:bg-gray-800/40 text-center">
                <img src="${mediaMap[mk]}" alt="Media" class="max-h-36 mx-auto object-contain rounded-lg mb-1.5" />
                <span class="text-[10px] font-mono text-slate-400 truncate block">${mk.split('/').pop()}</span>
              </div>
            `;
          }
          mediaGallery += `</div></div>`;
          htmlContent += mediaGallery;
        }

        stage.innerHTML = `
          <div class="omni-zoom-target w-full flex justify-center py-6 px-4">
            <div class="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-8 sm:p-14 text-slate-800 dark:text-slate-100">
              <div class="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-gray-800 text-xs text-slate-400">
                <span class="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Microsoft Word Document</span>
                <span>${file.name}</span>
              </div>
              <article class="prose dark:prose-invert max-w-none">
                ${htmlContent || '<p class="text-slate-400 italic">Document contains no readable text body.</p>'}
              </article>
            </div>
          </div>
        `;

        if (pageInfo) pageInfo.textContent = `Word Document (${outlineHeadings.length} sections)`;

        // Populate Outline Sidebar
        if (sidebar) {
          let sideHtml = `
            <div class="p-3 border-b border-slate-200 dark:border-gray-800 text-xs font-bold text-slate-700 dark:text-slate-200">
              Document Outline (${outlineHeadings.length})
            </div>
            <div class="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          `;
          if (outlineHeadings.length === 0) {
            sideHtml += `<p class="p-3 text-xs text-slate-400 italic">No headings found in document.</p>`;
          } else {
            outlineHeadings.forEach(h => {
              sideHtml += `
                <a href="#${h.id}" class="block p-2 rounded-lg text-xs truncate hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 font-medium ${h.level === 1 ? 'font-bold pl-2' : h.level === 2 ? 'pl-4' : 'pl-6 text-[11px]'}">
                  ${escapeHtml(h.text)}
                </a>
              `;
            });
          }
          sideHtml += `</div>`;
          sidebar.innerHTML = sideHtml;
        }

      } catch (err) {
        stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Failed to parse Word document: ${escapeHtml(err.message)}</div>`;
      }
    },

    // 3. PowerPoint PPTX Renderer (Slide Deck View)
    async renderPptx() {
      const stage = document.getElementById('omniViewportStage');
      const sidebar = document.getElementById('omniSidebar');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!window.JSZip || !file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">PowerPoint engine unavailable.</div>`;
        return;
      }

      stage.innerHTML = `<div class="p-8 text-center text-slate-400">Loading PowerPoint slides...</div>`;

      try {
        const zip = await window.JSZip.loadAsync(file.bytes);
        const slideFiles = Object.keys(zip.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k));
        slideFiles.sort((a, b) => {
          const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
          const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
          return na - nb;
        });

        if (slideFiles.length === 0) {
          throw new Error('No slides found in presentation archive.');
        }

        const slidesData = [];
        for (let i = 0; i < slideFiles.length; i++) {
          const xmlStr = await zip.file(slideFiles[i]).async('string');
          const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
          const pNodes = Array.from(xmlDoc.getElementsByTagName('a:p'));
          const lines = [];

          pNodes.forEach(p => {
            const texts = Array.from(p.getElementsByTagName('a:t')).map(t => t.textContent).join('');
            if (texts.trim()) lines.push(texts.trim());
          });

          slidesData.push({
            slideNumber: i + 1,
            title: lines[0] || `Slide ${i + 1}`,
            points: lines.slice(1)
          });
        }

        state.slidesData = slidesData;
        state.totalSlides = slidesData.length;
        if (state.slide > state.totalSlides) state.slide = 1;

        this.renderPptxSlide();
        this.populatePptxSidebar();

      } catch (err) {
        stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Failed to parse PowerPoint presentation: ${escapeHtml(err.message)}</div>`;
      }
    },

    renderPptxSlide() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      if (!stage || !state.slidesData) return;

      const current = state.slidesData[state.slide - 1];
      if (!current) return;

      stage.innerHTML = `
        <div class="omni-zoom-target w-full flex justify-center py-6 px-4">
          <div class="w-full max-w-4xl aspect-[16/9] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-gray-800 p-8 sm:p-14 flex flex-col justify-between text-slate-800 dark:text-slate-100 relative overflow-hidden">
            <!-- Accent Top Line -->
            <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500"></div>

            <div>
              <div class="flex items-center justify-between text-xs text-slate-400 font-mono mb-4">
                <span class="px-2.5 py-1 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Slide ${current.slideNumber} of ${state.totalSlides}</span>
                <span>PowerPoint Presentation</span>
              </div>
              <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">${escapeHtml(current.title)}</h1>

              <div class="space-y-4">
                ${current.points.length > 0 ? current.points.map(pt => `
                  <div class="flex items-start gap-3">
                    <span class="w-2.5 h-2.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                    <p class="text-base sm:text-xl text-slate-700 dark:text-slate-200 leading-snug">${escapeHtml(pt)}</p>
                  </div>
                `).join('') : '<p class="text-slate-400 italic">Slide contains graphic elements or empty slide canvas.</p>'}
              </div>
            </div>

            <!-- Slide Footer -->
            <div class="pt-4 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between text-xs text-slate-400">
              <span class="font-semibold truncate max-w-xs">${state.file.name}</span>
              <div class="flex items-center gap-2">
                <button type="button" id="omniSlidePrevBtn" class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 font-bold">◀ Prev</button>
                <button type="button" id="omniSlideNextBtn" class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 font-bold">Next ▶</button>
              </div>
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Slide ${state.slide} of ${state.totalSlides}`;

      document.getElementById('omniSlidePrevBtn')?.addEventListener('click', () => this.prevPageOrSlide());
      document.getElementById('omniSlideNextBtn')?.addEventListener('click', () => this.nextPageOrSlide());
    },

    populatePptxSidebar() {
      const sidebar = document.getElementById('omniSidebar');
      if (!sidebar || !state.slidesData) return;

      let thumbsHtml = `
        <div class="p-3 border-b border-slate-200 dark:border-gray-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span>Slide Deck (${state.totalSlides})</span>
          <span class="text-[10px] text-slate-400 font-normal">Click to jump</span>
        </div>
        <div class="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
      `;

      state.slidesData.forEach((s, idx) => {
        const isCurrent = s.slideNumber === state.slide;
        thumbsHtml += `
          <button type="button" data-jump-slide="${s.slideNumber}" class="w-full text-left p-2.5 rounded-xl border transition-all ${isCurrent ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 font-bold text-orange-600 dark:text-orange-400' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'}">
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>SLIDE ${s.slideNumber}</span>
            </div>
            <p class="text-xs truncate font-semibold">${escapeHtml(s.title)}</p>
          </button>
        `;
      });
      thumbsHtml += `</div>`;
      sidebar.innerHTML = thumbsHtml;

      sidebar.querySelectorAll('[data-jump-slide]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.slide = parseInt(btn.getAttribute('data-jump-slide'), 10);
          this.renderPptxSlide();
          this.populatePptxSidebar();
        });
      });
    },

    // 4. Excel & Spreadsheet Renderer
    async renderXlsx() {
      const stage = document.getElementById('omniViewportStage');
      const sidebar = document.getElementById('omniSidebar');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!window.XLSX || !file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">Spreadsheet engine unavailable.</div>`;
        return;
      }

      try {
        const wb = window.XLSX.read(file.bytes, { type: 'array' });
        const sheetNames = wb.SheetNames;
        if (sheetNames.length === 0) throw new Error('No worksheets found.');

        state.sheets = sheetNames;
        const currentSheetName = sheetNames[state.activeSheetIndex] || sheetNames[0];
        const sheet = wb.Sheets[currentSheetName];
        const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Filter rows if search query is active
        const displayRows = state.searchQuery
          ? rows.filter(r => r.some(c => String(c).toLowerCase().includes(state.searchQuery)))
          : rows;

        let tableHtml = `
          <div class="w-full max-w-7xl mx-auto p-4 space-y-4">
            <!-- Sheet Tabs Header -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <div class="flex flex-wrap items-center gap-1.5">
                ${sheetNames.map((sn, sIdx) => `
                  <button type="button" data-switch-sheet="${sIdx}" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${sIdx === state.activeSheetIndex ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
                    ${escapeHtml(sn)}
                  </button>
                `).join('')}
              </div>
              <div class="text-xs font-mono text-slate-500">
                <span>${rows.length} rows</span> • <span>${(rows[0] || []).length} cols</span>
              </div>
            </div>

            <!-- Spreadsheet Grid -->
            <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl max-h-[70vh] custom-scrollbar">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="sticky top-0 z-10 bg-slate-100 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 font-mono">
                  <tr>
                    <th class="p-2.5 w-12 text-center bg-slate-200/80 dark:bg-gray-700/80 border-r border-slate-200 dark:border-gray-700">#</th>
                    ${(rows[0] || []).map((_, colIdx) => `
                      <th class="p-2.5 px-3 border-r border-slate-200 dark:border-gray-700 whitespace-nowrap">
                        ${String.fromCharCode(65 + (colIdx % 26))}${colIdx >= 26 ? Math.floor(colIdx / 26) : ''}
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800/60 font-mono">
                  ${displayRows.slice(0, 300).map((r, rIdx) => `
                    <tr class="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                      <td class="p-2 text-center text-slate-400 bg-slate-50 dark:bg-gray-800/40 border-r border-slate-200 dark:border-gray-800 text-[11px]">${rIdx + 1}</td>
                      ${(rows[0] || []).map((_, cIdx) => {
                        const cellVal = r[cIdx] !== undefined ? String(r[cIdx]) : '';
                        const isMatch = state.searchQuery && cellVal.toLowerCase().includes(state.searchQuery);
                        return `<td class="p-2 px-3 border-r border-slate-100 dark:border-gray-800/60 whitespace-nowrap max-w-xs truncate ${isMatch ? 'bg-amber-200 text-amber-900 font-bold' : ''}">${escapeHtml(cellVal)}</td>`;
                      }).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${displayRows.length > 300 ? `<div class="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-gray-800/50">Displaying first 300 rows of ${displayRows.length} total rows.</div>` : ''}
            </div>
          </div>
        `;

        stage.innerHTML = tableHtml;
        if (pageInfo) pageInfo.textContent = `Sheet: ${currentSheetName} (${rows.length} rows)`;

        stage.querySelectorAll('[data-switch-sheet]').forEach(btn => {
          btn.addEventListener('click', () => {
            state.activeSheetIndex = parseInt(btn.getAttribute('data-switch-sheet'), 10);
            this.renderXlsx();
          });
        });

      } catch (err) {
        stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Failed to parse spreadsheet: ${escapeHtml(err.message)}</div>`;
      }
    },

    // 5. Image Viewer (High-Res Pan/Zoom + Rotation)
    renderImage() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const imgUrl = file.imageUrl || (file.bytes ? URL.createObjectURL(new Blob([file.bytes], { type: file.type || 'image/jpeg' })) : '');

      stage.innerHTML = `
        <div class="omni-zoom-target flex flex-col items-center justify-center min-h-full p-4 transition-transform duration-150">
          <div class="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-800 inline-block max-w-full">
            <img src="${imgUrl}" alt="${file.name}" class="max-h-[75vh] max-w-full object-contain rounded-xl select-none" />
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Image • ${file.name}`;
    },

    // 6. Media (Audio / Video) Player
    renderMedia() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const mediaUrl = URL.createObjectURL(new Blob([file.bytes], { type: file.type }));
      const isVideo = state.fileType === 'video';

      stage.innerHTML = `
        <div class="w-full max-w-3xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div class="w-full bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 p-6 flex flex-col items-center space-y-6">
            <div class="flex items-center gap-3 self-start">
              <span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <span class="text-xs font-mono font-bold text-slate-300 uppercase">${isVideo ? 'Video Player' : 'Audio Player'}</span>
            </div>

            ${isVideo ? `
              <video controls autoplay class="w-full rounded-2xl max-h-[60vh] bg-black shadow">
                <source src="${mediaUrl}" type="${file.type || 'video/mp4'}" />
                Your browser does not support HTML5 video.
              </video>
            ` : `
              <div class="w-full py-12 flex flex-col items-center justify-center space-y-6">
                <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xl">
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                </div>
                <audio controls class="w-full max-w-md">
                  <source src="${mediaUrl}" type="${file.type || 'audio/mpeg'}" />
                  Your browser does not support HTML5 audio.
                </audio>
              </div>
            `}

            <div class="w-full flex items-center justify-between text-xs text-slate-400 font-mono pt-4 border-t border-slate-800">
              <span class="truncate max-w-sm">${file.name}</span>
              <span>${formatBytes(file.size || file.bytes.length)}</span>
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `${isVideo ? 'Video' : 'Audio'} Playback`;
    },

    // 7. Archive (ZIP) File Explorer
    async renderZip() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!window.JSZip || !file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">ZIP reader unavailable.</div>`;
        return;
      }

      try {
        const zip = await window.JSZip.loadAsync(file.bytes);
        const entries = Object.keys(zip.files).map(k => {
          const entry = zip.files[k];
          return {
            name: k,
            dir: entry.dir,
            size: entry._data ? entry._data.uncompressedSize || 0 : 0
          };
        });

        entries.sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name));

        stage.innerHTML = `
          <div class="w-full max-w-4xl mx-auto p-4 space-y-4">
            <div class="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">ZIP Archive Contents</h3>
                <p class="text-xs text-slate-500">${entries.length} files and directories inside ${file.name}</p>
              </div>
              <span class="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">COMPRESSED ARCHIVE</span>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-gray-800">
              ${entries.map(e => `
                <div class="p-3 px-4 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-gray-800/50">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-base">${e.dir ? '📁' : '📄'}</span>
                    <span class="font-mono text-slate-800 dark:text-slate-200 truncate ${e.dir ? 'font-bold' : ''}">${escapeHtml(e.name)}</span>
                  </div>
                  <span class="font-mono text-slate-400 shrink-0">${e.dir ? 'Directory' : formatBytes(e.size)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        if (pageInfo) pageInfo.textContent = `Archive (${entries.length} items)`;

      } catch (err) {
        stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Failed to inspect ZIP archive: ${escapeHtml(err.message)}</div>`;
      }
    },

    // 8. Plain Text, Source Code & Markdown
    renderCode() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const raw = file.extractedText || new TextDecoder('utf-8', { fatal: false }).decode(file.bytes || new Uint8Array());
      const isMd = ['md', 'markdown'].includes(file.ext);

      if (isMd && state.mdRendered) {
        stage.innerHTML = `
          <div class="w-full max-w-4xl mx-auto p-4 space-y-4">
            <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Markdown Rendered Preview</span>
              <button id="toggleMdSourceBtn" type="button" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300">
                View Raw Source
              </button>
            </div>
            <div class="p-8 sm:p-12 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xl text-slate-800 dark:text-slate-100">
              ${parseMarkdownToHtml(raw)}
            </div>
          </div>
        `;

        document.getElementById('toggleMdSourceBtn')?.addEventListener('click', () => {
          state.mdRendered = false;
          this.renderCode();
        });
        return;
      }

      const lines = raw.split('\n');

      stage.innerHTML = `
        <div class="w-full max-w-5xl mx-auto p-4 space-y-3">
          ${isMd ? `
            <div class="flex items-center justify-end">
              <button id="toggleMdPreviewBtn" type="button" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow">
                View Formatted Markdown Preview
              </button>
            </div>
          ` : ''}

          <div class="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl overflow-hidden">
            <div class="flex items-center justify-between p-3 px-4 bg-slate-100 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-red-400"></span>
                <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span class="ml-2 font-mono text-slate-600 dark:text-slate-300 font-bold">${file.name}</span>
              </div>
              <button id="omniCopyRawCodeBtn" type="button" class="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-700 font-semibold hover:bg-slate-50 text-[11px]">
                Copy All Code
              </button>
            </div>

            <div class="p-4 overflow-x-auto max-h-[75vh] custom-scrollbar font-mono text-xs leading-relaxed">
              <table class="w-full">
                <tbody>
                  ${lines.map((ln, idx) => {
                    const isHit = state.searchQuery && ln.toLowerCase().includes(state.searchQuery);
                    return `
                      <tr class="${isHit ? 'bg-amber-100 dark:bg-amber-950/40' : ''}">
                        <td class="w-10 pr-4 text-right text-slate-400 select-none text-[11px] font-mono">${idx + 1}</td>
                        <td class="text-slate-800 dark:text-slate-200 whitespace-pre">${escapeHtml(ln)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `${lines.length} lines • ${raw.length} chars`;

      document.getElementById('toggleMdPreviewBtn')?.addEventListener('click', () => {
        state.mdRendered = true;
        this.renderCode();
      });

      document.getElementById('omniCopyRawCodeBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(raw);
        if (window.showToast) window.showToast('Copied code to clipboard!', '#10B981');
      });
    },

    // =========================================================================
    // MODE 2: EXTRACTED TEXT INSPECTOR
    // =========================================================================
    renderText() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const raw = file.extractedText || new TextDecoder('utf-8', { fatal: false }).decode(file.bytes || new Uint8Array());
      const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
      const chars = raw.length;

      stage.innerHTML = `
        <div class="w-full max-w-4xl mx-auto p-4 space-y-4">
          <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Extracted Document Text</h3>
              <p class="text-xs text-slate-500 font-mono">${words.toLocaleString()} words • ${chars.toLocaleString()} characters</p>
            </div>
            <button id="copyExtractedTextBtn" type="button" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
              <span>Copy Full Text</span>
            </button>
          </div>

          <div class="p-6 sm:p-8 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xl">
            <pre class="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[70vh] overflow-y-auto custom-scrollbar select-text">${escapeHtml(raw)}</pre>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `${words.toLocaleString()} words`;

      document.getElementById('copyExtractedTextBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(raw);
        if (window.showToast) window.showToast('Copied extracted text to clipboard!', '#10B981');
      });
    },

    // =========================================================================
    // MODE 3: UNIVERSAL HEX DUMP & STRINGS INSPECTOR
    // =========================================================================
    renderHex() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;
      const bytes = file.bytes || new Uint8Array();

      const totalBytes = bytes.length;
      const offset = state.hexOffset;
      const pageSize = state.hexPageSize;
      const chunk = bytes.slice(offset, offset + pageSize);
      const totalPages = Math.ceil(totalBytes / pageSize);
      const currentPage = Math.floor(offset / pageSize) + 1;

      const detectedHeader = detectMagicHeader(bytes);

      let hexLinesHtml = '';
      for (let i = 0; i < chunk.length; i += 16) {
        const lineOffset = (offset + i).toString(16).padStart(8, '0');
        const lineBytes = chunk.slice(i, i + 16);

        let hexPart = '';
        let asciiPart = '';

        for (let j = 0; j < 16; j++) {
          if (j === 8) hexPart += ' ';
          if (j < lineBytes.length) {
            const b = lineBytes[j];
            hexPart += b.toString(16).padStart(2, '0').toUpperCase() + ' ';
            asciiPart += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
          } else {
            hexPart += '   ';
            asciiPart += ' ';
          }
        }

        hexLinesHtml += `
          <div class="flex items-center gap-4 hover:bg-slate-800/80 px-2 py-0.5 rounded">
            <span class="text-rose-400 select-none">${lineOffset}</span>
            <span class="text-indigo-300 tracking-wider">${hexPart}</span>
            <span class="text-emerald-400 font-bold border-l border-slate-700 pl-3">${escapeHtml(asciiPart)}</span>
          </div>
        `;
      }

      stage.innerHTML = `
        <div class="w-full max-w-5xl mx-auto p-4 space-y-4">
          <!-- Header Banner -->
          <div class="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 class="text-sm font-bold font-mono">Binary &amp; Hex Dump Inspector</h3>
              </div>
              <p class="text-xs text-slate-400 font-mono mt-1">${detectedHeader}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-slate-400">Chunk ${currentPage} / ${totalPages}</span>
              <button id="hexPrevChunkBtn" type="button" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold" ${offset === 0 ? 'disabled' : ''}>◀ Prev 1KB</button>
              <button id="hexNextChunkBtn" type="button" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold" ${offset + pageSize >= totalBytes ? 'disabled' : ''}>Next 1KB ▶</button>
            </div>
          </div>

          <!-- Hex Output Box -->
          <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar select-text">
            <div class="flex items-center gap-4 pb-2 mb-2 border-b border-slate-800 text-[11px] font-bold text-slate-500">
              <span class="w-20">OFFSET</span>
              <span class="tracking-wider">00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
              <span class="border-l border-slate-800 pl-3">ASCII</span>
            </div>
            <div class="space-y-0.5">
              ${hexLinesHtml}
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Offset 0x${offset.toString(16).toUpperCase()} (${formatBytes(totalBytes)})`;

      document.getElementById('hexPrevChunkBtn')?.addEventListener('click', () => {
        state.hexOffset = Math.max(0, state.hexOffset - state.hexPageSize);
        this.renderHex();
      });

      document.getElementById('hexNextChunkBtn')?.addEventListener('click', () => {
        if (state.hexOffset + state.hexPageSize < totalBytes) {
          state.hexOffset += state.hexPageSize;
          this.renderHex();
        }
      });
    },

    renderHexFallback() {
      // For any unknown extension
      this.renderHex();
    },

    // =========================================================================
    // MODE 4: FILE METADATA INSPECTOR
    // =========================================================================
    renderMetadata() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;
      const bytes = file.bytes || new Uint8Array();

      const magic = detectMagicHeader(bytes);
      const first16Hex = Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

      stage.innerHTML = `
        <div class="w-full max-w-4xl mx-auto p-4 space-y-4">
          <div class="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xl space-y-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
                  ℹ️
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">${file.name}</h3>
                  <p class="text-xs text-slate-500">${magic}</p>
                </div>
              </div>
              <span class="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500 text-white uppercase">${file.ext || 'FILE'}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-700/80 space-y-1">
                <span class="text-slate-400 font-medium">File Size</span>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">${formatBytes(file.size || bytes.length)} (${(file.size || bytes.length).toLocaleString()} bytes)</p>
              </div>

              <div class="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-700/80 space-y-1">
                <span class="text-slate-400 font-medium">MIME Content Type</span>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">${file.type || 'application/octet-stream'}</p>
              </div>

              <div class="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-700/80 space-y-1">
                <span class="text-slate-400 font-medium">Page / Item Count</span>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">${state.totalPages || state.totalSlides || 1} units</p>
              </div>

              <div class="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200/80 dark:border-gray-700/80 space-y-1">
                <span class="text-slate-400 font-medium">Detected Architecture / Header</span>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono truncate">${magic}</p>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <span class="text-xs text-slate-400 font-mono">Magic Bytes Header (First 16 Bytes)</span>
              <p class="text-sm font-mono text-emerald-400 tracking-wider">${first16Hex || 'None'}</p>
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `File Metadata`;
    },

    // =========================================================================
    // UTILITIES: SEARCH, DOWNLOAD, PRINT
    // =========================================================================
    applySearch() {
      if (state.mode === 'render' && state.fileType === 'xlsx') {
        this.renderXlsx();
      } else if (state.mode === 'code') {
        this.renderCode();
      }
    },

    downloadCurrentFile() {
      if (!state.file) return;
      const bytes = state.file.bytes;
      if (!bytes) return;

      const blob = new Blob([bytes], { type: state.file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.file.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      if (window.showToast) window.showToast(`Downloaded ${state.file.name}`, '#10B981');
    },

    printCurrentDocument() {
      window.print();
    }
  };

  // Attach to window object
  window.PDFMaxxViewer = Viewer;

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Viewer.init());
  } else {
    Viewer.init();
  }

})(window);
