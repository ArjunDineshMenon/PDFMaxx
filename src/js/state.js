/**
 * PDFMaxx — Global Application State
 * Tracks active tool, uploaded file queue, form fields, and output blobs.
 */
// =========================================================================
    // 2. APPLICATION STATE
    // =========================================================================
    const state = {
      theme: 'light',
      searchQuery: '',
      selectedCategory: 'all',
      activeToolId: null,
      files: [], // Array of { id, name, size, type, bytes (Uint8Array), pageCount, extractedText, pagesMeta: [{num, rotation, deleted}], imageUrl }
      lastOutputBlobUrl: null,
      lastOutputBytes: null,
      lastOutputFilename: 'output.pdf',
      lastOutputText: '',
      lastOutputDataUrl: null,
      lastOutputImageBadge: '',
      // Tool specific interactive state
      signatureDataUrl: null,
      editCanvasDataUrl: null,
      formFields: [
        { id: 'f1', type: 'text', name: 'Full_Name', label: 'Full Name', value: 'Aarav Krishnan' },
        { id: 'f2', type: 'text', name: 'Department', label: 'Department / Role', value: 'Product Engineering' },
        { id: 'f3', type: 'checkbox', name: 'NDA_Approved', label: 'Confirm Compliance & NDA', value: true },
        { id: 'f4', type: 'select', name: 'Priority_Tier', label: 'Approval Priority Tier', value: 'Tier 1 - Immediate', options: ['Tier 1 - Immediate', 'Tier 2 - Standard', 'Tier 3 - Archival'] }
      ],
      cameraStream: null
    };
