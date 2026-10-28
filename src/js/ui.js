/**
 * PDFMaxx — UI Renderer, Search Bar, Live Page Inspector & Event Listeners
 */
// =========================================================================
    // 4. RENDER DIRECTORY GRID, SEARCH BAR & CATEGORY PILLS
    // =========================================================================
    function renderCategoryPills() {
      const bar = document.getElementById('categoryFilterBar');
      bar.innerHTML = CATEGORIES.map(cat => {
        const active = state.selectedCategory === cat.id;
        return `
          <button
            type="button"
            data-cat-pill="${cat.id}"
            class="cat-pill-btn px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              active
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm scale-[1.02]'
                : 'bg-white dark:bg-gray-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-gray-700 hover:border-slate-400'
            }"
          >
            ${cat.label}
          </button>
        `;
      }).join('');

      bar.querySelectorAll('.cat-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedCategory = btn.getAttribute('data-cat-pill');
          renderCategoryPills();
          renderToolsGrid();
        });
      });
    }

    function renderToolsGrid() {
      const grid = document.getElementById('toolsGrid');
      const emptyState = document.getElementById('emptySearchState');
      const countLabel = document.getElementById('searchCountLabel');
      const clearBtn = document.getElementById('clearSearchBtn');

      const q = state.searchQuery.trim().toLowerCase();
      if (q.length > 0) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');

      const filtered = TOOLS.filter(t => {
        const matchesCat = state.selectedCategory === 'all' || t.category === state.selectedCategory;
        if (!matchesCat) return false;
        if (!q) return true;
        const haystack = `${t.title} ${t.desc} ${t.category} ${t.accept} ${t.isNew ? 'new ai' : ''}`.toLowerCase();
        return haystack.includes(q);
      });

      countLabel.textContent = filtered.length === TOOLS.length
        ? `Showing all ${TOOLS.length} features`
        : `Found ${filtered.length} of ${TOOLS.length} features`;

      if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');
      grid.innerHTML = filtered.map(tool => `
        <button
          type="button"
          data-open-tool="${tool.id}"
          style="--card-color: ${tool.color}; --card-shadow: ${tool.badgeBg};"
          class="tool-card group text-left bg-white dark:bg-gray-900 rounded-2xl p-5 border border-slate-200/90 dark:border-gray-800 flex flex-col justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          <div class="space-y-3.5 w-full">
            <div class="flex items-start justify-between gap-2">
              <!-- Colored Icon Container -->
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                style="background-color: ${tool.badgeBg}; color: ${tool.color}; border: 1px solid ${tool.color}33;"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  ${tool.icon}
                </svg>
              </div>

              <div class="flex items-center gap-1.5">
                ${tool.isNew ? `<span class="badge-new px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm" style="background-color: ${tool.color};">New!</span>` : ''}
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400">${tool.category}</span>
              </div>
            </div>

            <div>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white group-hover:underline decoration-2" style="text-decoration-color: ${tool.color};">
                ${tool.title}
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                ${tool.desc}
              </p>
            </div>
          </div>

          <div class="w-full pt-2 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-bold" style="color: ${tool.color};">
            <span>Launch Tool</span>
            <span class="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      `).join('');

      grid.querySelectorAll('[data-open-tool]').forEach(card => {
        card.addEventListener('click', () => {
          openToolWorkspace(card.getAttribute('data-open-tool'));
        });
      });
    }

    // =========================================================================
    // 5. WORKSPACE STUDIO & TOOL-SPECIFIC CONFIGURATIONS
    // =========================================================================
    function populateQuickToolDropdown() {
      const sel = document.getElementById('quickToolSelect');
      sel.innerHTML = TOOLS.map(t => `<option value="${t.id}">${t.title}${t.isNew ? ' (New!)' : ''}</option>`).join('');
      sel.addEventListener('change', () => {
        openToolWorkspace(sel.value);
      });
    }

    async function openToolWorkspace(toolId, keepFiles = false) {
      const tool = TOOLS.find(t => t.id === toolId) || TOOLS[0];
      state.activeToolId = tool.id;
      stopCameraStream();

      if (!keepFiles) {
        state.files = [];
      }
      document.getElementById('resultDownloadCard').classList.add('hidden');
      document.getElementById('directoryView').classList.add('hidden');
      document.getElementById('workspaceView').classList.remove('hidden');
      document.getElementById('quickToolSelect').value = tool.id;

      // Update Header & Color Accents
      const iconBox = document.getElementById('activeToolIconBox');
      iconBox.style.backgroundColor = tool.color;
      iconBox.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">${tool.icon}</svg>`;

      document.getElementById('activeToolTitle').textContent = tool.title;
      document.getElementById('activeToolDesc').textContent = tool.desc;
      document.getElementById('activeToolCategoryBadge').textContent = tool.category;

      const newBadge = document.getElementById('activeToolNewBadge');
      if (tool.isNew) {
        newBadge.classList.remove('hidden');
        newBadge.style.backgroundColor = tool.color;
      } else {
        newBadge.classList.add('hidden');
      }

      // Style buttons with the tool's distinguishing color
      const dropBadge = document.getElementById('dropZoneIconBadge');
      dropBadge.style.backgroundColor = tool.color;

      const sampleBtn = document.getElementById('loadSampleBtn');
      sampleBtn.style.borderColor = tool.color;
      sampleBtn.style.color = tool.color;
      sampleBtn.style.backgroundColor = tool.badgeBg;

      const runBtn = document.getElementById('runToolActionBtn');
      runBtn.style.backgroundColor = tool.color;
      document.getElementById('runToolActionBtnText').textContent = `${tool.title} Now`;

      const fileInput = document.getElementById('fileInput');
      fileInput.accept = tool.accept;
      fileInput.multiple = tool.multiple;
      document.getElementById('acceptedFormatsPill').textContent = tool.accept;

      document.getElementById('loadSampleBtnLabel').textContent =
        (tool.id === 'merge-pdf' || tool.id === 'compare-pdf') ? 'Load 2 Sample PDFs' : 'Load Sample File';

      renderToolSpecificOptions(tool);

      renderFileQueue();
      renderLivePreviewStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function loadSampleFilesForCurrentTool(silent = false) {
      const tool = TOOLS.find(t => t.id === state.activeToolId) || TOOLS[0];
      state.files = [];

      if (tool.id === 'merge-pdf' || tool.id === 'compare-pdf' || tool.id === 'rotate-pdf') {
        const s1 = await generateSamplePdfBytes('executive');
        const s2 = await generateSamplePdfBytes('appendix');
        state.files.push({
          id: 'sample_1',
          name: 'Q4_Global_Operations_Report_v1.pdf',
          size: s1.bytes.length,
          type: 'application/pdf',
          ext: 'pdf',
          bytes: s1.bytes,
          pageCount: s1.pageCount,
          extractedText: s1.extractedText,
          tables: s1.tables,
          pagesMeta: Array.from({ length: s1.pageCount }, (_, i) => ({ num: i + 1, rotation: 0, deleted: false }))
        });
        state.files.push({
          id: 'sample_2',
          name: 'Partner_Addendum_Schedule_v2.pdf',
          size: s2.bytes.length,
          type: 'application/pdf',
          ext: 'pdf',
          bytes: s2.bytes,
          pageCount: s2.pageCount,
          extractedText: s2.extractedText,
          tables: s2.tables,
          pagesMeta: Array.from({ length: s2.pageCount }, (_, i) => ({ num: i + 1, rotation: 0, deleted: false }))
        });
      } else if (tool.id === 'compress-image') {
        const img1 = createHighResSamplePhoto('High_Resolution_Sunset_Panorama.jpg', '#0284C7');
        state.files.push(img1);
      } else if (tool.id === 'jpg-to-pdf' || tool.id === 'scan-to-pdf') {
        // Generate two clean canvas sample images
        const img1 = createSyntheticDocumentImage('Scanned Commercial Invoice #INV-2026-089', '#0284C7');
        const img2 = createSyntheticDocumentImage('Signed Delivery Receipt #REC-8841', '#059669');
        state.files.push(img1, img2);
      } else {
        const s1 = await generateSamplePdfBytes('executive');
        let sampleName = 'Q4_Global_Operations_Report.pdf';
        if (tool.id === 'word-to-pdf') sampleName = 'Enterprise_Master_Agreement.docx';
        if (tool.id === 'powerpoint-to-pdf') sampleName = 'Q4_Board_Strategy_Deck.pptx';
        if (tool.id === 'excel-to-pdf') sampleName = 'Regional_Revenue_Ledger_2026.xlsx';
        if (tool.id === 'html-to-pdf') sampleName = 'Landing_Page_Template.html';

        state.files.push({
          id: 'sample_main',
          name: sampleName,
          size: s1.bytes.length,
          type: 'application/pdf',
          ext: sampleName.split('.').pop(),
          bytes: s1.bytes,
          pageCount: s1.pageCount,
          extractedText: s1.extractedText,
          tables: s1.tables,
          pagesMeta: Array.from({ length: s1.pageCount }, (_, i) => ({ num: i + 1, rotation: 0, deleted: false }))
        });
      }

      renderFileQueue();
      renderLivePreviewStage();
      if (!silent) {
        showToast(`Loaded sample file(s) for ${tool.title}`, tool.color);
      }
    }

    function createSyntheticDocumentImage(titleText, accentColor) {
      const c = document.createElement('canvas');
      c.width = 600;
      c.height = 780;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 780);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, 600, 70);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText(titleText, 30, 43);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText('PDFMaxx High-Resolution Document Capture', 30, 115);
      ctx.fillStyle = '#475569';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText('Date: October 22, 2026   |   Status: Verified Original', 30, 142);

      // Draw structured table rows
      const rows = [
        ['Item Description', 'Qty', 'Unit Price', 'Line Total'],
        ['Enterprise Cloud PDF License', '10', '$240.00', '$2,400.00'],
        ['AI OCR & Translation Add-On', '1', '$850.00', '$850.00'],
        ['ISO PDF/A Archival Storage', '5', '$120.00', '$600.00'],
        ['Total Balance Due', '', '', '$3,850.00']
      ];
      rows.forEach((r, idx) => {
        const y = 185 + idx * 42;
        ctx.fillStyle = idx === 0 ? '#F1F5F9' : (idx === 4 ? '#ECFDF5' : '#F8FAFC');
        ctx.fillRect(30, y, 540, 36);
        ctx.fillStyle = '#0F172A';
        ctx.font = (idx === 0 || idx === 4) ? 'bold 13px Inter, sans-serif' : '13px Inter, sans-serif';
        ctx.fillText(r[0], 42, y + 23);
        ctx.fillText(r[1], 310, y + 23);
        ctx.fillText(r[2], 385, y + 23);
        ctx.fillText(r[3], 475, y + 23);
      });

      const dataUrl = c.toDataURL('image/jpeg', 0.92);
      const binStr = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

      return {
        id: 'img_' + Math.random().toString(36).slice(2, 7),
        name: titleText.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.jpg',
        size: bytes.length,
        type: 'image/jpeg',
        ext: 'jpg',
        bytes,
        pageCount: 1,
        extractedText: `${titleText}\nEnterprise Cloud PDF License: $2,400.00\nAI OCR & Translation Add-On: $850.00\nISO PDF/A Archival Storage: $600.00\nTotal Balance Due: $3,850.00`,
        pagesMeta: [{ num: 1, rotation: 0, deleted: false }],
        imageUrl: dataUrl
      };
    }

    function createHighResSamplePhoto(titleText, accentColor) {
      const c = document.createElement('canvas');
      c.width = 1920;
      c.height = 1080;
      const ctx = c.getContext('2d');

      // Draw rich photo-style gradient
      const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.3, '#1E293B');
      grad.addColorStop(0.6, '#0369A1');
      grad.addColorStop(0.85, '#0284C7');
      grad.addColorStop(1, '#38BDF8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1920, 1080);

      // Draw artistic mountain peaks / landscape shapes
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, 1080);
      ctx.lineTo(250, 680);
      ctx.lineTo(600, 850);
      ctx.lineTo(950, 520);
      ctx.lineTo(1350, 780);
      ctx.lineTo(1700, 480);
      ctx.lineTo(1920, 720);
      ctx.lineTo(1920, 1080);
      ctx.closePath();
      ctx.fill();

      // Foreground layer
      ctx.fillStyle = '#090D16';
      ctx.beginPath();
      ctx.moveTo(0, 1080);
      ctx.lineTo(350, 820);
      ctx.lineTo(800, 950);
      ctx.lineTo(1250, 790);
      ctx.lineTo(1650, 910);
      ctx.lineTo(1920, 840);
      ctx.lineTo(1920, 1080);
      ctx.closePath();
      ctx.fill();

      // Sun glow
      const sunGrad = ctx.createRadialGradient(1550, 320, 20, 1550, 320, 220);
      sunGrad.addColorStop(0, '#FEF08A');
      sunGrad.addColorStop(0.4, '#F59E0B');
      sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(1550, 320, 220, 0, Math.PI * 2);
      ctx.fill();

      // Crisp typography & badges
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 54px Inter, sans-serif';
      ctx.fillText('PDFMaxx High-Res Photography Sample', 100, 200);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 28px Inter, sans-serif';
      ctx.fillText('Original 1080p Master (1920 × 1080 px) • Uncompressed Raw Source', 100, 255);

      // Detail card inside photo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(100, 320, 700, 230, 24);
      } else {
        ctx.rect(100, 320, 700, 230);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText('Intelligent Image Compression Test', 140, 380);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '20px Inter, sans-serif';
      ctx.fillText('• 100% Client-Side Canvas & WebP Processing', 140, 425);
      ctx.fillText('• Visually Lossless Fidelity Optimization', 140, 465);
      ctx.fillText('• High-Performance Resampling Pipeline', 140, 505);

      // Export as uncompressed maximum-quality JPEG so it demonstrates huge size reduction
      const dataUrl = c.toDataURL('image/jpeg', 0.98);
      const binStr = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

      return {
        id: 'img_sample_' + Math.random().toString(36).slice(2, 7),
        name: 'High_Resolution_Sunset_Panorama.jpg',
        size: bytes.length,
        type: 'image/jpeg',
        ext: 'jpg',
        bytes,
        pageCount: 1,
        extractedText: `[High-Resolution Sample Image: 1920×1080 px (${formatBytes(bytes.length)})]`,
        pagesMeta: [{ num: 1, rotation: 0, deleted: false }],
        imageUrl: dataUrl
      };
    }

    // Render the uploaded/loaded files queue with reorder & remove buttons
    function renderFileQueue() {
      const container = document.getElementById('fileQueueContainer');
      const list = document.getElementById('fileQueueList');
      const countEl = document.getElementById('fileQueueCount');
      const clearBtn = document.getElementById('clearFilesBtn');

      if (state.files.length === 0) {
        container.classList.add('hidden');
        clearBtn.classList.add('hidden');
        return;
      }

      container.classList.remove('hidden');
      clearBtn.classList.remove('hidden');
      const totalPages = state.files.reduce((acc, f) => acc + (f.pageCount || 1), 0);
      countEl.textContent = `${state.files.length} file${state.files.length > 1 ? 's' : ''} loaded (${totalPages} total page${totalPages > 1 ? 's' : ''})`;

      list.innerHTML = state.files.map((f, idx) => `
        <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800/80 border border-slate-200/80 dark:border-gray-700 text-xs">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-6 h-6 rounded-lg bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-200 font-mono font-bold flex items-center justify-center shrink-0">${idx + 1}</span>
            <div class="truncate">
              <p class="font-bold text-slate-800 dark:text-slate-100 truncate">${f.name}</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">${formatBytes(f.size)} • ${f.pageCount} page${f.pageCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            ${state.files.length > 1 ? `
              <button type="button" data-move-up="${idx}" class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300" title="Move Up">↑</button>
              <button type="button" data-move-down="${idx}" class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300" title="Move Down">↓</button>
            ` : ''}
            <button type="button" data-remove-file="${idx}" class="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600" title="Remove">✕</button>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('[data-move-up]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-move-up'), 10);
          if (i > 0) {
            const tmp = state.files[i - 1];
            state.files[i - 1] = state.files[i];
            state.files[i] = tmp;
            renderFileQueue();
            renderLivePreviewStage();
          }
        });
      });
      list.querySelectorAll('[data-move-down]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-move-down'), 10);
          if (i < state.files.length - 1) {
            const tmp = state.files[i + 1];
            state.files[i + 1] = state.files[i];
            state.files[i] = tmp;
            renderFileQueue();
            renderLivePreviewStage();
          }
        });
      });
      list.querySelectorAll('[data-remove-file]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-remove-file'), 10);
          state.files.splice(i, 1);
          renderFileQueue();
          renderLivePreviewStage();
        });
      });
    }

    // =========================================================================
    // 6. RENDER TOOL-SPECIFIC INTERACTIVE CONTROLS FOR ALL 31 TOOLS
    // =========================================================================
    function renderToolSpecificOptions(tool) {
      const box = document.getElementById('toolOptionsContainer');
      const sub = document.getElementById('toolConfigSubtitle');
      sub.textContent = `${tool.category} Settings`;

      switch (tool.id) {
        case 'merge-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2.5">
                <input id="optMergeBookmarks" type="checkbox" checked class="rounded text-rose-600" />
                <span class="font-semibold">Preserve Document Bookmarks &amp; TOC</span>
              </label>
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2.5">
                <input id="optMergeNormalize" type="checkbox" checked class="rounded text-rose-600" />
                <span class="font-semibold">Normalize Page Widths to A4/Letter</span>
              </label>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">Merged Document Title Metadata</label>
              <input id="optMergeTitle" type="text" value="Merged_PDFMaxx_Package" class="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700" />
            </div>
          `;
          break;

        case 'split-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Split Mode</label>
                <select id="optSplitMode" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="range">Extract Custom Page Range (into 1 PDF)</option>
                  <option value="zip_all">Split Every Page into Separate PDF Files (.ZIP)</option>
                  <option value="first">Extract First Page Only</option>
                  <option value="odd">Extract Odd Pages (1, 3, 5...)</option>
                  <option value="even">Extract Even Pages (2, 4, 6...)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Page Range / Numbers (e.g. 1-2 or 1,3)</label>
                <input id="optSplitRange" type="text" value="1-2" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
              </div>
            </div>
          `;
          break;

        case 'compress-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 cursor-pointer flex flex-col gap-1">
                <div class="flex items-center gap-2 font-bold text-emerald-600"><input type="radio" name="compressLevel" value="extreme" /> Extreme</div>
                <span class="text-[11px] text-slate-500">Less quality, highest compression (~68% smaller)</span>
              </label>
              <label class="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 cursor-pointer flex flex-col gap-1">
                <div class="flex items-center gap-2 font-bold text-emerald-600"><input type="radio" name="compressLevel" value="recommended" checked /> Recommended</div>
                <span class="text-[11px] text-slate-500">Good quality, strong compression (~45% smaller)</span>
              </label>
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 cursor-pointer flex flex-col gap-1">
                <div class="flex items-center gap-2 font-bold text-emerald-600"><input type="radio" name="compressLevel" value="less" /> Lossless Light</div>
                <span class="text-[11px] text-slate-500">High quality, stream cleanup (~22% smaller)</span>
              </label>
            </div>
          `;
          break;

        case 'compress-image':
          box.innerHTML = `
            <div class="space-y-4 text-xs">
              <!-- Mode Selection Cards -->
              <div>
                <label class="block font-semibold mb-2 text-slate-700 dark:text-slate-300">Compression Preset</label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label id="cardOptCompressBalanced" class="p-3 rounded-xl border-2 border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 cursor-pointer flex flex-col gap-1 transition-all">
                    <div class="flex items-center gap-2 font-bold text-sky-600 dark:text-sky-400">
                      <input type="radio" name="optImgCompressMode" value="balanced" checked class="accent-sky-600" />
                      Recommended (Smart)
                    </div>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">~82% quality, visually lossless, 75-88% smaller</span>
                  </label>
                  <label id="cardOptCompressHigh" class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 cursor-pointer flex flex-col gap-1 transition-all">
                    <div class="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                      <input type="radio" name="optImgCompressMode" value="high" class="accent-sky-600" />
                      High Quality
                    </div>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">~92% quality, full dimensions, 45-60% smaller</span>
                  </label>
                  <label id="cardOptCompressMax" class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 cursor-pointer flex flex-col gap-1 transition-all">
                    <div class="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                      <input type="radio" name="optImgCompressMode" value="max" class="accent-sky-600" />
                      Maximum Compression
                    </div>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400">~60% quality, max 1440px, 85-95% smaller</span>
                  </label>
                </div>
              </div>

              <!-- Format & Resolution Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block font-semibold mb-1">Output Format</label>
                  <select id="optImgFormat" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                    <option value="auto" selected>Auto (Smallest file with transparency support)</option>
                    <option value="webp">WebP (Modern Standard, Best Compression)</option>
                    <option value="jpeg">JPEG (Universal Compatibility)</option>
                    <option value="png">PNG (Lossless Optimized)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Max Resolution (Resize limit)</label>
                  <select id="optImgResize" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                    <option value="1920" selected>Full HD (Max 1920 px) — Recommended</option>
                    <option value="original">Keep Original Resolution (No resize)</option>
                    <option value="3840">4K Ultra HD (Max 3840 px)</option>
                    <option value="1280">HD (Max 1280 px)</option>
                    <option value="800">Compact / Web (Max 800 px)</option>
                  </select>
                </div>
              </div>

              <!-- Quality Slider (Adjustable for fine-tuning) -->
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/70 border border-slate-200 dark:border-gray-700/80 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="font-semibold text-slate-700 dark:text-slate-300">Fine-Tune Quality Level</label>
                  <span id="optImgQualityVal" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">82%</span>
                </div>
                <input id="optImgQualitySlider" type="range" min="10" max="100" value="82" class="w-full accent-sky-600 cursor-pointer" />
                <div class="flex justify-between text-[10px] text-slate-400">
                  <span>10% (Smallest file)</span>
                  <span>50%</span>
                  <span>82% (Sweet spot)</span>
                  <span>100% (Maximum visual fidelity)</span>
                </div>
              </div>
            </div>
          `;

          setTimeout(() => {
            const slider = document.getElementById('optImgQualitySlider');
            const qVal = document.getElementById('optImgQualityVal');
            const resizeSel = document.getElementById('optImgResize');
            const radios = document.querySelectorAll('input[name="optImgCompressMode"]');
            const cardBal = document.getElementById('cardOptCompressBalanced');
            const cardHigh = document.getElementById('cardOptCompressHigh');
            const cardMax = document.getElementById('cardOptCompressMax');

            function updateCardStyles(activeVal) {
              [
                { card: cardBal, val: 'balanced' },
                { card: cardHigh, val: 'high' },
                { card: cardMax, val: 'max' }
              ].forEach(item => {
                if (!item.card) return;
                const isSelected = item.val === activeVal;
                if (isSelected) {
                  item.card.className = 'p-3 rounded-xl border-2 border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 cursor-pointer flex flex-col gap-1 transition-all';
                  const title = item.card.querySelector('.font-bold');
                  if (title) title.className = 'flex items-center gap-2 font-bold text-sky-600 dark:text-sky-400';
                } else {
                  item.card.className = 'p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 cursor-pointer flex flex-col gap-1 transition-all';
                  const title = item.card.querySelector('.font-bold');
                  if (title) title.className = 'flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300';
                }
              });
            }

            if (slider && qVal) {
              slider.addEventListener('input', () => {
                qVal.textContent = slider.value + '%';
              });
            }

            radios.forEach(r => {
              r.addEventListener('change', () => {
                updateCardStyles(r.value);
                if (r.value === 'balanced') {
                  if (slider) { slider.value = '82'; qVal.textContent = '82%'; }
                  if (resizeSel) resizeSel.value = '1920';
                } else if (r.value === 'high') {
                  if (slider) { slider.value = '92'; qVal.textContent = '92%'; }
                  if (resizeSel) resizeSel.value = 'original';
                } else if (r.value === 'max') {
                  if (slider) { slider.value = '60'; qVal.textContent = '60%'; }
                  if (resizeSel) resizeSel.value = '1280';
                }
              });
            });
          }, 10);
          break;

        case 'pdf-to-word':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Output Word Format</label>
                <select id="optWordFormat" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="docx" selected>Microsoft Word OpenXML (.docx)</option>
                  <option value="doc">Word Rich HTML Document (.doc)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Reconstruction Mode</label>
                <select id="optWordLayout" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="exact">Maintain 100% Exact Visual Layout &amp; Tables</option>
                  <option value="flowing">Flowing Editable Paragraphs</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'pdf-to-powerpoint':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Slide Aspect Ratio</label>
                <select id="optPptRatio" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="16:9">Widescreen Presentation (16:9)</option>
                  <option value="4:3">Standard Deck (4:3)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Slide Theme Accent</label>
                <select id="optPptTheme" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="executive">Executive Slate &amp; Amber</option>
                  <option value="minimal">Clean White Minimal</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'pdf-to-excel':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Spreadsheet Output Format</label>
                <select id="optExcelFormat" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="xls">Microsoft Excel Workbook (.xls)</option>
                  <option value="csv">Comma-Separated Values (.csv)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Table Sheet Grouping</label>
                <select id="optExcelGrouping" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="single">Combine All Tables into Single Sheet</option>
                  <option value="perpage">Separate Worksheet per PDF Page</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'word-to-pdf':
        case 'powerpoint-to-pdf':
        case 'excel-to-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold mb-1">Page Orientation</label>
                  <select id="optOfficeOrient" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                    <option value="portrait">Portrait (Vertical)</option>
                    <option value="landscape" ${tool.id !== 'word-to-pdf' ? 'selected' : ''}>Landscape (Horizontal)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Page Size</label>
                  <select id="optOfficeSize" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                    <option value="letter">US Letter (8.5 × 11 in)</option>
                    <option value="a4">ISO A4 (210 × 297 mm)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block font-semibold mb-1">Editable Document Content to Render into PDF</label>
                <textarea id="optOfficeCustomText" rows="4" placeholder="Leave blank to convert your uploaded file's full content, or type custom text here..." class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono text-xs"></textarea>
              </div>
            </div>
          `;
          break;

        case 'edit-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div class="sm:col-span-2">
                  <label class="block font-semibold mb-1">Annotation Text to Add</label>
                  <input id="optEditText" type="text" value="APPROVED FOR RELEASE — OCT 2026" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-semibold" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Font Size (pt)</label>
                  <input id="optEditFontSize" type="number" value="16" min="8" max="48" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label class="block font-semibold mb-1">Annotation Color</label>
                  <input id="optEditColor" type="color" value="#7C3AED" class="w-full h-9 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 cursor-pointer p-1" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Shape Overlay</label>
                  <select id="optEditShape" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                    <option value="banner">Framed Callout Box</option>
                    <option value="highlight">Yellow Highlight Bar</option>
                    <option value="none">Text Only (No Shape)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Vertical Position</label>
                  <select id="optEditPos" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                    <option value="top">Top Margin (Y: 705)</option>
                    <option value="middle">Center Page (Y: 400)</option>
                    <option value="bottom">Bottom Stamp (Y: 85)</option>
                  </select>
                </div>
              </div>
            </div>
          `;
          break;

        case 'pdf-to-jpg':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Conversion Mode</label>
                <select id="optPdfToJpgMode" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="pages">Convert Every PDF Page to High-Res JPG</option>
                  <option value="extract">Extract Embedded Figures &amp; Charts</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Image Quality (DPI)</label>
                <select id="optPdfToJpgDpi" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="0.95">High Print Quality (300 DPI)</option>
                  <option value="0.85">Standard Web Quality (150 DPI)</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'jpg-to-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label class="block font-semibold mb-1">Page Orientation</label>
                <select id="optJpgOrient" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Page Margin</label>
                <select id="optJpgMargin" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="24">Small Margin (24 pt)</option>
                  <option value="0">No Margin (Full Bleed)</option>
                  <option value="48">Large Margin (48 pt)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Merge Behaviour</label>
                <select id="optJpgMerge" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="single">Merge all images in 1 PDF</option>
                  <option value="fit">Center &amp; Fit to A4</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'sign-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold mb-1">Signer Full Name</label>
                  <input id="optSignName" type="text" value="Aarav Krishnan" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-semibold" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Title / Reason</label>
                  <input id="optSignReason" type="text" value="Approved & Verified Dynamically" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700" />
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-semibold">Draw Your Wet-Ink Signature Below</label>
                  <button id="clearSigPadBtn" type="button" class="text-[11px] font-semibold text-indigo-600 hover:underline">Clear Pad</button>
                </div>
                <canvas id="signaturePadCanvas" width="460" height="110" class="sig-canvas w-full h-28 rounded-xl bg-white border-2 border-indigo-200 dark:border-indigo-800"></canvas>
              </div>
            </div>
          `;
          setTimeout(initSignaturePadCanvas, 30);
          break;

        case 'watermark':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Watermark Stamp Text</label>
                <input id="optWatermarkText" type="text" value="CONFIDENTIAL • DO NOT DISTRIBUTE" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-bold" />
              </div>
              <div>
                <label class="block font-semibold mb-1">Position &amp; Angle</label>
                <select id="optWatermarkPos" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="diagonal">Diagonal Across Center (45°)</option>
                  <option value="header">Top Header Stamp (Horizontal)</option>
                  <option value="footer">Bottom Footer Stamp (Horizontal)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Opacity (<span id="wmOpacityVal">30%</span>)</label>
                <input id="optWatermarkOpacity" type="range" min="10" max="90" value="30" class="w-full accent-purple-600" />
              </div>
              <div>
                <label class="block font-semibold mb-1">Stamp Color</label>
                <input id="optWatermarkColor" type="color" value="#E11D48" class="w-full h-9 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-1" />
              </div>
            </div>
          `;
          const opSlider = document.getElementById('optWatermarkOpacity');
          if (opSlider) {
            opSlider.addEventListener('input', () => {
              document.getElementById('wmOpacityVal').textContent = opSlider.value + '%';
              renderLivePreviewStage();
            });
          }
          break;

        case 'rotate-pdf':
          box.innerHTML = `
            <div class="flex flex-wrap items-center gap-2.5 text-xs">
              <button type="button" data-rot-deg="90" class="rot-quick-btn flex-1 py-2.5 px-3 rounded-xl font-bold bg-pink-50 dark:bg-pink-950/50 text-pink-600 border border-pink-200 dark:border-pink-800 hover:bg-pink-100">
                ↻ Rotate All 90° Clockwise
              </button>
              <button type="button" data-rot-deg="180" class="rot-quick-btn flex-1 py-2.5 px-3 rounded-xl font-bold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 hover:bg-slate-200">
                ↕ Rotate All 180°
              </button>
              <button type="button" data-rot-deg="270" class="rot-quick-btn flex-1 py-2.5 px-3 rounded-xl font-bold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 hover:bg-slate-200">
                ↺ Rotate All 90° CCW
              </button>
            </div>
          `;
          box.querySelectorAll('.rot-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const deg = parseInt(btn.getAttribute('data-rot-deg'), 10);
              state.files.forEach(f => {
                f.pagesMeta.forEach(p => { p.rotation = (p.rotation + deg) % 360; });
              });
              renderLivePreviewStage();
              showToast(`Rotated all pages by ${deg}°`, tool.color);
            });
          });
          break;

        case 'html-to-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Webpage URL to Convert</label>
                <input id="optHtmlUrl" type="url" value="https://omnipdf.example.com/docs/q4-architecture-report" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
              </div>
              <div>
                <label class="block font-semibold mb-1">Or Paste / Edit HTML Snippet Directly</label>
                <textarea id="optHtmlSource" rows="4" class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono text-xs">&lt;h1&gt;PDFMaxx Web Capture Report&lt;/h1&gt;
&lt;p&gt;Captured from live URL with full typography, tables, and responsive layout.&lt;/p&gt;
&lt;ul&gt;
  &lt;li&gt;Viewport: Desktop 1440px Widescreen&lt;/li&gt;
  &lt;li&gt;Vector Text &amp; Links Preserved&lt;/li&gt;
&lt;/ul&gt;</textarea>
              </div>
            </div>
          `;
          break;

        case 'unlock-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Known Document Password (if open-locked)</label>
                <input id="optUnlockPass" type="password" value="omni2026" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
              </div>
              <div>
                <label class="block font-semibold mb-1">Restriction Removal Mode</label>
                <select id="optUnlockMode" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="all">Unlock Printing, Copying &amp; Editing</option>
                  <option value="rebuild">Rebuild Clean Unencrypted XRef Stream</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'protect-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Set Open Password</label>
                <input id="optProtectPass1" type="password" value="Secure#2026" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
              </div>
              <div>
                <label class="block font-semibold mb-1">Encryption Standard</label>
                <select id="optProtectCipher" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="AES-256">256-bit AES High Security (ISO 32000-2)</option>
                  <option value="AES-128">128-bit AES Standard</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'organize-pdf':
          box.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs bg-orange-50/70 dark:bg-orange-950/30 p-3 rounded-xl border border-orange-200 dark:border-orange-800">
              <span>Use the interactive page cards in the <strong>Live Document Preview</strong> panel on the right to move, rotate, or delete individual pages, or click below to insert a blank separator page.</span>
              <button id="addBlankPageBtn" type="button" class="px-3 py-1.5 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 shrink-0">+ Add Blank Page</button>
            </div>
          `;
          const addBlankBtn = document.getElementById('addBlankPageBtn');
          if (addBlankBtn) {
            addBlankBtn.addEventListener('click', () => {
              if (state.files[0]) {
                const nextNum = state.files[0].pagesMeta.length + 1;
                state.files[0].pagesMeta.push({ num: nextNum, rotation: 0, deleted: false, isBlank: true });
                state.files[0].pageCount = state.files[0].pagesMeta.filter(p => !p.deleted).length;
                renderFileQueue();
                renderLivePreviewStage();
                showToast('Added blank page to document', tool.color);
              }
            });
          }
          break;

        case 'pdf-to-pdfa':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">ISO Archival Conformance Level</label>
                <select id="optPdfaLevel" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="PDF/A-2b">PDF/A-2b (ISO 19005-2 Recommended)</option>
                  <option value="PDF/A-1b">PDF/A-1b (Legacy Archival Visual Integrity)</option>
                  <option value="PDF/A-3b">PDF/A-3b (Allows Embedded XML/CSV)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Color Profile Intent</label>
                <select id="optPdfaProfile" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="sRGB">IEC 61966-2.1 Default sRGB</option>
                  <option value="CMYK">Coated FOGRA39 CMYK Print</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'repair-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                <input type="checkbox" checked class="rounded text-lime-600" />
                <span class="font-semibold">Rebuild Cross-Reference (xref) Table</span>
              </label>
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                <input type="checkbox" checked class="rounded text-lime-600" />
                <span class="font-semibold">Recover Orphaned Font &amp; Image Streams</span>
              </label>
            </div>
          `;
          break;

        case 'page-numbers':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label class="block font-semibold mb-1">Page Position</label>
                <select id="optPageNumPos" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Format Style</label>
                <select id="optPageNumFormat" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="page_of">Page {n} of {total}</option>
                  <option value="simple">{n}</option>
                  <option value="dash">— {n} —</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">First Number</label>
                <input id="optPageNumStart" type="number" value="1" min="1" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700" />
              </div>
            </div>
          `;
          break;

        case 'scan-to-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div class="flex flex-wrap items-center gap-2">
                <button id="startCameraScanBtn" type="button" class="px-3.5 py-2 rounded-xl font-bold bg-cyan-600 text-white hover:bg-cyan-700">
                  📷 Open Device Camera Scanner
                </button>
                <button id="captureSyntheticScanBtn" type="button" class="px-3.5 py-2 rounded-xl font-bold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700">
                  + Simulate Instant Mobile Page Scan
                </button>
              </div>
              <video id="cameraPreviewVideo" autoplay playsinline class="hidden w-full max-h-48 rounded-xl bg-black"></video>
              <div>
                <label class="block font-semibold mb-1">Scan Image Enhancement Filter</label>
                <select id="optScanFilter" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="bw">High-Contrast Magic B&amp;W Document</option>
                  <option value="color">Auto-Deskew Enhanced Color</option>
                </select>
              </div>
            </div>
          `;
          const simBtn = document.getElementById('captureSyntheticScanBtn');
          if (simBtn) {
            simBtn.addEventListener('click', () => {
              const pageNum = state.files.length + 1;
              const scanImg = createSyntheticDocumentImage(`Mobile Scan Page #${pageNum}`, '#0891B2');
              state.files.push(scanImg);
              renderFileQueue();
              renderLivePreviewStage();
              showToast(`Captured Mobile Scan Page #${pageNum}`, tool.color);
            });
          }
          const camBtn = document.getElementById('startCameraScanBtn');
          if (camBtn) {
            camBtn.addEventListener('click', async () => {
              const video = document.getElementById('cameraPreviewVideo');
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                  state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
                  video.srcObject = state.cameraStream;
                  video.classList.remove('hidden');
                  showToast('Camera active! Click "Simulate Instant Mobile Page Scan" or Process to capture.', tool.color);
                } catch (e) {
                  const scanImg = createSyntheticDocumentImage(`Camera Capture Page #${state.files.length + 1}`, '#0891B2');
                  state.files.push(scanImg);
                  renderFileQueue();
                  renderLivePreviewStage();
                  showToast('Camera permission unavailable in sandbox — added simulated high-res scan page!', tool.color);
                }
              }
            });
          }
          break;

        case 'ocr-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Document Recognition Language</label>
                <select id="optOcrLang" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="eng">English (Latin + Financial Tables)</option>
                  <option value="spa">Spanish (Español)</option>
                  <option value="fra">French (Français)</option>
                  <option value="deu">German (Deutsch)</option>
                  <option value="hin">Hindi (हिन्दी)</option>
                  <option value="tam">Tamil (தமிழ்)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">OCR Output Layer</label>
                <select id="optOcrLayer" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="searchable">Searchable PDF + Selectable Text Overlay</option>
                  <option value="text">Extract Pure Text + Confidence Report</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'compare-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Comparison Mode</label>
                <select id="optCompareMode" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="semantic">Semantic Text &amp; Clause Diff</option>
                  <option value="visual">Visual Overlay &amp; Table Delta</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Highlight Color Scheme</label>
                <select id="optCompareTheme" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="standard">Green Additions / Crimson Deletions</option>
                  <option value="legal">Legal Redline Strike-Through</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'redact-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                  <input id="optRedactEmail" type="checkbox" checked class="rounded text-rose-600" />
                  <span class="font-semibold">Redact Emails</span>
                </label>
                <label class="p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                  <input id="optRedactPhone" type="checkbox" checked class="rounded text-rose-600" />
                  <span class="font-semibold">Redact Phone #s</span>
                </label>
                <label class="p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                  <input id="optRedactIds" type="checkbox" checked class="rounded text-rose-600" />
                  <span class="font-semibold">Redact Account IDs</span>
                </label>
              </div>
              <div>
                <label class="block font-semibold mb-1">Custom Words or Phrases to Permanently Black-Out (comma separated)</label>
                <input id="optRedactCustom" type="text" value="ACC-99482-X, $14.8M, Dr. Elena Vance" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
              </div>
            </div>
          `;
          break;

        case 'crop-pdf':
          box.innerHTML = `
            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label class="block font-semibold mb-1">Top Margin (pt)</label>
                  <input id="optCropTop" type="number" value="36" min="0" max="200" class="crop-input w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Bottom (pt)</label>
                  <input id="optCropBottom" type="number" value="36" min="0" max="200" class="crop-input w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Left (pt)</label>
                  <input id="optCropLeft" type="number" value="32" min="0" max="200" class="crop-input w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
                </div>
                <div>
                  <label class="block font-semibold mb-1">Right (pt)</label>
                  <input id="optCropRight" type="number" value="32" min="0" max="200" class="crop-input w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono" />
                </div>
              </div>
              <div>
                <label class="block font-semibold mb-1">Apply Crop Box To</label>
                <select id="optCropScope" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="all">All Pages in Document</option>
                  <option value="first">First Page Only</option>
                </select>
              </div>
            </div>
          `;
          box.querySelectorAll('.crop-input').forEach(inp => {
            inp.addEventListener('input', renderLivePreviewStage);
          });
          break;

        case 'pdf-forms':
          renderPdfFormsBuilderUI(box);
          break;

        case 'ai-summarizer':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">AI Summary Format</label>
                <select id="optSummaryStyle" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="executive">Executive Key Takeaways &amp; Action Items</option>
                  <option value="structured">Section-by-Section Analytical Breakdown</option>
                  <option value="concise">1-Paragraph Abstract + Core Metrics</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Summary Depth</label>
                <select id="optSummaryLength" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="detailed">Detailed (Key Figures + Context)</option>
                  <option value="brief">High-Speed 5-Bullet Digest</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'translate-pdf':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold mb-1">Source Language</label>
                <select id="optTransSource" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="auto">Auto-Detect (English Detected)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1">Target Language</label>
                <select id="optTransTarget" class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="ja">Japanese (日本語)</option>
                </select>
              </div>
            </div>
          `;
          break;

        case 'pdf-to-markdown':
          box.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                <input id="optMdTables" type="checkbox" checked class="rounded text-slate-700" />
                <span class="font-semibold">Format Data Grids as Pipe Tables (| Col |)</span>
              </label>
              <label class="p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-2">
                <input id="optMdFrontmatter" type="checkbox" checked class="rounded text-slate-700" />
                <span class="font-semibold">Include YAML Metadata Frontmatter</span>
              </label>
            </div>
          `;
          break;

        default:
          box.innerHTML = `<p class="text-xs text-slate-500">Ready to process your file with optimal settings.</p>`;
      }
    }

    function renderPdfFormsBuilderUI(box) {
      box.innerHTML = `
        <div class="space-y-3 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-slate-700 dark:text-slate-200">Interactive Fillable AcroForm Fields (${state.formFields.length})</span>
            <div class="flex items-center gap-1.5">
              <button id="addTextFieldBtn" type="button" class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold">+ Text Field</button>
              <button id="addCheckFieldBtn" type="button" class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold">+ Checkbox</button>
            </div>
          </div>
          <div id="formFieldsList" class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            ${state.formFields.map((f, idx) => `
              <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                <div class="flex-1">
                  <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">${f.type}</span>
                  <span class="font-bold ml-1.5 text-slate-800 dark:text-slate-100">${f.label}</span>
                </div>
                <div class="w-44">
                  ${f.type === 'checkbox'
                    ? `<input type="checkbox" data-form-idx="${idx}" ${f.value ? 'checked' : ''} class="form-val-input rounded text-teal-600" />`
                    : f.type === 'select'
                      ? `<select data-form-idx="${idx}" class="form-val-input w-full px-2 py-1 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">${f.options.map(o => `<option value="${o}" ${o === f.value ? 'selected' : ''}>${o}</option>`).join('')}</select>`
                      : `<input type="text" data-form-idx="${idx}" value="${f.value}" class="form-val-input w-full px-2 py-1 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700" />`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      box.querySelectorAll('.form-val-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const i = parseInt(inp.getAttribute('data-form-idx'), 10);
          if (state.formFields[i]) {
            state.formFields[i].value = inp.type === 'checkbox' ? inp.checked : inp.value;
            renderLivePreviewStage();
          }
        });
      });

      const addTxt = document.getElementById('addTextFieldBtn');
      if (addTxt) {
        addTxt.addEventListener('click', () => {
          const n = state.formFields.length + 1;
          state.formFields.push({ id: 'f' + n, type: 'text', name: 'Custom_Field_' + n, label: 'Custom Note ' + n, value: 'Verified Entry' });
          renderPdfFormsBuilderUI(box);
          renderLivePreviewStage();
        });
      }
      const addChk = document.getElementById('addCheckFieldBtn');
      if (addChk) {
        addChk.addEventListener('click', () => {
          const n = state.formFields.length + 1;
          state.formFields.push({ id: 'f' + n, type: 'checkbox', name: 'Check_Item_' + n, label: 'Secondary Sign-Off ' + n, value: true });
          renderPdfFormsBuilderUI(box);
          renderLivePreviewStage();
        });
      }
    }

    function initSignaturePadCanvas() {
      const canvas = document.getElementById('signaturePadCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw a default realistic calligraphic signature so it works immediately out of the box
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(45, 72);
      ctx.bezierCurveTo(75, 22, 115, 88, 150, 48);
      ctx.bezierCurveTo(180, 20, 210, 82, 265, 55);
      ctx.bezierCurveTo(300, 40, 355, 68, 410, 46);
      ctx.stroke();
      state.signatureDataUrl = canvas.toDataURL('image/png');

      let drawing = false;
      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      const start = (e) => {
        e.preventDefault();
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };
      const move = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };
      const end = () => {
        if (!drawing) return;
        drawing = false;
        state.signatureDataUrl = canvas.toDataURL('image/png');
      };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', end);

      const clearBtn = document.getElementById('clearSigPadBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          state.signatureDataUrl = canvas.toDataURL('image/png');
        });
      }
    }

    // =========================================================================
    // 7. LIVE PREVIEW STAGE RENDERER (With Page Reordering, Rotation & Real Thumbnails)
    // =========================================================================
    function renderLivePreviewStage() {
      const stage = document.getElementById('livePreviewStage');
      const pill = document.getElementById('pageCountPill');
      const tool = TOOLS.find(t => t.id === state.activeToolId) || TOOLS[0];

      if (state.files.length === 0) {
        pill.textContent = '0 pages';
        stage.innerHTML = `
          <div class="space-y-2 py-8 text-slate-400">
            <p class="text-sm font-semibold">No files loaded yet</p>
            <p class="text-xs">Upload a file or click "Load Sample File" to inspect pages</p>
          </div>
        `;
        return;
      }

      const activePagesCount = state.files.reduce((sum, f) => sum + f.pagesMeta.filter(p => !p.deleted).length, 0);
      pill.textContent = `${activePagesCount} active page${activePagesCount !== 1 ? 's' : ''}`;

      // Real Side-by-Side Diff Preview for Compare PDF
      if (tool.id === 'compare-pdf' && state.files.length >= 2) {
        const f1Lines = (state.files[0].extractedText || '').split('\n').filter(Boolean).slice(0, 12);
        const f2Lines = (state.files[1].extractedText || '').split('\n').filter(Boolean).slice(0, 12);
        stage.innerHTML = `
          <div class="w-full space-y-3 text-left text-xs">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold text-[10px]">VERSION A (${state.files[0].pageCount} PGS)</span>
                <p class="font-bold mt-1 truncate">${state.files[0].name}</p>
                <pre class="text-[10px] text-slate-500 mt-1.5 whitespace-pre-wrap max-h-48 overflow-y-auto">${f1Lines.join('\n')}</pre>
              </div>
              <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">VERSION B (${state.files[1].pageCount} PGS)</span>
                <p class="font-bold mt-1 truncate">${state.files[1].name}</p>
                <pre class="text-[10px] text-slate-500 mt-1.5 whitespace-pre-wrap max-h-48 overflow-y-auto">${f2Lines.join('\n')}</pre>
              </div>
            </div>
          </div>
        `;
        return;
      }

      const cardsHtml = [];
      state.files.forEach((f, fIdx) => {
        f.pagesMeta.forEach((p, pIdx) => {
          if (p.deleted) return;
          const cropOverlay = tool.id === 'crop-pdf'
            ? `<div class="absolute inset-3 border-2 border-dashed border-pink-500 bg-pink-500/5 pointer-events-none flex items-center justify-center"><span class="px-1.5 py-0.5 rounded bg-pink-600 text-white text-[9px] font-mono">CropBox</span></div>`
            : '';
          const wmOverlay = tool.id === 'watermark'
            ? `<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="text-[10px] font-extrabold uppercase tracking-widest text-rose-600/50 -rotate-12 border border-rose-500/40 px-1.5 py-0.5 rounded">${(document.getElementById('optWatermarkText')?.value || 'CONFIDENTIAL').slice(0, 16)}</span></div>`
            : '';

          const pageLineSnippet = (f.pagesData && f.pagesData[p.num - 1] && f.pagesData[p.num - 1].plainText)
            ? f.pagesData[p.num - 1].plainText.slice(0, 90)
            : '';

          cardsHtml.push(`
            <div class="relative group bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-2.5 shadow-sm flex flex-col justify-between text-left transition-transform" style="transform: rotate(${p.rotation}deg);">
              ${cropOverlay}
              ${wmOverlay}
              <div>
                <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span class="font-bold text-slate-700 dark:text-slate-200">Page ${p.num}</span>
                  <span>${p.rotation ? p.rotation + '°' : ''}</span>
                </div>
                ${(p.thumbDataUrl || f.imageUrl)
                  ? `<img src="${p.thumbDataUrl || f.imageUrl}" alt="Page ${p.num}" class="w-full h-28 object-contain bg-white rounded border border-slate-100 dark:border-gray-800" />`
                  : pageLineSnippet
                    ? `<div class="h-28 p-1.5 rounded bg-slate-50 dark:bg-gray-800/70 text-[9px] font-mono text-slate-600 dark:text-slate-300 overflow-hidden leading-tight">${pageLineSnippet.replace(/</g, '&lt;')}</div>`
                    : `
                      <div class="space-y-1.5 py-2">
                        <div class="h-2.5 w-3/4 rounded" style="background-color: ${tool.color}40;"></div>
                        <div class="h-1.5 w-full rounded bg-slate-200 dark:bg-gray-700"></div>
                        <div class="h-1.5 w-5/6 rounded bg-slate-200 dark:bg-gray-700"></div>
                        <div class="h-1.5 w-4/6 rounded bg-slate-200 dark:bg-gray-700"></div>
                      </div>
                    `
                }
              </div>
              <div class="mt-2 pt-1.5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                <div class="flex items-center gap-0.5">
                  <button type="button" data-page-left="${fIdx}:${pIdx}" class="px-1 py-0.5 rounded bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 font-bold" title="Move Page Earlier">←</button>
                  <button type="button" data-page-right="${fIdx}:${pIdx}" class="px-1 py-0.5 rounded bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 font-bold" title="Move Page Later">→</button>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" data-page-rot="${fIdx}:${pIdx}" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 font-bold" title="Rotate Page 90°">↻</button>
                  ${activePagesCount > 1 ? `<button type="button" data-page-del="${fIdx}:${pIdx}" class="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold" title="Delete Page">✕</button>` : ''}
                </div>
              </div>
            </div>
          `);
        });
      });

      stage.innerHTML = `<div class="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">${cardsHtml.join('')}</div>`;

      stage.querySelectorAll('[data-page-left]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [fIdx, pIdx] = btn.getAttribute('data-page-left').split(':').map(Number);
          const arr = state.files[fIdx].pagesMeta;
          if (pIdx > 0) {
            const tmp = arr[pIdx - 1];
            arr[pIdx - 1] = arr[pIdx];
            arr[pIdx] = tmp;
            renderLivePreviewStage();
          }
        });
      });
      stage.querySelectorAll('[data-page-right]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [fIdx, pIdx] = btn.getAttribute('data-page-right').split(':').map(Number);
          const arr = state.files[fIdx].pagesMeta;
          if (pIdx < arr.length - 1) {
            const tmp = arr[pIdx + 1];
            arr[pIdx + 1] = arr[pIdx];
            arr[pIdx] = tmp;
            renderLivePreviewStage();
          }
        });
      });
      stage.querySelectorAll('[data-page-rot]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [fIdx, pIdx] = btn.getAttribute('data-page-rot').split(':').map(Number);
          state.files[fIdx].pagesMeta[pIdx].rotation = (state.files[fIdx].pagesMeta[pIdx].rotation + 90) % 360;
          renderLivePreviewStage();
        });
      });
      stage.querySelectorAll('[data-page-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [fIdx, pIdx] = btn.getAttribute('data-page-del').split(':').map(Number);
          state.files[fIdx].pagesMeta[pIdx].deleted = true;
          renderFileQueue();
          renderLivePreviewStage();
        });
      });
    }

    // Helper: Convert any image file (including PNG/JPG/WebP) or DataURL to normalized JPEG/PNG bytes for PDFLib
    async function normalizeImageForPdfLib(fileItem, applyBwFilter = false) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth || 600;
          c.height = img.naturalHeight || 800;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0);
          if (applyBwFilter) {
            const imgData = ctx.getImageData(0, 0, c.width, c.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const v = lum > 155 ? 255 : Math.max(0, Math.round(lum * 0.65));
              d[i] = d[i + 1] = d[i + 2] = v;
            }
            ctx.putImageData(imgData, 0, 0);
          }
          const dataUrl = c.toDataURL('image/jpeg', 0.90);
          const bin = atob(dataUrl.split(',')[1]);
          const out = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
          resolve({ bytes: out, width: c.width, height: c.height });
        };
        img.onerror = () => resolve({ bytes: fileItem.bytes, width: 600, height: 800 });
        if (fileItem.imageUrl) {
          img.src = fileItem.imageUrl;
        } else {
          const blob = new Blob([fileItem.bytes], { type: fileItem.type || 'image/jpeg' });
          img.src = URL.createObjectURL(blob);
        }
      });
    }

    // Helper: Parse hex color (#RRGGBB) into PDFLib rgb(r, g, b)
    function hexToPdfRgb(hexStr, rgbFn) {
      const h = String(hexStr || '#7C3AED').replace('#', '');
      const r = parseInt(h.slice(0, 2) || '7C', 16) / 255;
      const g = parseInt(h.slice(2, 4) || '3A', 16) / 255;
      const b = parseInt(h.slice(4, 6) || 'ED', 16) / 255;
      return rgbFn(isNaN(r) ? 0.5 : r, isNaN(g) ? 0.2 : g, isNaN(b) ? 0.9 : b);
    }

// =========================================================================
    // 9. THEME SWITCHER (WHITE MODE / DARK MODE) & EVENT LISTENERS
    // =========================================================================
    function applyTheme(mode) {
      state.theme = mode === 'dark' ? 'dark' : 'light';
      const root = document.documentElement;
      const sun = document.getElementById('themeIconSun');
      const moon = document.getElementById('themeIconMoon');
      const label = document.getElementById('themeToggleLabel');

      if (state.theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        sun.classList.remove('hidden');
        moon.classList.add('hidden');
        label.textContent = 'White Mode';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        sun.classList.add('hidden');
        moon.classList.remove('hidden');
        label.textContent = 'Dark Mode';
      }

      try {
        localStorage.setItem('omnipdf_theme', state.theme);
      } catch (e) {}
    }

    function initApp() {
      // Restore saved theme or default to light ("White Mode")
      let savedTheme = 'light';
      try {
        savedTheme = localStorage.getItem('omnipdf_theme') || 'light';
      } catch (e) {}
      applyTheme(savedTheme);

      renderCategoryPills();
      renderToolsGrid();
      populateQuickToolDropdown();

      // Theme toggle button
      document.getElementById('themeToggleBtn').addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
        showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'White'} Mode`, '#6366F1');
      });

      // Brand logo -> back to directory
      document.getElementById('brandHomeBtn').addEventListener('click', () => {
        stopCameraStream();
        document.getElementById('workspaceView').classList.add('hidden');
        document.getElementById('directoryView').classList.remove('hidden');
      });

      document.getElementById('backToGridBtn').addEventListener('click', () => {
        stopCameraStream();
        document.getElementById('workspaceView').classList.add('hidden');
        document.getElementById('directoryView').classList.remove('hidden');
      });

      // Top nav category shortcuts
      document.querySelectorAll('.nav-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          stopCameraStream();
          state.selectedCategory = btn.getAttribute('data-nav-cat');
          document.getElementById('workspaceView').classList.add('hidden');
          document.getElementById('directoryView').classList.remove('hidden');
          renderCategoryPills();
          renderToolsGrid();
        });
      });

      // Search input & keyboard shortcut
      const searchInput = document.getElementById('toolSearchInput');
      searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput.value;
        renderToolsGrid();
      });

      document.getElementById('clearSearchBtn').addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        renderToolsGrid();
        searchInput.focus();
      });

      document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        state.selectedCategory = 'all';
        renderCategoryPills();
        renderToolsGrid();
      });

      document.querySelectorAll('.quick-search-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const term = chip.getAttribute('data-quick-search');
          searchInput.value = term;
          state.searchQuery = term;
          state.selectedCategory = 'all';
          renderCategoryPills();
          renderToolsGrid();
        });
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          searchInput.focus();
        }
      });

      // Download Self-Contained Windows PDFMaxx.exe Native Desktop App from header
      const downloadExeBtn = document.getElementById('downloadExeBtn');
      if (downloadExeBtn) {
        downloadExeBtn.addEventListener('click', () => {
        const htmlBytes = new TextEncoder().encode('<!DOCTYPE html>\n' + document.documentElement.outerHTML);
        const prefixB64 = "TVqQAAMAAAAEAAAAAAAAALgAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAFBERk1heHggU3RhbmRhbG9uZSBXaW5kb3dzIERlc2t0b3AgQXBwDQokAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQRQAATAEDAAAAGGcAAAAAAAAAAOAAAwELAQ4AAAIAAAAGAAAAAAAAABAAAAAQAAAAIAAAAABAAAAQAAAAAgAABgAAAAEAAAAGAAAAAAAAAABAAAAAAgAAAAAAAAIAAAAAABAAABAAAAAAEAAAEAAAAAAAABAAAAAAAAAAAAAAAAAgAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgIAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC50ZXh0AAAAYgAAAAAQAAAAAgAAAAIAAAAAAAAAAAAAAAAAACAAAGAucmRhdGEAAAAEAAAAIAAAAAQAAAAEAAAAAAAAAAAAAAAAAABAAABALmRhdGEAAAAVAAAAADAAAAACAAAACAAAAAAAAAAAAAAAAAAAQAAAwAAAAAAAAAAAAAAAAAAAAABqAGiAAAAAagJqAGoAaAAAAEBoECFAAP8VYCBAAInGagBoADBAAGgFAAAAaBAwQABW/xVkIEAAVv8VaCBAAGoBagBoYCFAAGhQIUAAaEAhQABqAP8VeCBAAGoA/xVsIEAAwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAgAAAAAAAAAAAAAJAgAABgIAAAWCAAAAAAAAAAAAAAoCAAAHggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwIAAAwCAAANAgAADgIAAAAAAAAAAAAADwIAAAAAAAALAgAADAIAAA0CAAAOAgAAAAAAAAAAAAAPAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGtlcm5lbDMyLmRsbAAAAABzaGVsbDMyLmRsbAAAAAAAAABDcmVhdGVGaWxlQQAAAAAAV3JpdGVGaWxlAAAAAAAAAENsb3NlSGFuZGxlAAAAAABFeGl0UHJvY2VzcwAAAAAAU2hlbGxFeGVjdXRlQQAAAAAAAAAAAAAAAAAAAAAAUERGTWF4eF9EZXNrdG9wX1J1bnRpbWUuaHRtbAAAAAAAAAAAAAAAAAAAAAAAAAAAb3BlbgAAAAAAAAAAAAAAAG1zZWRnZS5leGUAAAAAAAAtLWFwcD1QREZNYXh4X0Rlc2t0b3BfUnVudGltZS5odG1sIC0td2luZG93LXNpemU9MTM4MCw4ODAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
        const bin = atob(prefixB64);
        const prefix = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) prefix[i] = bin.charCodeAt(i);

        const fileAlign = 0x200;
        const sectAlign = 0x1000;
        const rawLen = 0x10 + htmlBytes.length;
        const dataFileSize = (rawLen + fileAlign - 1) & ~(fileAlign - 1);
        const dataVirtSize = (rawLen + sectAlign - 1) & ~(sectAlign - 1);
        const sizeOfImage = 0x3000 + dataVirtSize;

        const dv = new DataView(prefix.buffer);
        // Patch nNumberOfBytesToWrite in .text at file offset 0x200 + 36
        dv.setUint32(0x200 + 36, htmlBytes.length, true);
        // Patch SizeOfImage in OptionalHeader (0x80 + 24 + 56 = 0xD0)
        dv.setUint32(0xD0, sizeOfImage, true);
        // Patch .data section VirtualSize (0x80 + 24 + 224 + 80 + 8 = 0x1D0) and SizeOfRawData (0x1D8)
        dv.setUint32(0x1D0, rawLen, true);
        dv.setUint32(0x1D8, dataFileSize, true);

        const exeBytes = new Uint8Array(0x800 + dataFileSize);
        exeBytes.set(prefix, 0);
        exeBytes.set(htmlBytes, 0x810);

        const blob = new Blob([exeBytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'PDFMaxx.exe';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showToast('Downloaded standalone PDFMaxx.exe Desktop App!', '#E11D48');
        });
      }

      // Export complete modular VS Code project folder structure (.zip) directly from the app or EXE
      const exportVsBtn = document.getElementById('exportVsCodeBtn');
      if (exportVsBtn) {
        exportVsBtn.addEventListener('click', async () => {
          if (!window.JSZip) {
            showToast('JSZip is loading, please try again in a moment.', '#E11D48');
            return;
          }
          showToast('Packaging modular VS Code project structure...', '#2563EB');
          const zip = new window.JSZip();
          const root = zip.folder('PDFMaxx');

          const scaffoldB64 = "eyJzcmMvaW5kZXguaHRtbCI6ICJQQ0ZFVDBOVVdWQkZJR2gwYld3K0NqeG9kRzFzSUd4aGJtYzlJbVZ1SWlCamJHRnpjejBpYkdsbmFIUWlQZ284YUdWaFpENEtJQ0E4YldWMFlTQmphR0Z5YzJWMFBTSlZWRVl0T0NJZ0x6NEtJQ0E4YldWMFlTQnVZVzFsUFNKMmFXVjNjRzl5ZENJZ1kyOXVkR1Z1ZEQwaWQybGtkR2c5WkdWMmFXTmxMWGRwWkhSb0xDQnBibWwwYVdGc0xYTmpZV3hsUFRFdU1DSWdMejRLSUNBOGRHbDBiR1UrVUVSR1RXRjRlQ0RpZ0pRZ1FXeHNMV2x1TFU5dVpTQlFSRVlnUTI5dWRtVnlkR1Z5TENCRlpHbDBiM0lnSmlCQlNTQlRkV2wwWlR3dmRHbDBiR1UrQ2lBZ1BITmpjbWx3ZENCemNtTTlJbWgwZEhCek9pOHZZMlJ1TG5SaGFXeDNhVzVrWTNOekxtTnZiUzh6TGpRdU1UY2lQand2YzJOeWFYQjBQZ29nSUR4elkzSnBjSFFnYzNKalBTSm9kSFJ3Y3pvdkwyTmtiaTVxYzJSbGJHbDJjaTV1WlhRdmJuQnRMM0JrWmkxc2FXSkFNUzR4Tnk0eEwyUnBjM1F2Y0dSbUxXeHBZaTV0YVc0dWFuTWlQand2YzJOeWFYQjBQZ29nSUR4elkzSnBjSFFnYzNKalBTSm9kSFJ3Y3pvdkwyTmtibXB6TG1Oc2IzVmtabXhoY21VdVkyOXRMMkZxWVhndmJHbGljeTl3WkdZdWFuTXZNeTR4TVM0eE56UXZjR1JtTG0xcGJpNXFjeUkrUEM5elkzSnBjSFErQ2lBZ1BITmpjbWx3ZENCemNtTTlJbWgwZEhCek9pOHZZMlJ1YW5NdVkyeHZkV1JtYkdGeVpTNWpiMjB2WVdwaGVDOXNhV0p6TDNCa1ppNXFjeTh6TGpFeExqRTNOQzl3WkdZdWQyOXlhMlZ5TG0xcGJpNXFjeUkrUEM5elkzSnBjSFErQ2lBZ1BITmpjbWx3ZENCemNtTTlJbWgwZEhCek9pOHZZMlJ1TG1welpHVnNhWFp5TG01bGRDOXVjRzB2YW5ONmFYQkFNeTR4TUM0eEwyUnBjM1F2YW5ONmFYQXViV2x1TG1weklqNDhMM05qY21sd2RENEtJQ0E4YzJOeWFYQjBJSE55WXowaWFIUjBjSE02THk5alpHNHVhbk5rWld4cGRuSXVibVYwTDI1d2JTOTRiSE40UURBdU1UZ3VOUzlrYVhOMEwzaHNjM2d1Wm5Wc2JDNXRhVzR1YW5NaVBqd3ZjMk55YVhCMFBnb2dJRHh6WTNKcGNIUWdjM0pqUFNKb2RIUndjem92TDJOa2JpNXFjMlJsYkdsMmNpNXVaWFF2Ym5CdEwzQndkSGhuWlc1cWMwQXpMakV5TGpBdlpHbHpkQzl3Y0hSNFoyVnVMbUoxYm1Sc1pTNXFjeUkrUEM5elkzSnBjSFErQ2lBZ1BITmpjbWx3ZENCemNtTTlJbWgwZEhCek9pOHZZMlJ1TG1welpHVnNhWFp5TG01bGRDOXVjRzB2ZEdWemMyVnlZV04wTG1welFEVXZaR2x6ZEM5MFpYTnpaWEpoWTNRdWJXbHVMbXB6SWo0OEwzTmpjbWx3ZEQ0S0lDQThjMk55YVhCMFBnb2dJQ0FnYVdZZ0tIZHBibVJ2ZHk1d1pHWnFjMHhwWWlrZ2V3b2dJQ0FnSUNCM2FXNWtiM2N1Y0dSbWFuTk1hV0l1UjJ4dlltRnNWMjl5YTJWeVQzQjBhVzl1Y3k1M2IzSnJaWEpUY21NZ1BTQW5hSFIwY0hNNkx5OWpaRzVxY3k1amJHOTFaR1pzWVhKbExtTnZiUzloYW1GNEwyeHBZbk12Y0dSbUxtcHpMek11TVRFdU1UYzBMM0JrWmk1M2IzSnJaWEl1YldsdUxtcHpKenNLSUNBZ0lIMEtJQ0E4TDNOamNtbHdkRDRLSUNBOGJHbHVheUJ5Wld3OUluQnlaV052Ym01bFkzUWlJR2h5WldZOUltaDBkSEJ6T2k4dlptOXVkSE11WjI5dloyeGxZWEJwY3k1amIyMGlQZ29nSUR4c2FXNXJJSEpsYkQwaWNISmxZMjl1Ym1WamRDSWdhSEpsWmowaWFIUjBjSE02THk5bWIyNTBjeTVuYzNSaGRHbGpMbU52YlNJZ1kzSnZjM052Y21sbmFXNCtDaUFnUEd4cGJtc2dhSEpsWmowaWFIUjBjSE02THk5bWIyNTBjeTVuYjI5bmJHVmhjR2x6TG1OdmJTOWpjM015UDJaaGJXbHNlVDFKYm5SbGNqcDNaMmgwUURRd01EczFNREE3TmpBd096Y3dNRHM0TURBbVptRnRhV3g1UFVwbGRFSnlZV2x1Y3l0TmIyNXZPbmRuYUhSQU5EQXdPelV3TURzMk1EQW1aR2x6Y0d4aGVUMXpkMkZ3SWlCeVpXdzlJbk4wZVd4bGMyaGxaWFFpUGdvZ0lEeHpZM0pwY0hRK0NpQWdJQ0IwWVdsc2QybHVaQzVqYjI1bWFXY2dQU0I3Q2lBZ0lDQWdJR1JoY210TmIyUmxPaUFuWTJ4aGMzTW5MQW9nSUNBZ0lDQjBhR1Z0WlRvZ2V3b2dJQ0FnSUNBZ0lHVjRkR1Z1WkRvZ2V3b2dJQ0FnSUNBZ0lDQWdabTl1ZEVaaGJXbHNlVG9nZXdvZ0lDQWdJQ0FnSUNBZ0lDQnpZVzV6T2lCYkowbHVkR1Z5Snl3Z0ozTjVjM1JsYlMxMWFTY3NJQ2N0WVhCd2JHVXRjM2x6ZEdWdEp5d2dKM05oYm5NdGMyVnlhV1luWFN3S0lDQWdJQ0FnSUNBZ0lDQWdiVzl1YnpvZ1d5ZEtaWFJDY21GcGJuTWdUVzl1Ynljc0lDZHRiMjV2YzNCaFkyVW5YU3dLSUNBZ0lDQWdJQ0FnSUgwS0lDQWdJQ0FnSUNCOUNpQWdJQ0FnSUgwS0lDQWdJSDA3Q2lBZ1BDOXpZM0pwY0hRK0NpQWdJQ0E4YkdsdWF5QnlaV3c5SW5OMGVXeGxjMmhsWlhRaUlHaHlaV1k5SW1OemN5OXpkSGxzWlhNdVkzTnpJaUF2UGdvS1BDOW9aV0ZrUGdvOFltOWtlU0JqYkdGemN6MGliV2x1TFdndGMyTnlaV1Z1SUdac1pYZ2dabXhsZUMxamIyd2djMlZzWldOMGFXOXVPbUpuTFhKdmMyVXROVEF3SUhObGJHVmpkR2x2YmpwMFpYaDBMWGRvYVhSbElqNEtDaUFnUENFdExTQlViM0FnVG1GMmFXZGhkR2x2YmlCSVpXRmtaWElnTFMwK0NpQWdQR2hsWVdSbGNpQmpiR0Z6Y3owaWMzUnBZMnQ1SUhSdmNDMHdJSG90TkRBZ1ltRmphMlJ5YjNBdFlteDFjaTF0WkNCaVp5MTNhR2wwWlM4NU1DQmtZWEpyT21KbkxXZHlZWGt0T1RBd0x6a3dJR0p2Y21SbGNpMWlJR0p2Y21SbGNpMXpiR0YwWlMweU1EQWdaR0Z5YXpwaWIzSmtaWEl0WjNKaGVTMDRNREFnZEhKaGJuTnBkR2x2YmkxamIyeHZjbk1pUGdvZ0lDQWdQR1JwZGlCamJHRnpjejBpYldGNExYY3ROM2hzSUcxNExXRjFkRzhnY0hndE5DQnpiVHB3ZUMwMklHeG5PbkI0TFRnZ2FDMHhOaUJtYkdWNElHbDBaVzF6TFdObGJuUmxjaUJxZFhOMGFXWjVMV0psZEhkbFpXNGdaMkZ3TFRNaVBnb2dJQ0FnSUNBOElTMHRJRUp5WVc1a0lFeHZaMjhnTFMwK0NpQWdJQ0FnSUR4aWRYUjBiMjRnYVdROUltSnlZVzVrU0c5dFpVSjBiaUlnZEhsd1pUMGlZblYwZEc5dUlpQmpiR0Z6Y3owaVpteGxlQ0JwZEdWdGN5MWpaVzUwWlhJZ1oyRndMVE1nZEdWNGRDMXNaV1owSUdkeWIzVndJR1p2WTNWek9tOTFkR3hwYm1VdGJtOXVaU0krQ2lBZ0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaWR5MHhNQ0JvTFRFd0lISnZkVzVrWldRdGVHd2dZbWN0WjNKaFpHbGxiblF0ZEc4dFluSWdabkp2YlMxeWIzTmxMVFV3TUNCMmFXRXRjbVZrTFRVd01DQjBieTF2Y21GdVoyVXROVEF3SUdac1pYZ2dhWFJsYlhNdFkyVnVkR1Z5SUdwMWMzUnBabmt0WTJWdWRHVnlJSFJsZUhRdGQyaHBkR1VnYzJoaFpHOTNMVzFrSUhOb1lXUnZkeTF5YjNObExUVXdNQzh5TUNCbmNtOTFjQzFvYjNabGNqcHpZMkZzWlMweE1EVWdkSEpoYm5OcGRHbHZiaTEwY21GdWMyWnZjbTBpUGdvZ0lDQWdJQ0FnSUNBZ1BITjJaeUJqYkdGemN6MGlkeTAySUdndE5pSWdabWxzYkQwaWJtOXVaU0lnYzNSeWIydGxQU0pqZFhKeVpXNTBRMjlzYjNJaUlITjBjbTlyWlMxM2FXUjBhRDBpTWk0eUlpQjJhV1YzUW05NFBTSXdJREFnTWpRZ01qUWlQZ29nSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0J6ZEhKdmEyVXRiR2x1WldOaGNEMGljbTkxYm1RaUlITjBjbTlyWlMxc2FXNWxhbTlwYmowaWNtOTFibVFpSUdROUlrMDVJREV5YURadExUWWdOR2cyYlRJZ05VZzNZVElnTWlBd0lEQXhMVEl0TWxZMVlUSWdNaUF3SURBeE1pMHlhRFV1TlRnMllURWdNU0F3SURBeExqY3dOeTR5T1ROc05TNDBNVFFnTlM0ME1UUmhNU0F4SURBZ01ERXVNamt6TGpjd04xWXhPV0V5SURJZ01DQXdNUzB5SURKNklpOCtDaUFnSUNBZ0lDQWdJQ0E4TDNOMlp6NEtJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBOFpHbDJQZ29nSUNBZ0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaVpteGxlQ0JwZEdWdGN5MWpaVzUwWlhJZ1oyRndMVElpUGdvZ0lDQWdJQ0FnSUNBZ0lDQThjM0JoYmlCamJHRnpjejBpWm05dWRDMWxlSFJ5WVdKdmJHUWdkR1Y0ZEMxc1p5QjBjbUZqYTJsdVp5MTBhV2RvZENCMFpYaDBMWE5zWVhSbExUa3dNQ0JrWVhKck9uUmxlSFF0ZDJocGRHVWlQbEJFUmp4emNHRnVJR05zWVhOelBTSjBaWGgwTFhKdmMyVXROakF3SUdSaGNtczZkR1Y0ZEMxeWIzTmxMVFV3TUNJK1RXRjRlRHd2YzNCaGJqNDhMM053WVc0K0NpQWdJQ0FnSUNBZ0lDQWdJRHh6Y0dGdUlHTnNZWE56UFNKb2FXUmtaVzRnYzIwNmFXNXNhVzVsTFdac1pYZ2dhWFJsYlhNdFkyVnVkR1Z5SUhCNExUSWdjSGt0TUM0MUlISnZkVzVrWldRdFpuVnNiQ0IwWlhoMExWc3hNWEI0WFNCbWIyNTBMWE5sYldsaWIyeGtJR0puTFhKdmMyVXROVEFnWkdGeWF6cGlaeTF5YjNObExUazFNQzgzTUNCMFpYaDBMWEp2YzJVdE5qQXdJR1JoY21zNmRHVjRkQzF5YjNObExUUXdNQ0JpYjNKa1pYSWdZbTl5WkdWeUxYSnZjMlV0TWpBd0lHUmhjbXM2WW05eVpHVnlMWEp2YzJVdE9EQXdMell3SWo0ek1TQlViMjlzY3p3dmMzQmhiajRLSUNBZ0lDQWdJQ0FnSUR3dlpHbDJQZ29nSUNBZ0lDQWdJQ0FnUEhBZ1kyeGhjM005SW5SbGVIUXRlSE1nZEdWNGRDMXpiR0YwWlMwMU1EQWdaR0Z5YXpwMFpYaDBMWE5zWVhSbExUUXdNQ0JvYVdSa1pXNGdjMjA2WW14dlkyc2lQakV3TUNVZ1EyeHBaVzUwTFZOcFpHVWdRMjl1ZG1WeWMybHZiaXdnUldScGRHbHVaeUFtWVcxd095QkJTU0JUZFdsMFpUd3ZjRDRLSUNBZ0lDQWdJQ0E4TDJScGRqNEtJQ0FnSUNBZ1BDOWlkWFIwYjI0K0Nnb2dJQ0FnSUNBOElTMHRJRkYxYVdOcklFTmhkR1ZuYjNKNUlGTm9iM0owWTNWMGN5QW9SR1Z6YTNSdmNDa2dMUzArQ2lBZ0lDQWdJRHh1WVhZZ1kyeGhjM005SW1ocFpHUmxiaUI0YkRwbWJHVjRJR2wwWlcxekxXTmxiblJsY2lCbllYQXRNU0krQ2lBZ0lDQWdJQ0FnUEdKMWRIUnZiaUIwZVhCbFBTSmlkWFIwYjI0aUlHUmhkR0V0Ym1GMkxXTmhkRDBpWVd4c0lpQmpiR0Z6Y3owaWJtRjJMV05oZEMxaWRHNGdjSGd0TXlCd2VTMHhMalVnY205MWJtUmxaQzFzWnlCMFpYaDBMWGh6SUdadmJuUXRjMlZ0YVdKdmJHUWdkR1Y0ZEMxemJHRjBaUzAzTURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRJd01DQm9iM1psY2pwaVp5MXpiR0YwWlMweE1EQWdaR0Z5YXpwb2IzWmxjanBpWnkxbmNtRjVMVGd3TUNCMGNtRnVjMmwwYVc5dUxXTnZiRzl5Y3lJK1FXeHNJRE14SUZSdmIyeHpQQzlpZFhSMGIyNCtDaUFnSUNBZ0lDQWdQR0oxZEhSdmJpQjBlWEJsUFNKaWRYUjBiMjRpSUdSaGRHRXRibUYyTFdOaGREMGlUM0puWVc1cGVtVWlJR05zWVhOelBTSnVZWFl0WTJGMExXSjBiaUJ3ZUMweklIQjVMVEV1TlNCeWIzVnVaR1ZrTFd4bklIUmxlSFF0ZUhNZ1ptOXVkQzF6WlcxcFltOXNaQ0IwWlhoMExYTnNZWFJsTFRZd01DQmtZWEpyT25SbGVIUXRjMnhoZEdVdE16QXdJR2h2ZG1WeU9tSm5MWE5zWVhSbExURXdNQ0JrWVhKck9taHZkbVZ5T21KbkxXZHlZWGt0T0RBd0lIUnlZVzV6YVhScGIyNHRZMjlzYjNKeklqNVBjbWRoYm1sNlpUd3ZZblYwZEc5dVBnb2dJQ0FnSUNBZ0lEeGlkWFIwYjI0Z2RIbHdaVDBpWW5WMGRHOXVJaUJrWVhSaExXNWhkaTFqWVhROUlrTnZiblpsY25RZ1puSnZiU0JRUkVZaUlHTnNZWE56UFNKdVlYWXRZMkYwTFdKMGJpQndlQzB6SUhCNUxURXVOU0J5YjNWdVpHVmtMV3huSUhSbGVIUXRlSE1nWm05dWRDMXpaVzFwWW05c1pDQjBaWGgwTFhOc1lYUmxMVFl3TUNCa1lYSnJPblJsZUhRdGMyeGhkR1V0TXpBd0lHaHZkbVZ5T21KbkxYTnNZWFJsTFRFd01DQmtZWEpyT21odmRtVnlPbUpuTFdkeVlYa3RPREF3SUhSeVlXNXphWFJwYjI0dFkyOXNiM0p6SWo1RGIyNTJaWEowSUZCRVJqd3ZZblYwZEc5dVBnb2dJQ0FnSUNBZ0lEeGlkWFIwYjI0Z2RIbHdaVDBpWW5WMGRHOXVJaUJrWVhSaExXNWhkaTFqWVhROUlrVmthWFFnSmlCQmJtNXZkR0YwWlNJZ1kyeGhjM005SW01aGRpMWpZWFF0WW5SdUlIQjRMVE1nY0hrdE1TNDFJSEp2ZFc1a1pXUXRiR2NnZEdWNGRDMTRjeUJtYjI1MExYTmxiV2xpYjJ4a0lIUmxlSFF0YzJ4aGRHVXROakF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzB6TURBZ2FHOTJaWEk2WW1jdGMyeGhkR1V0TVRBd0lHUmhjbXM2YUc5MlpYSTZZbWN0WjNKaGVTMDRNREFnZEhKaGJuTnBkR2x2YmkxamIyeHZjbk1pUGtWa2FYUWdKbUZ0Y0RzZ1UybG5iand2WW5WMGRHOXVQZ29nSUNBZ0lDQWdJRHhpZFhSMGIyNGdkSGx3WlQwaVluVjBkRzl1SWlCa1lYUmhMVzVoZGkxallYUTlJa0ZKSUNZZ1UyMWhjblFpSUdOc1lYTnpQU0p1WVhZdFkyRjBMV0owYmlCd2VDMHpJSEI1TFRFdU5TQnliM1Z1WkdWa0xXeG5JSFJsZUhRdGVITWdabTl1ZEMxelpXMXBZbTlzWkNCMFpYaDBMWFpwYjJ4bGRDMDJNREFnWkdGeWF6cDBaWGgwTFhacGIyeGxkQzAwTURBZ2FHOTJaWEk2WW1jdGRtbHZiR1YwTFRVd0lHUmhjbXM2YUc5MlpYSTZZbWN0ZG1sdmJHVjBMVGsxTUM4MU1DQjBjbUZ1YzJsMGFXOXVMV052Ykc5eWN5Qm1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQm5ZWEF0TVNJK0NpQWdJQ0FnSUNBZ0lDQThjM0JoYmo1QlNTQW1ZVzF3T3lCT1pYYzhMM053WVc0K0NpQWdJQ0FnSUNBZ0lDQThjM0JoYmlCamJHRnpjejBpZHkweExqVWdhQzB4TGpVZ2NtOTFibVJsWkMxbWRXeHNJR0puTFhacGIyeGxkQzAxTURBaVBqd3ZjM0JoYmo0S0lDQWdJQ0FnSUNBOEwySjFkSFJ2Ymo0S0lDQWdJQ0FnUEM5dVlYWStDZ29nSUNBZ0lDQThJUzB0SUZKcFoyaDBJRU52Ym5SeWIyeHpPaUJIWlc1bGNtRjBaU0JUWVcxd2JHVWdVRVJHSUNzZ1YyaHBkR1V2UkdGeWF5Qk5iMlJsSUZSdloyZHNaU0F0TFQ0S0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaVpteGxlQ0JwZEdWdGN5MWpaVzUwWlhJZ1oyRndMVEl1TlNJK0NpQWdJQ0FnSUNBZ1BHSjFkSFJ2YmlCcFpEMGlaRzkzYm14dllXUkZlR1ZDZEc0aUlIUjVjR1U5SW1KMWRIUnZiaUlnWTJ4aGMzTTlJbWx1YkdsdVpTMW1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQm5ZWEF0TVM0MUlIQjRMVE1nY0hrdE1pQnliM1Z1WkdWa0xYaHNJSFJsZUhRdGVITWdabTl1ZEMxaWIyeGtJR0puTFhKdmMyVXROakF3SUhSbGVIUXRkMmhwZEdVZ2FHOTJaWEk2WW1jdGNtOXpaUzAzTURBZ2MyaGhaRzkzTFhOdElIUnlZVzV6YVhScGIyNHRZMjlzYjNKeklpQjBhWFJzWlQwaVJHOTNibXh2WVdRZ2MzUmhibVJoYkc5dVpTQlhhVzVrYjNkeklGQkVSazFoZUhndVpYaGxJR1Y0WldOMWRHRmliR1VpUGdvZ0lDQWdJQ0FnSUNBZ1BITjJaeUJqYkdGemN6MGlkeTAwSUdndE5DSWdabWxzYkQwaWJtOXVaU0lnYzNSeWIydGxQU0pqZFhKeVpXNTBRMjlzYjNJaUlITjBjbTlyWlMxM2FXUjBhRDBpTWk0eUlpQjJhV1YzUW05NFBTSXdJREFnTWpRZ01qUWlQZ29nSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0J6ZEhKdmEyVXRiR2x1WldOaGNEMGljbTkxYm1RaUlITjBjbTlyWlMxc2FXNWxhbTlwYmowaWNtOTFibVFpSUdROUlrMDVMamMxSURFM1REa2dNakJzTFRFZ01XZzRiQzB4TFRFdExqYzFMVE5OTXlBeE0yZ3hPRTAxSURFM2FERTBZVElnTWlBd0lEQXdNaTB5VmpWaE1pQXlJREFnTURBdE1pMHlTRFZoTWlBeUlEQWdNREF0TWlBeWRqRXdZVElnTWlBd0lEQXdNaUF5ZWlJdlBnb2dJQ0FnSUNBZ0lDQWdQQzl6ZG1jK0NpQWdJQ0FnSUNBZ0lDQThjM0JoYmo1RWIzZHViRzloWkNCUVJFWk5ZWGg0TG1WNFpUd3ZjM0JoYmo0S0lDQWdJQ0FnSUNBOEwySjFkSFJ2Ymo0S0NpQWdJQ0FnSUNBZ1BHSjFkSFJ2YmlCcFpEMGlaWGh3YjNKMFZuTkRiMlJsUW5SdUlpQjBlWEJsUFNKaWRYUjBiMjRpSUdOc1lYTnpQU0pwYm14cGJtVXRabXhsZUNCcGRHVnRjeTFqWlc1MFpYSWdaMkZ3TFRFdU5TQndlQzB6SUhCNUxUSWdjbTkxYm1SbFpDMTRiQ0IwWlhoMExYaHpJR1p2Ym5RdFltOXNaQ0JpWnkxaWJIVmxMVFl3TUNCMFpYaDBMWGRvYVhSbElHaHZkbVZ5T21KbkxXSnNkV1V0TnpBd0lITm9ZV1J2ZHkxemJTQjBjbUZ1YzJsMGFXOXVMV052Ykc5eWN5SWdkR2wwYkdVOUlrVjRjRzl5ZENCdGIyUjFiR0Z5SUZaVElFTnZaR1VnY0hKdmFtVmpkQ0JtYjJ4a1pYSWdjM1J5ZFdOMGRYSmxJQ2d1ZW1sd0tTQjNhWFJvSUhOeVl5OHNJQzUyYzJOdlpHVXZMQ0JrWlhOcmRHOXdMeXdnWVc1a0lGQkVSazFoZUhndVpYaGxJajRLSUNBZ0lDQWdJQ0FnSUR4emRtY2dZMnhoYzNNOUluY3ROQ0JvTFRRaUlHWnBiR3c5SW01dmJtVWlJSE4wY205clpUMGlZM1Z5Y21WdWRFTnZiRzl5SWlCemRISnZhMlV0ZDJsa2RHZzlJakl1TWlJZ2RtbGxkMEp2ZUQwaU1DQXdJREkwSURJMElqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2djM1J5YjJ0bExXeHBibVZqWVhBOUluSnZkVzVrSWlCemRISnZhMlV0YkdsdVpXcHZhVzQ5SW5KdmRXNWtJaUJrUFNKTk1UQWdNakJzTkMweE5tMDBJRFJzTkNBMExUUWdORTAySURFMmJDMDBMVFFnTkMwMElpOCtDaUFnSUNBZ0lDQWdJQ0E4TDNOMlp6NEtJQ0FnSUNBZ0lDQWdJRHh6Y0dGdUlHTnNZWE56UFNKb2FXUmtaVzRnYzIwNmFXNXNhVzVsSWo1V1V5QkRiMlJsSUZCeWIycGxZM1E4TDNOd1lXNCtDaUFnSUNBZ0lDQWdQQzlpZFhSMGIyNCtDZ29nSUNBZ0lDQWdJRHhpZFhSMGIyNGdhV1E5SW1SdmQyNXNiMkZrUkdWdGIxQmtaa0owYmlJZ2RIbHdaVDBpWW5WMGRHOXVJaUJqYkdGemN6MGlhVzVzYVc1bExXWnNaWGdnYVhSbGJYTXRZMlZ1ZEdWeUlHZGhjQzB4TGpVZ2NIZ3RNeUJ3ZVMweUlISnZkVzVrWldRdGVHd2dkR1Y0ZEMxNGN5Qm1iMjUwTFhObGJXbGliMnhrSUdKbkxYTnNZWFJsTFRFd01DQmtZWEpyT21KbkxXZHlZWGt0T0RBd0lIUmxlSFF0YzJ4aGRHVXROekF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzB5TURBZ2FHOTJaWEk2WW1jdGMyeGhkR1V0TWpBd0lHUmhjbXM2YUc5MlpYSTZZbWN0WjNKaGVTMDNNREFnWW05eVpHVnlJR0p2Y21SbGNpMXpiR0YwWlMweU1EQXZPREFnWkdGeWF6cGliM0prWlhJdFozSmhlUzAzTURBZ2RISmhibk5wZEdsdmJpMWpiMnh2Y25NaUlIUnBkR3hsUFNKRWIzZHViRzloWkNCaElISmxZV1I1TFhSdkxYVnpaU0J0ZFd4MGFTMXdZV2RsSUhSbGMzUWdVRVJHSUhSdklIUnllU0IzYVhSb0lHRnVlU0IwYjI5c0lqNEtJQ0FnSUNBZ0lDQWdJRHh6ZG1jZ1kyeGhjM005SW5jdE5DQm9MVFFnZEdWNGRDMXliM05sTFRVd01DSWdabWxzYkQwaWJtOXVaU0lnYzNSeWIydGxQU0pqZFhKeVpXNTBRMjlzYjNJaUlITjBjbTlyWlMxM2FXUjBhRDBpTWlJZ2RtbGxkMEp2ZUQwaU1DQXdJREkwSURJMElqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2djM1J5YjJ0bExXeHBibVZqWVhBOUluSnZkVzVrSWlCemRISnZhMlV0YkdsdVpXcHZhVzQ5SW5KdmRXNWtJaUJrUFNKTk5DQXhObll4WVRNZ015QXdJREF3TXlBemFERXdZVE1nTXlBd0lEQXdNeTB6ZGkweGJTMDBMVFJzTFRRZ05HMHdJREJzTFRRdE5HMDBJRFJXTkNJdlBnb2dJQ0FnSUNBZ0lDQWdQQzl6ZG1jK0NpQWdJQ0FnSUNBZ0lDQThjM0JoYmlCamJHRnpjejBpYUdsa1pHVnVJRzFrT21sdWJHbHVaU0krUjJWMElGTmhiWEJzWlNCUVJFWThMM053WVc0K0NpQWdJQ0FnSUNBZ1BDOWlkWFIwYjI0K0Nnb2dJQ0FnSUNBZ0lEd2hMUzBnVkdobGJXVWdVM2RwZEdOb1pYSWdLRmRvYVhSbElFMXZaR1VnTHlCRVlYSnJJRTF2WkdVcElDMHRQZ29nSUNBZ0lDQWdJRHhpZFhSMGIyNGdhV1E5SW5Sb1pXMWxWRzluWjJ4bFFuUnVJaUIwZVhCbFBTSmlkWFIwYjI0aUlHRnlhV0V0YkdGaVpXdzlJbFJ2WjJkc1pTQlhhR2wwWlNCaGJtUWdSR0Z5YXlCTmIyUmxJaUJqYkdGemN6MGlhVzVzYVc1bExXWnNaWGdnYVhSbGJYTXRZMlZ1ZEdWeUlHZGhjQzB5SUhCNExUTXVOU0J3ZVMweUlISnZkVzVrWldRdGVHd2dkR1Y0ZEMxNGN5Qm1iMjUwTFhObGJXbGliMnhrSUdKbkxYTnNZWFJsTFRrd01DQjBaWGgwTFhkb2FYUmxJR1JoY21zNlltY3RkMmhwZEdVZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRrd01DQnphR0ZrYjNjdGMyMGdhRzkyWlhJNmIzQmhZMmwwZVMwNU1DQjBjbUZ1YzJsMGFXOXVMV0ZzYkNJK0NpQWdJQ0FnSUNBZ0lDQThJUzB0SUZOMWJpQnBZMjl1SUNoemFHOTNiaUJwYmlCa1lYSnJJRzF2WkdVZ2RHOGdjM2RwZEdOb0lIUnZJRmRvYVhSbElFMXZaR1VwSUMwdFBnb2dJQ0FnSUNBZ0lDQWdQSE4yWnlCcFpEMGlkR2hsYldWSlkyOXVVM1Z1SWlCamJHRnpjejBpZHkwMElHZ3ROQ0IwWlhoMExXRnRZbVZ5TFRVd01DQm9hV1JrWlc0aUlHWnBiR3c5SW01dmJtVWlJSE4wY205clpUMGlZM1Z5Y21WdWRFTnZiRzl5SWlCemRISnZhMlV0ZDJsa2RHZzlJakl1TWlJZ2RtbGxkMEp2ZUQwaU1DQXdJREkwSURJMElqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2djM1J5YjJ0bExXeHBibVZqWVhBOUluSnZkVzVrSWlCemRISnZhMlV0YkdsdVpXcHZhVzQ5SW5KdmRXNWtJaUJrUFNKTk1USWdNM1l4YlRBZ01UWjJNVzA1TFRsb0xURk5OQ0F4TWtnemJURTFMak0yTkNBMkxqTTJOR3d0TGpjd055MHVOekEzVFRZdU16UXpJRFl1TXpRemJDMHVOekEzTFM0M01EZHRNVEl1TnpJNElEQnNMUzQzTURjdU56QTNUVFl1TXpReklERTNMalkxTjJ3dExqY3dOeTQzTURkTk1UWWdNVEpoTkNBMElEQWdNVEV0T0NBd0lEUWdOQ0F3SURBeE9DQXdlaUl2UGdvZ0lDQWdJQ0FnSUNBZ1BDOXpkbWMrQ2lBZ0lDQWdJQ0FnSUNBOElTMHRJRTF2YjI0Z2FXTnZiaUFvYzJodmQyNGdhVzRnZDJocGRHVWdiVzlrWlNCMGJ5QnpkMmwwWTJnZ2RHOGdSR0Z5YXlCTmIyUmxLU0F0TFQ0S0lDQWdJQ0FnSUNBZ0lEeHpkbWNnYVdROUluUm9aVzFsU1dOdmJrMXZiMjRpSUdOc1lYTnpQU0ozTFRRZ2FDMDBJSFJsZUhRdGMydDVMVE13TUNJZ1ptbHNiRDBpYm05dVpTSWdjM1J5YjJ0bFBTSmpkWEp5Wlc1MFEyOXNiM0lpSUhOMGNtOXJaUzEzYVdSMGFEMGlNaTR5SWlCMmFXVjNRbTk0UFNJd0lEQWdNalFnTWpRaVBnb2dJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQnpkSEp2YTJVdGJHbHVaV05oY0QwaWNtOTFibVFpSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlJR1E5SWsweU1DNHpOVFFnTVRVdU16VTBRVGtnT1NBd0lEQXhPQzQyTkRZZ015NDJORFlnT1M0d01ETWdPUzR3TURNZ01DQXdNREV5SURJeFlUa3VNREF6SURrdU1EQXpJREFnTURBNExqTTFOQzAxTGpZME5ub2lMejRLSUNBZ0lDQWdJQ0FnSUR3dmMzWm5QZ29nSUNBZ0lDQWdJQ0FnUEhOd1lXNGdhV1E5SW5Sb1pXMWxWRzluWjJ4bFRHRmlaV3dpUGtSaGNtc2dUVzlrWlR3dmMzQmhiajRLSUNBZ0lDQWdJQ0E4TDJKMWRIUnZiajRLSUNBZ0lDQWdQQzlrYVhZK0NpQWdJQ0E4TDJScGRqNEtJQ0E4TDJobFlXUmxjajRLQ2lBZ1BDRXRMU0JOWVdsdUlFTnZiblJsYm5RZ1EyOXVkR0ZwYm1WeUlDMHRQZ29nSUR4dFlXbHVJR05zWVhOelBTSm1iR1Y0TFRFZ2JXRjRMWGN0TjNoc0lIY3RablZzYkNCdGVDMWhkWFJ2SUhCNExUUWdjMjA2Y0hndE5pQnNaenB3ZUMwNElIQjVMVGdpUGdvS0lDQWdJRHdoTFMwZ1ZrbEZWeUF4T2lCRVNWSkZRMVJQVWxrZ0ppQlRSVUZTUTBnZ1ZrbEZWeUF0TFQ0S0lDQWdJRHh6WldOMGFXOXVJR2xrUFNKa2FYSmxZM1J2Y25sV2FXVjNJaUJqYkdGemN6MGljM0JoWTJVdGVTMDRJajRLSUNBZ0lDQWdQQ0V0TFNCSVpYSnZJQ1lnVTJWaGNtTm9JRUpoY2lBdExUNEtJQ0FnSUNBZ1BHUnBkaUJqYkdGemN6MGlkR1Y0ZEMxalpXNTBaWElnYldGNExYY3RNM2hzSUcxNExXRjFkRzhnYzNCaFkyVXRlUzAxSUhCMExUSWlQZ29nSUNBZ0lDQWdJRHhrYVhZZ1kyeGhjM005SW1sdWJHbHVaUzFtYkdWNElHbDBaVzF6TFdObGJuUmxjaUJuWVhBdE1pQndlQzB6TGpVZ2NIa3RNUzQxSUhKdmRXNWtaV1F0Wm5Wc2JDQjBaWGgwTFhoeklHWnZiblF0YzJWdGFXSnZiR1FnWW1jdGQyaHBkR1VnWkdGeWF6cGlaeTFuY21GNUxUZ3dNQzg1TUNCMFpYaDBMWE5zWVhSbExUY3dNQ0JrWVhKck9uUmxlSFF0YzJ4aGRHVXRNekF3SUdKdmNtUmxjaUJpYjNKa1pYSXRjMnhoZEdVdE1qQXdJR1JoY21zNlltOXlaR1Z5TFdkeVlYa3ROekF3SUhOb1lXUnZkeTF6YlNJK0NpQWdJQ0FnSUNBZ0lDQThjM0JoYmlCamJHRnpjejBpWm14bGVDQm9MVElnZHkweUlISnZkVzVrWldRdFpuVnNiQ0JpWnkxbGJXVnlZV3hrTFRVd01DSStQQzl6Y0dGdVBnb2dJQ0FnSUNBZ0lDQWdQSE53WVc0K1JYWmxjbmtnVUVSR0lDWmhiWEE3SUVacGJHVWdWWFJwYkdsMGVTQlpiM1VnVG1WbFpDRGlnSlFnUTI5c2IzSXRRMjlrWldRZ0ptRnRjRHNnU1c1emRHRnVkRHd2YzNCaGJqNEtJQ0FnSUNBZ0lDQThMMlJwZGo0S0NpQWdJQ0FnSUNBZ1BHZ3hJR05zWVhOelBTSjBaWGgwTFRONGJDQnpiVHAwWlhoMExUUjRiQ0JzWnpwMFpYaDBMVFY0YkNCbWIyNTBMV1Y0ZEhKaFltOXNaQ0IwY21GamEybHVaeTEwYVdkb2RDQjBaWGgwTFhOc1lYUmxMVGt3TUNCa1lYSnJPblJsZUhRdGQyaHBkR1VnYkdWaFpHbHVaeTEwYVdkb2RDSStDaUFnSUNBZ0lDQWdJQ0JGZG1WeWVTQjBiMjlzSUhsdmRTQnVaV1ZrSUhSdklIZHZjbXNnZDJsMGFDQThjM0JoYmlCamJHRnpjejBpWW1jdFozSmhaR2xsYm5RdGRHOHRjaUJtY205dExYSnZjMlV0TmpBd0lIWnBZUzF2Y21GdVoyVXROVEF3SUhSdkxYWnBiMnhsZEMwMk1EQWdZbWN0WTJ4cGNDMTBaWGgwSUhSbGVIUXRkSEpoYm5Od1lYSmxiblFpUGxCRVJuTWdKbUZ0Y0RzZ1JHOWpkVzFsYm5SelBDOXpjR0Z1UGdvZ0lDQWdJQ0FnSUR3dmFERStDZ29nSUNBZ0lDQWdJRHh3SUdOc1lYTnpQU0owWlhoMExYTnRJSE50T25SbGVIUXRZbUZ6WlNCMFpYaDBMWE5zWVhSbExUWXdNQ0JrWVhKck9uUmxlSFF0YzJ4aGRHVXROREF3SUcxaGVDMTNMVEo0YkNCdGVDMWhkWFJ2SWo0S0lDQWdJQ0FnSUNBZ0lFMWxjbWRsTENCemNHeHBkQ3dnWTI5dGNISmxjM01zSUdOdmJuWmxjblFzSUdWa2FYUXNJSE5wWjI0c0lFOURVaXdnY21Wa1lXTjBMQ0JtYVd4c0lHWnZjbTF6TENCemRXMXRZWEpwZW1VZ2QybDBhQ0JCU1N3Z2RISmhibk5zWVhSbExDQnZjaUJqYjI1MlpYSjBJSFJ2SUUxaGNtdGtiM2R1TGlCRGJHbGpheUJoYm5rZ2RHOXZiQ0JpWld4dmR5QnZjaUJ6WldGeVkyZ2dZbmtnWm5WdVkzUnBiMjR1Q2lBZ0lDQWdJQ0FnUEM5d1Bnb0tJQ0FnSUNBZ0lDQThJUzB0SUVsdWRHVnlZV04wYVhabElGTmxZWEpqYUNCQ1lYSWdMUzArQ2lBZ0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaWNtVnNZWFJwZG1VZ2JXRjRMWGN0TW5oc0lHMTRMV0YxZEc4Z2NIUXRNU0krQ2lBZ0lDQWdJQ0FnSUNBOFpHbDJJR05zWVhOelBTSnlaV3hoZEdsMlpTQm1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQmlaeTEzYUdsMFpTQmtZWEpyT21KbkxXZHlZWGt0T1RBd0lISnZkVzVrWldRdE1uaHNJR0p2Y21SbGNpMHlJR0p2Y21SbGNpMXpiR0YwWlMweU1EQWdaR0Z5YXpwaWIzSmtaWEl0WjNKaGVTMDNNREFnWm05amRYTXRkMmwwYUdsdU9tSnZjbVJsY2kxeWIzTmxMVFV3TUNCa1lYSnJPbVp2WTNWekxYZHBkR2hwYmpwaWIzSmtaWEl0Y205elpTMDFNREFnYzJoaFpHOTNMV3huSUhOb1lXUnZkeTF6YkdGMFpTMHlNREF2TlRBZ1pHRnlhenB6YUdGa2IzY3RZbXhoWTJzdk5EQWdkSEpoYm5OcGRHbHZiaTFoYkd3aVBnb2dJQ0FnSUNBZ0lDQWdJQ0E4WkdsMklHTnNZWE56UFNKd2JDMDBJSEJ5TFRJZ2RHVjRkQzF6YkdGMFpTMDBNREFnWkdGeWF6cDBaWGgwTFhOc1lYUmxMVFV3TUNCd2IybHVkR1Z5TFdWMlpXNTBjeTF1YjI1bElqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGMzWm5JR05zWVhOelBTSjNMVFVnYUMwMUlpQm1hV3hzUFNKdWIyNWxJaUJ6ZEhKdmEyVTlJbU4xY25KbGJuUkRiMnh2Y2lJZ2MzUnliMnRsTFhkcFpIUm9QU0l5TGpJaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSStDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCemRISnZhMlV0YkdsdVpXTmhjRDBpY205MWJtUWlJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUlHUTlJazB5TVNBeU1Xd3ROaTAyYlRJdE5XRTNJRGNnTUNBeE1TMHhOQ0F3SURjZ055QXdJREF4TVRRZ01Ib2lMejRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMM04yWno0S0lDQWdJQ0FnSUNBZ0lDQWdQQzlrYVhZK0NpQWdJQ0FnSUNBZ0lDQWdJRHhwYm5CMWRBb2dJQ0FnSUNBZ0lDQWdJQ0FnSUdsa1BTSjBiMjlzVTJWaGNtTm9TVzV3ZFhRaUNpQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhsd1pUMGlkR1Y0ZENJS0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZFhSdlkyOXRjR3hsZEdVOUltOW1aaUlLSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiR0ZqWldodmJHUmxjajBpVTJWaGNtTm9JR0Z1ZVNCbWRXNWpkR2x2YmlBb1pTNW5MaXdnVFdWeVoyVXNJRkJFUmlCMGJ5QlhiM0prTENCRGNtOXdMQ0JCU1NCVGRXMXRZWEpwZW1WeUxDQlVjbUZ1YzJ4aGRHVXNJRTFoY210a2IzZHVMQ0JRWVhOemQyOXlaQzR1TGlraUNpQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJ4aGMzTTlJbmN0Wm5Wc2JDQndlUzB6TGpVZ2NISXRNalFnWW1jdGRISmhibk53WVhKbGJuUWdkR1Y0ZEMxemJTQnpiVHAwWlhoMExXSmhjMlVnZEdWNGRDMXpiR0YwWlMwNU1EQWdaR0Z5YXpwMFpYaDBMWGRvYVhSbElIQnNZV05sYUc5c1pHVnlMWE5zWVhSbExUUXdNQ0JrWVhKck9uQnNZV05sYUc5c1pHVnlMWE5zWVhSbExUVXdNQ0JtYjJOMWN6cHZkWFJzYVc1bExXNXZibVVpQ2lBZ0lDQWdJQ0FnSUNBZ0lDOCtDaUFnSUNBZ0lDQWdJQ0FnSUR4a2FYWWdZMnhoYzNNOUltRmljMjlzZFhSbElISnBaMmgwTFRNZ1pteGxlQ0JwZEdWdGN5MWpaVzUwWlhJZ1oyRndMVEV1TlNJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEdKMWRIUnZiZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1E5SW1Oc1pXRnlVMlZoY21Ob1FuUnVJZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkSGx3WlQwaVluVjBkRzl1SWdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJ4aGMzTTlJbWhwWkdSbGJpQndlQzB5SUhCNUxURWdjbTkxYm1SbFpDMXNaeUIwWlhoMExYaHpJR1p2Ym5RdGMyVnRhV0p2YkdRZ1ltY3RjMnhoZEdVdE1UQXdJR1JoY21zNlltY3RaM0poZVMwNE1EQWdkR1Y0ZEMxemJHRjBaUzAyTURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRNd01DQm9iM1psY2pwaVp5MXpiR0YwWlMweU1EQWdaR0Z5YXpwb2IzWmxjanBpWnkxbmNtRjVMVGN3TUNCMGNtRnVjMmwwYVc5dUxXTnZiRzl5Y3lJS0lDQWdJQ0FnSUNBZ0lDQWdJQ0ErQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JEYkdWaGNnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlluVjBkRzl1UGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhyWW1RZ1kyeGhjM005SW1ocFpHUmxiaUJ6YlRwcGJteHBibVV0WW14dlkyc2djSGd0TWlCd2VTMHhJSFJsZUhRdFd6RXhjSGhkSUdadmJuUXRiVzl1YnlCbWIyNTBMWE5sYldsaWIyeGtJSFJsZUhRdGMyeGhkR1V0TkRBd0lHUmhjbXM2ZEdWNGRDMXpiR0YwWlMwMU1EQWdZbWN0YzJ4aGRHVXRNVEF3SUdSaGNtczZZbWN0WjNKaGVTMDRNREFnY205MWJtUmxaQzF0WkNCaWIzSmtaWElnWW05eVpHVnlMWE5zWVhSbExUSXdNQ0JrWVhKck9tSnZjbVJsY2kxbmNtRjVMVGN3TUNJK0x6d3ZhMkprUGdvZ0lDQWdJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvS0lDQWdJQ0FnSUNBZ0lEd2hMUzBnVTJWaGNtTm9JRk4wWVhSMWN5QW1JRkYxYVdOcklGTjFaMmRsYzNScGIyNXpJQzB0UGdvZ0lDQWdJQ0FnSUNBZ1BHUnBkaUJqYkdGemN6MGlabXhsZUNCbWJHVjRMWGR5WVhBZ2FYUmxiWE10WTJWdWRHVnlJR3AxYzNScFpua3RZbVYwZDJWbGJpQm5ZWEF0TWlCdGRDMHlMalVnY0hndE1TQjBaWGgwTFhoeklIUmxlSFF0YzJ4aGRHVXROVEF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzAwTURBaVBnb2dJQ0FnSUNBZ0lDQWdJQ0E4YzNCaGJpQnBaRDBpYzJWaGNtTm9RMjkxYm5STVlXSmxiQ0lnWTJ4aGMzTTlJbVp2Ym5RdGJXVmthWFZ0SWo1VGFHOTNhVzVuSUdGc2JDQXpNU0JtWldGMGRYSmxjend2YzNCaGJqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaVpteGxlQ0JtYkdWNExYZHlZWEFnYVhSbGJYTXRZMlZ1ZEdWeUlHZGhjQzB4TGpVaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR4emNHRnVQbEYxYVdOcklIUnllVG84TDNOd1lXNCtDaUFnSUNBZ0lDQWdJQ0FnSUNBZ1BHSjFkSFJ2YmlCMGVYQmxQU0ppZFhSMGIyNGlJR1JoZEdFdGNYVnBZMnN0YzJWaGNtTm9QU0pOWlhKblpTSWdZMnhoYzNNOUluRjFhV05yTFhObFlYSmphQzFqYUdsd0lIVnVaR1Z5YkdsdVpTQm9iM1psY2pwMFpYaDBMWEp2YzJVdE5UQXdJajVOWlhKblpUd3ZZblYwZEc5dVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR4emNHRnVQc0szUEM5emNHRnVQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lEeGlkWFIwYjI0Z2RIbHdaVDBpWW5WMGRHOXVJaUJrWVhSaExYRjFhV05yTFhObFlYSmphRDBpVjI5eVpDSWdZMnhoYzNNOUluRjFhV05yTFhObFlYSmphQzFqYUdsd0lIVnVaR1Z5YkdsdVpTQm9iM1psY2pwMFpYaDBMV0pzZFdVdE5UQXdJajVYYjNKa1BDOWlkWFIwYjI0K0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhOd1lXNCt3cmM4TDNOd1lXNCtDaUFnSUNBZ0lDQWdJQ0FnSUNBZ1BHSjFkSFJ2YmlCMGVYQmxQU0ppZFhSMGIyNGlJR1JoZEdFdGNYVnBZMnN0YzJWaGNtTm9QU0pHYjNKdGN5SWdZMnhoYzNNOUluRjFhV05yTFhObFlYSmphQzFqYUdsd0lIVnVaR1Z5YkdsdVpTQm9iM1psY2pwMFpYaDBMWFJsWVd3dE5UQXdJajVRUkVZZ1JtOXliWE04TDJKMWRIUnZiajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjM0JoYmo3Q3R6d3ZjM0JoYmo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WW5WMGRHOXVJSFI1Y0dVOUltSjFkSFJ2YmlJZ1pHRjBZUzF4ZFdsamF5MXpaV0Z5WTJnOUlsTjFiVzFoY21sNlpYSWlJR05zWVhOelBTSnhkV2xqYXkxelpXRnlZMmd0WTJocGNDQjFibVJsY214cGJtVWdhRzkyWlhJNmRHVjRkQzFtZFdOb2MybGhMVFV3TUNJK1FVa2dVM1Z0YldGeWFYcGxjand2WW5WMGRHOXVQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lEeHpjR0Z1UHNLM1BDOXpjR0Z1UGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhpZFhSMGIyNGdkSGx3WlQwaVluVjBkRzl1SWlCa1lYUmhMWEYxYVdOckxYTmxZWEpqYUQwaVRXRnlhMlJ2ZDI0aUlHTnNZWE56UFNKeGRXbGpheTF6WldGeVkyZ3RZMmhwY0NCMWJtUmxjbXhwYm1VZ2FHOTJaWEk2ZEdWNGRDMXpiR0YwWlMwNU1EQWdaR0Z5YXpwb2IzWmxjanAwWlhoMExYZG9hWFJsSWo1TllYSnJaRzkzYmp3dlluVjBkRzl1UGdvZ0lDQWdJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvZ0lDQWdJQ0FnSUR3dlpHbDJQZ29LSUNBZ0lDQWdJQ0E4SVMwdElFTmhkR1ZuYjNKNUlFWnBiSFJsY2lCUWFXeHNjeUF0TFQ0S0lDQWdJQ0FnSUNBOFpHbDJJR2xrUFNKallYUmxaMjl5ZVVacGJIUmxja0poY2lJZ1kyeGhjM005SW1ac1pYZ2dabXhsZUMxM2NtRndJR2wwWlcxekxXTmxiblJsY2lCcWRYTjBhV1o1TFdObGJuUmxjaUJuWVhBdE1pQndkQzB4SWo0S0lDQWdJQ0FnSUNBZ0lEd2hMUzBnVUc5d2RXeGhkR1ZrSUdSNWJtRnRhV05oYkd4NUlDMHRQZ29nSUNBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJRHdoTFMwZ1JXMXdkSGtnVTJWaGNtTm9JRk4wWVhSbElDMHRQZ29nSUNBZ0lDQThaR2wySUdsa1BTSmxiWEIwZVZObFlYSmphRk4wWVhSbElpQmpiR0Z6Y3owaWFHbGtaR1Z1SUhSbGVIUXRZMlZ1ZEdWeUlIQjVMVEUwSUhCNExUUWdjbTkxYm1SbFpDMHplR3dnWW1jdGQyaHBkR1VnWkdGeWF6cGlaeTFuY21GNUxUa3dNQ0JpYjNKa1pYSWdZbTl5WkdWeUxYTnNZWFJsTFRJd01DQmtZWEpyT21KdmNtUmxjaTFuY21GNUxUZ3dNQ0J0WVhndGR5MTRiQ0J0ZUMxaGRYUnZJSE53WVdObExYa3RNeUkrQ2lBZ0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaWR5MHhNaUJvTFRFeUlISnZkVzVrWldRdE1uaHNJR0puTFhKdmMyVXROVEFnWkdGeWF6cGlaeTF5YjNObExUazFNQzgyTUNCMFpYaDBMWEp2YzJVdE5UQXdJR1pzWlhnZ2FYUmxiWE10WTJWdWRHVnlJR3AxYzNScFpua3RZMlZ1ZEdWeUlHMTRMV0YxZEc4aVBnb2dJQ0FnSUNBZ0lDQWdQSE4yWnlCamJHRnpjejBpZHkwMklHZ3ROaUlnWm1sc2JEMGlibTl1WlNJZ2MzUnliMnRsUFNKamRYSnlaVzUwUTI5c2IzSWlJSE4wY205clpTMTNhV1IwYUQwaU1pSWdkbWxsZDBKdmVEMGlNQ0F3SURJMElESTBJajRLSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lpQnpkSEp2YTJVdGJHbHVaV3B2YVc0OUluSnZkVzVrSWlCa1BTSk5PUzR4TnpJZ01UWXVNVGN5WVRRZ05DQXdJREF4TlM0Mk5UWWdNRTA1SURFd2FDNHdNVTB4TlNBeE1HZ3VNREZOTWpFZ01USmhPU0E1SURBZ01URXRNVGdnTUNBNUlEa2dNQ0F3TVRFNElEQjZJaTgrQ2lBZ0lDQWdJQ0FnSUNBOEwzTjJaejRLSUNBZ0lDQWdJQ0E4TDJScGRqNEtJQ0FnSUNBZ0lDQThhRElnWTJ4aGMzTTlJblJsZUhRdGJHY2dabTl1ZEMxaWIyeGtJSFJsZUhRdGMyeGhkR1V0T1RBd0lHUmhjbXM2ZEdWNGRDMTNhR2wwWlNJK1RtOGdiV0YwWTJocGJtY2dkRzl2YkhNZ1ptOTFibVE4TDJneVBnb2dJQ0FnSUNBZ0lEeHdJR05zWVhOelBTSjBaWGgwTFhOdElIUmxlSFF0YzJ4aGRHVXROVEF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzAwTURBaVBsUnllU0J6WldGeVkyaHBibWNnWm05eUlHdGxlWGR2Y21SeklHeHBhMlVnUEhOd1lXNGdZMnhoYzNNOUltWnZiblF0YzJWdGFXSnZiR1FpUG0xbGNtZGxMQ0J6Y0d4cGRDd2dkMjl5WkN3Z1pYaGpaV3dzSUhOcFoyNHNJSGRoZEdWeWJXRnlheXdnYjJOeUxDQmpjbTl3TENCbWIzSnRjeXdnYzNWdGJXRnlhWHBsTENCMGNtRnVjMnhoZEdVOEwzTndZVzQrTENCdmNpQThjM0JoYmlCamJHRnpjejBpWm05dWRDMXpaVzFwWW05c1pDSStiV0Z5YTJSdmQyNDhMM053WVc0K0xqd3ZjRDRLSUNBZ0lDQWdJQ0E4WW5WMGRHOXVJR2xrUFNKeVpYTmxkRVpwYkhSbGNuTkNkRzRpSUhSNWNHVTlJbUoxZEhSdmJpSWdZMnhoYzNNOUltbHViR2x1WlMxbWJHVjRJR2wwWlcxekxXTmxiblJsY2lCbllYQXRNUzQxSUhCNExUUWdjSGt0TWlCeWIzVnVaR1ZrTFhoc0lIUmxlSFF0ZUhNZ1ptOXVkQzF6WlcxcFltOXNaQ0JpWnkxeWIzTmxMVFl3TUNCMFpYaDBMWGRvYVhSbElHaHZkbVZ5T21KbkxYSnZjMlV0TnpBd0lIUnlZVzV6YVhScGIyNHRZMjlzYjNKeklqNEtJQ0FnSUNBZ0lDQWdJRk5vYjNjZ1FXeHNJRE14SUZSdmIyeHpDaUFnSUNBZ0lDQWdQQzlpZFhSMGIyNCtDaUFnSUNBZ0lEd3ZaR2wyUGdvS0lDQWdJQ0FnUENFdExTQlViMjlzY3lCSGNtbGtJQ2d6TVNCRGIyeHZjaTFFYVhOMGFXNW5kV2x6YUdWa0lFWmxZWFIxY21VZ1EyRnlaSE1wSUMwdFBnb2dJQ0FnSUNBOFpHbDJJR2xrUFNKMGIyOXNjMGR5YVdRaUlHTnNZWE56UFNKbmNtbGtJR2R5YVdRdFkyOXNjeTB4SUhOdE9tZHlhV1F0WTI5c2N5MHlJR3huT21keWFXUXRZMjlzY3kweklIaHNPbWR5YVdRdFkyOXNjeTAwSUdkaGNDMDBJSE50T21kaGNDMDFJajRLSUNBZ0lDQWdJQ0E4SVMwdElGQnZjSFZzWVhSbFpDQmtlVzVoYldsallXeHNlU0JpZVNCS1V5QXRMVDRLSUNBZ0lDQWdQQzlrYVhZK0NpQWdJQ0E4TDNObFkzUnBiMjQrQ2dvZ0lDQWdQQ0V0TFNCV1NVVlhJREk2SUVGRFZFbFdSU0JVVDA5TUlGZFBVa3RUVUVGRFJTQlRWRlZFU1U4Z0xTMCtDaUFnSUNBOGMyVmpkR2x2YmlCcFpEMGlkMjl5YTNOd1lXTmxWbWxsZHlJZ1kyeGhjM005SW1ocFpHUmxiaUJ6Y0dGalpTMTVMVFlpUGdvZ0lDQWdJQ0E4SVMwdElGUnZjQ0JDY21WaFpHTnlkVzFpSUNZZ1ZHOXZiQ0JUZDJsMFkyaGxjaUJDWVhJZ0xTMCtDaUFnSUNBZ0lEeGthWFlnWTJ4aGMzTTlJbVpzWlhnZ1pteGxlQzEzY21Gd0lHbDBaVzF6TFdObGJuUmxjaUJxZFhOMGFXWjVMV0psZEhkbFpXNGdaMkZ3TFRNZ1ltY3RkMmhwZEdVZ1pHRnlhenBpWnkxbmNtRjVMVGt3TUNCd0xUUWdjbTkxYm1SbFpDMHllR3dnWW05eVpHVnlJR0p2Y21SbGNpMXpiR0YwWlMweU1EQWdaR0Z5YXpwaWIzSmtaWEl0WjNKaGVTMDRNREFnYzJoaFpHOTNMWE50SWo0S0lDQWdJQ0FnSUNBOFpHbDJJR05zWVhOelBTSm1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQm5ZWEF0TXlJK0NpQWdJQ0FnSUNBZ0lDQThZblYwZEc5dUlHbGtQU0ppWVdOclZHOUhjbWxrUW5SdUlpQjBlWEJsUFNKaWRYUjBiMjRpSUdOc1lYTnpQU0pwYm14cGJtVXRabXhsZUNCcGRHVnRjeTFqWlc1MFpYSWdaMkZ3TFRJZ2NIZ3RNeTQxSUhCNUxUSWdjbTkxYm1SbFpDMTRiQ0IwWlhoMExYaHpJR1p2Ym5RdGMyVnRhV0p2YkdRZ1ltY3RjMnhoZEdVdE1UQXdJR1JoY21zNlltY3RaM0poZVMwNE1EQWdkR1Y0ZEMxemJHRjBaUzAzTURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRJd01DQm9iM1psY2pwaVp5MXpiR0YwWlMweU1EQWdaR0Z5YXpwb2IzWmxjanBpWnkxbmNtRjVMVGN3TUNCMGNtRnVjMmwwYVc5dUxXTnZiRzl5Y3lJK0NpQWdJQ0FnSUNBZ0lDQWdJRHh6ZG1jZ1kyeGhjM005SW5jdE5DQm9MVFFpSUdacGJHdzlJbTV2Ym1VaUlITjBjbTlyWlQwaVkzVnljbVZ1ZEVOdmJHOXlJaUJ6ZEhKdmEyVXRkMmxrZEdnOUlqSXVNaUlnZG1sbGQwSnZlRDBpTUNBd0lESTBJREkwSWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQnpkSEp2YTJVdGJHbHVaV05oY0QwaWNtOTFibVFpSUhOMGNtOXJaUzFzYVc1bGFtOXBiajBpY205MWJtUWlJR1E5SWsweE1DQXhPV3d0TnkwM2JUQWdNR3czTFRkdExUY2dOMmd4T0NJdlBnb2dJQ0FnSUNBZ0lDQWdJQ0E4TDNOMlp6NEtJQ0FnSUNBZ0lDQWdJQ0FnUEhOd1lXNCtRV3hzSURNeElGUnZiMnh6UEM5emNHRnVQZ29nSUNBZ0lDQWdJQ0FnUEM5aWRYUjBiMjQrQ2dvZ0lDQWdJQ0FnSUNBZ1BHUnBkaUJqYkdGemN6MGlhQzAySUhjdGNIZ2dZbWN0YzJ4aGRHVXRNakF3SUdSaGNtczZZbWN0WjNKaGVTMDNNREFnYUdsa1pHVnVJSE50T21Kc2IyTnJJajQ4TDJScGRqNEtDaUFnSUNBZ0lDQWdJQ0E4WkdsMklHTnNZWE56UFNKbWJHVjRJR2wwWlcxekxXTmxiblJsY2lCbllYQXRNeUkrQ2lBZ0lDQWdJQ0FnSUNBZ0lEeGthWFlnYVdROUltRmpkR2wyWlZSdmIyeEpZMjl1UW05NElpQmpiR0Z6Y3owaWR5MHhNQ0JvTFRFd0lISnZkVzVrWldRdGVHd2dabXhsZUNCcGRHVnRjeTFqWlc1MFpYSWdhblZ6ZEdsbWVTMWpaVzUwWlhJZ2RHVjRkQzEzYUdsMFpTQm1iMjUwTFdKdmJHUWdjMmhoWkc5M0xYTnRJajQ4TDJScGRqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdScGRqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFpHbDJJR05zWVhOelBTSm1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQm5ZWEF0TWlJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGFESWdhV1E5SW1GamRHbDJaVlJ2YjJ4VWFYUnNaU0lnWTJ4aGMzTTlJblJsZUhRdGJHY2dabTl1ZEMxbGVIUnlZV0p2YkdRZ2RHVjRkQzF6YkdGMFpTMDVNREFnWkdGeWF6cDBaWGgwTFhkb2FYUmxJajVVYjI5c0lFNWhiV1U4TDJneVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BITndZVzRnYVdROUltRmpkR2wyWlZSdmIyeE9aWGRDWVdSblpTSWdZMnhoYzNNOUltaHBaR1JsYmlCd2VDMHlJSEI1TFRBdU5TQjBaWGgwTFZzeE1IQjRYU0JtYjI1MExXSnZiR1FnZFhCd1pYSmpZWE5sSUhSeVlXTnJhVzVuTFhkcFpHVnlJSEp2ZFc1a1pXUXRablZzYkNCaVp5MWxiV1Z5WVd4a0xUVXdNQ0IwWlhoMExYZG9hWFJsSWo1T1pYY2hQQzl6Y0dGdVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BITndZVzRnYVdROUltRmpkR2wyWlZSdmIyeERZWFJsWjI5eWVVSmhaR2RsSWlCamJHRnpjejBpY0hndE1pNDFJSEI1TFRBdU5TQjBaWGgwTFZzeE1YQjRYU0JtYjI1MExYTmxiV2xpYjJ4a0lISnZkVzVrWldRdFpuVnNiQ0JpWnkxemJHRjBaUzB4TURBZ1pHRnlhenBpWnkxbmNtRjVMVGd3TUNCMFpYaDBMWE5zWVhSbExUWXdNQ0JrWVhKck9uUmxlSFF0YzJ4aGRHVXRNekF3SWo1RFlYUmxaMjl5ZVR3dmMzQmhiajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0NCcFpEMGlZV04wYVhabFZHOXZiRVJsYzJNaUlHTnNZWE56UFNKMFpYaDBMWGh6SUhSbGVIUXRjMnhoZEdVdE5UQXdJR1JoY21zNmRHVjRkQzF6YkdGMFpTMDBNREFpUGxSdmIyd2daR1Z6WTNKcGNIUnBiMjQ4TDNBK0NpQWdJQ0FnSUNBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnSUNBZ0lDQWdQQzlrYVhZK0NpQWdJQ0FnSUNBZ1BDOWthWFkrQ2dvZ0lDQWdJQ0FnSUR3aExTMGdVWFZwWTJzZ1NuVnRjQ0JFY205d1pHOTNiaUIwYnlCVGQybDBZMmdnUW1WMGQyVmxiaUJCYm5rZ2IyWWdkR2hsSURNeElGUnZiMnh6SUMwdFBnb2dJQ0FnSUNBZ0lEeGthWFlnWTJ4aGMzTTlJbVpzWlhnZ2FYUmxiWE10WTJWdWRHVnlJR2RoY0MweUlIY3RablZzYkNCemJUcDNMV0YxZEc4Z2FuVnpkR2xtZVMxbGJtUWlQZ29nSUNBZ0lDQWdJQ0FnUEd4aFltVnNJR1p2Y2owaWNYVnBZMnRVYjI5c1UyVnNaV04wSWlCamJHRnpjejBpZEdWNGRDMTRjeUJtYjI1MExXMWxaR2wxYlNCMFpYaDBMWE5zWVhSbExUVXdNQ0JrWVhKck9uUmxlSFF0YzJ4aGRHVXROREF3SUhkb2FYUmxjM0JoWTJVdGJtOTNjbUZ3SWo1VGQybDBZMmdnZEc5dmJEbzhMMnhoWW1Wc1Bnb2dJQ0FnSUNBZ0lDQWdQSE5sYkdWamRDQnBaRDBpY1hWcFkydFViMjlzVTJWc1pXTjBJaUJqYkdGemN6MGljSGd0TXlCd2VTMHlJSEp2ZFc1a1pXUXRlR3dnZEdWNGRDMTRjeUJtYjI1MExYTmxiV2xpYjJ4a0lHSm5MWE5zWVhSbExUVXdJR1JoY21zNlltY3RaM0poZVMwNE1EQWdkR1Y0ZEMxemJHRjBaUzA0TURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRFd01DQmliM0prWlhJZ1ltOXlaR1Z5TFhOc1lYUmxMVEl3TUNCa1lYSnJPbUp2Y21SbGNpMW5jbUY1TFRjd01DQm1iMk4xY3pwdmRYUnNhVzVsTFc1dmJtVWlQZ29nSUNBZ0lDQWdJQ0FnSUNBOElTMHRJRkJ2Y0hWc1lYUmxaQ0JrZVc1aGJXbGpZV3hzZVNBdExUNEtJQ0FnSUNBZ0lDQWdJRHd2YzJWc1pXTjBQZ29nSUNBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJRHdoTFMwZ1RXRnBiaUJYYjNKcmMzQmhZMlVnVEdGNWIzVjBPaUJNWldaMElGVndiRzloWkM5R2FXeGxjeUFtSUVOdmJtWnBaeUFySUZKcFoyaDBJRWx1ZEdWeVlXTjBhWFpsSUZCeVpYWnBaWGNnSmlCUGRYUndkWFFnTFMwK0NpQWdJQ0FnSUR4a2FYWWdZMnhoYzNNOUltZHlhV1FnWjNKcFpDMWpiMnh6TFRFZ2JHYzZaM0pwWkMxamIyeHpMVEV5SUdkaGNDMDJJR2wwWlcxekxYTjBZWEowSWo0S0NpQWdJQ0FnSUNBZ1BDRXRMU0JNWldaMElFTnZiSFZ0YmlBb055QmpiMnh6S1RvZ1JtbHNaU0JFY205d2VtOXVaU3dnVEc5aFpHVmtJRVpwYkdWeklGRjFaWFZsTENCaGJtUWdWRzl2YkMxVGNHVmphV1pwWXlCRGIyNTBjbTlzY3lBdExUNEtJQ0FnSUNBZ0lDQThaR2wySUdOc1lYTnpQU0pzWnpwamIyd3RjM0JoYmkwM0lITndZV05sTFhrdE5TSStDZ29nSUNBZ0lDQWdJQ0FnUENFdExTQkdhV3hsSUZWd2JHOWhaQ0FtSUZOaGJYQnNaU0JNYjJGa1pYSWdRMkZ5WkNBdExUNEtJQ0FnSUNBZ0lDQWdJRHhrYVhZZ2FXUTlJblZ3Ykc5aFpFTmhjbVJEYjI1MFlXbHVaWElpSUdOc1lYTnpQU0ppWnkxM2FHbDBaU0JrWVhKck9tSm5MV2R5WVhrdE9UQXdJSEp2ZFc1a1pXUXRNbmhzSUdKdmNtUmxjaUJpYjNKa1pYSXRjMnhoZEdVdE1qQXdJR1JoY21zNlltOXlaR1Z5TFdkeVlYa3RPREF3SUhBdE5TQnphR0ZrYjNjdGMyMGdjM0JoWTJVdGVTMDBJajRLSUNBZ0lDQWdJQ0FnSUNBZ1BHUnBkaUJqYkdGemN6MGlabXhsZUNCbWJHVjRMWGR5WVhBZ2FYUmxiWE10WTJWdWRHVnlJR3AxYzNScFpua3RZbVYwZDJWbGJpQm5ZWEF0TWlJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEdScGRqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeG9NeUJqYkdGemN6MGlkR1Y0ZEMxemJTQm1iMjUwTFdKdmJHUWdkR1Y0ZEMxemJHRjBaUzA1TURBZ1pHRnlhenAwWlhoMExYZG9hWFJsSUdac1pYZ2dhWFJsYlhNdFkyVnVkR1Z5SUdkaGNDMHlJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhOd1lXNCtNUzRnVTJWc1pXTjBJRzl5SUVSeWIzQWdSbWxzWlhNOEwzTndZVzQrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4emNHRnVJR2xrUFNKaFkyTmxjSFJsWkVadmNtMWhkSE5RYVd4c0lpQmpiR0Z6Y3owaWNIZ3RNaUJ3ZVMwd0xqVWdjbTkxYm1SbFpDMXRaQ0IwWlhoMExWc3hNWEI0WFNCbWIyNTBMVzF2Ym04Z1ltY3RjMnhoZEdVdE1UQXdJR1JoY21zNlltY3RaM0poZVMwNE1EQWdkR1Y0ZEMxemJHRjBaUzAyTURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRNd01DSStMbkJrWmp3dmMzQmhiajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2YURNK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNDQnBaRDBpZFhCc2IyRmtTR2x1ZEZSbGVIUWlJR05zWVhOelBTSjBaWGgwTFhoeklIUmxlSFF0YzJ4aGRHVXROVEF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzAwTURBaVBsVndiRzloWkNCbWNtOXRJSGx2ZFhJZ1pHVjJhV05sSUc5eUlHeHZZV1FnWVNCaWRXbHNkQzFwYmlCellXMXdiR1VnWm1sc1pTQjBieUIwWlhOMElHbHRiV1ZrYVdGMFpXeDVMand2Y0Q0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4TDJScGRqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFpHbDJJR05zWVhOelBTSm1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQm5ZWEF0TWlJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFluVjBkRzl1SUdsa1BTSnNiMkZrVTJGdGNHeGxRblJ1SWlCMGVYQmxQU0ppZFhSMGIyNGlJR05zWVhOelBTSnBibXhwYm1VdFpteGxlQ0JwZEdWdGN5MWpaVzUwWlhJZ1oyRndMVEV1TlNCd2VDMHpJSEI1TFRFdU5TQnliM1Z1WkdWa0xYaHNJSFJsZUhRdGVITWdabTl1ZEMxelpXMXBZbTlzWkNCaWIzSmtaWElnZEhKaGJuTnBkR2x2YmkxaGJHd2djMmhoWkc5M0xYTnRJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhOMlp5QmpiR0Z6Y3owaWR5MDBJR2d0TkNJZ1ptbHNiRDBpYm05dVpTSWdjM1J5YjJ0bFBTSmpkWEp5Wlc1MFEyOXNiM0lpSUhOMGNtOXJaUzEzYVdSMGFEMGlNaUlnZG1sbGQwSnZlRDBpTUNBd0lESTBJREkwSWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCemRISnZhMlV0YkdsdVpXTmhjRDBpY205MWJtUWlJSE4wY205clpTMXNhVzVsYW05cGJqMGljbTkxYm1RaUlHUTlJazB4TXlBeE1GWXpURFFnTVRSb04zWTNiRGt0TVRGb0xUZDZJaTgrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR3dmMzWm5QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4YzNCaGJpQnBaRDBpYkc5aFpGTmhiWEJzWlVKMGJreGhZbVZzSWo1TWIyRmtJRk5oYlhCc1pTQkdhV3hsUEM5emNHRnVQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQQzlpZFhSMGIyNCtDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThZblYwZEc5dUlHbGtQU0pqYkdWaGNrWnBiR1Z6UW5SdUlpQjBlWEJsUFNKaWRYUjBiMjRpSUdOc1lYTnpQU0pvYVdSa1pXNGdjSGd0TWk0MUlIQjVMVEV1TlNCeWIzVnVaR1ZrTFhoc0lIUmxlSFF0ZUhNZ1ptOXVkQzF6WlcxcFltOXNaQ0JpWnkxemJHRjBaUzB4TURBZ1pHRnlhenBpWnkxbmNtRjVMVGd3TUNCMFpYaDBMWE5zWVhSbExUWXdNQ0JrWVhKck9uUmxlSFF0YzJ4aGRHVXROREF3SUdodmRtVnlPblJsZUhRdGNtOXpaUzAyTURBZ2RISmhibk5wZEdsdmJpMWpiMnh2Y25NaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQkRiR1ZoY2lCQmJHd0tJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZZblYwZEc5dVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlpHbDJQZ29nSUNBZ0lDQWdJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJQ0FnSUNBZ0lEd2hMUzBnUkhKaFp5QmhibVFnUkhKdmNDQmFiMjVsSUMwdFBnb2dJQ0FnSUNBZ0lDQWdJQ0E4WkdsMkNpQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdROUltUnliM0JhYjI1bElnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUdOc1lYTnpQU0p5Wld4aGRHbDJaU0JpYjNKa1pYSXRNaUJpYjNKa1pYSXRaR0Z6YUdWa0lHSnZjbVJsY2kxemJHRjBaUzB6TURBZ1pHRnlhenBpYjNKa1pYSXRaM0poZVMwM01EQWdjbTkxYm1SbFpDMHllR3dnY0MwMklIUmxlSFF0WTJWdWRHVnlJR2h2ZG1WeU9tSnZjbVJsY2kxemJHRjBaUzAwTURBZ1pHRnlhenBvYjNabGNqcGliM0prWlhJdFozSmhlUzAxTURBZ2RISmhibk5wZEdsdmJpMWhiR3dnWTNWeWMyOXlMWEJ2YVc1MFpYSWdZbWN0YzJ4aGRHVXROVEF2TnpBZ1pHRnlhenBpWnkxbmNtRjVMVGd3TUM4ME1DSUtJQ0FnSUNBZ0lDQWdJQ0FnUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhwYm5CMWRDQnBaRDBpWm1sc1pVbHVjSFYwSWlCMGVYQmxQU0ptYVd4bElpQmpiR0Z6Y3owaWFHbGtaR1Z1SWlCdGRXeDBhWEJzWlNBdlBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR4a2FYWWdZMnhoYzNNOUluTndZV05sTFhrdE1pNDFJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhrYVhZZ2FXUTlJbVJ5YjNCYWIyNWxTV052YmtKaFpHZGxJaUJqYkdGemN6MGlkeTB4TWlCb0xURXlJSEp2ZFc1a1pXUXRNbmhzSUcxNExXRjFkRzhnWm14bGVDQnBkR1Z0Y3kxalpXNTBaWElnYW5WemRHbG1lUzFqWlc1MFpYSWdkR1Y0ZEMxM2FHbDBaU0J6YUdGa2IzY3RiV1FpUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGMzWm5JR05zWVhOelBTSjNMVFlnYUMwMklpQm1hV3hzUFNKdWIyNWxJaUJ6ZEhKdmEyVTlJbU4xY25KbGJuUkRiMnh2Y2lJZ2MzUnliMnRsTFhkcFpIUm9QU0l5SWlCMmFXVjNRbTk0UFNJd0lEQWdNalFnTWpRaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lITjBjbTlyWlMxc2FXNWxZMkZ3UFNKeWIzVnVaQ0lnYzNSeWIydGxMV3hwYm1WcWIybHVQU0p5YjNWdVpDSWdaRDBpVFRjZ01UWmhOQ0EwSURBZ01ERXRMamc0TFRjdU9UQXpRVFVnTlNBd0lERXhNVFV1T1NBMlRERTJJRFpoTlNBMUlEQWdNREV4SURrdU9VMHhOU0F4TTJ3dE15MHpiVEFnTUd3dE15QXpiVE10TTNZeE1pSXZQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4TDNOMlp6NEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEdScGRqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEFnWTJ4aGMzTTlJblJsZUhRdGMyMGdabTl1ZEMxaWIyeGtJSFJsZUhRdGMyeGhkR1V0T0RBd0lHUmhjbXM2ZEdWNGRDMXpiR0YwWlMweE1EQWlQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUVOc2FXTnJJSFJ2SUdOb2IyOXpaU0JtYVd4bGN5QThjM0JoYmlCamJHRnpjejBpWm05dWRDMXViM0p0WVd3Z2RHVjRkQzF6YkdGMFpTMDFNREFnWkdGeWF6cDBaWGgwTFhOc1lYUmxMVFF3TUNJK2IzSWdaSEpoWnlBbVlXMXdPeUJrY205d0lHaGxjbVU4TDNOd1lXNCtDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2Y0Q0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQWdhV1E5SW1SeWIzQmFiMjVsVTNWaWRHVjRkQ0lnWTJ4aGMzTTlJblJsZUhRdGVITWdkR1Y0ZEMxemJHRjBaUzAxTURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRRd01DQnRkQzB3TGpVaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRkJ5YjJObGMzTmxaQ0F4TURBbElHeHZZMkZzYkhrZ2FXNGdlVzkxY2lCaWNtOTNjMlZ5SU9LQWxDQjViM1Z5SUdacGJHVnpJRzVsZG1WeUlHeGxZWFpsSUhsdmRYSWdaR1YyYVdObENpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZjRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlpHbDJQZ29nSUNBZ0lDQWdJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJQ0FnSUNBZ0lEd2hMUzBnVlhCc2IyRmtaV1FnTHlCTWIyRmtaV1FnUm1sc1pYTWdUR2x6ZENBdExUNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdScGRpQnBaRDBpWm1sc1pWRjFaWFZsUTI5dWRHRnBibVZ5SWlCamJHRnpjejBpYUdsa1pHVnVJSE53WVdObExYa3RNaUkrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdQR1JwZGlCamJHRnpjejBpWm14bGVDQnBkR1Z0Y3kxalpXNTBaWElnYW5WemRHbG1lUzFpWlhSM1pXVnVJSFJsZUhRdGVITWdkR1Y0ZEMxemJHRjBaUzAxTURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRRd01DQndlQzB4SWo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4emNHRnVJR2xrUFNKbWFXeGxVWFZsZFdWRGIzVnVkQ0lnWTJ4aGMzTTlJbVp2Ym5RdGMyVnRhV0p2YkdRaVBqRWdabWxzWlNCeVpXRmtlVHd2YzNCaGJqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHpjR0Z1SUdsa1BTSm1hV3hsVVhWbGRXVlNaVzl5WkdWeVNHbHVkQ0krVlhObElHRnljbTkzY3lCMGJ5QnlaVzl5WkdWeUlITmxjWFZsYm1ObFBDOXpjR0Z1UGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR4a2FYWWdhV1E5SW1acGJHVlJkV1YxWlV4cGMzUWlJR05zWVhOelBTSnpjR0ZqWlMxNUxUSWdiV0Y0TFdndE5UWWdiM1psY21ac2IzY3RlUzFoZFhSdklHTjFjM1J2YlMxelkzSnZiR3hpWVhJZ2NISXRNU0krQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4SVMwdElGQnZjSFZzWVhSbFpDQmtlVzVoYldsallXeHNlU0F0TFQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4TDJScGRqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEM5a2FYWStDaUFnSUNBZ0lDQWdJQ0E4TDJScGRqNEtDaUFnSUNBZ0lDQWdJQ0E4SVMwdElGUnZiMnd0VTNCbFkybG1hV01nUTI5dVptbG5kWEpoZEdsdmJpQW1JRWx1ZEdWeVlXTjBhWFpsSUVOdmJuUnliMnh6SUMwdFBnb2dJQ0FnSUNBZ0lDQWdQR1JwZGlCamJHRnpjejBpWW1jdGQyaHBkR1VnWkdGeWF6cGlaeTFuY21GNUxUa3dNQ0J5YjNWdVpHVmtMVEo0YkNCaWIzSmtaWElnWW05eVpHVnlMWE5zWVhSbExUSXdNQ0JrWVhKck9tSnZjbVJsY2kxbmNtRjVMVGd3TUNCd0xUVWdjMmhoWkc5M0xYTnRJSE53WVdObExYa3ROQ0krQ2lBZ0lDQWdJQ0FnSUNBZ0lEeGthWFlnWTJ4aGMzTTlJbVpzWlhnZ2FYUmxiWE10WTJWdWRHVnlJR3AxYzNScFpua3RZbVYwZDJWbGJpQmliM0prWlhJdFlpQmliM0prWlhJdGMyeGhkR1V0TVRBd0lHUmhjbXM2WW05eVpHVnlMV2R5WVhrdE9EQXdJSEJpTFRNaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR4b015QmpiR0Z6Y3owaWRHVjRkQzF6YlNCbWIyNTBMV0p2YkdRZ2RHVjRkQzF6YkdGMFpTMDVNREFnWkdGeWF6cDBaWGgwTFhkb2FYUmxJajR5TGlCRGIyNW1hV2QxY21VZ1ZHOXZiQ0JUWlhSMGFXNW5jend2YURNK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhOd1lXNGdhV1E5SW5SdmIyeERiMjVtYVdkVGRXSjBhWFJzWlNJZ1kyeGhjM005SW5SbGVIUXRlSE1nWm05dWRDMXRaV1JwZFcwZ2RHVjRkQzF6YkdGMFpTMDFNREFnWkdGeWF6cDBaWGgwTFhOc1lYUmxMVFF3TUNJK1EzVnpkRzl0SUhCaGNtRnRaWFJsY25NOEwzTndZVzQrQ2lBZ0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvS0lDQWdJQ0FnSUNBZ0lDQWdQQ0V0TFNCRWVXNWhiV2xqSUZSdmIyd2dUM0IwYVc5dWN5QkdiM0p0SUVOdmJuUmhhVzVsY2lBdExUNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdScGRpQnBaRDBpZEc5dmJFOXdkR2x2Ym5ORGIyNTBZV2x1WlhJaUlHTnNZWE56UFNKemNHRmpaUzE1TFRRaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR3aExTMGdVRzl3ZFd4aGRHVmtJSEJsY2kxMGIyOXNJR0o1SUVwVElDMHRQZ29nSUNBZ0lDQWdJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJQ0FnSUNBZ0lEd2hMUzBnVUhKcGJXRnllU0JGZUdWamRYUmxJRUZqZEdsdmJpQkNkWFIwYjI0Z0xTMCtDaUFnSUNBZ0lDQWdJQ0FnSUR4a2FYWWdZMnhoYzNNOUluQjBMVElpUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhpZFhSMGIyNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbGtQU0p5ZFc1VWIyOXNRV04wYVc5dVFuUnVJZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkSGx3WlQwaVluVjBkRzl1SWdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJ4aGMzTTlJbmN0Wm5Wc2JDQndlUzB6TGpVZ2NIZ3ROaUJ5YjNWdVpHVmtMWGhzSUdadmJuUXRZbTlzWkNCMFpYaDBMWGRvYVhSbElIUmxlSFF0YzIwZ2MyMDZkR1Y0ZEMxaVlYTmxJSE5vWVdSdmR5MXNaeUJtYkdWNElHbDBaVzF6TFdObGJuUmxjaUJxZFhOMGFXWjVMV05sYm5SbGNpQm5ZWEF0TWk0MUlIUnlZVzV6YVhScGIyNHRZV3hzSUdodmRtVnlPbTl3WVdOcGRIa3RPVFVnWVdOMGFYWmxPbk5qWVd4bExWc3dMams1WFNJS0lDQWdJQ0FnSUNBZ0lDQWdJQ0ErQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4YzNabklHTnNZWE56UFNKM0xUVWdhQzAxSWlCbWFXeHNQU0p1YjI1bElpQnpkSEp2YTJVOUltTjFjbkpsYm5SRGIyeHZjaUlnYzNSeWIydGxMWGRwWkhSb1BTSXlMaklpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUhOMGNtOXJaUzFzYVc1bFkyRndQU0p5YjNWdVpDSWdjM1J5YjJ0bExXeHBibVZxYjJsdVBTSnliM1Z1WkNJZ1pEMGlUVEV6SURFd1ZqTk1OQ0F4TkdnM2RqZHNPUzB4TVdndE4zb2lMejRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2YzNablBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BITndZVzRnYVdROUluSjFibFJ2YjJ4QlkzUnBiMjVDZEc1VVpYaDBJajVRY205alpYTnpJRVpwYkdVZ1RtOTNQQzl6Y0dGdVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlluVjBkRzl1UGdvZ0lDQWdJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvS0lDQWdJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJQ0FnUENFdExTQlNhV2RvZENCRGIyeDFiVzRnS0RVZ1kyOXNjeWs2SUVsdWRHVnlZV04wYVhabElFeHBkbVVnVjI5eWEySmxibU5vTENCV2FYTjFZV3dnUTJGdWRtRnpJRkJ5WlhacFpYY2dKaUJQZFhSd2RYUWdSRzkzYm14dllXUWdMUzArQ2lBZ0lDQWdJQ0FnUEdScGRpQmpiR0Z6Y3owaWJHYzZZMjlzTFhOd1lXNHROU0J6Y0dGalpTMTVMVFVpUGdvS0lDQWdJQ0FnSUNBZ0lEd2hMUzBnVEdsMlpTQkViMk4xYldWdWRDQXZJRU5oYm5aaGN5Qkpibk53WldOMGIzSWdRMkZ5WkNBdExUNEtJQ0FnSUNBZ0lDQWdJRHhrYVhZZ1kyeGhjM005SW1KbkxYZG9hWFJsSUdSaGNtczZZbWN0WjNKaGVTMDVNREFnY205MWJtUmxaQzB5ZUd3Z1ltOXlaR1Z5SUdKdmNtUmxjaTF6YkdGMFpTMHlNREFnWkdGeWF6cGliM0prWlhJdFozSmhlUzA0TURBZ2NDMDFJSE5vWVdSdmR5MXpiU0J6Y0dGalpTMTVMVFFpUGdvZ0lDQWdJQ0FnSUNBZ0lDQThaR2wySUdOc1lYTnpQU0ptYkdWNElHbDBaVzF6TFdObGJuUmxjaUJxZFhOMGFXWjVMV0psZEhkbFpXNGdZbTl5WkdWeUxXSWdZbTl5WkdWeUxYTnNZWFJsTFRFd01DQmtZWEpyT21KdmNtUmxjaTFuY21GNUxUZ3dNQ0J3WWkweklqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFpHbDJQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQR2d6SUdOc1lYTnpQU0owWlhoMExYTnRJR1p2Ym5RdFltOXNaQ0IwWlhoMExYTnNZWFJsTFRrd01DQmtZWEpyT25SbGVIUXRkMmhwZEdVaVBreHBkbVVnUkc5amRXMWxiblFnVUhKbGRtbGxkeUFtWVcxd095Qkpibk53WldOMGIzSThMMmd6UGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhBZ2FXUTlJbkJ5WlhacFpYZFRkR0YwZFhOVGRXSjBhWFJzWlNJZ1kyeGhjM005SW5SbGVIUXRlSE1nZEdWNGRDMXpiR0YwWlMwMU1EQWdaR0Z5YXpwMFpYaDBMWE5zWVhSbExUUXdNQ0krU1c1MFpYSmhZM1JwZG1VZ2NISmxkbWxsZHlCMWNHUmhkR1Z6SUdGMWRHOXRZWFJwWTJGc2JIazhMM0ErQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdQQzlrYVhZK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhOd1lXNGdhV1E5SW5CaFoyVkRiM1Z1ZEZCcGJHd2lJR05zWVhOelBTSndlQzB5TGpVZ2NIa3RNU0J5YjNWdVpHVmtMV3huSUhSbGVIUXRlSE1nWm05dWRDMXRiMjV2SUdadmJuUXRjMlZ0YVdKdmJHUWdZbWN0YzJ4aGRHVXRNVEF3SUdSaGNtczZZbWN0WjNKaGVTMDRNREFnZEdWNGRDMXpiR0YwWlMwM01EQWdaR0Z5YXpwMFpYaDBMWE5zWVhSbExUTXdNQ0krTUNCd1lXZGxjend2YzNCaGJqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEM5a2FYWStDZ29nSUNBZ0lDQWdJQ0FnSUNBOElTMHRJRlpwYzNWaGJDQlFjbVYyYVdWM0lGTjBZV2RsSUMwdFBnb2dJQ0FnSUNBZ0lDQWdJQ0E4WkdsMklHbGtQU0pzYVhabFVISmxkbWxsZDFOMFlXZGxJaUJqYkdGemN6MGliV2x1TFdndFd6TXdNSEI0WFNCdFlYZ3RhQzFiTkRZd2NIaGRJRzkyWlhKbWJHOTNMWGt0WVhWMGJ5QmpkWE4wYjIwdGMyTnliMnhzWW1GeUlISnZkVzVrWldRdGVHd2dZbWN0YzJ4aGRHVXRNVEF3THpnd0lHUmhjbXM2WW1jdFozSmhlUzA1TlRBdk9EQWdZbTl5WkdWeUlHSnZjbVJsY2kxemJHRjBaUzB5TURBdk9EQWdaR0Z5YXpwaWIzSmtaWEl0WjNKaGVTMDRNREFnY0MwMElHWnNaWGdnWm14bGVDMWpiMndnYVhSbGJYTXRZMlZ1ZEdWeUlHcDFjM1JwWm5rdFkyVnVkR1Z5SUhSbGVIUXRZMlZ1ZEdWeUlqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBOElTMHRJRkJ2Y0hWc1lYUmxaQ0JrZVc1aGJXbGpZV3hzZVNBdExUNEtJQ0FnSUNBZ0lDQWdJQ0FnUEM5a2FYWStDaUFnSUNBZ0lDQWdJQ0E4TDJScGRqNEtDaUFnSUNBZ0lDQWdJQ0E4SVMwdElFTnZiWEJzWlhSbFpDQlNaWE4xYkhRZ0ppQkViM2R1Ykc5aFpDQkRZWEprSUMwdFBnb2dJQ0FnSUNBZ0lDQWdQR1JwZGlCcFpEMGljbVZ6ZFd4MFJHOTNibXh2WVdSRFlYSmtJaUJqYkdGemN6MGlhR2xrWkdWdUlHSm5MV1Z0WlhKaGJHUXROVEF2T1RBZ1pHRnlhenBpWnkxbGJXVnlZV3hrTFRrMU1DODBNQ0J5YjNWdVpHVmtMVEo0YkNCaWIzSmtaWEl0TWlCaWIzSmtaWEl0WlcxbGNtRnNaQzAxTURBdk56QWdjQzAxSUhOb1lXUnZkeTF0WkNCemNHRmpaUzE1TFRRaVBnb2dJQ0FnSUNBZ0lDQWdJQ0E4WkdsMklHTnNZWE56UFNKbWJHVjRJR2wwWlcxekxYTjBZWEowSUdwMWMzUnBabmt0WW1WMGQyVmxiaUJuWVhBdE15SStDaUFnSUNBZ0lDQWdJQ0FnSUNBZ1BHUnBkaUJqYkdGemN6MGlabXhsZUNCcGRHVnRjeTFqWlc1MFpYSWdaMkZ3TFRNaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BHUnBkaUJqYkdGemN6MGlkeTB4TUNCb0xURXdJSEp2ZFc1a1pXUXRlR3dnWW1jdFpXMWxjbUZzWkMwMU1EQWdkR1Y0ZEMxM2FHbDBaU0JtYkdWNElHbDBaVzF6TFdObGJuUmxjaUJxZFhOMGFXWjVMV05sYm5SbGNpQnphSEpwYm1zdE1DQnphR0ZrYjNjaVBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjM1puSUdOc1lYTnpQU0ozTFRZZ2FDMDJJaUJtYVd4c1BTSnViMjVsSWlCemRISnZhMlU5SW1OMWNuSmxiblJEYjJ4dmNpSWdjM1J5YjJ0bExYZHBaSFJvUFNJeUxqUWlJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0krQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lpQnpkSEp2YTJVdGJHbHVaV3B2YVc0OUluSnZkVzVrSWlCa1BTSk5OU0F4TTJ3MElEUk1NVGtnTnlJdlBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMM04yWno0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlpHbDJQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQR1JwZGo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BHZzBJR2xrUFNKeVpYTjFiSFJVYVhSc1pWUmxlSFFpSUdOc1lYTnpQU0owWlhoMExYTnRJR1p2Ym5RdFpYaDBjbUZpYjJ4a0lIUmxlSFF0YzJ4aGRHVXRPVEF3SUdSaGNtczZkR1Y0ZEMxM2FHbDBaU0krVkdGemF5QkRiMjF3YkdWMFpXUWhQQzlvTkQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQWdhV1E5SW5KbGMzVnNkRTFsZEdGVVpYaDBJaUJqYkdGemN6MGlkR1Y0ZEMxNGN5QjBaWGgwTFhOc1lYUmxMVFl3TUNCa1lYSnJPblJsZUhRdGMyeGhkR1V0TXpBd0lqNVpiM1Z5SUc5MWRIQjFkQ0JtYVd4bElHbHpJSEpsWVdSNUlIUnZJR1J2ZDI1c2IyRmtMand2Y0Q0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlpHbDJQZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh6Y0dGdUlHbGtQU0p5WlhOMWJIUkdiM0p0WVhSQ1lXUm5aU0lnWTJ4aGMzTTlJbkI0TFRJdU5TQndlUzB4SUhKdmRXNWtaV1F0YldRZ2RHVjRkQzE0Y3lCbWIyNTBMVzF2Ym04Z1ptOXVkQzFpYjJ4a0lHSm5MV1Z0WlhKaGJHUXROakF3SUhSbGVIUXRkMmhwZEdVZ2RYQndaWEpqWVhObElqNVFSRVk4TDNOd1lXNCtDaUFnSUNBZ0lDQWdJQ0FnSUR3dlpHbDJQZ29LSUNBZ0lDQWdJQ0FnSUNBZ1BDRXRMU0JGZUhSeVlTQlNaWE4xYkhRZ1UzVnRiV0Z5ZVNBdklGUmxlSFFnVDNWMGNIVjBJRUp2ZUNBb1ptOXlJRUZKSUZOMWJXMWhjbWw2WlhJc0lGUnlZVzV6YkdGMFpTd2dUV0Z5YTJSdmQyNHNJRTlEVWl3Z1EyOXRjR0Z5WlN3Z1pYUmpMaWtnTFMwK0NpQWdJQ0FnSUNBZ0lDQWdJRHhrYVhZZ2FXUTlJbkpsYzNWc2RGSnBZMmhRY21WMmFXVjNWM0poY0NJZ1kyeGhjM005SW1ocFpHUmxiaUJ6Y0dGalpTMTVMVElpUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhrYVhZZ1kyeGhjM005SW1ac1pYZ2dhWFJsYlhNdFkyVnVkR1Z5SUdwMWMzUnBabmt0WW1WMGQyVmxiaUkrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4YzNCaGJpQmpiR0Z6Y3owaWRHVjRkQzE0Y3lCbWIyNTBMV0p2YkdRZ2RHVjRkQzF6YkdGMFpTMDNNREFnWkdGeWF6cDBaWGgwTFhOc1lYUmxMVEl3TUNJZ2FXUTlJbkpsYzNWc2RGSnBZMmhRY21WMmFXVjNUR0ZpWld3aVBrZGxibVZ5WVhSbFpDQlBkWFJ3ZFhRZ1EyOXVkR1Z1ZER3dmMzQmhiajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHhpZFhSMGIyNGdhV1E5SW1OdmNIbFNaWE4xYkhSVVpYaDBRblJ1SWlCMGVYQmxQU0ppZFhSMGIyNGlJR05zWVhOelBTSndlQzB5TGpVZ2NIa3RNU0J5YjNWdVpHVmtMV3huSUhSbGVIUXRlSE1nWm05dWRDMXpaVzFwWW05c1pDQmlaeTEzYUdsMFpTQmtZWEpyT21KbkxXZHlZWGt0T0RBd0lIUmxlSFF0YzJ4aGRHVXROekF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzB5TURBZ1ltOXlaR1Z5SUdKdmNtUmxjaTF6YkdGMFpTMHlNREFnWkdGeWF6cGliM0prWlhJdFozSmhlUzAzTURBZ2FHOTJaWEk2WW1jdGMyeGhkR1V0TVRBd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdRMjl3ZVNCRGIyNTBaVzUwQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4TDJKMWRIUnZiajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0hKbElHbGtQU0p5WlhOMWJIUlNhV05vVUhKbGRtbGxkMEp2ZUNJZ1kyeGhjM005SW5BdE15QnliM1Z1WkdWa0xYaHNJR0puTFhkb2FYUmxJR1JoY21zNlltY3RaM0poZVMwNU1EQWdZbTl5WkdWeUlHSnZjbVJsY2kxemJHRjBaUzB5TURBZ1pHRnlhenBpYjNKa1pYSXRaM0poZVMwNE1EQWdkR1Y0ZEMxNGN5Qm1iMjUwTFcxdmJtOGdkR1Y0ZEMxemJHRjBaUzA0TURBZ1pHRnlhenAwWlhoMExYTnNZWFJsTFRJd01DQnRZWGd0YUMwMU5pQnZkbVZ5Wm14dmR5MTVMV0YxZEc4Z1kzVnpkRzl0TFhOamNtOXNiR0poY2lCM2FHbDBaWE53WVdObExYQnlaUzEzY21Gd0lqNDhMM0J5WlQ0S0lDQWdJQ0FnSUNBZ0lDQWdQQzlrYVhZK0Nnb2dJQ0FnSUNBZ0lDQWdJQ0E4WkdsMklHTnNZWE56UFNKbWJHVjRJR1pzWlhndGQzSmhjQ0JwZEdWdGN5MWpaVzUwWlhJZ1oyRndMVEl1TlNJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEdFS0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsa1BTSmtiM2R1Ykc5aFpGSmxjM1ZzZEV4cGJtc2lDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm9jbVZtUFNJalpHOTNibXh2WVdRaUNpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCa2IzZHViRzloWkQwaWIzVjBjSFYwTG5Ca1ppSUtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnNZWE56UFNKbWJHVjRMVEVnY0hrdE15QndlQzAwSUhKdmRXNWtaV1F0ZUd3Z1ltY3RaVzFsY21Gc1pDMDJNREFnYUc5MlpYSTZZbWN0WlcxbGNtRnNaQzAzTURBZ2RHVjRkQzEzYUdsMFpTQm1iMjUwTFdKdmJHUWdkR1Y0ZEMxNGN5QnpiVHAwWlhoMExYTnRJSFJsZUhRdFkyVnVkR1Z5SUhOb1lXUnZkeUJtYkdWNElHbDBaVzF6TFdObGJuUmxjaUJxZFhOMGFXWjVMV05sYm5SbGNpQm5ZWEF0TWlCMGNtRnVjMmwwYVc5dUxXTnZiRzl5Y3lJS0lDQWdJQ0FnSUNBZ0lDQWdJQ0ErQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4YzNabklHTnNZWE56UFNKM0xUUWdhQzAwSWlCbWFXeHNQU0p1YjI1bElpQnpkSEp2YTJVOUltTjFjbkpsYm5SRGIyeHZjaUlnYzNSeWIydGxMWGRwWkhSb1BTSXlMaklpSUhacFpYZENiM2c5SWpBZ01DQXlOQ0F5TkNJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUhOMGNtOXJaUzFzYVc1bFkyRndQU0p5YjNWdVpDSWdjM1J5YjJ0bExXeHBibVZxYjJsdVBTSnliM1Z1WkNJZ1pEMGlUVFFnTVRaMk1XRXpJRE1nTUNBd01ETWdNMmd4TUdFeklETWdNQ0F3TURNdE0zWXRNVzB0TkMwMGJDMDBJRFJ0TUNBd2JDMDBMVFJ0TkNBMFZqUWlMejRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2YzNablBnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BITndZVzRnYVdROUltUnZkMjVzYjJGa1VtVnpkV3gwUW5SdVRHRmlaV3dpUGtSdmQyNXNiMkZrSUU5MWRIQjFkQ0JHYVd4bFBDOXpjR0Z1UGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJRHd2WVQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WW5WMGRHOXVDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaRDBpYzJWdVpFOTFkSEIxZEZSdlFXNXZkR2hsY2xSdmIyeENkRzRpQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwZVhCbFBTSmlkWFIwYjI0aUNpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamJHRnpjejBpY0hrdE15QndlQzB6TGpVZ2NtOTFibVJsWkMxNGJDQmlaeTEzYUdsMFpTQmtZWEpyT21KbkxXZHlZWGt0T0RBd0lHaHZkbVZ5T21KbkxYTnNZWFJsTFRFd01DQmtZWEpyT21odmRtVnlPbUpuTFdkeVlYa3ROekF3SUhSbGVIUXRjMnhoZEdVdE56QXdJR1JoY21zNmRHVjRkQzF6YkdGMFpTMHlNREFnWW05eVpHVnlJR0p2Y21SbGNpMXpiR0YwWlMweU1EQWdaR0Z5YXpwaWIzSmtaWEl0WjNKaGVTMDNNREFnWm05dWRDMXpaVzFwWW05c1pDQjBaWGgwTFhoeklIUnlZVzV6YVhScGIyNHRZMjlzYjNKeklnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RHbDBiR1U5SWxWelpTQjBhR2x6SUc5MWRIQjFkQ0JRUkVZZ1lYTWdkR2hsSUdsdWNIVjBJR1p2Y2lCaGJtOTBhR1Z5SUhSdmIyd2lDaUFnSUNBZ0lDQWdJQ0FnSUNBZ1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1EyOXVkR2x1ZFdVZ2FXNGdRVzV2ZEdobGNpQlViMjlzSU9LR2tnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlluVjBkRzl1UGdvZ0lDQWdJQ0FnSUNBZ0lDQThMMlJwZGo0S0lDQWdJQ0FnSUNBZ0lEd3ZaR2wyUGdvS0lDQWdJQ0FnSUNBOEwyUnBkajRLQ2lBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnUEM5elpXTjBhVzl1UGdvS0lDQThMMjFoYVc0K0Nnb2dJRHdoTFMwZ1ZHOWhjM1FnVG05MGFXWnBZMkYwYVc5dUlDMHRQZ29nSUR4a2FYWWdhV1E5SW5SdllYTjBRbUZ1Ym1WeUlpQmpiR0Z6Y3owaVptbDRaV1FnWW05MGRHOXRMVFVnY21sbmFIUXROU0I2TFRVd0lHaHBaR1JsYmlCMGNtRnVjMlp2Y20wZ2RISmhibk5wZEdsdmJpMWhiR3dnWkhWeVlYUnBiMjR0TWpBd0lqNEtJQ0FnSUR4a2FYWWdZMnhoYzNNOUltWnNaWGdnYVhSbGJYTXRZMlZ1ZEdWeUlHZGhjQzB6SUhCNExUUWdjSGt0TXlCeWIzVnVaR1ZrTFRKNGJDQmlaeTF6YkdGMFpTMDVNREFnWkdGeWF6cGlaeTEzYUdsMFpTQjBaWGgwTFhkb2FYUmxJR1JoY21zNmRHVjRkQzF6YkdGMFpTMDVNREFnYzJoaFpHOTNMWGhzSUdKdmNtUmxjaUJpYjNKa1pYSXRjMnhoZEdVdE56QXdJR1JoY21zNlltOXlaR1Z5TFhOc1lYUmxMVEl3TUNCMFpYaDBMWGh6SUhOdE9uUmxlSFF0YzIwZ1ptOXVkQzF6WlcxcFltOXNaQ0krQ2lBZ0lDQWdJRHh6Y0dGdUlHbGtQU0owYjJGemRFUnZkQ0lnWTJ4aGMzTTlJbmN0TWk0MUlHZ3RNaTQxSUhKdmRXNWtaV1F0Wm5Wc2JDQmlaeTFsYldWeVlXeGtMVFF3TUNCemFISnBibXN0TUNJK1BDOXpjR0Z1UGdvZ0lDQWdJQ0E4YzNCaGJpQnBaRDBpZEc5aGMzUk5aWE56WVdkbElqNUJZM1JwYjI0Z1kyOXRjR3hsZEdWa1BDOXpjR0Z1UGdvZ0lDQWdQQzlrYVhZK0NpQWdQQzlrYVhZK0Nnb2dJRHdoTFMwZ1JtOXZkR1Z5SUMwdFBnb2dJRHhtYjI5MFpYSWdZMnhoYzNNOUltMTBMVEV5SUdKdmNtUmxjaTEwSUdKdmNtUmxjaTF6YkdGMFpTMHlNREFnWkdGeWF6cGliM0prWlhJdFozSmhlUzA0TURBZ1ltY3RkMmhwZEdVdk5qQWdaR0Z5YXpwaVp5MW5jbUY1TFRrd01DODJNQ0J3ZVMwMklqNEtJQ0FnSUR4a2FYWWdZMnhoYzNNOUltMWhlQzEzTFRkNGJDQnRlQzFoZFhSdklIQjRMVFFnYzIwNmNIZ3ROaUJzWnpwd2VDMDRJR1pzWlhnZ1pteGxlQzFqYjJ3Z2MyMDZabXhsZUMxeWIzY2dhWFJsYlhNdFkyVnVkR1Z5SUdwMWMzUnBabmt0WW1WMGQyVmxiaUJuWVhBdE5DQjBaWGgwTFhoeklIUmxlSFF0YzJ4aGRHVXROVEF3SUdSaGNtczZkR1Y0ZEMxemJHRjBaUzAwTURBaVBnb2dJQ0FnSUNBOFpHbDJJR05zWVhOelBTSm1iR1Y0SUdsMFpXMXpMV05sYm5SbGNpQm5ZWEF0TWlJK0NpQWdJQ0FnSUNBZ1BITndZVzRnWTJ4aGMzTTlJbVp2Ym5RdFltOXNaQ0IwWlhoMExYTnNZWFJsTFRnd01DQmtZWEpyT25SbGVIUXRjMnhoZEdVdE1qQXdJajVRUkVaTllYaDRQQzl6Y0dGdVBnb2dJQ0FnSUNBZ0lEeHpjR0Z1UHVLQWxDQkRiMjF3YkdWMFpTQXpNUzFVYjI5c0lFWnBiR1VnUTI5dWRtVnljMmx2Yml3Z1JXUnBkR2x1WnlBbVlXMXdPeUJCU1NCVGRXbDBaVHd2YzNCaGJqNEtJQ0FnSUNBZ1BDOWthWFkrQ2lBZ0lDQWdJRHhrYVhZZ1kyeGhjM005SW1ac1pYZ2dabXhsZUMxM2NtRndJR2wwWlcxekxXTmxiblJsY2lCbllYQXRNeUkrQ2lBZ0lDQWdJQ0FnUEhOd1lXNCtWMmhwZEdVZ0ptRnRjRHNnUkdGeWF5Qk5iMlJsSUZKbFlXUjVQQzl6Y0dGdVBnb2dJQ0FnSUNBZ0lEeHpjR0Z1UHVLQW9qd3ZjM0JoYmo0S0lDQWdJQ0FnSUNBOGMzQmhiajR6TVNCRGIyeHZjaTFFYVhOMGFXNW5kV2x6YUdWa0lFWmxZWFIxY21WelBDOXpjR0Z1UGdvZ0lDQWdJQ0FnSUR4emNHRnVQdUtBb2p3dmMzQmhiajRLSUNBZ0lDQWdJQ0E4YzNCaGJqNU1iMk5oYkNCQ2NtOTNjMlZ5SUZCeWIyTmxjM05wYm1jOEwzTndZVzQrQ2lBZ0lDQWdJRHd2WkdsMlBnb2dJQ0FnUEM5a2FYWStDaUFnUEM5bWIyOTBaWEkrQ2dvZ0lDQWdQQ0V0TFNCTmIyUjFiR0Z5SUVGd2NHeHBZMkYwYVc5dUlGTmpjbWx3ZEhNZ0tFVmthWFFnYVc0Z2MzSmpMMnB6THlCcGJpQldVeUJEYjJSbEtTQXRMVDRLSUNBOGMyTnlhWEIwSUhOeVl6MGlhbk12ZEc5dmJITXRZMjl1Wm1sbkxtcHpJajQ4TDNOamNtbHdkRDRLSUNBOGMyTnlhWEIwSUhOeVl6MGlhbk12YzNSaGRHVXVhbk1pUGp3dmMyTnlhWEIwUGdvZ0lEeHpZM0pwY0hRZ2MzSmpQU0pxY3k5d1pHWXRaVzVuYVc1bExtcHpJajQ4TDNOamNtbHdkRDRLSUNBOGMyTnlhWEIwSUhOeVl6MGlhbk12Y0hKdlkyVnpjMjl5TG1weklqNDhMM05qY21sd2RENEtJQ0E4YzJOeWFYQjBJSE55WXowaWFuTXZkV2t1YW5NaVBqd3ZjMk55YVhCMFBnbzhMMkp2WkhrK0Nqd3ZhSFJ0YkQ0SyIsICIudnNjb2RlL2xhdW5jaC5qc29uIjogImV3b2dJQ0oyWlhKemFXOXVJam9nSWpBdU1pNHdJaXdLSUNBaVkyOXVabWxuZFhKaGRHbHZibk1pT2lCYkNpQWdJQ0I3Q2lBZ0lDQWdJQ0p1WVcxbElqb2dJa3hoZFc1amFDQlFSRVpOWVhoNElDaE5iMlIxYkdGeUlITnlZeTlwYm1SbGVDNW9kRzFzSUdsdUlFVmtaMlVwSWl3S0lDQWdJQ0FnSW5SNWNHVWlPaUFpYlhObFpHZGxJaXdLSUNBZ0lDQWdJbkpsY1hWbGMzUWlPaUFpYkdGMWJtTm9JaXdLSUNBZ0lDQWdJbVpwYkdVaU9pQWlKSHQzYjNKcmMzQmhZMlZHYjJ4a1pYSjlMM055WXk5cGJtUmxlQzVvZEcxc0lnb2dJQ0FnZlN3S0lDQWdJSHNLSUNBZ0lDQWdJbTVoYldVaU9pQWlUR0YxYm1Ob0lGQkVSazFoZUhnZ1JHVnphM1J2Y0NCQmNIQWdLRVZzWldOMGNtOXVLU0lzQ2lBZ0lDQWdJQ0owZVhCbElqb2dJbTV2WkdVaUxBb2dJQ0FnSUNBaWNtVnhkV1Z6ZENJNklDSnNZWFZ1WTJnaUxBb2dJQ0FnSUNBaWNuVnVkR2x0WlVWNFpXTjFkR0ZpYkdVaU9pQWlKSHQzYjNKcmMzQmhZMlZHYjJ4a1pYSjlMMjV2WkdWZmJXOWtkV3hsY3k4dVltbHVMMlZzWldOMGNtOXVJaXdLSUNBZ0lDQWdJbmRwYm1SdmQzTWlPaUI3Q2lBZ0lDQWdJQ0FnSW5KMWJuUnBiV1ZGZUdWamRYUmhZbXhsSWpvZ0lpUjdkMjl5YTNOd1lXTmxSbTlzWkdWeWZTOXViMlJsWDIxdlpIVnNaWE12TG1KcGJpOWxiR1ZqZEhKdmJpNWpiV1FpQ2lBZ0lDQWdJSDBzQ2lBZ0lDQWdJQ0poY21keklqb2dXd29nSUNBZ0lDQWdJQ0l1SWdvZ0lDQWdJQ0JkTEFvZ0lDQWdJQ0FpYjNWMGNIVjBRMkZ3ZEhWeVpTSTZJQ0p6ZEdRaUNpQWdJQ0I5Q2lBZ1hRcDkiLCAiLnZzY29kZS90YXNrcy5qc29uIjogImV3b2dJQ0oyWlhKemFXOXVJam9nSWpJdU1DNHdJaXdLSUNBaWRHRnphM01pT2lCYkNpQWdJQ0I3Q2lBZ0lDQWdJQ0pzWVdKbGJDSTZJQ0pDZFdsc1pDQW1JRXhoZFc1amFDQlFSRVpOWVhoNExtVjRaU0lzQ2lBZ0lDQWdJQ0owZVhCbElqb2dJbk5vWld4c0lpd0tJQ0FnSUNBZ0ltTnZiVzFoYm1RaU9pQWlKSHQzYjNKcmMzQmhZMlZHYjJ4a1pYSjlMMEoxYVd4a1gyRnVaRjlNWVhWdVkyaGZVRVJHVFdGNGVDNWlZWFFpTEFvZ0lDQWdJQ0FpWjNKdmRYQWlPaUI3Q2lBZ0lDQWdJQ0FnSW10cGJtUWlPaUFpWW5WcGJHUWlMQW9nSUNBZ0lDQWdJQ0pwYzBSbFptRjFiSFFpT2lCMGNuVmxDaUFnSUNBZ0lIMHNDaUFnSUNBZ0lDSndjbVZ6Wlc1MFlYUnBiMjRpT2lCN0NpQWdJQ0FnSUNBZ0luSmxkbVZoYkNJNklDSmhiSGRoZVhNaUxBb2dJQ0FnSUNBZ0lDSndZVzVsYkNJNklDSnphR0Z5WldRaUNpQWdJQ0FnSUgwc0NpQWdJQ0FnSUNKd2NtOWliR1Z0VFdGMFkyaGxjaUk2SUZ0ZENpQWdJQ0I5TEFvZ0lDQWdld29nSUNBZ0lDQWliR0ZpWld3aU9pQWlRblZ1Wkd4bElITnlZeThnYVc1MGJ5QmthWE4wTDJsdVpHVjRMbWgwYld3Z0ppQlFSRVpOWVhoNExtVjRaU0FvVUhsMGFHOXVLU0lzQ2lBZ0lDQWdJQ0owZVhCbElqb2dJbk5vWld4c0lpd0tJQ0FnSUNBZ0ltTnZiVzFoYm1RaU9pQWljSGwwYUc5dUlHUmxjMnQwYjNBdlluVnBiR1JmWlhobExuQjVJaXdLSUNBZ0lDQWdJbWR5YjNWd0lqb2dJbUoxYVd4a0lpd0tJQ0FnSUNBZ0luQnliMkpzWlcxTllYUmphR1Z5SWpvZ1cxMEtJQ0FnSUgwS0lDQmRDbjA9IiwgIi52c2NvZGUvc2V0dGluZ3MuanNvbiI6ICJld29nSUNKbFpHbDBiM0l1ZEdGaVUybDZaU0k2SURJc0NpQWdJbVZrYVhSdmNpNW1iM0p0WVhSUGJsTmhkbVVpT2lCMGNuVmxMQW9nSUNKbWFXeGxjeTVsYm1OdlpHbHVaeUk2SUNKMWRHWTRJaXdLSUNBaWJHbDJaVk5sY25abGNpNXpaWFIwYVc1bmN5NXliMjkwSWpvZ0lpOXpjbU1pQ24wPSIsICIudnNjb2RlL2V4dGVuc2lvbnMuanNvbiI6ICJld29nSUNKeVpXTnZiVzFsYm1SaGRHbHZibk1pT2lCYkNpQWdJQ0FpY21sMGQybGphMlJsZVM1c2FYWmxjMlZ5ZG1WeUlpd0tJQ0FnSUNKbGMySmxibkF1Y0hKbGRIUnBaWEl0ZG5OamIyUmxJaXdLSUNBZ0lDSnRjeTEyYzJOdlpHVXVhbk10WkdWaWRXY2lDaUFnWFFwOSIsICJkZXNrdG9wL21haW4uanMiOiAiWTI5dWMzUWdleUJoY0hBc0lFSnliM2R6WlhKWGFXNWtiM2NnZlNBOUlISmxjWFZwY21Vb0oyVnNaV04wY205dUp5azdDbU52Ym5OMElIQmhkR2dnUFNCeVpYRjFhWEpsS0Nkd1lYUm9KeWs3Q2dwbWRXNWpkR2x2YmlCamNtVmhkR1ZYYVc1a2IzY29LU0I3Q2lBZ1kyOXVjM1FnZDJsdUlEMGdibVYzSUVKeWIzZHpaWEpYYVc1a2IzY29ld29nSUNBZ2QybGtkR2c2SURFME1EQXNDaUFnSUNCb1pXbG5hSFE2SURrd01Dd0tJQ0FnSUcxcGJsZHBaSFJvT2lBNU5qQXNDaUFnSUNCdGFXNUlaV2xuYUhRNklEWTBNQ3dLSUNBZ0lIUnBkR3hsT2lBblVFUkdUV0Y0ZUNEaWdKUWdNekV0Vkc5dmJDQlFSRVlnUTI5dWRtVnlkR1Z5TENCRlpHbDBiM0lnSmlCQlNTQlRkV2wwWlNjc0NpQWdJQ0JoZFhSdlNHbGtaVTFsYm5WQ1lYSTZJSFJ5ZFdVc0NpQWdJQ0JpWVdOclozSnZkVzVrUTI5c2IzSTZJQ2NqTURrd1JERTJKeXdLSUNBZ0lIZGxZbEJ5WldabGNtVnVZMlZ6T2lCN0NpQWdJQ0FnSUc1dlpHVkpiblJsWjNKaGRHbHZiam9nWm1Gc2MyVXNDaUFnSUNBZ0lHTnZiblJsZUhSSmMyOXNZWFJwYjI0NklIUnlkV1VLSUNBZ0lIMEtJQ0I5S1RzS0NpQWdMeThnVEc5aFpDQjBhR1VnYlc5a2RXeGhjaUJ6Y21NdmFXNWtaWGd1YUhSdGJDQm1iM0lnWldGemVTQldVeUJEYjJSbElHVmthWFJwYm1jS0lDQmpiMjV6ZENCemNtTklkRzFzSUQwZ2NHRjBhQzVxYjJsdUtGOWZaR2x5Ym1GdFpTd2dKeTR1Snl3Z0ozTnlZeWNzSUNkcGJtUmxlQzVvZEcxc0p5azdDaUFnZDJsdUxteHZZV1JHYVd4bEtITnlZMGgwYld3cE93cDlDZ3BoY0hBdWQyaGxibEpsWVdSNUtDa3VkR2hsYmloamNtVmhkR1ZYYVc1a2IzY3BPd3BoY0hBdWIyNG9KM2RwYm1SdmR5MWhiR3d0WTJ4dmMyVmtKeXdnS0NrZ1BUNGdld29nSUdsbUlDaHdjbTlqWlhOekxuQnNZWFJtYjNKdElDRTlQU0FuWkdGeWQybHVKeWtnWVhCd0xuRjFhWFFvS1RzS2ZTazdDZz09IiwgImRlc2t0b3AvUERGTWF4eERlc2t0b3AuY3MiOiAiZFhOcGJtY2dVM2x6ZEdWdE93cDFjMmx1WnlCVGVYTjBaVzB1UkdsaFoyNXZjM1JwWTNNN0NuVnphVzVuSUZONWMzUmxiUzVKVHpzS2RYTnBibWNnVTNsemRHVnRMbGRwYm1SdmQzTXVSbTl5YlhNN0NncGpiR0Z6Y3lCUVJFWk5ZWGg0UkdWemEzUnZjRUZ3Y0NCN0NpQWdJQ0JiVTFSQlZHaHlaV0ZrWFFvZ0lDQWdjM1JoZEdsaklIWnZhV1FnVFdGcGJpZ3BJSHNLSUNBZ0lDQWdJQ0J6ZEhKcGJtY2dZbUZ6WlVScGNpQTlJRUZ3Y0VSdmJXRnBiaTVEZFhKeVpXNTBSRzl0WVdsdUxrSmhjMlZFYVhKbFkzUnZjbms3Q2lBZ0lDQWdJQ0FnYzNSeWFXNW5JSE55WTBoMGJXd2dQU0JRWVhSb0xrTnZiV0pwYm1Vb1ltRnpaVVJwY2l3Z0luTnlZeUlzSUNKcGJtUmxlQzVvZEcxc0lpazdDaUFnSUNBZ0lDQWdjM1J5YVc1bklISnZiM1JJZEcxc0lEMGdVR0YwYUM1RGIyMWlhVzVsS0dKaGMyVkVhWElzSUNKcGJtUmxlQzVvZEcxc0lpazdDaUFnSUNBZ0lDQWdjM1J5YVc1bklIUmhjbWRsZEVoMGJXd2dQU0JHYVd4bExrVjRhWE4wY3loemNtTklkRzFzS1NBL0lITnlZMGgwYld3Z09pQnliMjkwU0hSdGJEc0tDaUFnSUNBZ0lDQWdhV1lnS0NGR2FXeGxMa1Y0YVhOMGN5aDBZWEpuWlhSSWRHMXNLU2tnZXdvZ0lDQWdJQ0FnSUNBZ0lDQk5aWE56WVdkbFFtOTRMbE5vYjNjb0lrTnZkV3hrSUc1dmRDQm1hVzVrSUhOeVl5OXBibVJsZUM1b2RHMXNJRzl5SUdsdVpHVjRMbWgwYld3Z2FXNDZJQ0lnS3lCaVlYTmxSR2x5TENBaVVFUkdUV0Y0ZUNCRmNuSnZjaUlzSUUxbGMzTmhaMlZDYjNoQ2RYUjBiMjV6TGs5TExDQk5aWE56WVdkbFFtOTRTV052Ymk1RmNuSnZjaWs3Q2lBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmpzS0lDQWdJQ0FnSUNCOUNnb2dJQ0FnSUNBZ0lITjBjbWx1WnlCbWFXeGxWWEpwSUQwZ2JtVjNJRlZ5YVNoMFlYSm5aWFJJZEcxc0tTNUJZbk52YkhWMFpWVnlhVHNLSUNBZ0lDQWdJQ0J6ZEhKcGJtY2dZWEJ3UVhKbmN5QTlJQ0l0TFdGd2NEMWNJaUlnS3lCbWFXeGxWWEpwSUNzZ0lsd2lJQzB0ZDJsdVpHOTNMWE5wZW1VOU1UUXdNQ3c1TURBaU93b0tJQ0FnSUNBZ0lDQnpkSEpwYm1kYlhTQmxaR2RsVUdGMGFITWdQU0J1WlhjZ2MzUnlhVzVuVzEwZ2V3b2dJQ0FnSUNBZ0lDQWdJQ0JBSWtNNlhGQnliMmR5WVcwZ1JtbHNaWE1nS0hnNE5pbGNUV2xqY205emIyWjBYRVZrWjJWY1FYQndiR2xqWVhScGIyNWNiWE5sWkdkbExtVjRaU0lzQ2lBZ0lDQWdJQ0FnSUNBZ0lFQWlRenBjVUhKdlozSmhiU0JHYVd4bGMxeE5hV055YjNOdlpuUmNSV1JuWlZ4QmNIQnNhV05oZEdsdmJseHRjMlZrWjJVdVpYaGxJaXdLSUNBZ0lDQWdJQ0FnSUNBZ0ltMXpaV1JuWlM1bGVHVWlDaUFnSUNBZ0lDQWdmVHNLQ2lBZ0lDQWdJQ0FnWm05eVpXRmphQ0FvYzNSeWFXNW5JR1ZrWjJVZ2FXNGdaV1JuWlZCaGRHaHpLU0I3Q2lBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3Q2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JRY205alpYTnpVM1JoY25SSmJtWnZJSEJ6YVNBOUlHNWxkeUJRY205alpYTnpVM1JoY25SSmJtWnZLQ2s3Q2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3YzJrdVJtbHNaVTVoYldVZ1BTQmxaR2RsT3dvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0hOcExrRnlaM1Z0Wlc1MGN5QTlJR0Z3Y0VGeVozTTdDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndjMmt1VlhObFUyaGxiR3hGZUdWamRYUmxJRDBnZEhKMVpUc0tJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lGQnliMk5sYzNNdVUzUmhjblFvY0hOcEtUc0tJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmpzS0lDQWdJQ0FnSUNBZ0lDQWdmU0JqWVhSamFDQjdJSDBLSUNBZ0lDQWdJQ0I5Q2dvZ0lDQWdJQ0FnSUZCeWIyTmxjM011VTNSaGNuUW9ibVYzSUZCeWIyTmxjM05UZEdGeWRFbHVabThvZEdGeVoyVjBTSFJ0YkNrZ2V5QlZjMlZUYUdWc2JFVjRaV04xZEdVZ1BTQjBjblZsSUgwcE93b2dJQ0FnZlFwOUNnPT0iLCAiZGVza3RvcC9idWlsZF9leGUucHkiOiAiSXlFdmRYTnlMMkpwYmk5bGJuWWdjSGwwYUc5dU13b2lJaUlLVUVSR1RXRjRlQ0JDZFc1a2JHVnlJRk5qY21sd2RDQm1iM0lnVmxNZ1EyOWtaUXBEYjIxaWFXNWxjeUJ0YjJSMWJHRnlJR1pwYkdWeklHbHVJSE55WXk4Z0tITnlZeTlwYm1SbGVDNW9kRzFzTENCemNtTXZZM056TDNOMGVXeGxjeTVqYzNNc0lITnlZeTlxY3k4cUxtcHpLUXBwYm5SdklIUm9aU0J6YVc1bmJHVXRabWxzWlNCeWIyOTBJR2x1WkdWNExtaDBiV3dnWVc1a0lHUnBjM1F2YVc1a1pYZ3VhSFJ0YkM0S0lpSWlDbWx0Y0c5eWRDQnZjd29LY205dmRGOWthWElnUFNCdmN5NXdZWFJvTG1ScGNtNWhiV1VvYjNNdWNHRjBhQzVrYVhKdVlXMWxLRzl6TG5CaGRHZ3VZV0p6Y0dGMGFDaGZYMlpwYkdWZlh5a3BLUXB6Y21OZlpHbHlJRDBnYjNNdWNHRjBhQzVxYjJsdUtISnZiM1JmWkdseUxDQWljM0pqSWlrS0NuZHBkR2dnYjNCbGJpaHZjeTV3WVhSb0xtcHZhVzRvYzNKalgyUnBjaXdnSW1sdVpHVjRMbWgwYld3aUtTd2dJbklpTENCbGJtTnZaR2x1WnowaWRYUm1MVGdpS1NCaGN5Qm1PZ29nSUNBZ2FIUnRiQ0E5SUdZdWNtVmhaQ2dwQ2dwM2FYUm9JRzl3Wlc0b2IzTXVjR0YwYUM1cWIybHVLSE55WTE5a2FYSXNJQ0pqYzNNaUxDQWljM1I1YkdWekxtTnpjeUlwTENBaWNpSXNJR1Z1WTI5a2FXNW5QU0oxZEdZdE9DSXBJR0Z6SUdZNkNpQWdJQ0JqYzNNZ1BTQm1MbkpsWVdRb0tRb0thbk5mWm1sc1pYTWdQU0JiSW5SdmIyeHpMV052Ym1acFp5NXFjeUlzSUNKemRHRjBaUzVxY3lJc0lDSndaR1l0Wlc1bmFXNWxMbXB6SWl3Z0luQnliMk5sYzNOdmNpNXFjeUlzSUNKMWFTNXFjeUpkQ21welgyTnZiV0pwYm1Wa0lEMGdXMTBLWm05eUlHcG1JR2x1SUdwelgyWnBiR1Z6T2dvZ0lDQWdkMmwwYUNCdmNHVnVLRzl6TG5CaGRHZ3VhbTlwYmloemNtTmZaR2x5TENBaWFuTWlMQ0JxWmlrc0lDSnlJaXdnWlc1amIyUnBibWM5SW5WMFppMDRJaWtnWVhNZ1pqb0tJQ0FnSUNBZ0lDQnFjMTlqYjIxaWFXNWxaQzVoY0hCbGJtUW9aaTV5WldGa0tDa3BDZ3BvZEcxc0lEMGdhSFJ0YkM1eVpYQnNZV05sS0NjZ0lEeHNhVzVySUhKbGJEMGljM1I1YkdWemFHVmxkQ0lnYUhKbFpqMGlZM056TDNOMGVXeGxjeTVqYzNNaUlDOCtKeXdnWmlJZ0lEeHpkSGxzWlQ1Y2JudGpjM045WEc0Z0lEd3ZjM1I1YkdVK0lpa0tjMk55YVhCMGMxOWliRzlqYXlBOUlDZ0tJQ0FnSUNjZ0lEd2hMUzBnVFc5a2RXeGhjaUJCY0hCc2FXTmhkR2x2YmlCVFkzSnBjSFJ6SUNoRlpHbDBJR2x1SUhOeVl5OXFjeThnYVc0Z1ZsTWdRMjlrWlNrZ0xTMCtYRzRuQ2lBZ0lDQW5JQ0E4YzJOeWFYQjBJSE55WXowaWFuTXZkRzl2YkhNdFkyOXVabWxuTG1weklqNDhMM05qY21sd2RENWNiaWNLSUNBZ0lDY2dJRHh6WTNKcGNIUWdjM0pqUFNKcWN5OXpkR0YwWlM1cWN5SStQQzl6WTNKcGNIUStYRzRuQ2lBZ0lDQW5JQ0E4YzJOeWFYQjBJSE55WXowaWFuTXZjR1JtTFdWdVoybHVaUzVxY3lJK1BDOXpZM0pwY0hRK1hHNG5DaUFnSUNBbklDQThjMk55YVhCMElITnlZejBpYW5NdmNISnZZMlZ6YzI5eUxtcHpJajQ4TDNOamNtbHdkRDVjYmljS0lDQWdJQ2NnSUR4elkzSnBjSFFnYzNKalBTSnFjeTkxYVM1cWN5SStQQzl6WTNKcGNIUStKd29wQ21oMGJXd2dQU0JvZEcxc0xuSmxjR3hoWTJVb2MyTnlhWEIwYzE5aWJHOWpheXdnSWlBZ1BITmpjbWx3ZEQ1Y2JpSWdLeUFpWEc1Y2JpSXVhbTlwYmlocWMxOWpiMjFpYVc1bFpDa2dLeUFpWEc0Z0lEd3ZjMk55YVhCMFBpSXBDZ3AzYVhSb0lHOXdaVzRvYjNNdWNHRjBhQzVxYjJsdUtISnZiM1JmWkdseUxDQWlhVzVrWlhndWFIUnRiQ0lwTENBaWR5SXNJR1Z1WTI5a2FXNW5QU0oxZEdZdE9DSXBJR0Z6SUdZNkNpQWdJQ0JtTG5keWFYUmxLR2gwYld3cENncHZjeTV0WVd0bFpHbHljeWh2Y3k1d1lYUm9MbXB2YVc0b2NtOXZkRjlrYVhJc0lDSmthWE4wSWlrc0lHVjRhWE4wWDI5clBWUnlkV1VwQ25kcGRHZ2diM0JsYmlodmN5NXdZWFJvTG1wdmFXNG9jbTl2ZEY5a2FYSXNJQ0prYVhOMElpd2dJbWx1WkdWNExtaDBiV3dpS1N3Z0luY2lMQ0JsYm1OdlpHbHVaejBpZFhSbUxUZ2lLU0JoY3lCbU9nb2dJQ0FnWmk1M2NtbDBaU2hvZEcxc0tRb0tjSEpwYm5Rb0lsTjFZMk5sYzNObWRXeHNlU0JpZFc1a2JHVmtJSE55WXk4Z2FXNTBieUJwYm1SbGVDNW9kRzFzSUdGdVpDQmthWE4wTDJsdVpHVjRMbWgwYld3aElpa0siLCAiQnVpbGRfYW5kX0xhdW5jaF9QREZNYXh4LmJhdCI6ICJRR1ZqYUc4Z2IyWm1EUXAwYVhSc1pTQlFSRVpOWVhoNElPS0FsQ0JXVXlCRGIyUmxJRUoxYVd4a0lDWWdSR1Z6YTNSdmNDQk1ZWFZ1WTJobGNnMEtZMlFnTDJRZ0lpVitaSEF3SWcwS0RRcGxZMmh2SUZzeEx6TmRJRk41Ym1OcGJtY2diVzlrZFd4aGNpQnpjbU12SUdacGJHVnpMaTR1RFFwM2FHVnlaU0J3ZVhSb2IyNGdQbTUxYkNBeVBtNTFiQTBLYVdZZ0pVVlNVazlTVEVWV1JVd2xJRVZSVlNBd0lDZ05DaUFnSUNCd2VYUm9iMjRnWkdWemEzUnZjRnhpZFdsc1pGOWxlR1V1Y0hrTkNpa05DZzBLWldOb2J5QmJNaTh6WFNCRGIyMXdhV3hwYm1jZ2JtRjBhWFpsSUZkcGJtUnZkM01nUkdWemEzUnZjQ0JsZUdWamRYUmhZbXhsSUNoUVJFWk5ZWGg0TG1WNFpTa3VMaTROQ25ObGRDQkRVME0yTkQwbFYwbE9SRWxTSlZ4TmFXTnliM052Wm5RdVRrVlVYRVp5WVcxbGQyOXlhelkwWEhZMExqQXVNekF6TVRsY1kzTmpMbVY0WlEwS2MyVjBJRU5UUXpNeVBTVlhTVTVFU1ZJbFhFMXBZM0p2YzI5bWRDNU9SVlJjUm5KaGJXVjNiM0pyWEhZMExqQXVNekF6TVRsY1kzTmpMbVY0WlEwS0RRcHBaaUJsZUdsemRDQWlKVU5UUXpZMEpTSWdLQTBLSUNBZ0lDSWxRMU5ETmpRbElpQXZkR0Z5WjJWME9uZHBibVY0WlNBdmIzVjBPbEJFUmsxaGVIZ3VaWGhsSUM5eU9sTjVjM1JsYlM1WGFXNWtiM2R6TGtadmNtMXpMbVJzYkNCa1pYTnJkRzl3WEZCRVJrMWhlSGhFWlhOcmRHOXdMbU56SUQ1dWRXd05DaUFnSUNCamIzQjVJQzlaSUZCRVJrMWhlSGd1WlhobElHUnBjM1JjVUVSR1RXRjRlQzVsZUdVZ1BtNTFiQTBLSUNBZ0lHVmphRzhnSUNBZ0lDQWdRblZwYkhRZ1VFUkdUV0Y0ZUM1bGVHVWdjM1ZqWTJWemMyWjFiR3g1SVEwS0tTQmxiSE5sSUdsbUlHVjRhWE4wSUNJbFExTkRNeklsSWlBb0RRb2dJQ0FnSWlWRFUwTXpNaVVpSUM5MFlYSm5aWFE2ZDJsdVpYaGxJQzl2ZFhRNlVFUkdUV0Y0ZUM1bGVHVWdMM0k2VTNsemRHVnRMbGRwYm1SdmQzTXVSbTl5YlhNdVpHeHNJR1JsYzJ0MGIzQmNVRVJHVFdGNGVFUmxjMnQwYjNBdVkzTWdQbTUxYkEwS0lDQWdJR052Y0hrZ0wxa2dVRVJHVFdGNGVDNWxlR1VnWkdsemRGeFFSRVpOWVhoNExtVjRaU0ErYm5Wc0RRb2dJQ0FnWldOb2J5QWdJQ0FnSUNCQ2RXbHNkQ0JRUkVaTllYaDRMbVY0WlNCemRXTmpaWE56Wm5Wc2JIa2hEUW9wRFFvTkNtVmphRzhnV3pNdk0xMGdUR0YxYm1Ob2FXNW5JRkJFUmsxaGVIZ2dSR1Z6YTNSdmNDQkJjSEJzYVdOaGRHbHZiaTR1TGcwS2MzUmhjblFnSWlJZ0lpVitaSEF3VUVSR1RXRjRlQzVsZUdVaURRbz0iLCAicGFja2FnZS5qc29uIjogImV3b2dJQ0p1WVcxbElqb2dJbkJrWm0xaGVIZ2lMQW9nSUNKMlpYSnphVzl1SWpvZ0lqSXVNQzR3SWl3S0lDQWlaR1Z6WTNKcGNIUnBiMjRpT2lBaVVFUkdUV0Y0ZUNCY2RUSXdNVFFnUVd4c0xXbHVMVTl1WlNBek1TMVViMjlzSUZCRVJpQkRiMjUyWlhKMFpYSXNJRVZrYVhSdmNpQW1JRUZKSUVSbGMydDBiM0FnVTNWcGRHVWlMQW9nSUNKdFlXbHVJam9nSW1SbGMydDBiM0F2YldGcGJpNXFjeUlzQ2lBZ0luTmpjbWx3ZEhNaU9pQjdDaUFnSUNBaWMzUmhjblFpT2lBaVpXeGxZM1J5YjI0Z0xpSXNDaUFnSUNBaVluVnBiR1E2WW5WdVpHeGxJam9nSW5CNWRHaHZiaUJrWlhOcmRHOXdMMkoxYVd4a1gyVjRaUzV3ZVNJc0NpQWdJQ0FpWW5WcGJHUTZkMmx1SWpvZ0lrSjFhV3hrWDJGdVpGOU1ZWFZ1WTJoZlVFUkdUV0Y0ZUM1aVlYUWlMQW9nSUNBZ0luQmhZMnM2Wld4bFkzUnliMjRpT2lBaVpXeGxZM1J5YjI0dFluVnBiR1JsY2lBdExYZHBiaUJ3YjNKMFlXSnNaU0lLSUNCOUxBb2dJQ0poZFhSb2IzSWlPaUFpUVhKcWRXNGdSR2x1WlhOb0lFMWxibTl1SWl3S0lDQWliR2xqWlc1elpTSTZJQ0pOU1ZRaUxBb2dJQ0prWlhaRVpYQmxibVJsYm1OcFpYTWlPaUI3Q2lBZ0lDQWlaV3hsWTNSeWIyNGlPaUFpWGpJNExqQXVNQ0lzQ2lBZ0lDQWlaV3hsWTNSeWIyNHRZblZwYkdSbGNpSTZJQ0plTWpRdU9TNHhJZ29nSUgwc0NpQWdJbUoxYVd4a0lqb2dld29nSUNBZ0ltRndjRWxrSWpvZ0ltTnZiUzVoY21wMWJtUnBibVZ6YUcxbGJtOXVMbkJrWm0xaGVIZ2lMQW9nSUNBZ0luQnliMlIxWTNST1lXMWxJam9nSWxCRVJrMWhlSGdpTEFvZ0lDQWdJbVpwYkdWeklqb2dXd29nSUNBZ0lDQWljM0pqTHlvcUx5b2lMQW9nSUNBZ0lDQWlaR1Z6YTNSdmNDOHFLaThxSWl3S0lDQWdJQ0FnSW1sdVpHVjRMbWgwYld3aUxBb2dJQ0FnSUNBaWNHRmphMkZuWlM1cWMyOXVJZ29nSUNBZ1hTd0tJQ0FnSUNKM2FXNGlPaUI3Q2lBZ0lDQWdJQ0owWVhKblpYUWlPaUFpY0c5eWRHRmliR1VpTEFvZ0lDQWdJQ0FpWVhKMGFXWmhZM1JPWVcxbElqb2dJbEJFUmsxaGVIZ3VaWGhsSWdvZ0lDQWdmUW9nSUgwS2ZRPT0iLCAiUkVBRE1FLm1kIjogIkl5QlFSRVpOWVhoNElPS0FsQ0JCYkd3dGFXNHRUMjVsSURNeExWUnZiMndnVUVSR0lFTnZiblpsY25SbGNpd2dSV1JwZEc5eUlDWWdRVWtnVTNWcGRHVUtDaU1qSUZCeWIycGxZM1FnUm1sc1pTQlRkSEoxWTNSMWNtVWdLRkpsWVdSNUlHWnZjaUJXVXlCRGIyUmxLUW9LWUdCZ2RHVjRkQXBRUkVaTllYaDRMd3JpbEp6aWxJRGlsSUFnTG5aelkyOWtaUzhLNHBTQ0lDQWc0cFNjNHBTQTRwU0FJR3hoZFc1amFDNXFjMjl1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJeUJRY21WemN5QkdOU0JwYmlCV1V5QkRiMlJsSUhSdklHeGhkVzVqYUM5a1pXSjFaeUIwYUdVZ1lYQndDdUtVZ2lBZ0lPS1VuT0tVZ09LVWdDQjBZWE5yY3k1cWMyOXVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDTWdVSEpsYzNNZ1EzUnliQ3RUYUdsbWRDdENJR2x1SUZaVElFTnZaR1VnZEc4Z1luVnBiR1FnVUVSR1RXRjRlQzVsZUdVSzRwU0NJQ0FnNHBTYzRwU0E0cFNBSUhObGRIUnBibWR6TG1wemIyNGdJQ0FnSUNBZ0lDQWdJQ0FnSXlCWGIzSnJjM0JoWTJVZ1ptOXliV0YwZEdsdVp5QW1JRXhwZG1VZ1UyVnlkbVZ5SUhObGRIUnBibWR6Q3VLVWdpQWdJT0tVbE9LVWdPS1VnQ0JsZUhSbGJuTnBiMjV6TG1wemIyNGdJQ0FnSUNBZ0lDQWdJQ01nVW1WamIyMXRaVzVrWldRZ1ZsTWdRMjlrWlNCbGVIUmxibk5wYjI1ekN1S1VuT0tVZ09LVWdDQnpjbU12SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FqSUR3dExTQkZSRWxVSUZsUFZWSWdVMDlWVWtORklFTlBSRVVnU0VWU1JTQkpUaUJXVXlCRFQwUkZDdUtVZ2lBZ0lPS1VuT0tVZ09LVWdDQnBibVJsZUM1b2RHMXNJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDTWdUV0ZwYmlCSVZFMU1JR3hoZVc5MWRDQW1JRlZKSUhOb1pXeHNDdUtVZ2lBZ0lPS1VuT0tVZ09LVWdDQmpjM012Q3VLVWdpQWdJT0tVZ2lBZ0lPS1VsT0tVZ09LVWdDQnpkSGxzWlhNdVkzTnpJQ0FnSUNBZ0lDQWdJQ0FnSXlCRGRYTjBiMjBnUTFOVElIWmhjbWxoWW14bGN5d2dUR2xuYUhRdlJHRnlheUJ0YjJSbElDWWdZVzVwYldGMGFXOXVjd3JpbElJZ0lDRGlsSlRpbElEaWxJQWdhbk12Q3VLVWdpQWdJQ0FnSUNEaWxKemlsSURpbElBZ2RHOXZiSE10WTI5dVptbG5MbXB6SUNBZ0lDQWdJQ01nUVd4c0lETXhJSFJ2YjJ3Z1pHVm1hVzVwZEdsdmJuTXNJR052Ykc5eWN5d2dhV052Ym5NZ0ppQmpZWFJsWjI5eWFXVnpDdUtVZ2lBZ0lDQWdJQ0RpbEp6aWxJRGlsSUFnYzNSaGRHVXVhbk1nSUNBZ0lDQWdJQ0FnSUNBZ0lDTWdSMnh2WW1Gc0lHRndjR3hwWTJGMGFXOXVJSE4wWVhSbElDWWdabWxzWlNCeGRXVjFaU0J6ZEdGMFpRcmlsSUlnSUNBZ0lDQWc0cFNjNHBTQTRwU0FJSEJrWmkxbGJtZHBibVV1YW5NZ0lDQWdJQ0FnSUNBaklFMTFiSFJwTFhCaFoyVWdVRVJHTG1weklIQmhjbk5sY2l3Z1JFOURXQzlZVEZOWUwxQlFWRmdnWW5WcGJHUmxjbk1LNHBTQ0lDQWdJQ0FnSU9LVW5PS1VnT0tVZ0NCd2NtOWpaWE56YjNJdWFuTWdJQ0FnSUNBZ0lDQWdJeUJGZUdWamRYUnBiMjRnWlc1bmFXNWxJR1p2Y2lCaGJHd2dNekVnVUVSR0lDWWdZMjl1ZG1WeWMybHZiaUIwYjI5c2N3cmlsSUlnSUNBZ0lDQWc0cFNVNHBTQTRwU0FJSFZwTG1weklDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBaklGTmxZWEpqYUNCaVlYSXNJSFJ2YjJ3Z1kyRnlaSE1zSUd4cGRtVWdjR0ZuWlNCd2NtVjJhV1YzSUNZZ2JHbHpkR1Z1WlhKekN1S1VuT0tVZ09LVWdDQmtaWE5yZEc5d0x3cmlsSUlnSUNEaWxKemlsSURpbElBZ1VFUkdUV0Y0ZUVSbGMydDBiM0F1WTNNZ0lDQWdJQ0FnSUNBaklFNWhkR2wyWlNCWGFXNWtiM2R6SUVNaklHUmxjMnQwYjNBZ1lYQndJR3hoZFc1amFHVnlJQ2hzYjJGa2N5QnpjbU12YVc1a1pYZ3VhSFJ0YkNrSzRwU0NJQ0FnNHBTYzRwU0E0cFNBSUcxaGFXNHVhbk1nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSXlCRmJHVmpkSEp2YmlCa1pYTnJkRzl3SUhkeVlYQndaWElnWlc1MGNua2djRzlwYm5RSzRwU0NJQ0FnNHBTVTRwU0E0cFNBSUdKMWFXeGtYMlY0WlM1d2VTQWdJQ0FnSUNBZ0lDQWdJQ0FnSXlCQ2RXNWtiR1Z6SUhOeVl5OGdhVzUwYnlCemFXNW5iR1V0Wm1sc1pTQnBibVJsZUM1b2RHMXNJQ1lnWkdsemRDOXBibVJsZUM1b2RHMXNDdUtVbk9LVWdPS1VnQ0JrYVhOMEx3cmlsSUlnSUNEaWxKemlsSURpbElBZ1VFUkdUV0Y0ZUM1bGVHVWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBaklFTnZiWEJwYkdWa0lITjBZVzVrWVd4dmJtVWdWMmx1Wkc5M2N5QmxlR1ZqZFhSaFlteGxDdUtVZ2lBZ0lPS1VsT0tVZ09LVWdDQnBibVJsZUM1b2RHMXNJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDTWdRblZ1Wkd4bFpDQnphVzVuYkdVdFptbHNaU0J3Y205a2RXTjBhVzl1SUVoVVRVd0s0cFNjNHBTQTRwU0FJRUoxYVd4a1gyRnVaRjlNWVhWdVkyaGZVRVJHVFdGNGVDNWlZWFFnSUNNZ1QyNWxMV05zYVdOcklGZHBibVJ2ZDNNZ2MyTnlhWEIwSUhSdklISmxZMjl0Y0dsc1pTQW1JR3hoZFc1amFDQlFSRVpOWVhoNExtVjRaUXJpbEp6aWxJRGlsSUFnVUVSR1RXRjRlQzVsZUdVZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0l5QlRkR0Z1WkdGc2IyNWxJRmRwYm1SdmQzTWdSR1Z6YTNSdmNDQkJjSEJzYVdOaGRHbHZiaUJsZUdWamRYUmhZbXhsQ3VLVW5PS1VnT0tVZ0NCcGJtUmxlQzVvZEcxc0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWpJRUoxYm1Sc1pXUWdjbTl2ZENCbGJuUnllU0J3YjJsdWRBcmlsSlRpbElEaWxJQWdjR0ZqYTJGblpTNXFjMjl1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSXlCT1VFMGdMeUJGYkdWamRISnZiaUJ3Y205cVpXTjBJR052Ym1acFozVnlZWFJwYjI0S1lHQmdDZ29qSXlCSWIzY2dkRzhnUldScGRDQW1JRUoxYVd4a0lHbHVJRlpUSUVOdlpHVUtDakV1SUNvcVQzQmxiaUJwYmlCV1V5QkRiMlJsS2lvNklFOXdaVzRnVmxNZ1EyOWtaU0JoYm1RZ2MyVnNaV04wSUNvcVJtbHNaU0RpaHBJZ1QzQmxiaUJHYjJ4a1pYSXVMaTRxS2lEaWhwSWdZMmh2YjNObElIbHZkWElnWUZCRVJrMWhlSGhnSUdadmJHUmxjaUFvWUVNNlhGVnpaWEp6WEV4bGJtOTJieTFRUTF4RWIyTjFiV1Z1ZEhOY1VISnZhbVZqZEhOY1VFUkdUV0Y0ZUdBcExnb3lMaUFxS2tWa2FYUWdUVzlrZFd4aGNpQlRiM1Z5WTJVZ1JtbHNaWE1xS2pvS0lDQWdMU0JGWkdsMElHQnpjbU12YW5NdmRHOXZiSE10WTI5dVptbG5MbXB6WUNCMGJ5QmphR0Z1WjJVZ2RHOXZiQ0IwYVhSc1pYTXNJR1JsYzJOeWFYQjBhVzl1Y3l3Z1kyOXNiM0p6TENCdmNpQnBZMjl1Y3k0S0lDQWdMU0JGWkdsMElHQnpjbU12WTNOekwzTjBlV3hsY3k1amMzTmdJSFJ2SUhSM1pXRnJJRXhwWjJoMEwwUmhjbXNnZEdobGJXVWdZMjlzYjNKeklHOXlJR05oY21RZ1lXNXBiV0YwYVc5dWN5NEtJQ0FnTFNCRlpHbDBJR0J6Y21NdmFuTXZjR1JtTFdWdVoybHVaUzVxYzJBZ2IzSWdZSE55WXk5cWN5OXdjbTlqWlhOemIzSXVhbk5nSUhSdklHTjFjM1J2YldsNlpTQmhibmtnYjJZZ2RHaGxJRE14SUdOdmJuWmxjbk5wYjI0dlpXUnBkR2x1WnlCbGJtZHBibVZ6TGdvZ0lDQXRJRVZrYVhRZ1lITnlZeTlwYm1SbGVDNW9kRzFzWUNCdmNpQmdjM0pqTDJwekwzVnBMbXB6WUNCMGJ5QnRiMlJwWm5rZ2RHaGxJR3hoZVc5MWRDQnZjaUJWU1NCamIyNTBjbTlzY3k0S015NGdLaXBKYm5OMFlXNTBJRkJ5WlhacFpYY2dKaUJTWldKMWFXeGtJR0JRUkVaTllYaDRMbVY0WldBcUtqb0tJQ0FnTFNBcUtrNXZkR1VxS2pvZ1lGQkVSazFoZUhoRVpYTnJkRzl3TG1OellDQmhkWFJ2YldGMGFXTmhiR3g1SUd4dllXUnpJR0J6Y21NdmFXNWtaWGd1YUhSdGJHQWdkMmhsYm1WMlpYSWdkR2hsSUdCemNtTXZZQ0JtYjJ4a1pYSWdhWE1nY0hKbGMyVnVkQ0VnVkdoaGRDQnRaV0Z1Y3lCaGJua2dZMmhoYm1kbElIbHZkU0J6WVhabElHbHVJR0J6Y21NdllDQnBiaUJXVXlCRGIyUmxJSFJoYTJWeklHVm1abVZqZENBcUttbHRiV1ZrYVdGMFpXeDVLaW9nZEdobElHNWxlSFFnZEdsdFpTQjViM1VnYkdGMWJtTm9JR0JRUkVaTllYaDRMbVY0WldBaENpQWdJQzBnVkc4Z2NtVXRZblZ1Wkd4bElHQnpjbU12WUNCcGJuUnZJSFJvWlNCemFXNW5iR1V0Wm1sc1pTQmdhVzVrWlhndWFIUnRiR0FnWVc1a0lISmxZMjl0Y0dsc1pTQmdVRVJHVFdGNGVDNWxlR1ZnTENCd2NtVnpjeUFxS21CRGRISnNLMU5vYVdaMEswSmdLaW9nYVc0Z1ZsTWdRMjlrWlNBb2IzSWdaRzkxWW14bExXTnNhV05ySUdCQ2RXbHNaRjloYm1SZlRHRjFibU5vWDFCRVJrMWhlSGd1WW1GMFlDa3VDZz09IiwgIi5naXRodWIvd29ya2Zsb3dzL2J1aWxkLWV4ZS55bWwiOiAiYm1GdFpUb2dRblZwYkdRZ1VFUkdUV0Y0ZUNCWGFXNWtiM2R6SUVWWVJRb0tiMjQ2Q2lBZ2NIVnphRG9LSUNBZ0lHSnlZVzVqYUdWek9pQmJJRzFoYVc0c0lHMWhjM1JsY2lCZENpQWdkMjl5YTJac2IzZGZaR2x6Y0dGMFkyZzZDZ3BxYjJKek9nb2dJR0oxYVd4a0xYZHBibVJ2ZDNNdFpYaGxPZ29nSUNBZ2NuVnVjeTF2YmpvZ2QybHVaRzkzY3kxc1lYUmxjM1FLSUNBZ0lITjBaWEJ6T2dvZ0lDQWdJQ0F0SUc1aGJXVTZJRU5vWldOcmIzVjBJSEpsY0c5emFYUnZjbmtLSUNBZ0lDQWdJQ0IxYzJWek9pQmhZM1JwYjI1ekwyTm9aV05yYjNWMFFIWTBDZ29nSUNBZ0lDQXRJRzVoYldVNklFSjFibVJzWlNCdGIyUjFiR0Z5SUhOeVl5OGdabWxzWlhNS0lDQWdJQ0FnSUNCeWRXNDZJSEI1ZEdodmJpQmtaWE5yZEc5d0wySjFhV3hrWDJWNFpTNXdlUW9LSUNBZ0lDQWdMU0J1WVcxbE9pQkRiMjF3YVd4bElGQkVSazFoZUhndVpYaGxDaUFnSUNBZ0lDQWdjblZ1T2lCRE9seFhhVzVrYjNkelhFMXBZM0p2YzI5bWRDNU9SVlJjUm5KaGJXVjNiM0pyTmpSY2RqUXVNQzR6TURNeE9WeGpjMk11WlhobElDOTBZWEpuWlhRNmQybHVaWGhsSUM5dmRYUTZVRVJHVFdGNGVDNWxlR1VnTDNJNlUzbHpkR1Z0TGxkcGJtUnZkM011Um05eWJYTXVaR3hzSUdSbGMydDBiM0JjVUVSR1RXRjRlRVJsYzJ0MGIzQXVZM01LQ2lBZ0lDQWdJQzBnYm1GdFpUb2dWWEJzYjJGa0lGQkVSazFoZUhndVpYaGxJRUZ5ZEdsbVlXTjBDaUFnSUNBZ0lDQWdkWE5sY3pvZ1lXTjBhVzl1Y3k5MWNHeHZZV1F0WVhKMGFXWmhZM1JBZGpRS0lDQWdJQ0FnSUNCM2FYUm9PZ29nSUNBZ0lDQWdJQ0FnYm1GdFpUb2dVRVJHVFdGNGVDMVhhVzVrYjNkekxVUmxjMnQwYjNBS0lDQWdJQ0FnSUNBZ0lIQmhkR2c2SUh3S0lDQWdJQ0FnSUNBZ0lDQWdVRVJHVFdGNGVDNWxlR1VLSUNBZ0lDQWdJQ0FnSUNBZ2FXNWtaWGd1YUhSdGJBb2dJQ0FnSUNBZ0lDQWdJQ0J6Y21NdkNnPT0ifQ==";
          const scaffoldMap = JSON.parse(atob(scaffoldB64));
          Object.keys(scaffoldMap).forEach(relPath => {
            root.file(relPath, scaffoldMap[relPath], { base64: true });
          });

          const fullHtml = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
          root.file('index.html', fullHtml);
          root.folder('dist').file('index.html', fullHtml);

          // Extract modular src/css/styles.css and src/js/*.js dynamically from the live application
          const styleEl = document.querySelector('style');
          const cssText = styleEl ? styleEl.textContent : '';
          root.folder('src').folder('css').file('styles.css', cssText);

          const scripts = Array.from(document.querySelectorAll('body script'));
          const bigScript = scripts.map(s => s.textContent).join('\n');
          const idx1 = bigScript.indexOf('// 1. COMPLETE SPECIFICATION');
          const idx2 = bigScript.indexOf('// 2. APPLICATION STATE');
          const idx3 = bigScript.indexOf('// 3. REAL PDF GENERATOR');
          const idx4 = bigScript.indexOf('// 4. RENDER DIRECTORY GRID');
          const idx8 = bigScript.indexOf('// 8. REAL FILE PROCESSING ENGINE');
          const idx9 = bigScript.indexOf('// 9. THEME SWITCHER');
          const srcJs = root.folder('src').folder('js');
          if (idx1 !== -1 && idx2 !== -1 && idx3 !== -1 && idx4 !== -1 && idx8 !== -1 && idx9 !== -1) {
            srcJs.file('tools-config.js', bigScript.slice(idx1, idx2));
            srcJs.file('state.js', bigScript.slice(idx2, idx3));
            srcJs.file('pdf-engine.js', bigScript.slice(idx3, idx4));
            srcJs.file('processor.js', bigScript.slice(idx8, idx9));
            srcJs.file('ui.js', bigScript.slice(idx4, idx8) + '\n' + bigScript.slice(idx9));
          }

          const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'PDFMaxx_VSCode_Project.zip';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          showToast('Downloaded PDFMaxx_VSCode_Project.zip (Ready for VS Code)!', '#2563EB');
        });
      }

      // Download a sample test PDF from header
      const downloadDemoPdfBtn = document.getElementById('downloadDemoPdfBtn');
      if (downloadDemoPdfBtn) {
        downloadDemoPdfBtn.addEventListener('click', async () => {
          const sample = await generateSamplePdfBytes('executive');
          const blob = new Blob([sample.bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'PDFMaxx_Sample_4Page_Report.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          showToast('Downloaded PDFMaxx_Sample_4Page_Report.pdf!', '#E11D48');
        });
      }

      // File Dropzone & Upload input
      const dropZone = document.getElementById('dropZone');
      const fileInput = document.getElementById('fileInput');
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('ring-2', 'ring-rose-500');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('ring-2', 'ring-rose-500');
      });
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('ring-2', 'ring-rose-500');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await handleSelectedFiles(e.dataTransfer.files);
        }
      });
      fileInput.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files.length > 0) {
          await handleSelectedFiles(fileInput.files);
          fileInput.value = '';
        }
      });

      document.getElementById('loadSampleBtn').addEventListener('click', () => {
        loadSampleFilesForCurrentTool(false);
      });

      document.getElementById('clearFilesBtn').addEventListener('click', () => {
        state.files = [];
        renderFileQueue();
        renderLivePreviewStage();
      });

      document.getElementById('runToolActionBtn').addEventListener('click', executeActiveTool);

      // Copy Rich Result Text
      document.getElementById('copyResultTextBtn').addEventListener('click', () => {
        const txt = state.lastOutputText || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).catch(() => {});
        } else {
          const ta = document.createElement('textarea');
          ta.value = txt;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        showToast('Copied output text to clipboard!', '#10B981');
      });

      // Pipe output PDF into another tool
      document.getElementById('sendOutputToAnotherToolBtn').addEventListener('click', async () => {
        if (state.lastOutputBytes && state.lastOutputFilename.endsWith('.pdf')) {
          const fakeFile = new File([state.lastOutputBytes], state.lastOutputFilename, { type: 'application/pdf' });
          const parsed = await inspectUploadedFile(fakeFile);
          state.files = [parsed];
          document.getElementById('resultDownloadCard').classList.add('hidden');
          renderFileQueue();
          renderLivePreviewStage();
          showToast('Loaded output PDF as input! Use "Switch tool" at top right to chain another feature.', '#3B82F6');
        } else if (state.lastOutputBytes && (state.lastOutputFilename.endsWith('.jpg') || state.lastOutputFilename.endsWith('.png') || state.lastOutputFilename.endsWith('.webp'))) {
          const ext = state.lastOutputFilename.split('.').pop();
          const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
          const fakeFile = new File([state.lastOutputBytes], state.lastOutputFilename, { type: mime });
          const parsed = await inspectUploadedFile(fakeFile);
          state.files = [parsed];
          document.getElementById('resultDownloadCard').classList.add('hidden');
          renderFileQueue();
          renderLivePreviewStage();
          showToast('Loaded compressed image as input! Use "Switch tool" at top right to convert to PDF or chain another tool.', '#3B82F6');
        } else {
          document.getElementById('workspaceView').classList.add('hidden');
          document.getElementById('directoryView').classList.remove('hidden');
        }
      });
    }

    async function handleSelectedFiles(fileList) {
      const tool = TOOLS.find(t => t.id === state.activeToolId) || TOOLS[0];
      const runBtn = document.getElementById('runToolActionBtn');
      const runBtnText = document.getElementById('runToolActionBtnText');
      if (!tool.multiple) {
        state.files = [];
      } else {
        state.files = state.files.filter(f => !String(f.id).startsWith('sample_'));
      }
      document.getElementById('resultDownloadCard').classList.add('hidden');
      if (runBtn) runBtn.disabled = true;

      state.inspectPromise = (async () => {
        try {
          for (const f of Array.from(fileList)) {
            if (runBtnText) runBtnText.textContent = `Reading ${f.name}...`;
            const inspected = await inspectUploadedFile(f);
            state.files.push(inspected);
          }
        } finally {
          if (runBtn) runBtn.disabled = false;
          if (runBtnText) runBtnText.textContent = `${tool.title} Now`;
          state.inspectPromise = null;
        }
      })();

      await state.inspectPromise;
      renderFileQueue();
      renderLivePreviewStage();
      showToast(`Loaded ${fileList.length} file(s) (${state.files.reduce((a, b) => a + (b.pageCount || 1), 0)} pages) into ${tool.title}`, tool.color);
    }

    window.addEventListener('DOMContentLoaded', initApp);
