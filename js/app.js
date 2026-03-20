// ==========================================
// じぶん会議 - メインアプリ制御
// ==========================================

(function () {
  'use strict';

  let selectedAgentId = null;
  let isGenerating = false;

  function init() {
    UI.init();
    Chat.init();

    bindEvents();
    UI.setupAutoResize();
    renderAgentBar();
    renderSessionList();
  }

  function bindEvents() {
    UI.els.startBtn.addEventListener('click', () => {
      UI.showMain();
      UI.els.userInput.focus();
    });

    UI.els.menuBtn.addEventListener('click', () => UI.openSidebar());
    UI.els.sidebarClose.addEventListener('click', () => UI.closeSidebar());
    UI.els.sidebarOverlay.addEventListener('click', () => UI.closeSidebar());

    UI.els.newSessionBtn.addEventListener('click', () => {
      Chat.createNewSession();
      UI.clearMessages();
      UI.setSessionTitle('新しい会議');
      renderSessionList();
      UI.closeSidebar();
      selectedAgentId = null;
      renderAgentBar();
    });

    UI.els.sendBtn.addEventListener('click', handleSend);
    UI.els.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setResponseMode(btn.dataset.mode);
      });
    });

    UI.els.personaMapBtn.addEventListener('click', () => {
      UI.showMapModal();
      UI.closeSidebar();
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => UI.closeModals());
    });

    [UI.els.personaModal, UI.els.mapModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) UI.closeModals();
      });
    });
  }

  function renderAgentBar() {
    UI.renderAgentIcons(
      selectedAgentId,
      (id) => {
        selectedAgentId = selectedAgentId === id ? null : id;
        renderAgentBar();
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
        UI.closeSidebar();
      }
    );
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

    if (selectedAgentId === 'master') {
      await handleMasterResponse(text);
    } else if (selectedAgentId) {
      await handleAgentResponse(selectedAgentId, text);
    } else {
      await handleAgentResponse('ray', text);
    }

    isGenerating = false;
  }

  async function handleAgentResponse(agentId, userText) {
    const agent = getAgent(agentId);
    if (!agent) return;

    UI.showTypingIndicator(agent);

    await delay(800 + Math.random() * 1200);

    const result = await Chat.generateResponse(agentId, userText, currentMode);
    UI.removeTypingIndicator(agentId);

    if (result) {
      const msgEl = UI.addAgentMessage(result.agent, result.text, result.mode);
      Chat.addMessage('agent', agentId, result.text, result.mode);

      await delay(400 + Math.random() * 600);
      const reactions = Chat.generateReactions(agentId, userText);
      if (reactions.length > 0) {
        UI.addReactions(msgEl, reactions);
        const session = Chat.getActiveSession();
        if (session && session.messages.length > 0) {
          session.messages[session.messages.length - 1].reactions = reactions;
        }
      }
    }
  }

  async function handleMasterResponse(userText) {
    for (const agent of AGENTS) {
      UI.showTypingIndicator(agent);
      await delay(600 + Math.random() * 1000);

      const result = await Chat.generateResponse(agent.id, userText, currentMode);
      UI.removeTypingIndicator(agent.id);

      if (result) {
        UI.addAgentMessage(result.agent, result.text, result.mode);
        Chat.addMessage('agent', agent.id, result.text, result.mode);
      }

      await delay(300);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
