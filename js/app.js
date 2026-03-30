// ==========================================
// じぶん会議 – メインアプリ v5.0
// World-class quality update
// ==========================================

(function () {
  'use strict';

  let selectedAgentId = null;
  let isGenerating = false;

  function init() {
    UI.init();
    Chat.init();

    setResponseMode('short');

    bindEvents();
    UI.setupAutoResize();
    renderAgentBar();
    renderSessionList();

    const session = Chat.getActiveSession();
    if (session && session.messages.length > 0) {
      UI.setSessionTitle(session.title);
      restoreMessages(session);
    } else {
      UI.showEmptyState();
    }

    UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);
    UI.initModalSwipe();
  }

  function bindEvents() {
    // Splash → Main
    UI.els.startBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.startBtn, e);
      setTimeout(() => {
        UI.showMain();
        setTimeout(() => UI.els.userInput.focus(), 600);
      }, 150);
    });

    // Theme toggle
    UI.els.themeToggleBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.themeToggleBtn, e);
      UI.toggleTheme();
    });

    // Sidebar
    UI.els.menuBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.menuBtn, e);
      UI.openSidebar();
    });
    UI.els.sidebarClose.addEventListener('click', () => UI.closeSidebar());
    UI.els.sidebarOverlay.addEventListener('click', () => UI.closeSidebar());

    // New session
    UI.els.newSessionBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.newSessionBtn, e);
      Chat.createNewSession();
      UI.clearMessages();
      UI.setSessionTitle('新しい会議');
      renderSessionList();
      UI.closeSidebar();
      selectedAgentId = null;
      UI.setAgentPlaceholder(null);
      renderAgentBar();
    });

    // Send
    UI.els.sendBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.sendBtn, e);
      handleSend();
    });
    UI.els.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        UI.addRipple(btn, e);
        const prev = currentMode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setResponseMode(btn.dataset.mode);
        UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);

        if (prev !== currentMode) {
          UI.showToast(
            RESPONSE_MODES[currentMode].name + ' モードに切替',
            2000
          );
        }
      });
    });

    // Map button
    UI.els.mapBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.mapBtn, e);
      UI.showMapModal();
    });

    // Close modals
    document.querySelectorAll('.modal-backdrop').forEach(el => {
      el.addEventListener('click', () => UI.closeModals());
    });
    document.querySelectorAll('.modal-handle').forEach(el => {
      el.addEventListener('click', () => UI.closeModals());
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const inputFocused = document.activeElement === UI.els.userInput;

      if (e.key === 'Escape') {
        UI.closeModals();
        UI.closeSidebar();
        return;
      }

      if (!inputFocused) {
        if (e.key === '1') activateModeBtn('short');
        else if (e.key === '2') activateModeBtn('medium');
        else if (e.key === '3') activateModeBtn('long');
      }
    });
  }

  function activateModeBtn(mode) {
    const btn = document.querySelector('.mode-btn[data-mode="' + mode + '"]');
    if (!btn) return;
    const prev = currentMode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setResponseMode(mode);
    UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);
    if (prev !== currentMode) {
      UI.showToast(RESPONSE_MODES[currentMode].name + ' モードに切替', 2000);
    }
  }

  function renderAgentBar() {
    UI.renderAgentIcons(
      selectedAgentId,
      (id) => {
        selectedAgentId = selectedAgentId === id ? null : id;
        renderAgentBar();

        if (selectedAgentId && selectedAgentId !== 'random') {
          const a = getAgent(selectedAgentId);
          if (a) {
            UI.setAgentPlaceholder(a);
            UI.showToast(a.name + '（' + a.title + '）を選択', 1500);
          }
        } else if (selectedAgentId === 'random') {
          UI.setAgentPlaceholder(null);
          UI.showToast('ランダム：誰かが答えます', 1500);
        } else {
          UI.setAgentPlaceholder(null);
        }
      },
      (id) => {
        const agent = getAgent(id);
        if (agent) UI.showPersonaModal(agent);
      }
    );
  }

  function renderSessionList() {
    UI.renderSessionList(
      Chat.sessions,
      Chat.activeSessionId,
      (sessionId) => {
        const session = Chat.switchSession(sessionId);
        if (session) {
          UI.clearMessages();
          UI.setSessionTitle(session.title);
          restoreMessages(session);
        }
        UI.closeSidebar();
      },
      (sessionId) => {
        const session = Chat.deleteSession(sessionId);
        if (session) {
          UI.clearMessages();
          UI.setSessionTitle(session.title);
          restoreMessages(session);
        }
        renderSessionList();
      }
    );
  }

  function restoreMessages(session) {
    if (!session.messages || session.messages.length === 0) {
      UI.showEmptyState();
      return;
    }
    session.messages.forEach(msg => {
      if (msg.role === 'user') {
        UI.addUserMessage(msg.text);
      } else {
        const agent = getAgent(msg.agentId);
        if (agent) {
          const el = UI.addAgentMessage(agent, msg.text, msg.mode);
          if (msg.reactions && msg.reactions.length > 0) {
            UI.addReactions(el, msg.reactions);
          }
        }
      }
    });
  }

  async function handleSend() {
    if (isGenerating) return;

    const text = UI.getInputValue();
    if (!text) return;

    UI.addUserMessage(text);
    Chat.addMessage('user', null, text, null);
    UI.clearInput();

    const session = Chat.getActiveSession();
    if (session) {
      UI.setSessionTitle(session.title);
      renderSessionList();
    }

    isGenerating = true;
    UI.setGeneratingState(true);

    let targetId;
    if (selectedAgentId === 'random') {
      const randomAgent = getRandomAgent();
      targetId = randomAgent.id;
    } else if (selectedAgentId) {
      targetId = selectedAgentId;
    } else {
      targetId = 'ray';
    }

    try {
      await handleAgentResponse(targetId, text);
    } finally {
      isGenerating = false;
      UI.setGeneratingState(false);
    }
  }

  async function handleAgentResponse(agentId, userText) {
    const agent = getAgent(agentId);
    if (!agent) return;

    UI.showTypingIndicator(agent);
    try {
      await delay(700 + Math.random() * 1000);

      const result = await Chat.generateResponse(agentId, userText, currentMode);

      if (result) {
        const msgEl = UI.addAgentMessage(result.agent, result.text, result.mode);

        if (result.mode && result.mode.reason) {
          UI.showToast(
            result.mode.reason + ' →【' + result.mode.name + '】モード',
            2500
          );
        }

        Chat.addMessage('agent', agentId, result.text, result.mode);

        await delay(400 + Math.random() * 500);
        const reactions = Chat.generateReactions(agentId, userText);
        if (reactions.length > 0) {
          UI.addReactions(msgEl, reactions);
          const s = Chat.getActiveSession();
          if (s && s.messages.length > 0) {
            s.messages[s.messages.length - 1].reactions = reactions;
            Chat.save();
          }
        }
      }
    } catch (err) {
      UI.showToast('応答の生成に失敗しました', 3000);
    } finally {
      UI.removeTypingIndicator(agentId);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
