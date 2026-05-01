// Phase 3: meeting records, meeting-note actions, constellation map
// UI-only enhancements. No response generation or stored data shape changes.

(function () {
  'use strict';

  if (typeof UI === 'undefined') return;

  const originalInit = UI.init.bind(UI);
  const originalAddAgentMessage = UI.addAgentMessage.bind(UI);

  UI.init = function phase3Init() {
    originalInit();
    renameSidebarToRecords();
  };

  UI.renderSessionList = function phase3RenderSessionList(sessions, activeId, onSelect, onDelete) {
    if (!this.els || !this.els.sessionList) return;
    renameSidebarToRecords();
    this.els.sessionList.innerHTML = '';

    sessions.forEach(session => {
      const item = document.createElement('li');
      item.className = 'meeting-record-item' + (session.id === activeId ? ' active' : '');

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'meeting-record-main';
      main.addEventListener('click', () => onSelect(session.id));

      const title = document.createElement('span');
      title.className = 'meeting-record-title';
      title.textContent = session.title || '新しい会議';

      const meta = document.createElement('span');
      meta.className = 'meeting-record-meta';

      const dot = document.createElement('span');
      dot.className = 'meeting-record-dot';

      const date = document.createElement('span');
      date.textContent = formatMeetingDate(session.createdAt);

      const count = document.createElement('span');
      count.textContent = (session.messages ? session.messages.length : 0) + '件';

      meta.appendChild(dot);
      meta.appendChild(date);
      meta.appendChild(count);
      main.appendChild(title);
      main.appendChild(meta);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'meeting-record-delete';
      del.setAttribute('aria-label', '会議録を削除');
      del.textContent = '×';
      del.addEventListener('click', e => {
        e.stopPropagation();
        if (sessions.length <= 1) return;
        onDelete(session.id);
      });

      item.appendChild(main);
      item.appendChild(del);
      this.els.sessionList.appendChild(item);
    });
  };

  UI.addAgentMessage = function phase3AddAgentMessage(agent, text, mode) {
    const messageEl = originalAddAgentMessage(agent, text, mode);
    addMeetingNoteActions(messageEl);
    return messageEl;
  };

  UI.showMapModal = function phase3ShowMapModal() {
    if (!this.els || !this.els.relationshipMap || typeof AGENTS === 'undefined') return;

    const root = document.createElement('div');
    root.className = 'constellation-map';

    const title = document.createElement('div');
    title.className = 'constellation-title';
    title.textContent = '7人の関係性';

    const subtitle = document.createElement('p');
    subtitle.className = 'constellation-subtitle';
    subtitle.textContent = '中心にあなたがいて、周囲にそれぞれの声が灯っています。必要な声を選ぶと、会議の見え方が少し変わります。';

    const stage = document.createElement('div');
    stage.className = 'constellation-stage';

    const cross = document.createElement('span');
    cross.className = 'constellation-crossline';
    stage.appendChild(cross);

    const center = document.createElement('div');
    center.className = 'constellation-center';
    const centerStrong = document.createElement('strong');
    centerStrong.textContent = 'あなた';
    const centerSub = document.createElement('span');
    centerSub.textContent = '会議の中心';
    center.appendChild(centerStrong);
    center.appendChild(centerSub);
    stage.appendChild(center);

    AGENTS.forEach((agent, index) => {
      const node = document.createElement('div');
      node.className = 'constellation-node constellation-node--' + index;

      const avatar = document.createElement('div');
      avatar.className = 'constellation-avatar';
      avatar.style.background = agent.gradient;
      avatar.textContent = agent.initial;

      const name = document.createElement('div');
      name.className = 'constellation-name';
      name.textContent = agent.name;

      const role = document.createElement('div');
      role.className = 'constellation-role';
      role.textContent = agent.subtitle || agent.title || '';

      node.appendChild(avatar);
      node.appendChild(name);
      node.appendChild(role);
      stage.appendChild(node);
    });

    const legend = document.createElement('div');
    legend.className = 'constellation-legend';

    AGENTS.forEach(agent => {
      const item = document.createElement('div');
      item.className = 'constellation-legend-item';

      const name = document.createElement('div');
      name.className = 'constellation-legend-name';
      name.style.color = agent.color;
      name.textContent = agent.name + ' — ' + (agent.subtitle || agent.title || agent.role || '声');

      const text = document.createElement('div');
      text.className = 'constellation-legend-text';
      text.textContent = agent.mapFunction || agent.role || '';

      item.appendChild(name);
      item.appendChild(text);
      legend.appendChild(item);
    });

    root.appendChild(title);
    root.appendChild(subtitle);
    root.appendChild(stage);
    root.appendChild(legend);

    this.els.relationshipMap.innerHTML = '';
    this.els.relationshipMap.appendChild(root);

    this.els.mapModal.classList.add('active');
    this._scrollLockY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = -this._scrollLockY + 'px';
  };

  function renameSidebarToRecords() {
    const title = document.querySelector('.sidebar-header h3');
    if (title) title.textContent = '会議録';
  }

  function addMeetingNoteActions(messageEl) {
    if (!messageEl || messageEl.querySelector('.meeting-note-actions')) return;

    const actions = document.createElement('div');
    actions.className = 'meeting-note-actions';

    const otherVoices = document.createElement('button');
    otherVoices.type = 'button';
    otherVoices.className = 'meeting-note-btn';
    otherVoices.textContent = '他の声も聞く';
    otherVoices.addEventListener('click', () => {
      if (UI.showToast) UI.showToast('下の声のデッキから、別の声を選べます', 2200);
    });

    const record = document.createElement('button');
    record.type = 'button';
    record.className = 'meeting-note-btn';
    record.textContent = '会議録に残りました';
    record.addEventListener('click', () => {
      if (UI.showToast) UI.showToast('この会話は会議録から見返せます', 2200);
    });

    actions.appendChild(otherVoices);
    actions.appendChild(record);
    messageEl.appendChild(actions);
  }

  function formatMeetingDate(value) {
    if (!value) return '日付なし';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '日付なし';

    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (sameDay) {
      return '今日 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }

    return (date.getMonth() + 1) + '/' + date.getDate();
  }
})();
