/**
 * PDFMaxx — Configuration & Metadata for All 31 Tools
 * Edit this file in VS Code to customize tool names, colors, categories, or icons.
 */
// =========================================================================
    // 1. COMPLETE SPECIFICATION OF ALL 31 FEATURES WITH UNIQUE DISTINGUISHING COLORS
    // =========================================================================
    const TOOLS = [
      {
        id: 'merge-pdf',
        title: 'Merge PDF',
        desc: 'Combine PDFs in the order you want with the easiest PDF merger available.',
        category: 'Organize',
        color: '#E11D48', // Crimson Rose
        badgeBg: 'rgba(225, 29, 72, 0.12)',
        accept: '.pdf',
        multiple: true,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>'
      },
      {
        id: 'split-pdf',
        title: 'Split PDF',
        desc: 'Separate one page or a whole set for easy conversion into independent PDF files.',
        category: 'Organize',
        color: '#EA580C', // Burnt Orange
        badgeBg: 'rgba(234, 88, 12, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>'
      },
      {
        id: 'compress-pdf',
        title: 'Compress PDF',
        desc: 'Reduce file size while optimizing for maximal PDF quality.',
        category: 'Optimize',
        color: '#16A34A', // Emerald Green
        badgeBg: 'rgba(22, 163, 74, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>'
      },
      {
        id: 'compress-image',
        title: 'Compress Image',
        desc: 'Compress JPG, PNG, and WebP images with high visual quality and massive file size reduction.',
        category: 'Optimize',
        color: '#0284C7', // Vibrant Sky Blue
        badgeBg: 'rgba(2, 132, 199, 0.12)',
        accept: '.jpg,.jpeg,.png,.webp,.bmp,.gif',
        multiple: true,
        isNew: true,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v5m0 0l-1.5-1.5M12 8l1.5-1.5"/>'
      },
      {
        id: 'pdf-to-word',
        title: 'PDF to Word',
        desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.',
        category: 'Convert from PDF',
        color: '#2563EB', // Royal Blue
        badgeBg: 'rgba(37, 99, 235, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>'
      },
      {
        id: 'pdf-to-powerpoint',
        title: 'PDF to PowerPoint',
        desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.',
        category: 'Convert from PDF',
        color: '#D97706', // Warm Amber
        badgeBg: 'rgba(217, 119, 6, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>'
      },
      {
        id: 'pdf-to-excel',
        title: 'PDF to Excel',
        desc: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.',
        category: 'Convert from PDF',
        color: '#059669', // Forest Jade
        badgeBg: 'rgba(5, 150, 105, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>'
      },
      {
        id: 'word-to-pdf',
        title: 'Word to PDF',
        desc: 'Make DOC and DOCX files easy to read by converting them to PDF.',
        category: 'Convert to PDF',
        color: '#1D4ED8', // Cobalt Blue
        badgeBg: 'rgba(29, 78, 216, 0.12)',
        accept: '.doc,.docx,.txt,.rtf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>'
      },
      {
        id: 'powerpoint-to-pdf',
        title: 'PowerPoint to PDF',
        desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.',
        category: 'Convert to PDF',
        color: '#C2410C', // Rust Terracotta
        badgeBg: 'rgba(194, 65, 12, 0.12)',
        accept: '.ppt,.pptx,.txt',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>'
      },
      {
        id: 'excel-to-pdf',
        title: 'Excel to PDF',
        desc: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
        category: 'Convert to PDF',
        color: '#15803D', // Deep Leaf Green
        badgeBg: 'rgba(21, 128, 61, 0.12)',
        accept: '.xls,.xlsx,.csv',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>'
      },
      {
        id: 'edit-pdf',
        title: 'Edit PDF',
        desc: 'Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color of the added content.',
        category: 'Edit & Annotate',
        color: '#7C3AED', // Vivid Violet
        badgeBg: 'rgba(124, 58, 237, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>'
      },
      {
        id: 'pdf-to-jpg',
        title: 'PDF to JPG',
        desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.',
        category: 'Convert from PDF',
        color: '#CA8A04', // Goldenrod Yellow
        badgeBg: 'rgba(202, 138, 4, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>'
      },
      {
        id: 'jpg-to-pdf',
        title: 'JPG to PDF',
        desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
        category: 'Convert to PDF',
        color: '#EAB308', // Marigold Gold
        badgeBg: 'rgba(234, 179, 8, 0.14)',
        accept: '.jpg,.jpeg,.png,.webp',
        multiple: true,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>'
      },
      {
        id: 'sign-pdf',
        title: 'Sign PDF',
        desc: 'Sign yourself or request electronic signatures from others.',
        category: 'PDF Security',
        color: '#4F46E5', // Indigo Ink
        badgeBg: 'rgba(79, 70, 229, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>'
      },
      {
        id: 'watermark',
        title: 'Watermark',
        desc: 'Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.',
        category: 'Edit & Annotate',
        color: '#9333EA', // Amethyst Purple
        badgeBg: 'rgba(147, 51, 234, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>'
      },
      {
        id: 'rotate-pdf',
        title: 'Rotate PDF',
        desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
        category: 'Organize',
        color: '#DB2777', // Magenta Pink
        badgeBg: 'rgba(219, 39, 119, 0.12)',
        accept: '.pdf',
        multiple: true,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>'
      },
      {
        id: 'html-to-pdf',
        title: 'HTML to PDF',
        desc: 'Convert webpages in HTML to PDF. Copy and paste the URL of the page you want and convert it to PDF with a click.',
        category: 'Convert to PDF',
        color: '#0284C7', // Cerulean Sky
        badgeBg: 'rgba(2, 132, 199, 0.12)',
        accept: '.html,.htm,.txt',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>'
      },
      {
        id: 'unlock-pdf',
        title: 'Unlock PDF',
        desc: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
        category: 'PDF Security',
        color: '#0D9488', // Teal Cyan
        badgeBg: 'rgba(13, 148, 136, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>'
      },
      {
        id: 'protect-pdf',
        title: 'Protect PDF',
        desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
        category: 'PDF Security',
        color: '#0F766E', // Deep Petrol Teal
        badgeBg: 'rgba(15, 118, 110, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>'
      },
      {
        id: 'organize-pdf',
        title: 'Organize PDF',
        desc: 'Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.',
        category: 'Organize',
        color: '#F97316', // Tangerine Orange
        badgeBg: 'rgba(249, 115, 22, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>'
      },
      {
        id: 'pdf-to-pdfa',
        title: 'PDF to PDF/A',
        desc: 'Transform your PDF to PDF/A, the ISO-standardized version of PDF for long-term archiving. Your PDF will preserve formatting when accessed in the future.',
        category: 'Convert from PDF',
        color: '#0369A1', // Archival Ocean Blue
        badgeBg: 'rgba(3, 105, 161, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>'
      },
      {
        id: 'repair-pdf',
        title: 'Repair PDF',
        desc: 'Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair tool.',
        category: 'Optimize',
        color: '#65A30D', // Olive Lime
        badgeBg: 'rgba(101, 163, 13, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>'
      },
      {
        id: 'page-numbers',
        title: 'Page numbers',
        desc: 'Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.',
        category: 'Edit & Annotate',
        color: '#A855F7', // Orchid Purple
        badgeBg: 'rgba(168, 85, 247, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>'
      },
      {
        id: 'scan-to-pdf',
        title: 'Scan to PDF',
        desc: 'Capture document scans from your mobile device and send them instantly to your browser.',
        category: 'Convert to PDF',
        color: '#0891B2', // Cyan Lagoon
        badgeBg: 'rgba(8, 145, 178, 0.12)',
        accept: '.jpg,.jpeg,.png,.pdf',
        multiple: true,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>'
      },
      {
        id: 'ocr-pdf',
        title: 'OCR PDF',
        desc: 'Easily convert scanned PDF into searchable and selectable documents.',
        category: 'Optimize',
        color: '#10B981', // Mint Emerald
        badgeBg: 'rgba(16, 185, 129, 0.12)',
        accept: '.pdf,.jpg,.png',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>'
      },
      {
        id: 'compare-pdf',
        title: 'Compare PDF',
        desc: 'Show a side-by-side document comparison and easily spot changes between different file versions.',
        category: 'PDF Security',
        color: '#6366F1', // Periwinkle Indigo
        badgeBg: 'rgba(99, 102, 241, 0.12)',
        accept: '.pdf',
        multiple: true,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>'
      },
      {
        id: 'redact-pdf',
        title: 'Redact PDF',
        desc: 'Redact text and graphics to permanently remove sensitive information from a PDF.',
        category: 'PDF Security',
        color: '#BE123C', // Dark Ruby Crimson
        badgeBg: 'rgba(190, 18, 60, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>'
      },
      {
        id: 'crop-pdf',
        title: 'Crop PDF',
        desc: 'Crop margins of PDF documents or select specific areas, then apply the changes to one page or the whole document.',
        category: 'Edit & Annotate',
        color: '#EC4899', // Hot Pink Coral
        badgeBg: 'rgba(236, 72, 153, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: true,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 3v12a2 2 0 002 2h12M3 7h12a2 2 0 012 2v12"/>'
      },
      {
        id: 'pdf-forms',
        title: 'PDF Forms',
        desc: 'Detect form fields automatically, create interactive fillable PDFs, or fill PDF forms yourself. Add text fields, checkboxes, multiple choice fields, and lists.',
        category: 'AI & Smart',
        color: '#14B8A6', // Bright Turquoise
        badgeBg: 'rgba(20, 184, 166, 0.12)',
        accept: '.pdf',
        multiple: false,
        isNew: true,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>'
      },
      {
        id: 'ai-summarizer',
        title: 'AI Summarizer',
        desc: 'Quickly generate concise summaries from articles, paragraphs, and essays, providing clear and precise key points in seconds.',
        category: 'AI & Smart',
        color: '#D946EF', // Electric Fuchsia
        badgeBg: 'rgba(217, 70, 239, 0.12)',
        accept: '.pdf,.txt,.md',
        multiple: false,
        isNew: true,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>'
      },
      {
        id: 'translate-pdf',
        title: 'Translate PDF',
        desc: 'Easily translate PDF files powered by AI. Keep fonts, layout, and formatting perfectly intact.',
        category: 'AI & Smart',
        color: '#3B82F6', // Azure Sapphire
        badgeBg: 'rgba(59, 130, 246, 0.12)',
        accept: '.pdf,.txt',
        multiple: false,
        isNew: true,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>'
      },
      {
        id: 'pdf-to-markdown',
        title: 'PDF to Markdown',
        desc: 'Easily turn PDFs into Markdown files. Perfect for notes, docs, and LLMs. Headings, tables, lists, and links preserved automatically.',
        category: 'AI & Smart',
        color: '#475569', // Slate Graphite
        badgeBg: 'rgba(71, 85, 105, 0.14)',
        accept: '.pdf,.txt',
        multiple: false,
        isNew: false,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>'
      }
    ];

    const CATEGORIES = [
      { id: 'all', label: 'All Tools (32)' },
      { id: 'Organize', label: 'Organize PDF' },
      { id: 'Optimize', label: 'Optimize & Repair' },
      { id: 'Convert to PDF', label: 'Convert to PDF' },
      { id: 'Convert from PDF', label: 'Convert from PDF' },
      { id: 'Edit & Annotate', label: 'Edit & Annotate' },
      { id: 'PDF Security', label: 'PDF Security' },
      { id: 'AI & Smart', label: 'AI & Smart Tools (New!)' }
    ];
