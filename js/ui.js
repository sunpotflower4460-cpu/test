// ==========================================
// じぶん会議 – UI v4.0
// Light/Dark + Native App Feel
// ==========================================

const UI = {
  els: {},
  _scrollLockY: 0,

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
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
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

    this.initTheme();
  },

  // --- Theme ---
  initTheme() {
    const saved = localStorage.getItem('jibun-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
    // If no saved preference, CSS @media handles it automatically
  },

  toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let next;
    if (current === 'dark') {
      next = 'light';
    } else if (current === 'light') {
      next = 'dark';
    } else {
      // No explicit setting, using OS default. Toggle to opposite.
      next = isDarkOS ? 'light' : 'dark';
    }

    root.setAttribute('data-theme', next);
    localStorage.setItem('jibun-theme', next);

    // Update theme-color meta
    const meta = document.querySelector('meta[name="theme-color"]:not([media])') ||
                 document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', next === 'light' ? '#f5f4f1' : '#0b0b10');
    }
  },

  // --- Splash → Main ---
  showMain() {
    this.els.splashScreen.classList.add('exit');
    setTimeout(() => {
      this.els.splashScreen.classList.remove('active');
      this.els.splashScreen.classList.remove('exit');
      this.els.mainScreen.classList.add('active', 'entering');
      setTimeout(() => {
        this.els.mainScreen.classList.remove('entering');
      }, 500);
    }, 500);
  },

  // --- Ripple effect ---
  addRipple(el, e) {
    const rect = el.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (x - size / 2) + 'px';
    ripple.style.top = (y - size / 2) + 'px';

    el.classList.add('ripple-host');
    el.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
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

      el.addEventListener('click', (e) => {
        this.addRipple(el, e);
        onSelect(agent.id);
      });

      let pressTimer;
      el.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
          e.preventDefault();
          onLongPress(agent.id);
        }, 500);
      }, { passive: false });
      el.addEventListener('touchend', () => clearTimeout(pressTimer));
      el.addEventListener('touchmove', () => clearTimeout(pressTimer));
      el.addEventListener('dblclick', () => onLongPress(agent.id));

      this.els.agentIcons.appendChild(el);
    });

    const randEl = document.createElement('div');
    randEl.className = 'agent-icon agent-icon--random' + (selectedId === 'random' ? ' selected' : '');
    randEl.innerHTML = `?<span class="agent-icon-label">ランダム</span>`;
    randEl.addEventListener('click', (e) => {
      this.addRipple(randEl, e);
      onSelect('random');
    });
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

  // --- Focus ---
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

  // --- Mode indicator ---
  updateModeIndicator(modeName) {
    this.els.modeIndicator.textContent = modeName;
  },

  // --- Persona modal ---
  showPersonaModal(agent) {
    const beliefsHtml = agent.beliefs.map(b =>
      `<li>「${typeof b === 'object' ? b.seed : b}」</li>`
    ).join('');

    const approachHtml = agent.guidance
      ? agent.guidance.approach.map(a =>
          `<li class="persona-approach-item">${a}</li>`
        ).join('')
      : '';

    const permissionHtml = agent.guidance && agent.guidance.permission
      ? agent.guidance.permission.map(p =>
          `<span class="persona-permission-tag">${p}</span>`
        ).join('')
      : '';

    const strengthHtml = agent.strength
      ? `<div class="persona-strength">
           <span class="strength-label">得意な深さ:</span> ${agent.strength.primaryLayers.join(', ')}<br>
           <span class="strength-label">得意な領域:</span> ${agent.strength.primaryDomains.join(', ')}<br>
           <span class="strength-label">神経親和:</span> ${agent.strength.nervousAffinity}
         </div>`
      : '';

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
        <p><strong>${agent.core.symbol}</strong> — ${agent.core.essence}</p>
        <p style="margin-top:6px;">願い: ${agent.core.wish}</p>
        <p style="margin-top:4px;">痛み: ${agent.core.pain}</p>
      </div>

      ${agent.guidance ? `
      <div class="persona-section">
        <div class="persona-section-title">トーン</div>
        <p>${agent.guidance.tone}</p>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">許可</div>
        <div class="persona-permissions">${permissionHtml}</div>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">接し方</div>
        <ul class="persona-approach">${approachHtml}</ul>
      </div>
      ` : ''}

      <div class="persona-section">
        <div class="persona-section-title">信念体系</div>
        <ul class="persona-beliefs">${beliefsHtml}</ul>
      </div>

      ${strengthHtml ? `
      <div class="persona-section">
        <div class="persona-section-title">得意な領域</div>
        ${strengthHtml}
      </div>
      ` : ''}
    `;

    this.els.personaModal.classList.add('active');
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
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
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
  },

  closeModals() {
    this.els.personaModal.classList.remove('active');
    this.els.mapModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, this._scrollLockY || 0);
  },

  // --- Session list ---
  renderSessionList(sessions, activeId, onSelect, onDelete) {
    this.els.sessionList.innerHTML = '';
    sessions.forEach(s => {
      const li = document.createElement('li');
      li.className = s.id === activeId ? 'active' : '';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'session-title-text';
      titleSpan.textContent = s.title;
      titleSpan.addEventListener('click', () => onSelect(s.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'session-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.setAttribute('aria-label', '削除');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sessions.length <= 1) return;
        onDelete(s.id);
      });

      li.appendChild(titleSpan);
      li.appendChild(deleteBtn);
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
