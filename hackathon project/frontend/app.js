/**
 * Terra Sight Core - Frontend Application Logic
 * Integrates with FastAPI CMPDI Geological Intelligence Backend
 */

// Application State
const state = {
  activeFile: null,
  isAnalyzing: false,
  isQuerying: false,
  apiConnected: false,
  extractedKeywords: []
};

// DOM Element References
const elements = {
  apiEndpointInput: document.getElementById('api-endpoint-input'),
  apiStatusBadge: document.getElementById('api-status-badge'),
  apiStatusLabel: document.getElementById('api-status-label'),
  btnQuickSample: document.getElementById('btn-quick-sample'),

  // File Upload
  pdfDropzone: document.getElementById('pdf-dropzone'),
  pdfFileInput: document.getElementById('pdf-file-input'),
  fileInfoBar: document.getElementById('file-info-bar'),
  selectedFilename: document.getElementById('selected-filename'),
  selectedFilesize: document.getElementById('selected-filesize'),
  btnRemoveFile: document.getElementById('btn-remove-file'),
  docStatePill: document.getElementById('doc-state-pill'),
  btnExtractAnalyze: document.getElementById('btn-extract-analyze'),
  extractBtnText: document.getElementById('extract-btn-text'),

  // Analytics
  wordCloudDisplay: document.getElementById('word-cloud-display'),
  keywordCountBadge: document.getElementById('keyword-count-badge'),
  keywordBarsSection: document.getElementById('keyword-bars-section'),
  keywordBarsList: document.getElementById('keyword-bars-list'),

  // Chat
  chatFeed: document.getElementById('chat-conversation-feed'),
  askForm: document.getElementById('ask-question-form'),
  queryInput: document.getElementById('query-input'),
  btnSendQuery: document.getElementById('btn-send-query'),
  btnClearChat: document.getElementById('btn-clear-chat'),
  quickPromptChips: document.querySelectorAll('.prompt-chip'),
  toastContainer: document.getElementById('toast-container')
};

// ---------------------------------------------------------------------------
// 1. Backend Connectivity & Health Check
// ---------------------------------------------------------------------------
function getApiBaseUrl() {
  const custom = elements.apiEndpointInput.value.trim().replace(/\/+$/, '');
  if (custom) return custom;
  if (window.location.origin.startsWith('http')) return window.location.origin;
  return 'https://sih-hackathon-project-solution-1.onrender.com';
}

async function pingBackendHealth() {
  const url = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Ping root with Accept: application/json
    const response = await fetch(`${url}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      elements.apiStatusBadge.classList.remove('offline');
      elements.apiStatusLabel.textContent = 'Core Online (Port 8000)';
      state.apiConnected = true;
    } else {
      elements.apiStatusBadge.classList.add('offline');
      elements.apiStatusLabel.textContent = `Error ${response.status}`;
      state.apiConnected = false;
    }
  } catch (err) {
    elements.apiStatusBadge.classList.add('offline');
    elements.apiStatusLabel.textContent = 'Core Offline';
    state.apiConnected = false;
  }
}

// ---------------------------------------------------------------------------
// 2. Toast Notifications
// ---------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ---------------------------------------------------------------------------
// 3. File Handling & Dropzone
// ---------------------------------------------------------------------------
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function handleFileSelection(file) {
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Please select a valid .pdf document.', 'error');
    return;
  }

  state.activeFile = file;
  elements.selectedFilename.textContent = file.name;
  elements.selectedFilesize.textContent = formatFileSize(file.size);
  elements.fileInfoBar.classList.remove('hidden');
  elements.docStatePill.textContent = 'Loaded';
  elements.docStatePill.classList.add('active');
  elements.btnExtractAnalyze.disabled = false;
  elements.btnSendQuery.disabled = false;

  showToast(`Loaded: ${file.name}`, 'info');
}

function removeFile() {
  state.activeFile = null;
  elements.pdfFileInput.value = '';
  elements.fileInfoBar.classList.add('hidden');
  elements.docStatePill.textContent = 'No File Loaded';
  elements.docStatePill.classList.remove('active');
  elements.btnExtractAnalyze.disabled = true;
  elements.btnSendQuery.disabled = true;
}

// Dropzone Events
elements.pdfDropzone.addEventListener('click', () => elements.pdfFileInput.click());

elements.pdfDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.pdfDropzone.classList.add('dragover');
});

elements.pdfDropzone.addEventListener('dragleave', () => {
  elements.pdfDropzone.classList.remove('dragover');
});

elements.pdfDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.pdfDropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileSelection(e.dataTransfer.files[0]);
  }
});

elements.pdfFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFileSelection(e.target.files[0]);
  }
});

elements.btnRemoveFile.addEventListener('click', (e) => {
  e.stopPropagation();
  removeFile();
});

// ---------------------------------------------------------------------------
// 4. Sample PDF Generator (Instant Testing)
// ---------------------------------------------------------------------------
function generateSampleGeologicalPdfBlob() {
  // Generates a valid uncompressed single-page PDF with realistic CMPDI borehole content
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 1100 >>
stream
BT
/F1 16 Tf
50 740 Td
(CENTRAL MINE PLANNING AND DESIGN INSTITUTE (CMPDI)) Tj
/F1 12 Tf
0 -24 Td
(BOREHOLE EXPLORATION REPORT - BLOCK JHARKHAND NORTH) Tj
/F1 10 Tf
0 -20 Td
(Project: Jharia Coalfield Seam Horizon Investigation) Tj
0 -16 Td
(Borehole ID: CMPDI-DH-2026-B8 | Coordinates: 23.7502 N, 86.4150 E) Tj
0 -16 Td
(Total Depth Drilled: 420.5 meters | Lithological Log & Stratigraphic Sequence) Tj
0 -24 Td
(STRATIGRAPHY & COAL SEAM HORIZONS:) Tj
0 -16 Td
(1. Depth 0.0 - 18.2m: Alluvium and coarse weathered sandstone overburden.) Tj
0 -16 Td
(2. Depth 18.2 - 64.8m: Medium grained carbonaceous shale and siltstone strata.) Tj
0 -16 Td
(3. Depth 64.8 - 72.4m: Seam-IX Coal Seam. Thickness 7.6m. High volatile bituminous grade.) Tj
0 -16 Td
(4. Depth 72.4 - 142.0m: Massive sandstone with interbedded shaly coal stringers.) Tj
0 -16 Td
(5. Depth 142.0 - 153.2m: Seam-X Main Coal Seam. Thickness 11.2m. Low ash metallurgical coal.) Tj
0 -16 Td
(6. Depth 153.2 - 310.0m: Barren Measures Formation comprising dense grey shale and quartzite.) Tj
0 -16 Td
(7. Depth 310.0 - 325.8m: Seam-XII Deep Horizon. Thickness 15.8m. High calorific value.) Tj
0 -24 Td
(HYDROGEOLOGY & FAULT ANALYSIS:) Tj
0 -16 Td
(Water table encountered at 14.5m below surface. Artesian pressure observed at 295m depth.) Tj
0 -16 Td
(Minor shear zone detected at 210m with 15 degree dip. Rock Quality Designation (RQD): 82%.) Tj
0 -24 Td
(RECOMMENDATIONS FOR OPENCAST MINING:) Tj
0 -16 Td
(Stripping ratio calculated at 1:4.8. Recommended bench height 12 meters with 45 degree slope.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000298 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1460
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

elements.btnQuickSample.addEventListener('click', () => {
  const blob = generateSampleGeologicalPdfBlob();
  const sampleFile = new File([blob], 'CMPDI_Borehole_Exploration_Sample.pdf', { type: 'application/pdf' });
  handleFileSelection(sampleFile);
  showToast('Generated sample CMPDI borehole report PDF.', 'info');
});

// ---------------------------------------------------------------------------
// 5. Extract & Analyze Action
// ---------------------------------------------------------------------------
elements.btnExtractAnalyze.addEventListener('click', async () => {
  if (!state.activeFile || state.isAnalyzing) return;

  state.isAnalyzing = true;
  elements.btnExtractAnalyze.disabled = true;
  elements.extractBtnText.textContent = 'Extracting Text & Frequencies...';

  elements.wordCloudDisplay.innerHTML = `
    <div class="empty-state-notice">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <span>Extracting text with PyPDF2 and computing word weights...</span>
    </div>
  `;

  const formData = new FormData();
  formData.append('file', state.activeFile);

  try {
    const res = await fetch(`${getApiBaseUrl()}/extract-and-analyze/`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      elements.wordCloudDisplay.innerHTML = `
        <div class="empty-state-notice" style="color: var(--danger)">
          <span>⚠️ ${data.error}</span>
        </div>
      `;
      showToast(data.error, 'error');
      return;
    }

    renderWordCloud(data.word_cloud_data || []);
    showToast('Keyword analysis completed successfully!', 'info');
  } catch (err) {
    elements.wordCloudDisplay.innerHTML = `
      <div class="empty-state-notice" style="color: var(--danger)">
        <span>Failed to connect to backend: ${err.message}</span>
      </div>
    `;
    showToast('Failed to connect to backend: ' + err.message, 'error');
  } finally {
    state.isAnalyzing = false;
    elements.btnExtractAnalyze.disabled = false;
    elements.extractBtnText.textContent = 'Extract & Generate Analytics';
  }
});

function renderWordCloud(wordCloudData) {
  state.extractedKeywords = wordCloudData;
  elements.keywordCountBadge.textContent = `${wordCloudData.length} terms`;

  if (!wordCloudData || wordCloudData.length === 0) {
    elements.wordCloudDisplay.innerHTML = `
      <div class="empty-state-notice">
        <span>No significant keywords extracted.</span>
      </div>
    `;
    elements.keywordBarsSection.classList.add('hidden');
    return;
  }

  // Find max weight for dynamic scaling
  const maxWeight = Math.max(...wordCloudData.map(d => d.weight), 1);
  const minWeight = Math.min(...wordCloudData.map(d => d.weight), 1);

  // Render Tags
  elements.wordCloudDisplay.innerHTML = '';
  wordCloudData.forEach(item => {
    // Map weight from 12px to 22px
    const normalized = (item.weight - minWeight) / (maxWeight - minWeight || 1);
    const fontSize = 12 + Math.round(normalized * 10);

    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.style.fontSize = `${fontSize}px`;
    chip.title = `Click to ask Gemini about "${item.word}"`;
    chip.innerHTML = `
      <span class="chip-text">${item.word}</span>
      <span class="chip-weight">${item.weight}</span>
    `;

    chip.addEventListener('click', () => {
      askQuestionAboutKeyword(item.word);
    });

    elements.wordCloudDisplay.appendChild(chip);
  });

  // Render Horizontal Bars
  elements.keywordBarsList.innerHTML = '';
  wordCloudData.slice(0, 8).forEach(item => {
    const percentage = Math.round((item.weight / maxWeight) * 100);
    const barItem = document.createElement('div');
    barItem.className = 'freq-bar-item';
    barItem.title = `Frequency: ${item.weight} | Click to ask about ${item.word}`;
    barItem.innerHTML = `
      <span class="bar-term-name">${item.word}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${percentage}%"></div>
      </div>
      <span class="bar-count-num">${item.weight}</span>
    `;

    barItem.addEventListener('click', () => {
      askQuestionAboutKeyword(item.word);
    });

    elements.keywordBarsList.appendChild(barItem);
  });

  elements.keywordBarsSection.classList.remove('hidden');
}

function askQuestionAboutKeyword(keyword) {
  elements.queryInput.value = `Provide detailed analysis and context regarding "${keyword}" in this geological report.`;
  elements.queryInput.focus();
}

// ---------------------------------------------------------------------------
// 6. Interactive Q&A Assistant (Gemini)
// ---------------------------------------------------------------------------
function formatMarkdown(text) {
  if (!text) return '';
  // Basic markdown sanitizer & converter
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ```code```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold **bold**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic *italic*
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Bullet lists (- or *)
  formatted = formatted.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Linebreaks to paragraphs
  const paragraphs = formatted.split(/\n\n+/);
  return paragraphs.map(p => {
    if (p.startsWith('<ul>') || p.startsWith('<pre>')) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function appendMessageBubble(sender, content, rawText = '') {
  const isUser = sender === 'user';
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isUser ? 'user-message' : 'ai-message'}`;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.innerHTML = `
    <div class="bubble-avatar">${isUser ? 'YOU' : 'TS'}</div>
    <div class="bubble-body">
      <div class="bubble-header">
        <strong>${isUser ? 'Mining Engineer' : 'Terra Sight Gemini'}</strong>
        <span class="timestamp">${timeStr}</span>
      </div>
      <div class="bubble-content">
        ${isUser ? `<p>${content}</p>` : formatMarkdown(content)}
      </div>
      ${!isUser ? `<button class="copy-answer-btn" title="Copy answer">📋 Copy Answer</button>` : ''}
    </div>
  `;

  if (!isUser) {
    const copyBtn = bubble.querySelector('.copy-answer-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(rawText || content);
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy Answer', 2000);
      });
    }
  }

  elements.chatFeed.appendChild(bubble);
  elements.chatFeed.scrollTop = elements.chatFeed.scrollHeight;
  return bubble;
}

function appendThinkingBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ai-message thinking-bubble';
  bubble.id = 'active-thinking-bubble';

  bubble.innerHTML = `
    <div class="bubble-avatar">TS</div>
    <div class="bubble-body">
      <div class="bubble-header">
        <strong>Terra Sight Gemini</strong>
        <span class="timestamp">Analyzing document text...</span>
      </div>
      <div class="bubble-content">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  elements.chatFeed.appendChild(bubble);
  elements.chatFeed.scrollTop = elements.chatFeed.scrollHeight;
  return bubble;
}

elements.askForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = elements.queryInput.value.trim();
  if (!question || state.isQuerying) return;

  if (!state.activeFile) {
    showToast('Please upload or generate a geological PDF first.', 'error');
    return;
  }

  // Clear query input
  elements.queryInput.value = '';
  state.isQuerying = true;
  elements.btnSendQuery.disabled = true;

  // Add user bubble
  appendMessageBubble('user', question);

  // Add thinking placeholder
  const thinkingBubble = appendThinkingBubble();

  const formData = new FormData();
  formData.append('file', state.activeFile);
  formData.append('question', question);

  try {
    const res = await fetch(`${getApiBaseUrl()}/ask-pdf/`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    thinkingBubble.remove();

    if (data.error) {
      appendMessageBubble('ai', `⚠️ **Error**: ${data.error}`);
      showToast(data.error, 'error');
    } else if (data.answer) {
      appendMessageBubble('ai', data.answer, data.answer);
    } else {
      appendMessageBubble('ai', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    thinkingBubble.remove();
    appendMessageBubble('ai', `❌ **Request failed**: Unable to reach backend (${err.message}). Ensure \`CMPDI_Backend/main.py\` is running.`);
    showToast('Query failed: ' + err.message, 'error');
  } finally {
    state.isQuerying = false;
    elements.btnSendQuery.disabled = !state.activeFile;
  }
});

// Submit on Enter, Shift+Enter for newline
elements.queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    elements.askForm.requestSubmit();
  }
});

// Quick Prompts Chips
elements.quickPromptChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    if (prompt) {
      elements.queryInput.value = prompt;
      if (state.activeFile) {
        elements.askForm.requestSubmit();
      } else {
        elements.queryInput.focus();
        showToast('Please upload a PDF first to ask this prompt.', 'info');
      }
    }
  });
});

// Clear Chat Action
elements.btnClearChat.addEventListener('click', () => {
  elements.chatFeed.innerHTML = `
    <div class="chat-bubble ai-message intro-bubble">
      <div class="bubble-avatar">TS</div>
      <div class="bubble-body">
        <div class="bubble-header">
          <strong>Terra Sight Assistant</strong>
          <span class="timestamp">Ready</span>
        </div>
        <div class="bubble-content">
          <p>Conversation cleared. Ready for your geological queries.</p>
        </div>
      </div>
    </div>
  `;
  showToast('Chat history cleared.', 'info');
});

// Re-check backend health whenever user edits endpoint
elements.apiEndpointInput.addEventListener('change', pingBackendHealth);

// Initialize Health Monitoring
pingBackendHealth();
setInterval(pingBackendHealth, 5000);
