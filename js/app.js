// ==========================================
// じぶん会議 – メインアプリ v5.0
// Claude Code fixes:
//   - Race condition: isGenerating in try-finally
// ==========================================

(function () {
  'use strict';

  let selectedAgentId = null;
  let isGenerating = false;
  let onboardingSlide = 0;

  function init() {
    UI.init();
    Chat.init();

    setResponseMode('short');

    // Onboarding → Splash → Main flow
    if (!UI.hasSeenOnboarding()) {
      showOnboarding();
    } else {
      showSplash();
    }
  }

  // --- Onboarding ---
  function showOnboarding() {
    UI.els.onboardingScreen.classList.add('active');

    UI.els.onboardingNextBtn.addEventListener('click', () => {
      if (onboardingSlide < 2) {
        goToSlide(onboardingSlide + 1);
      } else {
        finishOnboarding();
      }
    });

    UI.els.onboardingSkipBtn.addEventListener('click', () => {
      finishOnboarding();
    });

    // Dot clicks
    UI.els.onboardingDots.querySelectorAll('.onboarding-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.dot, 10));
      });
    });
  }

  function goToSlide(index) {
    const slides = UI.els.onboardingSlides.querySelectorAll('.onboarding-slide');
    const dots = UI.els.onboardingDots.querySelectorAll('.onboarding-dot');

    slides[onboardingSlide].classList.remove('active');
    slides[onboardingSlide].classList.add('exit-left');
    setTimeout(() => slides[onboardingSlide].classList.remove('exit-left'), 400);

    dots[onboardingSlide].classList.remove('active');

    onboardingSlide = index;
    slides[onboardingSlide].classList.add('active');
    dots[onboardingSlide].classList.add('active');

    // Update button text on last slide
    UI.els.onboardingNextBtn.textContent = onboardingSlide === 2 ? 'はじめる' : '次へ';
  }

  function finishOnboarding() {
    UI.markOnboardingDone();
    UI.els.onboardingScreen.classList.remove('active');
    showSplash();
  }

  // --- Splash ---
  function showSplash() {
    UI.els.splashScreen.classList.add('active');
    bindEvents();
    UI.setupAutoResize();
    renderAgentBar();
    renderSessionList();

    // Always start with a fresh session
    const session = Chat.getActiveSession();
    if (session && session.messages.length > 0) {
      // Existing session with messages — restore
      UI.setSessionTitle(session.title);
      restoreMessages(session);
    } else {
      // Empty or new — show welcome
      UI.setSessionTitle('新しい会議');
    }

    UI.updateModeIndicator(RESPONSE_MODES[currentMode].name);
  }

  function bindEvents() {
    // Splash → Main
    UI.els.startBtn.addEventListener('click', (e) => {
      UI.addRipple(UI.els.startBtn, e);
      setTimeout(() => {
        UI.showMain();
        setTimeout(() => {
          // Show welcome if chat is empty
          const session = Chat.getActiveSession();
          if (!session || session.messages.length === 0) {
            UI.showWelcome();
          }
          UI.els.userInput.focus();
        }, 600);
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
      UI.showWelcome();
      renderSessionList();
      UI.closeSidebar();
      selectedAgentId = null;
      renderAgentBar();
    });

    // Welcome suggestion buttons
    document.querySelectorAll('.welcome-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.text;
        if (text) {
          UI.els.userInput.value = text;
          UI.els.sendBtn.disabled = false;
          UI.els.userInput.focus();
          // Auto resize
          UI.els.userInput.style.height = 'auto';
          UI.els.userInput.style.height = Math.min(UI.els.userInput.scrollHeight, 120) + 'px';
        }
      });
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
  }

  function renderAgentBar() {
    UI.renderAgentIcons(
      selectedAgentId,
      (id) => {
        selectedAgentId = selectedAgentId === id ? null : id;
        renderAgentBar();

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
          if (session.messages.length > 0) {
            UI.hideWelcome();
            restoreMessages(session);
          } else {
            UI.showWelcome();
          }
        }
        UI.closeSidebar();
      },
      (sessionId) => {
        const session = Chat.deleteSession(sessionId);
        if (session) {
          UI.clearMessages();
          UI.setSessionTitle(session.title);
          if (session.messages.length > 0) {
            UI.hideWelcome();
            restoreMessages(session);
          } else {
            UI.showWelcome();
          }
        }
        renderSessionList();
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

    UI.hideWelcome();
    UI.addUserMessage(text);
    Chat.addMessage('user', null, text, null);
    UI.clearInput();

    const session = Chat.getActiveSession();
    if (session) {
      UI.setSessionTitle(session.title);
      renderSessionList();
    }

    isGenerating = true;

    try {
      let targetId;
      if (selectedAgentId === 'random') {
        const randomAgent = getRandomAgent();
        targetId = randomAgent.id;
      } else if (selectedAgentId) {
        targetId = selectedAgentId;
      } else {
        targetId = 'ray';
      }

      await handleAgentResponse(targetId, text);
    } finally {
      isGenerating = false;
    }
  }

  async function handleAgentResponse(agentId, userText) {
    const agent = getAgent(agentId);
    if (!agent) return;

    UI.showTypingIndicator(agent);
    await delay(700 + Math.random() * 1000);

    const result = await Chat.generateResponse(agentId, userText, currentMode);
    UI.removeTypingIndicator(agentId);

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
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
