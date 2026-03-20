// ==========================================
// じぶん会議 - UI描画・制御
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
      menuBtn: document.getElementById('menu-btn'),
      sidebar: document.getElementById('sidebar'),
      sidebarClose: document.getElementById('sidebar-close'),
      sidebarOverlay: document.getElementById('sidebar-overlay'),
      newSessionBtn: document.getElementById('new-session-btn'),
      sessionList: document.getElementById('session-list'),
      personaMapBtn: document.getElementById('persona-map-btn'),
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
    };
  },

  showMain() {
    this.els.splashScreen.classList.remove('active');
    this.els.mainScreen.classList.add('active');
  },

  openSidebar() {
    this.els.sidebar.classList.add('sidebar-open');
    this.els.sidebarOverlay.classList.add('visible');
  },

  closeSidebar() {
    this.els.sidebar.classList.remove('sidebar-open');
    this.els.sidebarOverlay.classList.remove('visible');
  },

  renderAgentIcons(selectedId, onSelect, onLongPress) {
    this.els.agentIcons.innerHTML = '';

    AGENTS.forEach(agent => {
      const el = document.createElement('div');
      el.className = 'agent-icon' + (selectedId === agent.id ? ' selected' : '');
      el.style.background = agent.glow;
      el.style.color = agent.color;
      el.innerHTML = `
        ${agent.icon}
        <span class="agent-tooltip">${agent.name}（${agent.role}）</span>
      `;

      el.addEventListener('click', () => onSelect(agent.id));

      let pressTimer;
      el.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
          e.preventDefault();
          onLongPress(agent.id);
        }, 500);
      });
      el.addEventListener('touchend', () => clearTimeout(pressTimer));
      el.addEventListener('touchmove', () => clearTimeout(pressTimer));

      this.els.agentIcons.appendChild(el);
    });

    const masterEl = document.createElement('div');
    masterEl.className = 'agent-icon-master' + (selectedId === 'master' ? ' selected' : '');
    masterEl.textContent = '全員';
    masterEl.addEventListener('click', () => onSelect('master'));
    this.els.agentIcons.appendChild(masterEl);
  },

  addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = `<div class="bubble">${this.escapeHtml(text)}</div>`;
    this.els.messages.appendChild(div);
    this.scrollToBottom();
  },

  addAgentMessage(agent, text, mode) {
    const div = document.createElement('div');
    div.className = 'message message-agent';

    const modeInfo = mode ? `<span class="agent-mode-label">— ${mode.emoji} ${mode.name}</span>` : '';

    div.innerHTML = `
      <div class="agent-label">
        <div class="agent-icon-small" style="background:${agent.glow}; color:${agent.color};">
          ${agent.icon}
        </div>
        <span class="agent-name-label" style="color:${agent.color};">${agent.name}</span>
        ${modeInfo}
      </div>
      <div class="bubble ${agent.bubbleClass}">${this.escapeHtml(text)}</div>
    `;

    this.els.messages.appendChild(div);
    this.scrollToBottom();
    return div;
  },

  addReactions(messageEl, reactions) {
    const reactionsDiv = document.createElement('div');
    reactionsDiv.className = 'reactions';

    reactions.forEach(r => {
      const agent = getAgent(r.agentId);
      if (!agent) return;
      const tag = document.createElement('span');
      tag.className = 'reaction';
      tag.style.background = agent.glow;
      tag.style.color = agent.color;
      tag.style.borderColor = agent.color;
      tag.innerHTML = `${agent.icon} ${r.text}`;
      reactionsDiv.appendChild(tag);
    });

    const bubble = messageEl.querySelector('.bubble');
    if (bubble) {
      bubble.after(reactionsDiv);
    }
  },

  showTypingIndicator(agent) {
    const div = document.createElement('div');
    div.className = 'message message-agent typing-message';
    div.setAttribute('data-typing', agent.id);

    div.innerHTML = `
      <div class="agent-label">
        <div class="agent-icon-small" style="background:${agent.glow}; color:${agent.color};">
          ${agent.icon}
        </div>
        <span class="agent-name-label" style="color:${agent.color};">${agent.name}</span>
      </div>
      <div class="bubble ${agent.bubbleClass}">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
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

  showPersonaModal(agent) {
    const beliefsHtml = agent.beliefs.map(b => `<li>「${b}」</li>`).join('');
    const modesHtml = agent.modes.map(m =>
      `<span class="persona-mode-tag" style="color:${agent.color}; border-color:${agent.color};">
        ${m.emoji} ${m.name}
      </span>`
    ).join('');

    this.els.personaDetail.innerHTML = `
      <div class="persona-header">
        <div class="persona-icon-large" style="background:${agent.glow}; color:${agent.color};">
          ${agent.icon}
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

  showMapModal() {
    let itemsHtml = AGENTS.map(a => `
      <div class="map-item">
        <div class="map-icon" style="background:${a.glow}; color:${a.color};">${a.icon}</div>
        <div class="map-info">
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
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
