// ==========================================
// じぶん会議 – UI v5.0
// World-class quality update
// ==========================================

const UI = {
  els: {},
  _scrollLockY: 0,
  _focusTrapHandler: null,
  _previousFocus: null,

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
      emptyState: document.getElementById('empty-state'),
      agentBar: document.getElementById('agent-bar'),
      agentIcons: document.getElementById('agent-icons'),
      inputArea: document.getElementById('input-area'),
      inputWrapper: document.querySelector('.input-wrapper'),
      userInput: document.getElementById('user-input'),
      sendBtn: document.getElementById('send-btn'),
      personaModal: document.getElementById('persona-modal'),
      personaDetail: document.getElementById('persona-detail'),
      mapModal: document.getElementById('map-modal'),
      relationshipMap: document.getElementById('relationship-map'),
      modeToast: document.getElementById('mode-toast'),
      scrollToBottomBtn: document.getElementById('scroll-to-bottom-btn'),
    };

    this.initTheme();
    this._agentOnSelect = null;
    this._agentOnLongPress = null;
    this.initAgentBarEvents();
    this.initScrollToBottomBtn();
    this.initModalSwipe();
  },

  // --- Theme ---
  initTheme() {
    const saved = localStorage.getItem('jibun-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
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
    if (this.els.sidebarOverlay) this.els.sidebarOverlay.classList.add('open');
  },
  closeSidebar() {
    this.els.sidebar.classList.remove('open');
    if (this.els.sidebarOverlay) this.els.sidebarOverlay.classList.remove('open');
  },

  // --- Agent bar ---
  initAgentBarEvents() {
    const container = this.els.agentIcons;
    let pressTimer = null;

    container.addEventListener('click', (e) => {
      const icon = e.target.closest('.agent-icon');
      if (!icon || !this._agentOnSelect) return;
      this.addRipple(icon, e);
      this._agentOnSelect(icon.dataset.agentId);
    });

    container.addEventListener('touchstart', (e) => {
      const icon = e.target.closest('.agent-icon');
      if (!icon || !this._agentOnLongPress) return;
      pressTimer = setTimeout(() => {
        e.preventDefault();
        this._agentOnLongPress(icon.dataset.agentId);
      }, 500);
    }, { passive: false });

    container.addEventListener('touchend', () => clearTimeout(pressTimer));
    container.addEventListener('touchmove', () => clearTimeout(pressTimer));

    container.addEventListener('dblclick', (e) => {
      const icon = e.target.closest('.agent-icon');
      if (!icon || !this._agentOnLongPress) return;
      this._agentOnLongPress(icon.dataset.agentId);
    });
  },

  renderAgentIcons(selectedId, onSelect, onLongPress) {
    this._agentOnSelect = onSelect;
    this._agentOnLongPress = onLongPress;

    this.els.agentIcons.innerHTML = '';

    AGENTS.forEach(agent => {
      const el = document.createElement('div');
      el.className = 'agent-icon' + (selectedId === agent.id ? ' selected' : '');
      el.style.background = agent.gradient;
      el.dataset.agentId = agent.id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', agent.name + '（' + agent.title + '）');
      el.innerHTML = `
        ${this.escapeHtml(agent.initial)}
        <span class="agent-icon-label">${this.escapeHtml(agent.name)}</span>
      `;
      this.els.agentIcons.appendChild(el);
    });

    const randEl = document.createElement('div');
    randEl.className = 'agent-icon agent-icon--random' + (selectedId === 'random' ? ' selected' : '');
    randEl.dataset.agentId = 'random';
    randEl.setAttribute('role', 'button');
    randEl.setAttribute('tabindex', '0');
    randEl.setAttribute('aria-label', 'ランダム');
    randEl.innerHTML = `?<span class="agent-icon-label">ランダム</span>`;
    this.els.agentIcons.appendChild(randEl);
  },

  // --- Generating state ---
  setGeneratingState(generating) {
    const btn = this.els.sendBtn;
    const wrapper = this.els.inputWrapper;
    if (generating) {
      btn.classList.add('loading');
      btn.disabled = true;
      if (wrapper) wrapper.classList.add('generating');
    } else {
      btn.classList.remove('loading');
      if (wrapper) wrapper.classList.remove('generating');
      btn.disabled = this.els.userInput.value.trim() === '';
    }
  },

  // --- Agent-specific placeholder ---
  setAgentPlaceholder(agent) {
    const placeholder = (agent && agent.placeholder) ? agent.placeholder : 'ここに書く…';
    this.els.userInput.setAttribute('placeholder', placeholder);
  },

  // --- Scroll-to-bottom button ---
  initScrollToBottomBtn() {
    const btn = this.els.scrollToBottomBtn;
    if (!btn) return;
    btn.removeAttribute('hidden');

    this.els.chatArea.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.els.chatArea;
      const distFromBottom = scrollHeight - scrollTop - clientHeight;
      btn.classList.toggle('visible', distFromBottom > 120);
    });

    btn.addEventListener('click', () => this.scrollToBottom());
  },

  // --- Modal swipe-to-close ---
  initModalSwipe() {
    document.querySelectorAll('.modal-sheet').forEach(sheet => {
      let startY = 0;
      let currentY = 0;
      let dragging = false;

      sheet.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        currentY = startY;
        dragging = true;
        sheet.style.transition = 'none';
      }, { passive: true });

      sheet.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0) sheet.style.transform = `translateY(${diff}px)`;
      }, { passive: true });

      sheet.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        const diff = currentY - startY;
        if (diff > 80) {
          sheet.style.transform = '';
          this.closeModals();
        } else {
          sheet.style.transform = '';
        }
      });
    });
  },

  // --- Focus trap for modals ---
  trapFocus(modal) {
    this._previousFocus = document.activeElement;
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first) setTimeout(() => first.focus(), 50);

    this._focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last && last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first && first.focus(); }
      }
    };
    modal.addEventListener('keydown', this._focusTrapHandler);
  },

  releaseFocus() {
    [this.els.personaModal, this.els.mapModal].forEach(modal => {
      if (modal && this._focusTrapHandler) {
        modal.removeEventListener('keydown', this._focusTrapHandler);
      }
    });
    this._focusTrapHandler = null;
    if (this._previousFocus) {
      this._previousFocus.focus();
      this._previousFocus = null;
    }
  },

  // --- Empty state ---
  showEmptyState() {
    if (this.els.emptyState) {
      this.els.emptyState.removeAttribute('hidden');
    }
  },
  hideEmptyState() {
    if (this.els.emptyState) {
      this.els.emptyState.setAttribute('hidden', '');
    }
  },

  // --- Messages ---
  addUserMessage(text) {
    this.hideEmptyState();
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = `<div class="bubble">${this.escapeHtml(text)}</div>`;
    this.els.messages.appendChild(div);
    this.scrollToBottom();
  },

  addAgentMessage(agent, text, mode) {
    this.hideEmptyState();
    const div = document.createElement('div');
    div.className = `message message-agent ${agent.animClass}`;
    const modeLabel = mode ? `<span class="agent-mode-label">— ${this.escapeHtml(mode.name)}</span>` : '';
    const avatarContent = agent.avatar || this.escapeHtml(agent.initial);

    div.innerHTML = `
      <div class="agent-label">
        <div class="agent-avatar-sm" style="background:${agent.gradient};">${avatarContent}</div>
        <span class="agent-name-label" style="color:${agent.color};">${this.escapeHtml(agent.name)}</span>
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
        ${this.escapeHtml(agent.name)} ${this.escapeHtml(r.text)}
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
    const avatarContent = agent.avatar || this.escapeHtml(agent.initial);

    div.innerHTML = `
      <div class="agent-label">
        <div class="agent-avatar-sm" style="background:${agent.gradient};">${avatarContent}</div>
        <span class="agent-name-label" style="color:${agent.color};">${this.escapeHtml(agent.name)}</span>
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
    const esc = (s) => this.escapeHtml(String(s ?? ''));

    const beliefsHtml = agent.beliefs.map(b =>
      `<li>「${esc(typeof b === 'object' ? b.seed : b)}」</li>`
    ).join('');

    const approachHtml = agent.guidance
      ? agent.guidance.approach.map(a =>
          `<li class="persona-approach-item">${esc(a)}</li>`
        ).join('')
      : '';

    const permissionHtml = agent.guidance && agent.guidance.permission
      ? agent.guidance.permission.map(p =>
          `<span class="persona-permission-tag">${esc(p)}</span>`
        ).join('')
      : '';

    const strengthHtml = agent.strength
      ? `<div class="persona-strength">
           <span class="strength-label">得意な深さ:</span> ${esc(agent.strength.primaryLayers.join(', '))}<br>
           <span class="strength-label">得意な領域:</span> ${esc(agent.strength.primaryDomains.join(', '))}<br>
           <span class="strength-label">神経親和:</span> ${esc(agent.strength.nervousAffinity)}
         </div>`
      : '';

    const avatarLg = agent.avatar || esc(agent.initial);
    this.els.personaDetail.innerHTML = `
      <div class="persona-header">
        <div class="persona-avatar-lg" style="background:${agent.gradient};">${avatarLg}</div>
        <div id="persona-modal-name" class="persona-name" style="color:${agent.color};">${esc(agent.name)}</div>
        <div class="persona-role">${esc(agent.role)} — ${esc(agent.title)}</div>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">存在の宣言</div>
        <div class="persona-layer0">
          <div class="persona-layer0-declaration">${esc(agent.layer0.declaration)}</div>
          <p>${esc(agent.layer0.identity)}</p>
          <p style="margin-top:8px;">${esc(agent.layer0.mission)}</p>
        </div>
      </div>

      <div class="persona-section">
        <div class="persona-section-title">存在の核</div>
        <p><strong>${esc(agent.core.symbol)}</strong> — ${esc(agent.core.essence)}</p>
        <p style="margin-top:6px;">願い: ${esc(agent.core.wish)}</p>
        <p style="margin-top:4px;">痛み: ${esc(agent.core.pain)}</p>
      </div>

      ${agent.guidance ? `
      <div class="persona-section">
        <div class="persona-section-title">トーン</div>
        <p>${esc(agent.guidance.tone)}</p>
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
    this.trapFocus(this.els.personaModal);
  },

  // --- Map modal ---
  showMapModal() {
    const esc = (s) => this.escapeHtml(String(s ?? ''));
    const itemsHtml = AGENTS.map(a => `
      <div class="map-item">
        <div class="map-avatar" style="background:${a.gradient};">${a.avatar || esc(a.initial)}</div>
        <div>
          <div class="map-name" style="color:${a.color};">${esc(a.name)}（${esc(a.title)}）</div>
          <div class="map-function">${esc(a.mapFunction)}</div>
        </div>
      </div>
    `).join('');

    this.els.relationshipMap.innerHTML = `
      <div id="map-modal-title" class="map-title">7人の関係性</div>
      ${itemsHtml}
    `;

    this.els.mapModal.classList.add('active');
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
    this.trapFocus(this.els.mapModal);
  },

  closeModals() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, this._scrollLockY || 0);
    this.releaseFocus();
  },

  // --- Session list ---
  renderSessionList(sessions, activeId, onSelect, onDelete) {
    this.els.sessionList.innerHTML = '';
    sessions.forEach(s => {
      const li = document.createElement('li');
      li.className = s.id === activeId ? 'active' : '';

      // Row: title + delete button
      const row = document.createElement('div');
      row.className = 'session-row';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'session-title-text';
      titleSpan.textContent = s.title;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'session-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.setAttribute('aria-label', '削除');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sessions.length <= 1) return;
        onDelete(s.id);
      });

      row.appendChild(titleSpan);
      row.appendChild(deleteBtn);
      row.addEventListener('click', () => onSelect(s.id));
      li.appendChild(row);

      // Preview text from first user message
      const firstUserMsg = s.messages && s.messages.find(m => m.role === 'user');
      if (firstUserMsg && firstUserMsg.text) {
        const preview = document.createElement('span');
        preview.className = 'session-preview';
        const t = firstUserMsg.text;
        preview.textContent = t.length > 22 ? t.substring(0, 22) + '…' : t;
        li.appendChild(preview);
      }

      this.els.sessionList.appendChild(li);
    });
  },

  setSessionTitle(title) {
    this.els.sessionTitle.textContent = title;
  },

  scrollToBottom() {
    requestAnimationFrame(() => {
      if (this.els.chatArea) {
        this.els.chatArea.scrollTop = this.els.chatArea.scrollHeight;
      }
    });
  },

  clearMessages() {
    // Remove all .message elements but keep #empty-state
    const msgs = this.els.messages.querySelectorAll('.message');
    msgs.forEach(m => m.remove());
    this.showEmptyState();
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

  // ==========================================
  // v6.0 — New UI Methods
  // ==========================================

  // --- Enhanced agent icons with SVG avatar ---
  renderAgentIconsV6(selectedId, onSelect, onLongPress) {
    this._agentOnSelect = onSelect;
    this._agentOnLongPress = onLongPress;
    this.els.agentIcons.innerHTML = '';

    AGENTS.forEach(agent => {
      const el = document.createElement('div');
      el.className = 'agent-icon' + (selectedId === agent.id ? ' selected' : '');
      el.style.background = agent.gradient;
      el.dataset.agentId = agent.id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', agent.name + '（' + agent.title + '）');
      const avatarContent = agent.avatar || `<span>${this.escapeHtml(agent.initial)}</span>`;
      el.innerHTML = avatarContent + `<span class="agent-icon-label">${this.escapeHtml(agent.name)}</span>`;
      this.els.agentIcons.appendChild(el);
    });

    const randEl = document.createElement('div');
    randEl.className = 'agent-icon agent-icon--random' + (selectedId === 'random' ? ' selected' : '');
    randEl.dataset.agentId = 'random';
    randEl.setAttribute('role', 'button');
    randEl.setAttribute('tabindex', '0');
    randEl.setAttribute('aria-label', 'ランダム');
    randEl.innerHTML = `<svg viewBox="0 0 28 28" fill="none" style="width:22px;height:22px"><path d="M4 10h3.5L10 7l2.5 3H16M4 18h3.5L10 21l2.5-3H16M18 7l6 0M18 21l6 0M21 4l3 3-3 3M21 18l3 3-3 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="agent-icon-label">ランダム</span>`;
    this.els.agentIcons.appendChild(randEl);
  },

  // --- Flash director-pick animation on agent icon ---
  flashDirectorPick(agentId) {
    const icon = this.els.agentIcons.querySelector(`[data-agent-id="${agentId}"]`);
    if (!icon) return;
    icon.classList.remove('director-picked');
    void icon.offsetWidth; // reflow
    icon.classList.add('director-picked');
    setTimeout(() => icon.classList.remove('director-picked'), 600);
  },

  // --- Show director selection badge (random panel) ---
  showDirectorBadge(agent) {
    const badge = document.getElementById('random-selected-badge');
    const nameEl = document.getElementById('random-agent-name');
    if (!badge || !nameEl) return;
    badge.style.background = agent.gradient;
    nameEl.textContent = agent.name + '（' + agent.title + '）';
    badge.classList.remove('show');
    void badge.offsetWidth;
    badge.classList.add('show');
    setTimeout(() => badge.classList.remove('show'), 3000);
  },

  // --- Render meeting participant picker ---
  renderMeetingPicker(selectedIds, onChange) {
    const picker = document.getElementById('meeting-agent-picker');
    const countEl = document.getElementById('meeting-count');
    if (!picker) return;
    picker.innerHTML = '';

    AGENTS.forEach(agent => {
      const chip = document.createElement('div');
      const isSelected = selectedIds.includes(agent.id);
      chip.className = 'meeting-chip' + (isSelected ? ' selected' : '');
      chip.style.setProperty('--chip-color', agent.color);
      chip.dataset.agentId = agent.id;

      chip.innerHTML = `<span class="meeting-chip-dot"></span>${this.escapeHtml(agent.name)}`;
      chip.addEventListener('click', () => {
        const cur = [...selectedIds];
        const idx = cur.indexOf(agent.id);
        if (idx >= 0) {
          cur.splice(idx, 1);
        } else if (cur.length < 7) {
          cur.push(agent.id);
        }
        onChange(cur);
      });
      picker.appendChild(chip);
    });

    if (countEl) countEl.textContent = selectedIds.length + ' / 7';
  },

  // --- Add opinion popup row below a message element ---
  addOpinionPopups(opinions, afterEl) {
    if (!opinions || !opinions.length) return;

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'opinion-toggle-btn';
    toggleBtn.innerHTML = `<svg viewBox="0 0 10 10" fill="none"><path d="M1 3.5L5 7L9 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> ${opinions.length}人の意見`;
    afterEl.after(toggleBtn);

    // Opinion row
    const row = document.createElement('div');
    row.className = 'opinion-row collapsed';

    opinions.forEach(op => {
      const card = document.createElement('div');
      card.className = 'opinion-card';
      card.style.setProperty('--op-color', op.agent.color);
      card.innerHTML = `<span class="opinion-agent-name">${this.escapeHtml(op.agent.name)}</span><p class="opinion-text">${this.escapeHtml(op.text)}</p>`;
      row.appendChild(card);
    });

    toggleBtn.after(row);

    let open = false;
    toggleBtn.addEventListener('click', () => {
      open = !open;
      row.classList.toggle('collapsed', !open);
      toggleBtn.innerHTML = `<svg viewBox="0 0 10 10" fill="none"><path d="${open ? 'M1 6.5L5 3L9 6.5' : 'M1 3.5L5 7L9 3.5'}" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> ${open ? '閉じる' : opinions.length + '人の意見'}`;
      if (open) this.scrollToBottom();
    });
  },

  // --- Meeting sequence label ---
  addMeetingSeqLabel(agentId, index, afterEl) {
    const agent = getAgent(agentId);
    if (!agent) return;
    const label = document.createElement('div');
    label.className = 'meeting-seq-label';
    label.innerHTML = `<span class="meeting-seq-badge">${index}</span>${this.escapeHtml(agent.name)} の発言`;
    afterEl.before(label);
  },

  // --- Minutes modal ---
  showMinutesModal(minutesData) {
    const esc = (s) => this.escapeHtml(String(s ?? ''));
    const el = document.getElementById('minutes-content');
    if (!el) return;

    if (!minutesData) {
      el.innerHTML = `<div style="padding:24px 0;text-align:center;color:var(--text-secondary)">まだ会話がありません</div>`;
    } else {
      const { keywords, agentCounts, arc, summary, suggestions, messageCount } = minutesData;

      const keywordsHtml = keywords.length
        ? keywords.map(k => `<span class="minutes-keyword">${esc(k)}</span>`).join('')
        : '<span class="minutes-keyword">（なし）</span>';

      const arcHtml = arc.length
        ? arc.map((a, i) => `${i > 0 ? ' → ' : ''}${esc(a)}`).join('')
        : '（検出できませんでした）';

      const agentParticipation = Object.entries(agentCounts).map(([id, cnt]) => {
        const a = getAgent(id);
        return a ? `${esc(a.name)}（${cnt}回）` : '';
      }).filter(Boolean).join('　');

      const suggestionsHtml = suggestions.map(s => {
        const a = getAgent(s.agentId);
        return `<div class="minutes-suggestion">
          <span class="minutes-sug-dot" style="background:${a ? a.color : '#888'}"></span>
          <div><span class="minutes-agent-label">${esc(a ? a.name : '')}</span><span class="minutes-sug-text">${esc(s.text)}</span></div>
        </div>`;
      }).join('');

      el.innerHTML = `
        <div class="minutes-content">
          <h3 id="minutes-modal-title" style="font-size:15px;font-weight:700;margin-bottom:18px;padding-top:2px;">議事録 — ${messageCount}メッセージ</h3>

          <div class="minutes-section">
            <div class="minutes-section-title">会話の流れ</div>
            <p class="minutes-body">${esc(summary)}</p>
          </div>

          <div class="minutes-section">
            <div class="minutes-section-title">感情の軌跡</div>
            <p class="minutes-body">${arcHtml}</p>
          </div>

          ${keywords.length ? `<div class="minutes-section">
            <div class="minutes-section-title">キーワード</div>
            <div>${keywordsHtml}</div>
          </div>` : ''}

          ${agentParticipation ? `<div class="minutes-section">
            <div class="minutes-section-title">参加エージェント</div>
            <p class="minutes-body">${agentParticipation}</p>
          </div>` : ''}

          <div class="minutes-section">
            <div class="minutes-section-title">エージェントからの提案</div>
            ${suggestionsHtml}
          </div>
        </div>
      `;
    }

    const modal = document.getElementById('minutes-modal');
    modal.classList.add('active');
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
    this.trapFocus(modal);
  },

  // --- Settings modal (API keys) ---
  showSettingsModal(onSave) {
    const el = document.getElementById('settings-content');
    if (!el) return;
    const esc = (s) => this.escapeHtml(String(s ?? ''));
    const keys = Chat.getApiKeys();

    const agentFieldsHtml = AGENTS.map(agent => `
      <div class="api-field">
        <span class="api-field-label" style="color:${agent.color}">${esc(agent.name)}</span>
        <input class="api-field-input" type="password" data-agent-id="${esc(agent.id)}"
          placeholder="個別キー（空欄=グローバルを使用）"
          value="${esc(keys[agent.id] || '')}">
      </div>
    `).join('');

    el.innerHTML = `
      <div class="settings-content">
        <h3 id="settings-modal-title" style="font-size:15px;font-weight:700;margin-bottom:18px;padding-top:2px;">設定 — APIキー</h3>

        <div class="settings-section">
          <div class="settings-section-title">グローバルAPIキー</div>
          <div class="api-field">
            <span class="api-field-label">全エージェント</span>
            <input class="api-field-input" type="password" data-agent-id="global"
              placeholder="sk-ant-..."
              value="${esc(keys['global'] || '')}">
          </div>
          <div class="settings-note">
            Anthropic APIキーを登録すると、エージェントが実際のClaudeとして応答します。<br>
            キーはブラウザのローカルストレージのみに保存され、外部には送信されません。<br>
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener">APIキーを取得 →</a>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">エージェント別キー（上書き）</div>
          <div class="agent-key-grid">${agentFieldsHtml}</div>
        </div>

        <button class="settings-save-btn" id="settings-save-btn">保存する</button>
      </div>
    `;

    const modal = document.getElementById('settings-modal');
    modal.classList.add('active');
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
    this.trapFocus(modal);

    document.getElementById('settings-save-btn').addEventListener('click', () => {
      const newKeys = {};
      el.querySelectorAll('.api-field-input').forEach(input => {
        const val = input.value.trim();
        if (val) newKeys[input.dataset.agentId] = val;
      });
      Chat.saveApiKeys(newKeys);
      if (onSave) onSave(newKeys);
      this.closeModals();
      this.showToast('APIキーを保存しました', 2000);
    });
  },

  // --- Close all modals (extend to include new ones) ---
  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.classList.remove('active'));
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, this._scrollLockY || 0);
    this.releaseFocus();
  },
};
