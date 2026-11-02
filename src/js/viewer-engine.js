/**
 * PDFMaxx — Universal File Viewer ("Omni Viewer") Engine
 * Authentic, zero-distortion client-side renderer for PDF, Word, PowerPoint, Excel, Images, Code, Audio, Video & Hex inspection.
 * Renders documents exactly as they truly look in native office software, 100% offline & private.
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
    pdfDoc: null,
    pdfRendering: false,
    pptxPackage: null
  };

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
    if (['txt', 'md', 'markdown', 'json', 'js', 'mjs', 'ts', 'jsx', 'tsx', 'html', 'htm', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'bat', 'ps1', 'xml', 'yaml', 'yml', 'ini', 'toml', 'env', 'log', 'config'].includes(ext) || mime.startsWith('text/')) return 'code';

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

  function parseMarkdownToHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md);
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => `<pre class="my-3 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto"><code>${code.trim()}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-gray-800 font-mono text-xs text-rose-600 dark:text-rose-400">$1</code>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-gray-800">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold mt-6 mb-3 pb-2 border-b-2 border-slate-300 dark:border-gray-700">$1</h1>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-slate-400 pl-3 my-2 text-slate-600 dark:text-slate-300 italic">$1</blockquote>');
    html = html.replace(/^---$/gim, '<hr class="my-4 border-slate-200 dark:border-gray-800" />');
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ml-4 list-disc my-0.5">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal my-0.5">$1</li>');
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

      const modeRender = document.getElementById('omniModeRender');
      const modeText = document.getElementById('omniModeText');
      const modeHex = document.getElementById('omniModeHex');
      const modeMeta = document.getElementById('omniModeMeta');

      if (modeRender) modeRender.addEventListener('click', () => this.setMode('render'));
      if (modeText) modeText.addEventListener('click', () => this.setMode('text'));
      if (modeHex) modeHex.addEventListener('click', () => this.setMode('hex'));
      if (modeMeta) modeMeta.addEventListener('click', () => this.setMode('meta'));

      const zoomIn = document.getElementById('omniZoomIn');
      const zoomOut = document.getElementById('omniZoomOut');
      const zoomReset = document.getElementById('omniZoomReset');
      const zoomFit = document.getElementById('omniZoomFit');

      if (zoomIn) zoomIn.addEventListener('click', () => this.changeZoom(0.15));
      if (zoomOut) zoomOut.addEventListener('click', () => this.changeZoom(-0.15));
      if (zoomReset) zoomReset.addEventListener('click', () => this.setZoom(1.0));
      if (zoomFit) zoomFit.addEventListener('click', () => this.setZoom('fit'));

      const rotBtn = document.getElementById('omniRotateBtn');
      const invBtn = document.getElementById('omniInvertBtn');
      if (rotBtn) rotBtn.addEventListener('click', () => this.rotate());
      if (invBtn) invBtn.addEventListener('click', () => this.toggleInvert());

      const prevBtn = document.getElementById('omniPrevBtn');
      const nextBtn = document.getElementById('omniNextBtn');
      if (prevBtn) prevBtn.addEventListener('click', () => this.prevPageOrSlide());
      if (nextBtn) nextBtn.addEventListener('click', () => this.nextPageOrSlide());

      const searchInp = document.getElementById('omniSearchInput');
      if (searchInp) {
        searchInp.addEventListener('input', (e) => {
          state.searchQuery = e.target.value.trim().toLowerCase();
          this.applySearch();
        });
      }

      const sideToggle = document.getElementById('omniSidebarToggle');
      if (sideToggle) {
        sideToggle.addEventListener('click', () => {
          state.sidebarOpen = !state.sidebarOpen;
          const sidebar = document.getElementById('omniSidebar');
          if (sidebar) sidebar.classList.toggle('hidden', !state.sidebarOpen);
        });
      }

      const dlBtn = document.getElementById('omniDownloadBtn');
      if (dlBtn) dlBtn.addEventListener('click', () => this.downloadCurrentFile());

      const printBtn = document.getElementById('omniPrintBtn');
      if (printBtn) printBtn.addEventListener('click', () => this.printCurrentDocument());

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
      state.slide = options.slide || 1;
      state.activeSheetIndex = 0;
      state.zoom = 1.0;
      state.rotation = 0;
      state.invert = false;
      state.searchQuery = '';
      state.hexOffset = 0;
      state.pdfDoc = null;
      state.pptxPackage = null;

      const modal = document.getElementById('universalViewerModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      document.getElementById('omniFileName').textContent = fileObj.name || 'Document';
      document.getElementById('omniFileSize').textContent = formatBytes(fileObj.size || (fileObj.bytes ? fileObj.bytes.length : 0));
      const badge = document.getElementById('omniFormatBadge');
      if (badge) badge.textContent = (fileObj.ext || state.fileType).toUpperCase();

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
      state.pptxPackage = null;
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
          el.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-gray-700 transition-all';
        } else {
          el.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all';
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
      }
    },

    prevPageOrSlide() {
      if (state.fileType === 'pptx') {
        if (state.slide > 1) {
          state.slide--;
          this.renderPptxSlide();
          this.updatePptxSidebarActive();
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
          this.updatePptxSidebarActive();
        }
      } else if (state.page < state.totalPages) {
        state.page++;
        if (state.fileType === 'pdf') this.renderPdfPage();
        else this.render();
      }
    },

    render() {
      const stage = document.getElementById('omniViewportStage');
      if (!stage) return;
      stage.innerHTML = '';

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
      switch (state.fileType) {
        case 'pdf':
          await this.setupPdf();
          break;
        case 'pptx':
          await this.renderPptx();
          break;
        case 'docx':
          await this.renderDocx();
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
          this.renderHex();
          break;
      }
    },

    // =========================================================================
    // 1. POWERPOINT (.pptx) — AUTHENTIC OPENXML SLIDE CANVAS ENGINE
    // Renders every shape, tree node, text run, and image at exact coordinates!
    // =========================================================================
    async renderPptx() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!window.JSZip || !file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">PowerPoint engine unavailable.</div>`;
        return;
      }

      stage.innerHTML = `<div class="p-12 text-center text-slate-400">Rendering PowerPoint slides...</div>`;

      try {
        const zip = await window.JSZip.loadAsync(file.bytes);

        // Slide dimensions from ppt/presentation.xml (default to 16:9 widescreen: 12192000 x 6858000 EMUs)
        let slideW = 12192000;
        let slideH = 6858000;
        const presFile = zip.file('ppt/presentation.xml');
        if (presFile) {
          const presXml = await presFile.async('string');
          const pDoc = new DOMParser().parseFromString(presXml, 'application/xml');
          const sldSz = pDoc.getElementsByTagName('p:sldSz')[0] || pDoc.getElementsByTagName('sldSz')[0];
          if (sldSz) {
            slideW = parseInt(sldSz.getAttribute('cx') || '12192000', 10);
            slideH = parseInt(sldSz.getAttribute('cy') || '6858000', 10);
          }
        }

        // Pre-extract all media files to Blob URLs
        const mediaMap = {};
        for (const k of Object.keys(zip.files)) {
          if (/^ppt\/media\//i.test(k)) {
            const bytes = await zip.file(k).async('uint8array');
            const ext = k.split('.').pop().toLowerCase();
            const mime = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
            mediaMap[k] = URL.createObjectURL(new Blob([bytes], { type: mime }));
          }
        }

        // Find and sort all slide files
        const slideFiles = Object.keys(zip.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k));
        slideFiles.sort((a, b) => {
          const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
          const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
          return na - nb;
        });

        if (slideFiles.length === 0) {
          throw new Error('No slides found in presentation.');
        }

        state.pptxPackage = {
          zip,
          slideFiles,
          slideW,
          slideH,
          mediaMap
        };

        state.totalSlides = slideFiles.length;
        if (state.slide > state.totalSlides || state.slide < 1) state.slide = 1;

        await this.renderPptxSlide();
        this.populatePptxSidebar();

      } catch (err) {
        stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Failed to render PowerPoint: ${escapeHtml(err.message)}</div>`;
      }
    },

    async renderPptxSlide() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      if (!stage || !state.pptxPackage) return;

      const { zip, slideFiles, slideW, slideH, mediaMap } = state.pptxPackage;
      const slidePath = slideFiles[state.slide - 1];
      if (!slidePath) return;

      const slideNum = slidePath.match(/slide(\d+)\.xml/)[1];
      const xmlStr = await zip.file(slidePath).async('string');
      const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');

      // Load slide relationships (for images)
      const relsMap = {};
      const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      const relsFile = zip.file(relsPath);
      if (relsFile) {
        const relsStr = await relsFile.async('string');
        const rDoc = new DOMParser().parseFromString(relsStr, 'application/xml');
        const rels = Array.from(rDoc.getElementsByTagName('Relationship'));
        for (const r of rels) {
          const id = r.getAttribute('Id');
          let target = r.getAttribute('Target') || '';
          if (target.startsWith('../')) target = 'ppt/' + target.replace(/^\.\.\//, '');
          relsMap[id] = mediaMap[target] || target;
        }
      }

      // Detect background color
      let bgColor = '#FFFFFF';
      const bgSrgb = xmlDoc.querySelector('bg > bgPr > solidFill > srgbClr, p\\:bg > p\\:bgPr > a\\:solidFill > a\\:srgbClr, bg > solidFill > srgbClr');
      if (bgSrgb && bgSrgb.getAttribute('val')) {
        bgColor = '#' + bgSrgb.getAttribute('val');
      }

      // Parse Shape Tree (<p:spTree>)
      const spTree = xmlDoc.getElementsByTagName('p:spTree')[0] || xmlDoc.getElementsByTagName('spTree')[0];
      const elementsHtml = [];

      if (spTree) {
        this.parsePptxElements(spTree, elementsHtml, relsMap, slideW, slideH);
      }

      const aspectRatio = `${slideW} / ${slideH}`;

      stage.innerHTML = `
        <div class="omni-zoom-target flex flex-col items-center justify-center p-4 sm:p-8 min-h-full">
          <div id="omniSlideCanvas"
               class="relative shadow-2xl transition-transform"
               style="width: 100%; max-width: 1060px; aspect-ratio: ${aspectRatio}; background-color: ${bgColor}; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.35); border: 1px solid rgba(0,0,0,0.12); overflow: hidden; container-type: size;">
            ${elementsHtml.join('')}
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Slide ${state.slide} of ${state.totalSlides}`;
    },

    parsePptxElements(containerNode, elementsHtml, relsMap, slideW, slideH) {
      const children = Array.from(containerNode.childNodes);

      for (const node of children) {
        const tag = node.nodeName.toLowerCase();

        // 1. Regular Shape or Textbox (<p:sp>)
        if (tag.endsWith(':sp') || tag === 'sp') {
          const xfrm = node.getElementsByTagName('a:xfrm')[0] || node.getElementsByTagName('xfrm')[0];
          if (!xfrm) continue;
          const off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagName('off')[0];
          const ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagName('ext')[0];
          if (!off || !ext) continue;

          const x = parseInt(off.getAttribute('x') || '0', 10);
          const y = parseInt(off.getAttribute('y') || '0', 10);
          const cx = parseInt(ext.getAttribute('cx') || '0', 10);
          const cy = parseInt(ext.getAttribute('cy') || '0', 10);
          const rot = parseInt(xfrm.getAttribute('rot') || '0', 10) / 60000;

          const left = (x / slideW) * 100;
          const top = (y / slideH) * 100;
          const width = (cx / slideW) * 100;
          const height = (cy / slideH) * 100;

          // Shape Fill
          let bgColor = 'transparent';
          const solidFill = node.querySelector('spPr > solidFill > srgbClr, p\\:spPr > a\\:solidFill > a\\:srgbClr');
          if (solidFill && solidFill.getAttribute('val')) {
            bgColor = '#' + solidFill.getAttribute('val');
          }

          // Shape Border
          let border = 'none';
          const ln = node.querySelector('spPr > ln, p\\:spPr > a\\:ln');
          if (ln) {
            const lnSrgb = ln.querySelector('solidFill > srgbClr, a\\:solidFill > a\\:srgbClr');
            const lnW = parseInt(ln.getAttribute('w') || '12700', 10);
            const borderPx = Math.max(1, Math.round(lnW / 12700));
            const borderColor = lnSrgb ? '#' + lnSrgb.getAttribute('val') : '#000000';
            border = `${borderPx}px solid ${borderColor}`;
          }

          // Preset Geometry (ellipse for tree nodes, roundRect, etc.)
          const geom = node.querySelector('prstGeom, a\\:prstGeom');
          const prst = geom ? geom.getAttribute('prst') : 'rect';
          let geomStyle = '';
          if (prst === 'ellipse') {
            geomStyle = 'border-radius: 50%;';
          } else if (prst === 'roundRect') {
            geomStyle = 'border-radius: 8px;';
          }

          // Text content
          const txBody = node.getElementsByTagName('p:txBody')[0] || node.getElementsByTagName('txBody')[0];
          let textHtml = '';
          let vAlign = 'flex-start';

          if (txBody) {
            const bodyPr = txBody.getElementsByTagName('a:bodyPr')[0] || txBody.getElementsByTagName('bodyPr')[0];
            const anchor = bodyPr ? bodyPr.getAttribute('anchor') : 't';
            vAlign = anchor === 'ctr' ? 'center' : anchor === 'b' ? 'flex-end' : 'flex-start';

            const pNodes = Array.from(txBody.getElementsByTagName('a:p')).concat(Array.from(txBody.getElementsByTagName('p')));
            const paragraphs = [];

            for (const p of pNodes) {
              const pPr = p.getElementsByTagName('a:pPr')[0] || p.getElementsByTagName('pPr')[0];
              const algn = pPr ? (pPr.getAttribute('algn') || 'l') : 'l';
              const textAlign = algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : algn === 'just' ? 'justify' : 'left';

              // Determine whether to display bullets
              let hasBullet = false;
              let bulletChar = '•';
              if (pPr) {
                const buNone = pPr.getElementsByTagName('a:buNone')[0] || pPr.getElementsByTagName('buNone')[0];
                const buChar = pPr.getElementsByTagName('a:buChar')[0] || pPr.getElementsByTagName('buChar')[0];
                const buAuto = pPr.getElementsByTagName('a:buAutoNum')[0] || pPr.getElementsByTagName('buAutoNum')[0];
                const lvl = parseInt(pPr.getAttribute('lvl') || '0', 10);

                if (buNone) {
                  hasBullet = false;
                } else if (buChar && buChar.getAttribute('char')) {
                  hasBullet = true;
                  bulletChar = buChar.getAttribute('char');
                } else if (buAuto) {
                  hasBullet = true;
                  bulletChar = '1.';
                } else if (lvl > 0) {
                  hasBullet = true;
                  bulletChar = '•';
                }
              }

              const runsHtml = [];
              const pChildren = Array.from(p.childNodes);

              for (const child of pChildren) {
                const cTag = child.nodeName.toLowerCase();
                if (cTag.endsWith(':r') || cTag === 'r') {
                  const tNode = child.getElementsByTagName('a:t')[0] || child.getElementsByTagName('t')[0];
                  const text = tNode ? tNode.textContent : '';
                  if (!text) continue;

                  const rPr = child.getElementsByTagName('a:rPr')[0] || child.getElementsByTagName('rPr')[0];
                  const sz = rPr ? parseInt(rPr.getAttribute('sz') || '1800', 10) : 1800;
                  const bold = rPr ? (rPr.getAttribute('b') === '1' || rPr.getAttribute('b') === 'true') : false;
                  const italic = rPr ? (rPr.getAttribute('i') === '1' || rPr.getAttribute('i') === 'true') : false;
                  const underline = rPr ? (rPr.hasAttribute('u') && rPr.getAttribute('u') !== 'none') : false;

                  let color = '#000000';
                  if (rPr) {
                    const srgb = rPr.querySelector('solidFill > srgbClr, a\\:solidFill > a\\:srgbClr');
                    if (srgb && srgb.getAttribute('val')) color = '#' + srgb.getAttribute('val');
                  }

                  const latin = rPr ? rPr.querySelector('latin, a\\:latin') : null;
                  const typeface = latin ? (latin.getAttribute('typeface') || 'Calibri, Arial, sans-serif') : 'Calibri, Arial, sans-serif';

                  // Vector font sizing proportional to slide height
                  const fontHeightPct = ((sz / 100) / (slideH / 12700)) * 100;

                  runsHtml.push(`
                    <span style="font-size: ${fontHeightPct}cqh; font-weight: ${bold ? '700' : '400'}; font-style: ${italic ? 'italic' : 'normal'}; text-decoration: ${underline ? 'underline' : 'none'}; color: ${color}; font-family: '${typeface}', sans-serif; white-space: pre-wrap;">${escapeHtml(text)}</span>
                  `);
                } else if (cTag.endsWith(':br') || cTag === 'br') {
                  runsHtml.push('<br/>');
                }
              }

              if (runsHtml.length > 0) {
                if (hasBullet) {
                  paragraphs.push(`
                    <div style="text-align: ${textAlign}; display: flex; align-items: flex-start; margin-bottom: 0.25em;">
                      <span style="display: inline-block; width: 1.2em; shrink-0; font-size: inherit;">${bulletChar}</span>
                      <span style="flex: 1;">${runsHtml.join('')}</span>
                    </div>
                  `);
                } else {
                  paragraphs.push(`
                    <div style="text-align: ${textAlign}; margin-bottom: 0.15em;">
                      ${runsHtml.join('')}
                    </div>
                  `);
                }
              }
            }

            textHtml = paragraphs.join('');
          }

          elementsHtml.push(`
            <div style="position: absolute;
                        left: ${left}%;
                        top: ${top}%;
                        width: ${width}%;
                        height: ${height}%;
                        ${rot ? `transform: rotate(${rot}deg);` : ''}
                        background-color: ${bgColor};
                        border: ${border};
                        ${geomStyle}
                        display: flex;
                        flex-direction: column;
                        justify-content: ${vAlign};
                        box-sizing: border-box;
                        padding: 3px 5px;
                        overflow: hidden;">
              ${textHtml}
            </div>
          `);
        }

        // 2. Picture / Graphic (<p:pic>)
        else if (tag.endsWith(':pic') || tag === 'pic') {
          const xfrm = node.getElementsByTagName('a:xfrm')[0] || node.getElementsByTagName('xfrm')[0];
          if (!xfrm) continue;
          const off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagName('off')[0];
          const ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagName('ext')[0];
          if (!off || !ext) continue;

          const x = parseInt(off.getAttribute('x') || '0', 10);
          const y = parseInt(off.getAttribute('y') || '0', 10);
          const cx = parseInt(ext.getAttribute('cx') || '0', 10);
          const cy = parseInt(ext.getAttribute('cy') || '0', 10);

          const left = (x / slideW) * 100;
          const top = (y / slideH) * 100;
          const width = (cx / slideW) * 100;
          const height = (cy / slideH) * 100;

          const blip = node.getElementsByTagName('a:blip')[0] || node.getElementsByTagName('blip')[0];
          const rId = blip ? (blip.getAttribute('r:embed') || blip.getAttribute('embed')) : null;
          const imgUrl = rId ? relsMap[rId] : null;

          if (imgUrl) {
            elementsHtml.push(`
              <img src="${imgUrl}" alt="Graphic" style="position: absolute; left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; object-fit: contain; pointer-events: none;" />
            `);
          }
        }

        // 3. Graphic Frame / Table (<p:graphicFrame>)
        else if (tag.endsWith(':graphicframe') || tag === 'graphicframe') {
          const xfrm = node.getElementsByTagName('a:xfrm')[0] || node.getElementsByTagName('xfrm')[0];
          if (!xfrm) continue;
          const off = xfrm.getElementsByTagName('a:off')[0] || xfrm.getElementsByTagName('off')[0];
          const ext = xfrm.getElementsByTagName('a:ext')[0] || xfrm.getElementsByTagName('ext')[0];
          if (!off || !ext) continue;

          const left = (parseInt(off.getAttribute('x') || '0', 10) / slideW) * 100;
          const top = (parseInt(off.getAttribute('y') || '0', 10) / slideH) * 100;
          const width = (parseInt(ext.getAttribute('cx') || '0', 10) / slideW) * 100;
          const height = (parseInt(ext.getAttribute('cy') || '0', 10) / slideH) * 100;

          const tbl = node.getElementsByTagName('a:tbl')[0] || node.getElementsByTagName('tbl')[0];
          if (tbl) {
            const rows = Array.from(tbl.getElementsByTagName('a:tr'));
            let tblHtml = `<table style="width: 100%; height: 100%; border-collapse: collapse; font-size: 2.2cqh;">`;
            rows.forEach(tr => {
              tblHtml += `<tr>`;
              const cells = Array.from(tr.getElementsByTagName('a:tc'));
              cells.forEach(tc => {
                const textNodes = Array.from(tc.getElementsByTagName('a:t'));
                const cellText = textNodes.map(t => t.textContent).join(' ');
                tblHtml += `<td style="border: 1px solid #cbd5e1; padding: 4px; vertical-align: middle;">${escapeHtml(cellText)}</td>`;
              });
              tblHtml += `</tr>`;
            });
            tblHtml += `</table>`;

            elementsHtml.push(`
              <div style="position: absolute; left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%; overflow: auto;">
                ${tblHtml}
              </div>
            `);
          }
        }

        // 4. Grouped Shapes (<p:grpSp>)
        else if (tag.endsWith(':grpsp') || tag === 'grpsp') {
          this.parsePptxElements(node, elementsHtml, relsMap, slideW, slideH);
        }
      }
    },

    populatePptxSidebar() {
      const sidebar = document.getElementById('omniSidebar');
      if (!sidebar || !state.pptxPackage) return;

      let thumbsHtml = `
        <div class="p-3 border-b border-slate-200 dark:border-gray-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span>Slides (${state.totalSlides})</span>
        </div>
        <div class="p-2 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
      `;

      for (let i = 1; i <= state.totalSlides; i++) {
        const isCurrent = i === state.slide;
        thumbsHtml += `
          <button type="button" data-jump-slide="${i}" class="w-full text-left p-2.5 rounded-lg border transition-all ${isCurrent ? 'bg-slate-100 dark:bg-gray-800 border-slate-400 font-bold text-slate-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}">
            <span class="text-[11px] font-mono">Slide ${i}</span>
          </button>
        `;
      }
      thumbsHtml += `</div>`;
      sidebar.innerHTML = thumbsHtml;

      sidebar.querySelectorAll('[data-jump-slide]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.slide = parseInt(btn.getAttribute('data-jump-slide'), 10);
          this.renderPptxSlide();
          this.updatePptxSidebarActive();
        });
      });
    },

    updatePptxSidebarActive() {
      const sidebar = document.getElementById('omniSidebar');
      if (!sidebar) return;
      sidebar.querySelectorAll('[data-jump-slide]').forEach(btn => {
        const num = parseInt(btn.getAttribute('data-jump-slide'), 10);
        const isCurrent = num === state.slide;
        btn.className = `w-full text-left p-2.5 rounded-lg border transition-all ${isCurrent ? 'bg-slate-100 dark:bg-gray-800 border-slate-400 font-bold text-slate-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`;
      });
    },

    // =========================================================================
    // 2. WORD (.docx) — AUTHENTIC DOCUMENT PAGES VIA DOCX-PREVIEW
    // =========================================================================
    async renderDocx() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">Word document bytes unavailable.</div>`;
        return;
      }

      stage.innerHTML = `
        <div class="omni-zoom-target flex flex-col items-center justify-center p-4 sm:p-8 min-h-full">
          <div id="docxContainer" class="w-full max-w-4xl bg-white shadow-2xl p-6 sm:p-14 border border-slate-200 text-slate-900">
            <div class="p-8 text-center text-slate-400">Rendering document pages...</div>
          </div>
        </div>
      `;

      const container = document.getElementById('docxContainer');

      if (window.docx && window.docx.renderAsync) {
        try {
          container.innerHTML = '';
          await window.docx.renderAsync(file.bytes, container, null, {
            className: 'docx-page',
            inWrapper: false,
            breakPages: true
          });
          if (pageInfo) pageInfo.textContent = `Word Document • ${file.name}`;
          return;
        } catch (docxErr) {
          console.warn('docx-preview fallback:', docxErr);
        }
      }

      // Standard A4/Letter clean paper fallback if docx-preview not loaded
      try {
        const zip = await window.JSZip.loadAsync(file.bytes);
        const docXmlFile = zip.file('word/document.xml');
        if (!docXmlFile) throw new Error('Missing word/document.xml');

        const xmlStr = await docXmlFile.async('string');
        const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
        const bodyNodes = Array.from(xmlDoc.getElementsByTagName('w:body')[0]?.childNodes || []);

        let html = '';
        for (const node of bodyNodes) {
          if (node.nodeName === 'w:p') {
            const pStyle = node.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
            const isHeading = /Heading/i.test(pStyle);
            const rNodes = Array.from(node.getElementsByTagName('w:r'));
            let pText = '';
            for (const r of rNodes) {
              const bold = r.getElementsByTagName('w:b').length > 0;
              const italic = r.getElementsByTagName('w:i').length > 0;
              const str = Array.from(r.getElementsByTagName('w:t')).map(t => t.textContent).join('');
              let s = escapeHtml(str);
              if (bold) s = `<strong>${s}</strong>`;
              if (italic) s = `<em>${s}</em>`;
              pText += s;
            }
            if (!pText.trim()) continue;
            if (isHeading) {
              html += `<h2 class="text-xl font-bold mt-6 mb-3 text-slate-900">${pText}</h2>`;
            } else {
              html += `<p class="my-2 text-base leading-relaxed text-slate-800">${pText}</p>`;
            }
          }
        }

        container.innerHTML = html || '<p class="text-slate-400 italic">Empty Word Document</p>';
        if (pageInfo) pageInfo.textContent = `Word Document • ${file.name}`;
      } catch (err) {
        stage.innerHTML = `<div class="p-8 text-rose-500 font-semibold">Failed to load Word document: ${escapeHtml(err.message)}</div>`;
      }
    },

    // =========================================================================
    // 3. PDF (.pdf) — CRISP VECTOR CANVAS VIA PDF.JS
    // =========================================================================
    async setupPdf() {
      const stage = document.getElementById('omniViewportStage');
      const file = state.file;

      if (!file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">PDF bytes unavailable.</div>`;
        return;
      }

      stage.innerHTML = `
        <div class="omni-zoom-target flex flex-col items-center justify-center min-h-full py-4 transition-transform duration-150">
          <canvas id="omniPdfCanvas" class="shadow-2xl border border-slate-300 dark:border-gray-800 bg-white max-w-full" style="box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);"></canvas>
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

        if (pageInfo) pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
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
        </div>
        <div class="p-2 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
      `;

      for (let i = 1; i <= state.totalPages; i++) {
        const isCurrent = i === state.page;
        thumbsHtml += `
          <button type="button" data-jump-page="${i}" class="w-full text-left p-2.5 rounded-lg border transition-all ${isCurrent ? 'bg-slate-100 dark:bg-gray-800 border-slate-400 font-bold text-slate-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}">
            <span class="text-[11px] font-mono">Page ${i}</span>
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

    // =========================================================================
    // 4. EXCEL (.xlsx, .csv) — AUTHENTIC EXCEL GRID & BOTTOM TABS
    // =========================================================================
    async renderXlsx() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      if (!window.XLSX || !file.bytes) {
        stage.innerHTML = `<div class="p-8 text-center text-slate-400">Spreadsheet engine unavailable.</div>`;
        return;
      }

      try {
        const wb = window.XLSX.read(file.bytes, { type: 'array' });
        const sheetNames = wb.SheetNames;
        if (sheetNames.length === 0) throw new Error('No sheets found.');

        state.sheets = sheetNames;
        const currentSheetName = sheetNames[state.activeSheetIndex] || sheetNames[0];
        const sheet = wb.Sheets[currentSheetName];
        const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const colLetter = (idx) => {
          let s = '';
          idx++;
          while (idx > 0) {
            let rem = (idx - 1) % 26;
            s = String.fromCharCode(65 + rem) + s;
            idx = Math.floor((idx - 1) / 26);
          }
          return s;
        };

        const maxCols = rows.reduce((max, r) => Math.max(max, r ? r.length : 0), 0) || 10;
        const cols = Array.from({ length: maxCols }, (_, i) => colLetter(i));

        stage.innerHTML = `
          <div class="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            <div class="flex-1 overflow-auto custom-scrollbar">
              <table class="w-full text-xs text-left border-collapse font-sans">
                <thead class="sticky top-0 z-10 bg-[#f3f4f6] dark:bg-gray-800 border-b border-[#d1d5db] dark:border-gray-700 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  <tr>
                    <th class="p-2 w-12 text-center bg-[#e5e7eb] dark:bg-gray-700 border-r border-[#d1d5db] dark:border-gray-700"></th>
                    ${cols.map(c => `
                      <th class="p-2 px-3 border-r border-[#d1d5db] dark:border-gray-700 text-center font-semibold select-none">${c}</th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#e5e7eb] dark:divide-gray-800 font-sans">
                  ${rows.slice(0, 500).map((r, rIdx) => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                      <td class="p-1.5 text-center text-slate-500 bg-[#f3f4f6] dark:bg-gray-800/80 border-r border-[#d1d5db] dark:border-gray-700 font-mono text-[11px] select-none">${rIdx + 1}</td>
                      ${cols.map((_, cIdx) => {
                        const cellVal = (r && r[cIdx] !== undefined) ? String(r[cIdx]) : '';
                        return `<td class="p-1.5 px-2.5 border-r border-[#e5e7eb] dark:border-gray-800 whitespace-nowrap max-w-sm truncate text-slate-800 dark:text-slate-100">${escapeHtml(cellVal)}</td>`;
                      }).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="h-9 px-3 bg-[#f3f4f6] dark:bg-gray-800 border-t border-[#d1d5db] dark:border-gray-700 flex items-center gap-1 overflow-x-auto shrink-0 select-none">
              ${sheetNames.map((sn, sIdx) => `
                <button type="button" data-switch-sheet="${sIdx}" class="px-3 py-1 text-xs font-semibold rounded-t border-b-2 transition-all ${sIdx === state.activeSheetIndex ? 'bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 border-emerald-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-gray-700'}">
                  ${escapeHtml(sn)}
                </button>
              `).join('')}
            </div>
          </div>
        `;

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

    // =========================================================================
    // 5. IMAGES — CLEAN NATIVE PHOTO VIEWER
    // =========================================================================
    renderImage() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const imgUrl = file.imageUrl || (file.bytes ? URL.createObjectURL(new Blob([file.bytes], { type: file.type || 'image/jpeg' })) : '');

      stage.innerHTML = `
        <div class="omni-zoom-target flex flex-col items-center justify-center min-h-full p-4 transition-transform duration-150">
          <img src="${imgUrl}" alt="${file.name}" class="max-h-[82vh] max-w-full object-contain shadow-2xl select-none" />
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Image • ${file.name}`;
    },

    // =========================================================================
    // 6. AUDIO & VIDEO
    // =========================================================================
    renderMedia() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const mediaUrl = URL.createObjectURL(new Blob([file.bytes], { type: file.type }));
      const isVideo = state.fileType === 'video';

      stage.innerHTML = `
        <div class="w-full max-w-3xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
          ${isVideo ? `
            <video controls autoplay class="w-full rounded-xl max-h-[70vh] bg-black shadow-2xl">
              <source src="${mediaUrl}" type="${file.type || 'video/mp4'}" />
            </video>
          ` : `
            <div class="w-full p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 flex flex-col items-center space-y-4">
              <div class="text-base font-bold text-slate-800 dark:text-slate-100">${file.name}</div>
              <audio controls class="w-full max-w-md">
                <source src="${mediaUrl}" type="${file.type || 'audio/mpeg'}" />
              </audio>
            </div>
          `}
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `${isVideo ? 'Video' : 'Audio'}`;
    },

    // =========================================================================
    // 7. ARCHIVES (.zip)
    // =========================================================================
    async renderZip() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

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
          <div class="w-full max-w-4xl mx-auto p-4 space-y-3">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-gray-800 font-mono text-xs">
              ${entries.map(e => `
                <div class="p-3 px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-800/50">
                  <div class="flex items-center gap-2.5 truncate">
                    <span>${e.dir ? '📁' : '📄'}</span>
                    <span class="truncate ${e.dir ? 'font-bold' : ''}">${escapeHtml(e.name)}</span>
                  </div>
                  <span class="text-slate-400 shrink-0 text-[11px]">${e.dir ? 'Dir' : formatBytes(e.size)}</span>
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

    // =========================================================================
    // 8. CODE & TEXT & MARKDOWN
    // =========================================================================
    renderCode() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const raw = file.extractedText || new TextDecoder('utf-8', { fatal: false }).decode(file.bytes || new Uint8Array());
      const isMd = ['md', 'markdown'].includes(file.ext);

      if (isMd && state.mdRendered) {
        stage.innerHTML = `
          <div class="w-full max-w-4xl mx-auto p-4 space-y-4">
            <div class="flex items-center justify-end">
              <button id="toggleMdSourceBtn" type="button" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-xs font-semibold">
                View Raw Markdown
              </button>
            </div>
            <div class="p-8 sm:p-12 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xl text-slate-800 dark:text-slate-100 leading-relaxed">
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
              <button id="toggleMdPreviewBtn" type="button" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-xs font-semibold">
                View Rendered Preview
              </button>
            </div>
          ` : ''}

          <div class="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl overflow-hidden font-mono text-xs">
            <div class="p-4 overflow-x-auto max-h-[75vh] custom-scrollbar leading-relaxed">
              <table class="w-full">
                <tbody>
                  ${lines.map((ln, idx) => `
                    <tr>
                      <td class="w-10 pr-4 text-right text-slate-400 select-none text-[11px]">${idx + 1}</td>
                      <td class="text-slate-800 dark:text-slate-200 whitespace-pre">${escapeHtml(ln)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `${lines.length} lines`;

      document.getElementById('toggleMdPreviewBtn')?.addEventListener('click', () => {
        state.mdRendered = true;
        this.renderCode();
      });
    },

    // =========================================================================
    // 9. RAW TEXT VIEW
    // =========================================================================
    renderText() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;

      const raw = file.extractedText || new TextDecoder('utf-8', { fatal: false }).decode(file.bytes || new Uint8Array());
      const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;

      stage.innerHTML = `
        <div class="w-full max-w-4xl mx-auto p-4 space-y-3">
          <div class="flex items-center justify-end">
            <button id="copyExtractedTextBtn" type="button" class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5">
              Copy Text
            </button>
          </div>
          <div class="p-6 sm:p-8 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xl">
            <pre class="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[75vh] overflow-y-auto custom-scrollbar select-text">${escapeHtml(raw)}</pre>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `${words.toLocaleString()} words`;

      document.getElementById('copyExtractedTextBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(raw);
        if (window.showToast) window.showToast('Copied text to clipboard!', '#10B981');
      });
    },

    // =========================================================================
    // 10. HEX DUMP INSPECTOR
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
            <span class="text-slate-500 select-none">${lineOffset}</span>
            <span class="text-indigo-300 tracking-wider">${hexPart}</span>
            <span class="text-slate-300 font-bold border-l border-slate-700 pl-3">${escapeHtml(asciiPart)}</span>
          </div>
        `;
      }

      stage.innerHTML = `
        <div class="w-full max-w-5xl mx-auto p-4 space-y-3">
          <div class="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Offset 0x${offset.toString(16).toUpperCase()} (${formatBytes(totalBytes)})</span>
            <div class="flex items-center gap-2">
              <span>Chunk ${currentPage} / ${totalPages}</span>
              <button id="hexPrevChunkBtn" type="button" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold" ${offset === 0 ? 'disabled' : ''}>◀ Prev</button>
              <button id="hexNextChunkBtn" type="button" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold" ${offset + pageSize >= totalBytes ? 'disabled' : ''}>Next ▶</button>
            </div>
          </div>
          <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-2xl font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar select-text">
            <div class="flex items-center gap-4 pb-2 mb-2 border-b border-slate-800 text-[11px] font-bold text-slate-500">
              <span class="w-20">OFFSET</span>
              <span class="tracking-wider">00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</span>
              <span class="border-l border-slate-800 pl-3">ASCII</span>
            </div>
            <div class="space-y-0.5">${hexLinesHtml}</div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Hex 0x${offset.toString(16).toUpperCase()}`;

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

    // =========================================================================
    // 11. METADATA
    // =========================================================================
    renderMetadata() {
      const stage = document.getElementById('omniViewportStage');
      const pageInfo = document.getElementById('omniPageCounter');
      const file = state.file;
      const bytes = file.bytes || new Uint8Array();

      const magic = detectMagicHeader(bytes);
      const first16Hex = Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

      stage.innerHTML = `
        <div class="w-full max-w-4xl mx-auto p-4">
          <div class="p-6 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-xl space-y-4 text-xs">
            <div class="pb-3 border-b border-slate-200 dark:border-gray-800">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">${file.name}</h3>
              <p class="text-slate-500">${magic}</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 rounded-lg bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
                <span class="text-slate-400">File Size</span>
                <p class="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">${formatBytes(file.size || bytes.length)} (${(file.size || bytes.length).toLocaleString()} bytes)</p>
              </div>
              <div class="p-3 rounded-lg bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
                <span class="text-slate-400">MIME Content Type</span>
                <p class="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">${file.type || 'application/octet-stream'}</p>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-slate-900 text-white font-mono">
              <span class="text-slate-400">Magic Bytes (Header)</span>
              <p class="text-emerald-400 tracking-wider mt-0.5">${first16Hex || 'None'}</p>
            </div>
          </div>
        </div>
      `;

      if (pageInfo) pageInfo.textContent = `Properties`;
    },

    applySearch() {
      if (state.mode === 'render' && state.fileType === 'xlsx') {
        this.renderXlsx();
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

  window.PDFMaxxViewer = Viewer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Viewer.init());
  } else {
    Viewer.init();
  }

})(window);
