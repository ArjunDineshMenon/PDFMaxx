/**
 * PDFMaxx — Core Multi-Page PDF.js Extractor, DOCX Builder & File Inspector
 */
// =========================================================================
    // 3. REAL PDF GENERATOR & PARSER UTILITIES (pdf-lib + fallback PDF builder)
    // =========================================================================
    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function showToast(msg, color = '#10B981') {
      const banner = document.getElementById('toastBanner');
      const text = document.getElementById('toastMessage');
      const dot = document.getElementById('toastDot');
      text.textContent = msg;
      dot.style.backgroundColor = color;
      banner.classList.remove('hidden');
      if (window._toastTimer) clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => {
        banner.classList.add('hidden');
      }, 3400);
    }

    // Minimal pure-JS valid PDF builder fallback if PDFLib is ever unavailable
    function buildMinimalValidPdfBytes(pagesTextArray) {
      const pages = pagesTextArray && pagesTextArray.length ? pagesTextArray : ['Sample PDFMaxx Document'];
      let objects = [];
      // 1: Catalog, 2: Pages
      const pageObjIds = [];
      const contentObjIds = [];
      let nextId = 4; // 3 is Font
      for (let i = 0; i < pages.length; i++) {
        pageObjIds.push(nextId++);
        contentObjIds.push(nextId++);
      }
      objects.push({ id: 1, body: `<< /Type /Catalog /Pages 2 0 R >>` });
      objects.push({ id: 2, body: `<< /Type /Pages /Kids [${pageObjIds.map(id => id + ' 0 R').join(' ')}] /Count ${pages.length} >>` });
      objects.push({ id: 3, body: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>` });

      for (let i = 0; i < pages.length; i++) {
        const lines = String(pages[i]).split('\n');
        let streamLines = ['BT', '/F1 12 Tf', '50 750 Td', '16 TL'];
        lines.forEach((line, idx) => {
          const safe = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
          if (idx === 0) streamLines.push(`(${safe}) Tj`);
          else streamLines.push(`T* (${safe}) Tj`);
        });
        streamLines.push('ET');
        const streamStr = streamLines.join('\n');
        objects.push({
          id: pageObjIds[i],
          body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjIds[i]} 0 R >>`
        });
        objects.push({
          id: contentObjIds[i],
          body: `<< /Length ${streamStr.length} >>\nstream\n${streamStr}\nendstream`
        });
      }

      objects.sort((a, b) => a.id - b.id);
      let pdf = '%PDF-1.4\n';
      const offsets = [0];
      for (const obj of objects) {
        offsets.push(pdf.length);
        pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
      }
      const xrefOffset = pdf.length;
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i < offsets.length; i++) {
        pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
      }
      pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
      return new TextEncoder().encode(pdf);
    }

    // Generate a rich, realistic multi-page PDF using pdf-lib (or fallback)
    async function generateSamplePdfBytes(variant = 'executive') {
      const samplePagesContent = {
        executive: [
          {
            title: 'Q4 Global Operations & Financial Report',
            subtitle: 'Prepared by PDFMaxx Enterprise Analytics • ISO-27001 Verified',
            paragraphs: [
              '1. Executive Overview',
              'Global cloud infrastructure revenue reached $14.8M in Q4, representing a 24.6% year-over-year expansion across North America, Europe, and APAC regions.',
              'Operating margin improved by 340 basis points following automated document workflow deployment and zero-trust security upgrades.',
              'Key Contact:finance-ops@omnipdf.example.com | Support Phone: +1 (415) 890-4321 | Account ID: ACC-99482-X'
            ],
            table: [
              ['Region', 'Q3 Revenue', 'Q4 Revenue', 'YoY Growth', 'Status'],
              ['North America', '$5,420,000', '$6,810,000', '+25.6%', 'Exceeding'],
              ['European Union', '$3,890,000', '$4,720,000', '+21.3%', 'On Track'],
              ['Asia-Pacific', '$2,510,000', '$3,270,000', '+30.2%', 'Outperforming']
            ]
          },
          {
            title: '2. Product Architecture & Workflow Metrics',
            subtitle: 'Document Processing Throughput & Latency Benchmarks',
            paragraphs: [
              'Client-side WebAssembly and PDF stream processors reduced average conversion time from 4.2 seconds to 0.38 seconds per document.',
              'Automated optical character recognition (OCR) achieved 99.4% token accuracy on scanned commercial invoices and legal agreements.',
              'All archival exports conform strictly to ISO 19005 (PDF/A-2b) standards with embedded sRGB color profiles.'
            ],
            table: [
              ['Pipeline Module', 'Avg Latency', 'Accuracy', 'Daily Volume', 'SLA Tier'],
              ['PDF to Word / DOCX', '320 ms', '99.6%', '142,000 docs', '99.99%'],
              ['PDF to Excel Grid', '280 ms', '99.2%', '98,500 docs', '99.99%'],
              ['AI Summarizer & Translate', '610 ms', '98.9%', '84,200 docs', '99.95%']
            ]
          },
          {
            title: '3. Security, Redaction & Governance Policy',
            subtitle: 'Confidentiality & Electronic Signature Verification',
            paragraphs: [
              'Sensitive PII tokens including email addresses, telephone numbers, and account identifiers must be permanently redacted prior to external distribution.',
              'Cryptographic document protection enforces 256-bit AES encryption with granular owner/user permission flags.',
              'Authorized Signatory: Dr. Elena Vance, Chief Information Security Officer (CISO).'
            ],
            table: [
              ['Control ID', 'Policy Domain', 'Encryption', 'Audit Status', 'Owner'],
              ['SEC-101', 'Password Protection', 'AES-256', 'Verified', 'Security Ops'],
              ['SEC-204', 'PII Redaction Sanitizer', 'Permanent', 'Verified', 'Legal Compliance'],
              ['SEC-309', 'Digital E-Signature', 'SHA-256', 'Verified', 'Executive Board']
            ]
          }
        ],
        appendix: [
          {
            title: 'Appendix B: Partner Addendum & Service Level Agreement',
            subtitle: 'Supplemental Contract Schedule • Version 2.4',
            paragraphs: [
              'This supplemental schedule governs service uptime credits, priority API routing, and multi-region archival replication.',
              'Updated Clause 4.2: Monthly uptime commitment increased from 99.90% to 99.99% effective November 1, 2026.',
              'Updated Fee Cap: Annual licensing cap adjusted to $48,500 with unlimited seats included.'
            ],
            table: [
              ['Metric', 'Previous v1.0', 'Revised v2.4', 'Delta', 'Effective Date'],
              ['SLA Uptime', '99.90%', '99.99%', '+0.09%', '2026-11-01'],
              ['Max File Size', '100 MB', '500 MB', '+400 MB', '2026-11-01'],
              ['Annual License', '$52,000', '$48,500', '-$3,500', '2026-11-01']
            ]
          },
          {
            title: 'Sign-Off & Form Verification Page',
            subtitle: 'Interactive Compliance Checklist',
            paragraphs: [
              'Please review all annexed tables before merging, splitting, or signing this document package.',
              'Contact legal@omnipdf.example.com or +1 (800) 555-0199 for amendment requests.'
            ],
            table: [
              ['Item', 'Requirement', 'Verified', 'Reviewer', 'Date'],
              ['01', 'Financial Table Reconciliation', 'Yes', 'A. Krishnan', '2026-10-22'],
              ['02', 'ISO PDF/A Archival Check', 'Yes', 'E. Vance', '2026-10-22']
            ]
          }
        ]
      };

      const chosenPages = samplePagesContent[variant] || samplePagesContent.executive;

      if (window.PDFLib) {
        try {
          const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
          const pdfDoc = await PDFDocument.create();
          pdfDoc.setTitle(chosenPages[0].title);
          pdfDoc.setAuthor('PDFMaxx');
          pdfDoc.setSubject('Enterprise Sample Document');
          pdfDoc.setKeywords(['PDFMaxx', 'Report', 'Financials', 'Sample']);
          const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

          for (let i = 0; i < chosenPages.length; i++) {
            const pData = chosenPages[i];
            const page = pdfDoc.addPage([612, 792]);
            // Top Accent Header Banner
            page.drawRectangle({ x: 0, y: 730, width: 612, height: 62, color: rgb(0.08, 0.11, 0.18) });
            page.drawRectangle({ x: 0, y: 726, width: 612, height: 4, color: rgb(0.88, 0.11, 0.28) });
            page.drawText(pData.title, { x: 42, y: 758, size: 15, font: fontBold, color: rgb(1, 1, 1) });
            page.drawText(pData.subtitle, { x: 42, y: 740, size: 9.5, font: fontReg, color: rgb(0.75, 0.82, 0.92) });

            let curY = 690;
            for (const para of pData.paragraphs) {
              const isHeading = /^[0-9]+\./.test(para);
              // Simple word wrap at 82 chars
              const words = para.split(' ');
              let line = '';
              for (const w of words) {
                if ((line + ' ' + w).trim().length > 82) {
                  page.drawText(line.trim(), {
                    x: 42,
                    y: curY,
                    size: isHeading ? 12 : 10,
                    font: isHeading ? fontBold : fontReg,
                    color: isHeading ? rgb(0.08, 0.11, 0.18) : rgb(0.2, 0.25, 0.33)
                  });
                  curY -= 15;
                  line = w;
                } else {
                  line = (line + ' ' + w).trim();
                }
              }
              if (line) {
                page.drawText(line, {
                  x: 42,
                  y: curY,
                  size: isHeading ? 12 : 10,
                  font: isHeading ? fontBold : fontReg,
                  color: isHeading ? rgb(0.08, 0.11, 0.18) : rgb(0.2, 0.25, 0.33)
                });
                curY -= 22;
              }
            }

            // Draw Table
            if (pData.table && pData.table.length) {
              curY -= 6;
              const colWidths = [150, 95, 95, 90, 95];
              for (let r = 0; r < pData.table.length; r++) {
                const row = pData.table[r];
                const rowY = curY - r * 24;
                page.drawRectangle({
                  x: 42,
                  y: rowY - 6,
                  width: 525,
                  height: 22,
                  color: r === 0 ? rgb(0.91, 0.94, 0.98) : (r % 2 === 1 ? rgb(0.98, 0.99, 1) : rgb(0.95, 0.96, 0.98))
                });
                let colX = 48;
                for (let c = 0; c < row.length; c++) {
                  page.drawText(String(row[c]), {
                    x: colX,
                    y: rowY,
                    size: 9.5,
                    font: r === 0 ? fontBold : fontReg,
                    color: r === 0 ? rgb(0.07, 0.1, 0.2) : rgb(0.2, 0.24, 0.3)
                  });
                  colX += colWidths[c] || 95;
                }
              }
              curY -= pData.table.length * 24 + 20;
            }

            // Footer
            page.drawLine({ start: { x: 42, y: 48 }, end: { x: 570, y: 48 }, thickness: 0.8, color: rgb(0.85, 0.88, 0.92) });
            page.drawText(`PDFMaxx Sample Document • Page ${i + 1} of ${chosenPages.length}`, {
              x: 42,
              y: 32,
              size: 8.5,
              font: fontReg,
              color: rgb(0.45, 0.5, 0.58)
            });
          }

          const pdfBytes = await pdfDoc.save();
          return {
            bytes: pdfBytes,
            pageCount: chosenPages.length,
            extractedText: chosenPages.map((p, idx) => `--- Page ${idx + 1}: ${p.title} ---\n${p.subtitle}\n${p.paragraphs.join('\n')}\n` + p.table.map(r => r.join(' | ')).join('\n')).join('\n\n'),
            tables: chosenPages.map(p => p.table)
          };
        } catch (err) {
          console.error('PDFLib sample error, falling back:', err);
        }
      }

      const fallbackText = chosenPages.map((p, idx) => `Page ${idx + 1}: ${p.title}\n${p.subtitle}\n${p.paragraphs.join('\n')}`);
      return {
        bytes: buildMinimalValidPdfBytes(fallbackText),
        pageCount: chosenPages.length,
        extractedText: fallbackText.join('\n\n'),
        tables: chosenPages.map(p => p.table)
      };
    }

    // Real PDF.js Multi-Page Extractor: extracts structured lines, tables, coordinates, and page thumbnails across ALL pages
    async function extractFullPdfWithPdfJs(bytes, fileName, onProgress) {
      if (!window.pdfjsLib) return null;
      try {
        const loadingTask = window.pdfjsLib.getDocument({
          data: bytes.slice(0),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const pagesData = [];
        const allPagesTextParts = [];
        const allTables = [];

        for (let p = 1; p <= numPages; p++) {
          if (onProgress) onProgress(p, numPages);
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.0 });
          const textContent = await page.getTextContent();

          const rowBuckets = [];
          const rawItems = [];
          for (const item of textContent.items) {
            const str = (item.str || '');
            if (!str.trim()) continue;
            const tx = item.transform ? item.transform[4] : 0;
            const ty = item.transform ? item.transform[5] : 0;
            const fontH = item.height || (item.transform ? Math.abs(item.transform[3]) : 11) || 11;
            const itemW = item.width || Math.max(12, str.length * fontH * 0.52);

            rawItems.push({ text: str, x: tx, y: ty, width: itemW, height: fontH });

            let bucket = rowBuckets.find(b => Math.abs(b.y - ty) <= 4.5);
            if (!bucket) {
              bucket = { y: ty, items: [], maxFontH: fontH };
              rowBuckets.push(bucket);
            }
            bucket.items.push({ x: tx, text: str, fontH, width: itemW });
            if (fontH > bucket.maxFontH) bucket.maxFontH = fontH;
          }

          rowBuckets.sort((a, b) => b.y - a.y);

          const lines = [];
          const pageTableRows = [];
          for (const bucket of rowBuckets) {
            bucket.items.sort((a, b) => a.x - b.x);
            const cols = [];
            let curCol = '';
            let lastRightX = null;
            for (const it of bucket.items) {
              if (lastRightX !== null && (it.x - lastRightX) > 22) {
                cols.push(curCol.trim());
                curCol = it.text;
              } else {
                curCol = curCol ? (curCol + ' ' + it.text) : it.text;
              }
              lastRightX = it.x + it.width;
            }
            if (curCol.trim()) cols.push(curCol.trim());

            const fullLine = cols.join('    ');
            if (fullLine.trim()) {
              lines.push({
                y: bucket.y,
                text: fullLine.trim(),
                cols,
                fontSize: Math.round(bucket.maxFontH * 10) / 10,
                isHeading: bucket.maxFontH >= 13.5
              });
            }
            if (cols.length >= 2) {
              pageTableRows.push(cols);
            }
          }

          // Render visual thumbnail for the first 12 pages immediately
          let thumbDataUrl = null;
          if (p <= 12) {
            try {
              const thumbScale = Math.min(1.1, 420 / Math.max(1, viewport.width));
              const thumbVp = page.getViewport({ scale: thumbScale });
              const canvas = document.createElement('canvas');
              canvas.width = Math.floor(thumbVp.width);
              canvas.height = Math.floor(thumbVp.height);
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              await page.render({ canvasContext: ctx, viewport: thumbVp }).promise;
              thumbDataUrl = canvas.toDataURL('image/jpeg', 0.80);
            } catch (re) {}
          }

          const pagePlain = lines.map(l => l.text).join('\n');
          allPagesTextParts.push(`=== Page ${p} of ${numPages} ===\n` + (pagePlain || `[Scanned / Visual Page ${p}]`));
          if (pageTableRows.length > 0) {
            allTables.push({ page: p, rows: pageTableRows });
          }

          pagesData.push({
            pageNumber: p,
            width: viewport.width,
            height: viewport.height,
            lines,
            rawItems,
            plainText: pagePlain,
            tableRows: pageTableRows,
            thumbDataUrl
          });
        }

        return {
          pageCount: numPages,
          pagesData,
          extractedText: allPagesTextParts.join('\n\n'),
          tables: allTables
        };
      } catch (err) {
        console.warn('PDF.js full extraction error:', err);
        return null;
      }
    }

    // Render any PDF page to JPEG bytes + DataURL using PDF.js
    async function renderPdfPageToJpeg(bytes, pageNumber, scale = 1.5, quality = 0.88) {
      if (!window.pdfjsLib) return null;
      const loadingTask = window.pdfjsLib.getDocument({
          data: bytes.slice(0),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      const vp = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const b64 = dataUrl.split(',')[1];
      const bin = atob(b64);
      const imgBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) imgBytes[i] = bin.charCodeAt(i);
      return {
        dataUrl,
        base64: b64,
        bytes: imgBytes,
        width: canvas.width,
        height: canvas.height
      };
    }

    // Build a genuine OpenXML .docx file (ZIP archive) containing all pages, paragraphs, tables, and rendered page images
    async function buildRealDocxBytes(fileRecord, includePageImages, onProgress) {
      const zip = new window.JSZip();
      const pagesData = fileRecord.pagesData || [];
      const totalPages = fileRecord.pageCount || pagesData.length || 1;

      const escapeXml = (str) => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

      const relsXmlItems = [];
      const bodyParts = [];

      for (let i = 0; i < totalPages; i++) {
        const pNum = i + 1;
        if (onProgress) onProgress(pNum, totalPages);
        const pInfo = pagesData[i] || { lines: [], plainText: '' };
        const hasTextLines = pInfo.lines && pInfo.lines.length > 0;

        if (i > 0) {
          bodyParts.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
        }

        if (includePageImages && window.pdfjsLib) {
          // EXACT VISUAL MATCH MODE (100% Identical to PDF Page)
          try {
            const rendered = await renderPdfPageToJpeg(fileRecord.bytes, pNum, 2.2, 0.92);
            if (rendered && rendered.bytes) {
              const rId = `rIdImg${pNum}`;
              const imgFileName = `page_${pNum}.jpg`;
              zip.file(`word/media/${imgFileName}`, rendered.bytes);
              relsXmlItems.push(`<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imgFileName}"/>`);
              
              // Standard Letter printable area: 10080 dxa x 13680 dxa (6,400,800 x 8,686,800 EMUs)
              const imgAspect = rendered.height / Math.max(1, rendered.width);
              let cx = 6400800;
              let cy = Math.round(cx * imgAspect);
              if (cy > 8686800) {
                cy = 8686800;
                cx = Math.round(cy / imgAspect);
              }

              bodyParts.push(`
                <w:p>
                  <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>
                  <w:r>
                    <w:drawing>
                      <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                        <wp:extent cx="${cx}" cy="${cy}"/>
                        <wp:docPr id="${pNum}" name="Page_${pNum}"/>
                        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                              <pic:nvPicPr><pic:cNvPr id="${pNum}" name="${imgFileName}"/><pic:cNvPicPr/></pic:nvPicPr>
                              <pic:blipFill>
                                <a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                                <a:stretch><a:fillRect/></a:stretch>
                              </pic:blipFill>
                              <pic:spPr>
                                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                              </pic:spPr>
                            </pic:pic>
                          </a:graphicData>
                        </a:graphic>
                      </wp:inline>
                    </w:drawing>
                  </w:r>
                </w:p>
              `);
            }
          } catch (imgErr) {
            console.warn(`Error rendering exact page ${pNum} for docx:`, imgErr);
          }
        } else if (hasTextLines) {
          // FLOWING EDITABLE TEXT & PROPER MULTI-ROW TABLES MODE
          let pendingTableRows = [];
          const flushTable = () => {
            if (pendingTableRows.length === 0) return;
            const maxCols = Math.max(1, ...pendingTableRows.map(r => r.length));
            const cellW = Math.floor(9360 / maxCols);
            const rowsXml = pendingTableRows.map((rowCols, rIdx) => {
              const isHdr = rIdx === 0;
              const cellsXml = rowCols.map(c => `
                <w:tc>
                  <w:tcPr>
                    <w:tcW w:w="${cellW}" w:type="dxa"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="${isHdr ? '0F172A' : (rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF')}"/>
                  </w:tcPr>
                  <w:p>
                    <w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>
                    <w:r>
                      <w:rPr>
                        ${isHdr ? '<w:b/><w:color w:val="FFFFFF"/>' : '<w:color w:val="1E293B"/>'}
                        <w:sz w:val="20"/>
                      </w:rPr>
                      <w:t xml:space="preserve">${escapeXml(c)}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>`).join('');
              return `<w:tr>${cellsXml}</w:tr>`;
            }).join('');
            bodyParts.push(`<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/></w:tblBorders></w:tblPr>${rowsXml}</w:tbl>`);
            pendingTableRows = [];
          };

          for (const lineObj of pInfo.lines) {
            if (lineObj.cols && lineObj.cols.length >= 2) {
              pendingTableRows.push(lineObj.cols);
            } else {
              flushTable();
              const szHalfPt = lineObj.isHeading ? Math.min(36, Math.max(24, Math.round(lineObj.fontSize * 2))) : 22;
              bodyParts.push(`
                <w:p>
                  <w:pPr><w:spacing w:after="${lineObj.isHeading ? 140 : 90}"/></w:pPr>
                  <w:r>
                    <w:rPr>${lineObj.isHeading ? '<w:b/><w:color w:val="0F172A"/>' : ''}<w:sz w:val="${szHalfPt}"/></w:rPr>
                    <w:t xml:space="preserve">${escapeXml(lineObj.text)}</w:t>
                  </w:r>
                </w:p>
              `);
            }
          }
          flushTable();
        } else if (window.pdfjsLib && pNum <= 100) {
          // Scanned page fallback
          try {
            const rendered = await renderPdfPageToJpeg(fileRecord.bytes, pNum, 1.8, 0.88);
            if (rendered && rendered.bytes) {
              const rId = `rIdImg${pNum}`;
              const imgFileName = `page_${pNum}.jpg`;
              zip.file(`word/media/${imgFileName}`, rendered.bytes);
              relsXmlItems.push(`<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imgFileName}"/>`);
              const cx = 5760000;
              const cy = Math.round(cx * (rendered.height / Math.max(1, rendered.width)));
              bodyParts.push(`
                <w:p>
                  <w:r>
                    <w:drawing>
                      <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                        <wp:extent cx="${cx}" cy="${cy}"/>
                        <wp:docPr id="${pNum}" name="Page_${pNum}"/>
                        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                              <pic:nvPicPr><pic:cNvPr id="${pNum}" name="${imgFileName}"/><pic:cNvPicPr/></pic:nvPicPr>
                              <pic:blipFill>
                                <a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                                <a:stretch><a:fillRect/></a:stretch>
                              </pic:blipFill>
                              <pic:spPr>
                                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                              </pic:spPr>
                            </pic:pic>
                          </a:graphicData>
                        </a:graphic>
                      </wp:inline>
                    </w:drawing>
                  </w:r>
                </w:p>
              `);
            }
          } catch (imgErr) {}
        }
      }

      zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
      zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
      zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relsXmlItems.join('\n  ')}
</Relationships>`);
      zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyParts.join('\n')}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr>
  </w:body>
</w:document>`);

      return await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    }

    // Parse real uploaded DOCX, PPTX, XLSX, CSV, HTML, JPG/PNG, or PDF files
    async function inspectUploadedFile(fileObj) {
      const name = fileObj.name || 'document.pdf';
      const ext = name.split('.').pop().toLowerCase();
      const arrayBuf = await fileObj.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);

      let pageCount = 1;
      let extractedText = '';
      let pagesData = [];
      let tables = [];

      if (ext === 'pdf' || fileObj.type === 'application/pdf') {
        showToast(`Parsing all pages of ${name}...`, '#2563EB');
        const pdfJsResult = await extractFullPdfWithPdfJs(bytes, name);
        if (pdfJsResult && pdfJsResult.pageCount > 0) {
          pageCount = pdfJsResult.pageCount;
          extractedText = pdfJsResult.extractedText;
          pagesData = pdfJsResult.pagesData;
          tables = pdfJsResult.tables;
        }
        if (window.PDFLib) {
          try {
            const formPdf = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            const form = formPdf.getForm();
            const existingFields = form.getFields();
            if (existingFields && existingFields.length > 0) {
              state.formFields = existingFields.slice(0, 25).map((fld, idx) => {
                const fName = fld.getName() || `Field_${idx + 1}`;
                const ctor = fld.constructor.name || '';
                const isCheck = ctor.includes('CheckBox');
                let val = isCheck ? false : '';
                try {
                  if (isCheck && typeof fld.isChecked === 'function') val = fld.isChecked();
                  else if (typeof fld.getText === 'function') val = fld.getText() || '';
                } catch (fe) {}
                return { id: 'f_ext_' + idx, type: isCheck ? 'checkbox' : 'text', name: fName, label: fName, value: val, isExisting: true };
              });
              if (state.activeToolId === 'pdf-forms') {
                const box = document.getElementById('toolOptionsContainer');
                if (box) renderPdfFormsBuilderUI(box);
              }
            }
          } catch (fe) {}
        } else if (window.PDFLib) {
          try {
            const pdfDoc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            pageCount = pdfDoc.getPageCount() || 1;
          } catch (e) {
            pageCount = Math.max(1, Math.round(bytes.length / 4500));
          }
          extractedText = `Document: ${name} (${pageCount} pages)`;
        }
      } else if (ext === 'docx' && window.JSZip) {
        try {
          const zip = await window.JSZip.loadAsync(bytes);
          const docXmlFile = zip.file('word/document.xml');
          const embeddedImages = [];
          const mediaKeys = Object.keys(zip.files).filter(k => /^word\/media\/.*\.(png|jpg|jpeg)$/i.test(k));
          for (const mk of mediaKeys.slice(0, 20)) {
            const imgBytes = await zip.file(mk).async('uint8array');
            embeddedImages.push({ name: mk, bytes: imgBytes, isPng: mk.toLowerCase().endsWith('.png') });
          }
          if (docXmlFile) {
            const xmlStr = await docXmlFile.async('string');
            const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
            const bodyLines = [];
            const pNodes = Array.from(xmlDoc.getElementsByTagName('w:p'));
            for (const p of pNodes) {
              const tStr = Array.from(p.getElementsByTagName('w:t')).map(t => t.textContent).join('');
              if (!tStr.trim()) continue;
              const isBold = p.getElementsByTagName('w:b').length > 0 || p.getElementsByTagName('w:pStyle').length > 0;
              bodyLines.push({ text: tStr, isHeading: isBold && tStr.length < 95, fontSize: isBold ? 13 : 10.5 });
            }
            extractedText = bodyLines.map(l => l.text).join('\n');
            pageCount = Math.max(1, Math.ceil(bodyLines.length / 34));
            for (let pIdx = 0; pIdx < pageCount; pIdx++) {
              const slice = bodyLines.slice(pIdx * 34, (pIdx + 1) * 34);
              pagesData.push({ pageNumber: pIdx + 1, plainText: slice.map(s => s.text).join('\n'), lines: slice, embeddedImages: pIdx === 0 ? embeddedImages : [] });
            }
          }
        } catch (e) {
          extractedText = `Word Document: ${name}`;
        }
      } else if (ext === 'pptx' && window.JSZip) {
        try {
          const zip = await window.JSZip.loadAsync(bytes);
          const slideFiles = Object.keys(zip.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k));
          slideFiles.sort((a, b) => {
            const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
            const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
            return na - nb;
          });
          const slideTexts = [];
          for (let i = 0; i < slideFiles.length; i++) {
            const xmlStr = await zip.file(slideFiles[i]).async('string');
            const xmlDoc = new DOMParser().parseFromString(xmlStr, 'application/xml');
            const texts = Array.from(xmlDoc.getElementsByTagName('a:t')).map(t => t.textContent).filter(Boolean);
            slideTexts.push(`=== Slide ${i + 1} ===\n` + texts.join('\n'));
            pagesData.push({ pageNumber: i + 1, plainText: texts.join('\n'), lines: texts.map((t, idx) => ({ text: t, isHeading: idx === 0, fontSize: idx === 0 ? 16 : 11 })) });
          }
          extractedText = slideTexts.join('\n\n');
          pageCount = Math.max(1, slideFiles.length);
        } catch (e) {
          extractedText = `PowerPoint Presentation: ${name}`;
        }
      } else if (['xls', 'xlsx', 'csv'].includes(ext) && window.XLSX) {
        try {
          const wb = window.XLSX.read(bytes, { type: 'array' });
          const sheetTexts = wb.SheetNames.map((sn, idx) => {
            const sheet = wb.Sheets[sn];
            const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });
            pagesData.push({
              pageNumber: idx + 1,
              plainText: rows.map(r => r.join(' | ')).join('\n'),
              tableRows: rows,
              lines: rows.map((r, rIdx) => ({ text: r.join('    '), cols: r.map(String), isHeading: rIdx === 0, fontSize: rIdx === 0 ? 13 : 10 }))
            });
            return `=== Sheet: ${sn} ===\n` + rows.map(r => r.join('\t')).join('\n');
          });
          extractedText = sheetTexts.join('\n\n');
          pageCount = Math.max(1, wb.SheetNames.length);
        } catch (e) {
          extractedText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        }
      } else if (['txt', 'md', 'html', 'htm', 'rtf'].includes(ext)) {
        extractedText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        pageCount = Math.max(1, Math.ceil(extractedText.length / 2200));
      } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg'].includes(ext) || (fileObj.type && fileObj.type.startsWith('image/'))) {
        pageCount = 1;
        extractedText = `[Image File: ${name} (${formatBytes(bytes.length)})]`;
      } else {
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 200000));
        const cleanLines = rawText.replace(/<[^>]+>/g, ' ').match(/[A-Za-z0-9\s.,:$%\-()]{6,120}/g);
        extractedText = (cleanLines && cleanLines.length > 2) ? cleanLines.join('\n') : `File: ${name}`;
        pageCount = Math.max(1, Math.ceil(extractedText.length / 2000));
      }

      const pagesMeta = Array.from({ length: pageCount }, (_, idx) => ({
        num: idx + 1,
        rotation: 0,
        deleted: false,
        thumbDataUrl: pagesData[idx]?.thumbDataUrl || null
      }));

      let imageUrl = null;
      if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg'].includes(ext) || (fileObj.type && fileObj.type.startsWith('image/'))) {
        const mime = fileObj.type || ('image/' + (ext === 'jpg' ? 'jpeg' : ext));
        const blob = new Blob([bytes], { type: mime });
        imageUrl = URL.createObjectURL(blob);
      }

      return {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        name,
        size: bytes.length,
        type: fileObj.type || ext,
        ext,
        bytes,
        pageCount,
        extractedText,
        pagesData,
        tables,
        pagesMeta,
        imageUrl
      };
    }
