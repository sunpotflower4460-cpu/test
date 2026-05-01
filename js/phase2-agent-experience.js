// ==========================================
// じぶん会議 test版 – Phase 2 Agent Experience
// UI-only enhancements: voice deck, delegation label, current voice status.
// ==========================================

(function () {
  'use strict';

  if (typeof UI === 'undefined') return;

  const originalInit = UI.init.bind(UI);
  const originalRenderAgentIcons = UI.renderAgentIcons.bind(UI);
  const originalShowPersonaModal = UI.showPersonaModal.bind(UI);
  const originalShowToast = UI.showToast.bind(UI);

  UI.init = function phase2Init() {
    originalInit();
    ensureAgentStatus();
  };

  UI.renderAgentIcons = function phase2RenderAgentIcons(selectedId, onSelect, onLongPress) {
    originalRenderAgentIcons(selectedId, onSelect, onLongPress);
    polishDelegationCard(selectedId);
    updateAgentStatus(selectedId);
  };

  UI.showPersonaModal = function phase2ShowPersonaModal(agent) {
    originalShowPersonaModal(agent);
    addPersonaSummary(agent);
  };

  UI.showToast = function phase2ShowToast(text, duration) {
    const nextText = String(text || '').replace(
      'ランダム：誰かが答えます',
      '委ねる：今出るべき声に任せます'
    );
    originalShowToast(nextText, duration);
  };

  function ensureAgentStatus() {
    if (!UI.els || !UI.els.inputArea) return;

    let status = document.getElementById('agent-status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'agent-status';
      status.className = 'agent-status agent-status--idle';
      status.setAttribute('aria-live', 'polite');
      UI.els.inputArea.prepend(status);
    }

    UI.els.agentStatus = status;
    updateAgentStatus(null);
  }

  function polishDelegationCard(selectedId) {
    if (!UI.els || !UI.els.agentIcons) return;

    const card = UI.els.agentIcons.querySelector('.agent-card--random');
    if (!card) return;

    card.classList.toggle('selected', selectedId === 'random');
    card.setAttribute('aria-label', '委ねる。今出るべき声に任せる');
    card.setAttribute('title', '委ねる：今出るべき声に任せる');

    const avatar = card.querySelector('.agent-card-avatar');
    const label = card.querySelector('.agent-card-label');
    const subtitle = card.querySelector('.agent-card-subtitle');

    if (avatar) avatar.textContent = '∞';
    if (label) label.textContent = '委ねる';
    if (subtitle) subtitle.textContent = '今出るべき声';
  }

  function updateAgentStatus(selectedId) {
    const status = UI.els && UI.els.agentStatus ? UI.els.agentStatus : document.getElementById('agent-status');
    if (!status) return;

    status.style.removeProperty('--agent-status-color');

    if (selectedId === 'random') {
      status.className = 'agent-status agent-status--random';
      status.innerHTML =
        '<span class="agent-status-dot"></span>' +
        '<span>委ねています</span>' +
        '<em>今出るべき声に任せます</em>';
      return;
    }

    if (selectedId && typeof getAgent === 'function') {
      const agent = getAgent(selectedId);
      if (agent) {
        status.className = 'agent-status';
        status.style.setProperty('--agent-status-color', agent.color || 'var(--accent)');
        status.innerHTML =
          '<span class="agent-status-dot"></span>' +
          '<span>' + UI.escapeHtml(agent.name) + 'に聞いています</span>' +
          '<em>' + UI.escapeHtml(agent.subtitle || agent.title || agent.role || '') + '</em>';
        return;
      }
    }

    status.className = 'agent-status agent-status--idle';
    status.innerHTML =
      '<span class="agent-status-dot"></span>' +
      '<span>まずは自由に書いてください</span>' +
      '<em>未選択時はレイが静かに受け取ります</em>';
  }

  function addPersonaSummary(agent) {
    if (!agent || !UI.els || !UI.els.personaDetail) return;

    const detail = UI.els.personaDetail;
    const old = detail.querySelector('.persona-summary-card');
    if (old) old.remove();

    const header = detail.querySelector('.persona-header');
    if (!header) return;

    const essence = agent.core && agent.core.essence ? agent.core.essence : agent.mapFunction || '';
    const role = agent.subtitle || agent.title || agent.role || '声';

    header.insertAdjacentHTML('afterend',
      '<div class="persona-summary-card">' +
        '<div class="persona-summary-title">この声の役割</div>' +
        '<p><strong>' + UI.escapeHtml(agent.name) + ' — ' + UI.escapeHtml(role) + '</strong><br>' +
        UI.escapeHtml(essence) + '</p>' +
      '</div>'
    );
  }
})();
