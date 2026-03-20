// ==========================================
// じぶん会議 – メインアプリ v2.0
// ランダム応答, localStorage, toast通知
// ==========================================

(function () {
  'use strict';

  let selectedAgentId = null;
  let isGenerating = false;

  function init() {
    UI.init();
    Chat.init();

    // Apply default mode theme
    setResponseMode('short');

    bindEvents();
    UI.setupAutoResize();
    renderAgentBar();
    renderSessionList();

    // Restore active session messages
    const session = Chat.getActiveSession();
    if (session && session.messages.length > 0) {
      UI.setSessionTitle(session.title);
      restoreMessages(session);
    }

    // Update mode indicator
    UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);
  }

  function bindEvents() {
    // Splash → Main
    UI.els.startBtn.addEventListener('click', () => {
      UI.showMain();
      UI.els.userInput.focus();
    });

    // Sidebar
    UI.els.menuBtn.addEventListener('click', () => UI.openSidebar());
    UI.els.sidebarClose.addEventListener('click', () => UI.closeSidebar());
    UI.els.sidebarOverlay.addEventListener('click', () => UI.closeSidebar());

    // New session
    UI.els.newSessionBtn.addEventListener('click', () => {
      Chat.createNewSession();
      UI.clearMessages();
      UI.setSessionTitle('新しい会議');
      renderSessionList();
      UI.closeSidebar();
      selectedAgentId = null;
      renderAgentBar();
    });

    // Send
    UI.els.sendBtn.addEventListener('click', handleSend);
    UI.els.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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

    // Map button in header
    UI.els.mapBtn.addEventListener('click', () => {
      UI.showMapModal();
    });

    // Close modals
    document.querySelectorAll('.modal-backdrop').forEach(el => {
      el.addEventListener('click', () => UI.closeModals());
    });
    document.querySelectorAll('.modal-handle').forEach(el => {
      el.addEventListener('click', () => UI.closeModals());
    });
  }

  function renderAgentBar() {
    UI.renderAgentIcons(
      selectedAgentId,
      (id) => {
        selectedAgentId = selectedAgentId === id ? null : id;
        renderAgentBar();

        // Show agent name in header when selected
        if (selectedAgentId && selectedAgentId !== 'random') {
          const a = getAgent(selectedAgentId);
          if (a) UI.showToast(a.name + '（' + a.title + '）を選択', 1500);
        } else if (selectedAgentId === 'random') {
          UI.showToast('ランダム：誰かが答えます', 1500);
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
      }
    );
  }

  function restoreMessages(session) {
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

    // Update title
    const session = Chat.getActiveSession();
    if (session) {
      UI.setSessionTitle(session.title);
      renderSessionList();
    }

    isGenerating = true;

    // Determine which agent responds
    let targetId;
    if (selectedAgentId === 'random') {
      const randomAgent = getRandomAgent();
      targetId = randomAgent.id;
    } else if (selectedAgentId) {
      targetId = selectedAgentId;
    } else {
      // Default: Ray
      targetId = 'ray';
    }

    await handleAgentResponse(targetId, text);

    isGenerating = false;
  }

  async function handleAgentResponse(agentId, userText) {
    const agent = getAgent(agentId);
    if (!agent) return;

    // Show typing
    UI.showTypingIndicator(agent);

    await delay(700 + Math.random() * 1000);

    const result = await Chat.generateResponse(agentId, userText, currentMode);
    UI.removeTypingIndicator(agentId);

    if (result) {
      const msgEl = UI.addAgentMessage(result.agent, result.text, result.mode);

      // Show mode estimation toast if reason exists
      if (result.mode && result.mode.reason) {
        UI.showToast(
          result.mode.reason + ' →【' + result.mode.name + '】モード',
          2500
        );
      }

      Chat.addMessage('agent', agentId, result.text, result.mode);

      // Generate reactions from others
      await delay(400 + Math.random() * 500);
      const reactions = Chat.generateReactions(agentId, userText);
      if (reactions.length > 0) {
        UI.addReactions(msgEl, reactions);
        // Save reactions to last message
        const s = Chat.getActiveSession();
        if (s && s.messages.length > 0) {
          s.messages[s.messages.length - 1].reactions = reactions;
          Chat.save();
        }
      }
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
