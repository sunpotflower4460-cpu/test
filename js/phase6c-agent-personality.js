// Phase 6C: Agent Personality UI
// UI-only layer. Does not change response generation, agent definitions, or stored data.

(function () {
  'use strict';

  if (typeof UI === 'undefined') return;

  const TEXTURES = {
    ray: { label: '静かな鏡', status: 'レイが静かに映しています', hint: '言葉の奥にあるものを、そのまま見ます。' },
    joe: { label: '灯る火花', status: 'ジョーが火を見ています', hint: 'まだ消えていない熱を照らします。' },
    mina: { label: '包む泉', status: 'ミナがやわらかく受け止めています', hint: '急がず、そのままの形で包みます。' },
    sato: { label: '守る重心', status: 'サトウが足元を見ています', hint: '危うさを見て、必要なら立ち止まらせます。' },
    ken: { label: '澄んだ設計図', status: 'ケンが構造を整えています', hint: '絡まったものを、見える形に並べます。' },
    fio: { label: '抜ける風', status: 'フィオが外へ風を通しています', hint: '閉じた場所から、少し外へ連れ出します。' },
    tom: { label: '突破のノイズ', status: 'トムが固まった形を揺らしています', hint: '壊すことで、次の形が出る余地を作ります。' },
    random: { label: '場に委ねる', status: '場に委ねています', hint: '今出るべき声に任せます。' }
  };

  const originalRenderAgentIcons = UI.renderAgentIcons.bind(UI);
  const originalAddAgentMessage = UI.addAgentMessage.bind(UI);
  const originalShowPersonaModal = UI.showPersonaModal.bind(UI);

  UI.renderAgentIcons = function phase6cRenderAgentIcons(selectedId, onSelect, onLongPress) {
    originalRenderAgentIcons(selectedId, onSelect, onLongPress);
    decorateAgentCards(selectedId);
    decorateAgentStatus(selectedId);
    document.body.dataset.currentAgent = selectedId || 'none';
  };

  UI.addAgentMessage = function phase6cAddAgentMessage(agent, text, mode) {
    const messageEl = originalAddAgentMessage(agent, text, mode);
    if (agent && messageEl) {
      messageEl.dataset.agentId = agent.id;
      messageEl.classList.add('message-agent--' + agent.id);
      messageEl.style.setProperty('--agent-ui-color', agent.color || 'var(--accent)');
    }
    return messageEl;
  };

  UI.showPersonaModal = function phase6cShowPersonaModal(agent) {
    originalShowPersonaModal(agent);
    addTextureBadge(agent);
  };

  function decorateAgentCards(selectedId) {
    if (!UI.els || !UI.els.agentIcons) return;

    UI.els.agentIcons.querySelectorAll('.agent-card').forEach(card => {
      const name = card.querySelector('.agent-card-label')?.textContent || '';
      const id = inferAgentIdFromCard(card, name);
      if (!id) return;

      card.dataset.agentId = id;
      card.classList.add('agent-card--' + id);
      if (id === 'random') card.classList.add('agent-card--delegate');

      const texture = TEXTURES[id];
      if (texture) {
        card.setAttribute('title', texture.label + '：' + texture.hint);
        card.setAttribute('aria-label', texture.label + '。' + texture.hint);
      }
    });
  }

  function decorateAgentStatus(selectedId) {
    const status = UI.els && UI.els.agentStatus ? UI.els.agentStatus : document.getElementById('agent-status');
    if (!status) return;

    const id = selectedId || 'none';
    status.dataset.agentId = id;

    if (id === 'none') return;

    const texture = TEXTURES[id];
    if (!texture) return;

    if (id === 'random') {
      status.innerHTML = '<span class="agent-status-dot"></span><span>' + escapeHtml(texture.status) + '</span><em>' + escapeHtml(texture.hint) + '</em>';
      return;
    }

    if (typeof getAgent === 'function') {
      const agent = getAgent(id);
      if (agent) {
        status.style.setProperty('--agent-status-color', agent.color || 'var(--accent)');
        status.innerHTML = '<span class="agent-status-dot"></span><span>' + escapeHtml(texture.status) + '</span><em>' + escapeHtml(texture.hint) + '</em>';
      }
    }
  }

  function addTextureBadge(agent) {
    if (!agent || !UI.els || !UI.els.personaDetail) return;

    const detail = UI.els.personaDetail;
    const old = detail.querySelector('.persona-texture-badge');
    if (old) old.remove();

    const texture = TEXTURES[agent.id];
    if (!texture) return;

    const header = detail.querySelector('.persona-header') || detail.firstElementChild;
    if (!header) return;

    const badge = document.createElement('div');
    badge.className = 'persona-texture-badge persona-texture-badge--' + agent.id;
    badge.style.setProperty('--accent', agent.color || 'var(--accent)');
    badge.textContent = texture.label + ' / ' + texture.hint;

    header.insertAdjacentElement('afterend', badge);
  }

  function inferAgentIdFromCard(card, labelText) {
    if (card.classList.contains('agent-card--random')) return 'random';
    if (labelText.includes('委ねる')) return 'random';
    if (labelText.includes('レイ')) return 'ray';
    if (labelText.includes('ジョー')) return 'joe';
    if (labelText.includes('ミナ')) return 'mina';
    if (labelText.includes('サトウ')) return 'sato';
    if (labelText.includes('ケン')) return 'ken';
    if (labelText.includes('フィオ')) return 'fio';
    if (labelText.includes('トム')) return 'tom';
    return null;
  }

  function escapeHtml(value) {
    if (UI.escapeHtml) return UI.escapeHtml(value);
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
