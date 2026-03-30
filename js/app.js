// ==========================================
// じぶん会議 – メインアプリ v6.0
// Individual / Random / Meeting + API keys
// ==========================================

(function () {
  'use strict';

  // --- State ---
  let selectedAgentId  = null;   // individual mode
  let convMode         = 'individual'; // 'individual' | 'random' | 'meeting'
  let meetingAgentIds  = [];     // meeting mode participants
  let isGenerating     = false;

  // ─────────────────── Init ───────────────────

  function init() {
    UI.init();
    Chat.init();

    setResponseMode('short');
    bindEvents();
    UI.setupAutoResize();

    // Render agent bar with SVG avatars
    renderAgentBar();
    renderMeetingPicker();
    renderSessionList();

    // Restore session
    const session = Chat.getActiveSession();
    if (session && session.messages.length > 0) {
      UI.setSessionTitle(session.title);
      restoreMessages(session);
    } else {
      UI.showEmptyState();
    }

    UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);
    UI.initModalSwipe();

    // Default conv mode UI
    setConvMode('individual');
  }

  // ─────────────────── Event Binding ───────────────────

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

    // Response length mode buttons (short/medium/long)
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        UI.addRipple(btn, e);
        activateModeBtn(btn.dataset.mode, true);
      });
    });

    // Map button
    UI.els.mapBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.mapBtn, e);
      UI.showMapModal();
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', (e) => {
      UI.addRipple(document.getElementById('settings-btn'), e);
      UI.showSettingsModal(() => {});
    });

    // Minutes button
    document.getElementById('minutes-btn').addEventListener('click', (e) => {
      const minutes = Chat.generateMinutes();
      UI.showMinutesModal(minutes);
    });

    // Conversation mode tabs
    document.querySelectorAll('.conv-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        UI.addRipple(tab, e);
        setConvMode(tab.dataset.conv);
      });
    });

    // Open settings from meeting note link
    const settingsLink = document.getElementById('open-settings-from-meeting');
    if (settingsLink) {
      settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        UI.showSettingsModal(() => {});
      });
    }

    // Close modals
    document.querySelectorAll('.modal-backdrop, .modal-handle').forEach(el => {
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
        else if (e.key === 'i') setConvMode('individual');
        else if (e.key === 'r') setConvMode('random');
        else if (e.key === 'm') setConvMode('meeting');
      }
    });
  }

  // ─────────────────── Conversation Mode ───────────────────

  function setConvMode(mode) {
    convMode = mode;

    // Update tab active state
    document.querySelectorAll('.conv-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.conv === mode);
    });

    // Show/hide panels
    const agentBar       = document.getElementById('agent-bar');
    const randomPanel    = document.getElementById('random-panel');
    const meetingPanel   = document.getElementById('meeting-panel');

    agentBar.style.display     = mode === 'individual' ? '' : 'none';
    randomPanel.classList.toggle('active', mode === 'random');
    meetingPanel.classList.toggle('active', mode === 'meeting');

    // Update empty state hint
    const subtitleEl = document.querySelector('.empty-subtitle');
    if (subtitleEl) {
      if (mode === 'individual') subtitleEl.innerHTML = '下のアイコンからペルソナを選んで<br>会話をはじめよう';
      else if (mode === 'random') subtitleEl.innerHTML = 'AIが最適なエージェントを自動で選びます<br>メッセージを送ってください';
      else subtitleEl.innerHTML = '参加者を選んで「全体会議」をスタート<br>（2〜7人推奨）';
    }

    // Reset placeholder
    UI.setAgentPlaceholder(null);
    if (mode === 'individual' && selectedAgentId && selectedAgentId !== 'random') {
      const a = getAgent(selectedAgentId);
      if (a) UI.setAgentPlaceholder(a);
    }

    // Meeting: default select first 3 if empty
    if (mode === 'meeting' && meetingAgentIds.length === 0) {
      meetingAgentIds = AGENTS.slice(0, 3).map(a => a.id);
      renderMeetingPicker();
    }
  }

  // ─────────────────── Agent Bar ───────────────────

  function renderAgentBar() {
    UI.renderAgentIconsV6(
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

  // ─────────────────── Meeting Picker ───────────────────

  function renderMeetingPicker() {
    UI.renderMeetingPicker(meetingAgentIds, (ids) => {
      if (ids.length > 7) return;
      meetingAgentIds = ids;
      renderMeetingPicker();
    });
  }

  // ─────────────────── Session List ───────────────────

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

  // ─────────────────── Response mode buttons ───────────────────

  function activateModeBtn(mode, showToastFlag) {
    const btn = document.querySelector('.mode-btn[data-mode="' + mode + '"]');
    if (!btn) return;
    const prev = currentMode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setResponseMode(mode);
    UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);
    if ((showToastFlag || false) && prev !== currentMode) {
      UI.showToast(RESPONSE_MODES[currentMode].name + ' モードに切替', 2000);
    }
  }

  // ─────────────────── Send ───────────────────

  async function handleSend() {
    if (isGenerating) return;
    const text = UI.getInputValue();
    if (!text) return;

    // Validate meeting mode
    if (convMode === 'meeting' && meetingAgentIds.length < 2) {
      UI.showToast('参加者を2人以上選んでください', 2500);
      return;
    }

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

    try {
      if (convMode === 'individual') {
        await handleIndividualResponse(text);
      } else if (convMode === 'random') {
        await handleRandomResponse(text);
      } else if (convMode === 'meeting') {
        await handleMeetingResponse(text);
      }
    } finally {
      isGenerating = false;
      UI.setGeneratingState(false);
    }
  }

  // ─────────────────── Individual mode ───────────────────

  async function handleIndividualResponse(userText) {
    let targetId;
    if (selectedAgentId === 'random') {
      targetId = getRandomAgent().id;
    } else if (selectedAgentId) {
      targetId = selectedAgentId;
    } else {
      targetId = 'ray'; // default
    }

    const msgEl = await handleAgentResponse(targetId, userText);
    if (!msgEl) return;

    // Opinion popups from 3 other agents
    await delay(500);
    const opinions = Chat.generateOpinions(targetId, userText, 3);
    UI.addOpinionPopups(opinions, msgEl);
  }

  // ─────────────────── Random mode ───────────────────

  async function handleRandomResponse(userText) {
    // Director picks the best agent
    const chosenAgent = selectDirectorAgent(userText, null);
    UI.showDirectorBadge(chosenAgent);

    // Small delay for the "selection" feeling
    await delay(600);

    const msgEl = await handleAgentResponse(chosenAgent.id, userText);
    if (!msgEl) return;

    // Opinion popups
    await delay(500);
    const opinions = Chat.generateOpinions(chosenAgent.id, userText, 3);
    UI.addOpinionPopups(opinions, msgEl);
  }

  // ─────────────────── Meeting mode ───────────────────

  async function handleMeetingResponse(userText) {
    const participants = meetingAgentIds
      .map(id => getAgent(id))
      .filter(Boolean);

    if (participants.length < 2) {
      UI.showToast('参加者を2人以上選んでください', 2500);
      return;
    }

    // Cost warning for long mode
    if (currentMode === 'long') {
      UI.showToast('深淵モード × 全体会議は多くのリソースを使います', 3000);
    }

    const previousResponses = [];

    for (let i = 0; i < participants.length; i++) {
      const agent = participants[i];

      // Typing indicator
      UI.showTypingIndicator(agent);
      await delay(800 + Math.random() * 700);

      let result;
      try {
        result = await Chat.generateMeetingResponse(
          agent.id, userText, previousResponses, currentMode
        );
      } catch (err) {
        UI.showToast(agent.name + 'の応答でエラーが発生しました', 2500);
        UI.removeTypingIndicator(agent.id);
        continue;
      }
      UI.removeTypingIndicator(agent.id);

      if (!result) continue;

      const msgEl = UI.addAgentMessage(result.agent, result.text, result.mode);
      Chat.addMessage('agent', agent.id, result.text, result.mode);

      previousResponses.push({ agent: result.agent, text: result.text });

      // Add reactions to last message
      await delay(300);
      const reactions = Chat.generateReactions(agent.id, userText);
      if (reactions.length > 0) {
        UI.addReactions(msgEl, reactions);
        const s = Chat.getActiveSession();
        if (s && s.messages.length > 0) {
          s.messages[s.messages.length - 1].reactions = reactions;
          Chat.save();
        }
      }

      // Pause between speakers (shorter for short mode)
      if (i < participants.length - 1) {
        await delay(currentMode === 'short' ? 300 : currentMode === 'medium' ? 500 : 700);
      }
    }
  }

  // ─────────────────── Core agent response ───────────────────

  async function handleAgentResponse(agentId, userText) {
    const agent = getAgent(agentId);
    if (!agent) return null;

    UI.showTypingIndicator(agent);
    let msgEl = null;

    try {
      await delay(700 + Math.random() * 900);

      const result = await Chat.generateResponse(agentId, userText, currentMode);

      if (result) {
        msgEl = UI.addAgentMessage(result.agent, result.text, result.mode);

        if (result.mode && result.mode.reason) {
          UI.showToast(result.mode.reason + ' →【' + result.mode.name + '】', 2500);
        }

        Chat.addMessage('agent', agentId, result.text, result.mode);

        await delay(350 + Math.random() * 450);
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

    return msgEl;
  }

  // ─────────────────── Utilities ───────────────────

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
