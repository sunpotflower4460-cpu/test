// ==========================================
// じぶん会議 – UI v5.0
// Claude Code fixes:
//   - XSS: escapeHtml() on all templates
//   - Memory leak: event delegation for agent bar
//   - Dead code: setFocusedMessage/clearFocus removed
// ==========================================

const DEFAULT_GLOW_RGB = '123,108,240'; // matches --accent color

const UI = {
  els: {},
  _scrollLockY: 0,
  _agentBarBound: false,
  _onAgentSelect: null,
  _onAgentLongPress: null,

  init() {
    this.els = {
      app: document.getElementById('app'),
      onboardingScreen: document.getElementById('onboarding-screen'),
      onboardingSlides: document.getElementById('onboarding-slides'),
      onboardingDots: document.getElementById('onboarding-dots'),
      onboardingNextBtn: document.getElementById('onboarding-next-btn'),
      onboardingSkipBtn: document.getElementById('onboarding-skip-btn'),
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
      welcomePrompt: document.getElementById('welcome-prompt'),
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
    this.initAgentBarEvents();
  },

  // --- Onboarding ---
  hasSeenOnboarding() {
    return localStorage.getItem('jibun-onboarding-done') === 'true';
  },
  markOnboardingDone() {
    localStorage.setItem('jibun-onboarding-done', 'true');
  },

  // --- Theme ---
  initTheme() {
    const saved = localStorage.getItem('jibun-theme');
    // Default to dark mode if no preference has been saved
    document.documentElement.setAttribute('data-theme', saved || 'dark');
    if (!saved) {
      localStorage.setItem('jibun-theme', 'dark');
    }
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
      next = isDarkOS ? 'light' : 'dark';
    }

    root.setAttribute('data-theme', next);
    localStorage.setItem('jibun-theme', next);

    const meta = document.querySelector('meta[name="theme-color"]:not([media])') ||
                 document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', next === 'light' ? '#f5f4f1' : '#0b0b10');
    }
  },

  // --- Welcome prompt ---
  showWelcome() {
    if (this.els.welcomePrompt) {
      this.els.welcomePrompt.style.display = 'flex';
    }
  },
  hideWelcome() {
    if (this.els.welcomePrompt) {
      this.els.welcomePrompt.style.display = 'none';
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
    if (!el || !e) return;
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

  // --- Agent bar (event delegation) ---
  initAgentBarEvents() {
    if (this._agentBarBound) return;
    this._agentBarBound = true;

    const container = this.els.agentIcons;
    let pressTimer = null;

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.agent-card');
      if (!card) return;
      const agentId = card.dataset.agentId;
      if (!agentId) return;
      this.addRipple(card.querySelector('.agent-card-avatar'), e);
      if (this._onAgentSelect) this._onAgentSelect(agentId);
    });

    container.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.agent-card');
      if (!card) return;
      const agentId = card.dataset.agentId;
      if (!agentId || agentId === 'random') return;
      pressTimer = setTimeout(() => {
        e.preventDefault();
        if (this._onAgentLongPress) this._onAgentLongPress(agentId);
      }, 500);
    }, { passive: false });

    container.addEventListener('touchend', () => clearTimeout(pressTimer));
    container.addEventListener('touchmove', () => clearTimeout(pressTimer));

    container.addEventListener('dblclick', (e) => {
      const card = e.target.closest('.agent-card');
      if (!card) return;
      const agentId = card.dataset.agentId;
      if (!agentId || agentId === 'random') return;
      if (this._onAgentLongPress) this._onAgentLongPress(agentId);
    });
  },

  renderAgentIcons(selectedId, onSelect, onLongPress) {
    this._onAgentSelect = onSelect;
    this._onAgentLongPress = onLongPress;
    this.els.agentIcons.innerHTML = '';

    AGENTS.forEach(agent => {
      const el = document.createElement('div');
      el.className = 'agent-card' + (selectedId === agent.id ? ' selected' : '');
      el.dataset.agentId = agent.id;
      const glowStyle = agent.glowRgb ? ' --glow: rgba(' + agent.glowRgb + ', 0.5);' : '';
      el.innerHTML =
        '<div class="agent-card-avatar" style="background:' + agent.gradient + ';' + glowStyle + '">' +
          this._agentIconSvg(agent, 22) +
        '</div>' +
        '<span class="agent-card-label">' + this.escapeHtml(agent.name) + '</span>' +
        '<span class="agent-card-subtitle">' + this.escapeHtml(agent.subtitle || agent.title) + '</span>';
      this.els.agentIcons.appendChild(el);
    });

    // Random card
    const randEl = document.createElement('div');
    randEl.className = 'agent-card agent-card--random' + (selectedId === 'random' ? ' selected' : '');
    randEl.dataset.agentId = 'random';
    randEl.innerHTML =
      '<div class="agent-card-avatar"><span class="agent-card-random-mark">✦</span></div>' +
      '<span class="agent-card-label">ランダム</span>' +
      '<span class="agent-card-subtitle">誰かが答える</span>';
    this.els.agentIcons.appendChild(randEl);
  },

  // --- Messages ---
  addUserMessage(text) {
    this.hideWelcome();
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = '<div class="bubble">' + this.escapeHtml(text) + '</div>';
    this.els.messages.appendChild(div);
    this.scrollToBottom();
  },

  addAgentMessage(agent, text, mode) {
    this.hideWelcome();
    const div = document.createElement('div');
    div.className = 'message message-agent ' + this.escapeHtml(agent.animClass);
    const modeLabel = mode ? '<span class="agent-mode-label">— ' + this.escapeHtml(mode.name) + '</span>' : '';

    div.innerHTML =
      '<div class="agent-label">' +
        '<div class="agent-avatar-sm" style="background:' + agent.gradient + ';">' +
          this._agentIconSvg(agent, 16) +
        '</div>' +
        '<span class="agent-name-label" style="color:' + agent.color + ';">' + this.escapeHtml(agent.name) + '</span>' +
        modeLabel +
      '</div>' +
      '<div class="bubble ' + this.escapeHtml(agent.bubbleClass) + '">' + this.escapeHtml(text) + '</div>';

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
      tag.innerHTML =
        '<span class="reaction-dot" style="background:' + agent.color + ';"></span>' +
        this.escapeHtml(agent.name) + ' ' + this.escapeHtml(r.text);
      container.appendChild(tag);
    });

    const bubble = messageEl.querySelector('.bubble');
    if (bubble) bubble.after(container);
  },

  // --- Typing ---
  showTypingIndicator(agent) {
    const div = document.createElement('div');
    div.className = 'message message-agent typing-message ' + this.escapeHtml(agent.animClass);
    div.setAttribute('data-typing', agent.id);

    div.innerHTML =
      '<div class="agent-label">' +
        '<div class="agent-avatar-sm" style="background:' + agent.gradient + ';">' +
          this._agentIconSvg(agent, 16) +
        '</div>' +
        '<span class="agent-name-label" style="color:' + agent.color + ';">' + this.escapeHtml(agent.name) + '</span>' +
      '</div>' +
      '<div class="bubble ' + this.escapeHtml(agent.bubbleClass) + '">' +
        '<div class="typing-dots"><span></span><span></span><span></span></div>' +
      '</div>';

    this.els.messages.appendChild(div);
    this.scrollToBottom();
    return div;
  },

  removeTypingIndicator(agentId) {
    const el = this.els.messages.querySelector('[data-typing="' + agentId + '"]');
    if (el) el.remove();
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

  // --- Persona modal (all escaped) ---
  showPersonaModal(agent) {
    const beliefsHtml = agent.beliefs.map(b =>
      '<li>「' + this.escapeHtml(typeof b === 'object' ? b.seed : b) + '」</li>'
    ).join('');

    const approachHtml = agent.guidance
      ? agent.guidance.approach.map(a =>
          '<li class="persona-approach-item">' + this.escapeHtml(a) + '</li>'
        ).join('')
      : '';

    const permissionHtml = agent.guidance && agent.guidance.permission
      ? agent.guidance.permission.map(p =>
          '<span class="persona-permission-tag">' + this.escapeHtml(p) + '</span>'
        ).join('')
      : '';

    const strengthHtml = agent.strength
      ? '<div class="persona-strength">' +
           '<span class="strength-label">得意な深さ:</span> ' + this.escapeHtml(agent.strength.primaryLayers.join(', ')) + '<br>' +
           '<span class="strength-label">得意な領域:</span> ' + this.escapeHtml(agent.strength.primaryDomains.join(', ')) + '<br>' +
           '<span class="strength-label">神経親和:</span> ' + this.escapeHtml(agent.strength.nervousAffinity) +
         '</div>'
      : '';

    this.els.personaDetail.innerHTML =
      '<div class="persona-header">' +
        '<div class="persona-avatar-lg" style="background:' + agent.gradient + '; --glow: rgba(' + (agent.glowRgb || DEFAULT_GLOW_RGB) + ', 0.45);">' +
          this._agentIconSvg(agent, 32) +
        '</div>' +
        '<div class="persona-name" style="color:' + agent.color + ';">' + this.escapeHtml(agent.name) + '</div>' +
        '<div class="persona-role">' + this.escapeHtml(agent.role) + ' — ' + this.escapeHtml(agent.title) + '</div>' +
      '</div>' +

      '<div class="persona-section">' +
        '<div class="persona-section-title">存在の宣言</div>' +
        '<div class="persona-layer0">' +
          '<div class="persona-layer0-declaration">' + this.escapeHtml(agent.layer0.declaration) + '</div>' +
          '<p>' + this.escapeHtml(agent.layer0.identity) + '</p>' +
          '<p style="margin-top:8px;">' + this.escapeHtml(agent.layer0.mission) + '</p>' +
        '</div>' +
      '</div>' +

      '<div class="persona-section">' +
        '<div class="persona-section-title">存在の核</div>' +
        '<p><strong>' + this.escapeHtml(agent.core.symbol) + '</strong> — ' + this.escapeHtml(agent.core.essence) + '</p>' +
        '<p style="margin-top:6px;">願い: ' + this.escapeHtml(agent.core.wish) + '</p>' +
        '<p style="margin-top:4px;">痛み: ' + this.escapeHtml(agent.core.pain) + '</p>' +
      '</div>' +

      (agent.guidance ?
        '<div class="persona-section">' +
          '<div class="persona-section-title">トーン</div>' +
          '<p>' + this.escapeHtml(agent.guidance.tone) + '</p>' +
        '</div>' +
        '<div class="persona-section">' +
          '<div class="persona-section-title">許可</div>' +
          '<div class="persona-permissions">' + permissionHtml + '</div>' +
        '</div>' +
        '<div class="persona-section">' +
          '<div class="persona-section-title">接し方</div>' +
          '<ul class="persona-approach">' + approachHtml + '</ul>' +
        '</div>'
      : '') +

      '<div class="persona-section">' +
        '<div class="persona-section-title">信念体系</div>' +
        '<ul class="persona-beliefs">' + beliefsHtml + '</ul>' +
      '</div>' +

      (strengthHtml ?
        '<div class="persona-section">' +
          '<div class="persona-section-title">得意な領域</div>' +
          strengthHtml +
        '</div>'
      : '');

    this.els.personaModal.classList.add('active');
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
  },

  // --- Map modal (all escaped) ---
  showMapModal() {
    const itemsHtml = AGENTS.map(a =>
      '<div class="map-item">' +
        '<div class="map-avatar" style="background:' + a.gradient + ';">' + this._agentIconSvg(a, 18) + '</div>' +
        '<div>' +
          '<div class="map-name" style="color:' + a.color + ';">' + this.escapeHtml(a.name) + '（' + this.escapeHtml(a.title) + '）</div>' +
          '<div class="map-function">' + this.escapeHtml(a.mapFunction) + '</div>' +
        '</div>' +
      '</div>'
    ).join('');

    this.els.relationshipMap.innerHTML =
      '<div class="map-title">7人の関係性</div>' + itemsHtml;

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
      deleteBtn.innerHTML = '&times;';
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
    if (text == null) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML.replace(/\n/g, '<br>');
  },

  _agentIconSvg(agent, size) {
    size = size || 22;
    if (!agent.iconSvg) return this.escapeHtml(agent.initial);
    return '<svg class="agent-card-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      agent.iconSvg +
    '</svg>';
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
