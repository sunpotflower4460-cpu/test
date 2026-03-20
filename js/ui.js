// ==========================================
// じぶん会議 – UI v2.0
// イニシャルアバター, localStorage, toast
// ==========================================

const UI = {
  els: {},

  init() {
    this.els = {
      app: document.getElementById('app'),
      splashScreen: document.getElementById('splash-screen'),
      mainScreen: document.getElementById('main-screen'),
      startBtn: document.getElementById('start-btn'),
      header: document.getElementById('header'),
      sessionTitle: document.getElementById('session-title'),
      modeIndicator: document.getElementById('mode-indicator'),
      menuBtn: document.getElementById('menu-btn'),
      mapBtn: document.getElementById('map-btn'),
      sidebar: document.getElementById('sidebar'),
      sidebarClose: document.getElementById('sidebar-close'),
      sidebarOverlay: document.getElementById('sidebar-overlay'),
      newSessionBtn: document.getElementById('new-session-btn'),
      sessionList: document.getElementById('session-list'),
      chatArea: document.getElementById('chat-area'),
      messages: document.getElementById('messages'),
      agentBar: document.getElementById('agent-bar'),
      agentIcons: document.getElementById('agent-icons'),
      inputArea: document.getElementById('input-area'),
      userInput: document.getElementById('user-input'),
      sendBtn: document.getElementById('send-btn'),
      personaModal: document.getElementById('persona-modal'),
      personaDetail: document.getElementById('persona-detail'),
      mapModal: document.getElementById('map-modal'),
      relationshipMap: document.getElementById('relationship-map'),
      modeToast: document.getElementById('mode-toast'),
    };
  },

  showMain() {
    this.els.splashScreen.classList.remove('active');
    this.els.mainScreen.classList.add('active');
  },

  // --- Sidebar ---
  openSidebar() {
    this.els.sidebar.classList.add('open');
    this.els.sidebarOverlay.classList.add('open');
  },
  closeSidebar() {
    this.els.sidebar.classList.remove('open');
    this.els.sidebarOverlay.classList.remove('open');
  },

  // --- Agent bar ---
  renderAgentIcons(selectedId, onSelect, onLongPress) {
    this.els.agentIcons.innerHTML = '';

    AGENTS.forEach(agent => {
      const el = document.createElement('div');
      el.className = 'agent-icon' + (selectedId === agent.id ? ' selected' : '');
      el.style.background = agent.gradient;
      el.innerHTML = `
        ${agent.initial}
        <span class="agent-icon-label">${agent.name}</span>
      `;

      el.addEventListener('click', () => onSelect(agent.id));

      // Long press for modal
      let pressTimer;
      el.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
          e.preventDefault();
          onLongPress(agent.id);
        }, 500);
      }, { passive: false });
      el.addEventListener('touchend', () => clearTimeout(pressTimer));
      el.addEventListener('touchmove', () => clearTimeout(pressTimer));

      // Desktop: double click for modal
      el.addEventListener('dblclick', () => onLongPress(agent.id));

      this.els.agentIcons.appendChild(el);
    });

    // Random button (replaces 全員)
    const randEl = document.createElement('div');
    randEl.className = 'agent-icon agent-icon--random' + (selectedId === 'random' ? ' selected' : '');
    randEl.innerHTML = `?<span class="agent-icon-label">ランダム</span>`;
    randEl.addEventListener('click', () => onSelect('random'));
    this.els.agentIcons.appendChild(randEl);
  },

  // --- Messages ---
  addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = `<div class="bubble">${this.escapeHtml(text)}</div>`;
    this.els.messages.appendChild(div);
    this.scrollToBottom();
  },

  addAgentMessage(agent, text, mode) {
    const div = document.createElement('div');
    div.className = `message message-agent ${agent.animClass}`;

    const modeLabel = mode ? `<span class="agent-mode-label">— ${mode.name}</span>` : '';

    div.innerHTML = `
      <div class="agent-label">
        <div class="agent-avatar-sm" style="background:${agent.gradient};">
          ${agent.initial}
        </div>
        <span class="agent-name-label" style="color:${agent.color};">${agent.name}</span>
        ${modeLabel}
      </div>
      <div class="bubble ${agent.bubbleClass}">${this.escapeHtml(text)}</div>
    `;

    this.els.messages.appendChild(div);
    this.scrollToBottom();
    return div;
  },

  addReactions(messageEl, reactions) {
    const container = document.createElement('div');
    container.className = 'reactions';

    reactions.forEach(r => {
      const agent = getAgent(r.agentId);
      if (!agent) return;
      const tag = document.createElement('span');
      tag.className = 'reaction';
      tag.style.background = agent.bg;
      tag.style.color = agent.color;
      tag.style.borderColor = agent.color;
      tag.innerHTML = `
        <span class="reaction-dot" style="background:${agent.color};"></span>
        ${agent.name} ${r.text}
      `;
      container.appendChild(tag);
    });

    const bubble = messageEl.querySelector('.bubble');
    if (bubble) bubble.after(container);
  },

  // --- Typing ---
  showTypingIndicator(agent) {
    const div = document.createElement('div');
    div.className = `message message-agent typing-message ${agent.animClass}`;
    div.setAttribute('data-typing', agent.id);

    div.innerHTML = `
      <div class="agent-label">
        <div class="agent-avatar-sm" style="background:${agent.gradient};">
          ${agent.initial}
        </div>
        <span class="agent-name-label" style="color:${agent.color};">${agent.name}</span>
      </div>
      <div class="bubble ${agent.bubbleClass}">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    `;

    this.els.messages.appendChild(div);
    this.scrollToBottom();
    return div;
  },

  removeTypingIndicator(agentId) {
    const el = this.els.messages.querySelector(`[data-typing="${agentId}"]`);
    if (el) el.remove();
  },

  // --- Focus effect (for sequential responses) ---
  setFocusedMessage(messageEl) {
    this.els.messages.classList.add('focusing');
    document.querySelectorAll('#messages .message').forEach(m => m.classList.remove('focused'));
    if (messageEl) messageEl.classList.add('focused');
  },
  clearFocus() {
    this.els.messages.classList.remove('focusing');
    document.querySelectorAll('#messages .message').forEach(m => m.classList.remove('focused'));
  },

  // --- Toast ---
  showToast(text, duration) {
    duration = duration || 2500;
    this.els.modeToast.textContent = text;
    this.els.modeToast.classList.add('show');
    setTimeout(() => {
      this.els.modeToast.classList.remove('show');
    }, duration);
  },

  // --- Mode indicator in header ---
  updateModeIndicator(modeName) {
    this.els.modeIndicator.textContent = modeName;
  },

  // --- Persona modal ---
  showPersonaModal(agent) {
    const beliefsHtml = agent.beliefs.map(b => `<li>「${b}」</li>`).join('');
    const modesHtml = agent.modes.map(m =>
      `<span class="persona-mode-tag" style="color:${agent.color}; border-color:${agent.color};">
        ${m.name}
      </span>`
    ).join('');

    this.els.personaDetail.innerHTML = `
      <div class="persona-header">
        <div class="persona-avatar-lg" style="background:${agent.gradient};">
          ${agent.initial}
        </div>
        <div class="persona-name" style="color:${agent.color};">${agent.name}</div>
        <div class="persona-role">${agent.role} — ${agent.title}</div>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">存在の宣言</div>
        <div class="persona-layer0">
          <div class="persona-layer0-declaration">${agent.layer0.declaration}</div>
          <p>${agent.layer0.identity}</p>
          <p style="margin-top:8px;">${agent.layer0.mission}</p>
        </div>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">存在の核</div>
        <p>${agent.core.essence}</p>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">根源的な願い</div>
        <p>${agent.core.wish}</p>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">信念体系</div>
        <ul class="persona-beliefs">${beliefsHtml}</ul>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">関係性のモード</div>
        <div class="persona-modes">${modesHtml}</div>
      </div>
    `;

    this.els.personaModal.classList.add('active');
  },

  // --- Map modal ---
  showMapModal() {
    const itemsHtml = AGENTS.map(a => `
      <div class="map-item">
        <div class="map-avatar" style="background:${a.gradient};">${a.initial}</div>
        <div>
          <div class="map-name" style="color:${a.color};">${a.name}（${a.title}）</div>
          <div class="map-function">${a.mapFunction}</div>
        </div>
      </div>
    `).join('');

    this.els.relationshipMap.innerHTML = `
      <div class="map-title">7人の関係性</div>
      ${itemsHtml}
    `;

    this.els.mapModal.classList.add('active');
  },

  closeModals() {
    this.els.personaModal.classList.remove('active');
    this.els.mapModal.classList.remove('active');
  },

  // --- Session list ---
  renderSessionList(sessions, activeId, onSelect) {
    this.els.sessionList.innerHTML = '';
    sessions.forEach(s => {
      const li = document.createElement('li');
      li.className = s.id === activeId ? 'active' : '';
      li.textContent = s.title;
      li.addEventListener('click', () => onSelect(s.id));
      this.els.sessionList.appendChild(li);
    });
  },

  setSessionTitle(title) {
    this.els.sessionTitle.textContent = title;
  },

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.els.chatArea.scrollTop = this.els.chatArea.scrollHeight;
    });
  },

  clearMessages() {
    this.els.messages.innerHTML = '';
  },

  escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML.replace(/\n/g, '<br>');
  },

  getInputValue() {
    return this.els.userInput.value.trim();
  },

  clearInput() {
    this.els.userInput.value = '';
    this.els.userInput.style.height = 'auto';
    this.els.sendBtn.disabled = true;
  },

  setupAutoResize() {
    this.els.userInput.addEventListener('input', () => {
      const el = this.els.userInput;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      this.els.sendBtn.disabled = el.value.trim() === '';
    });
  },
};
