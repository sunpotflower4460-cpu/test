// ==========================================
// じぶん会議 - 会話ロジック（モック版）
// ==========================================

const Chat = {
  sessions: [],
  activeSessionId: null,

  init() {
    this.createNewSession();
  },

  createNewSession() {
    const session = {
      id: 'session-' + Date.now(),
      title: '新しい会議',
      messages: [],
      createdAt: new Date(),
    };
    this.sessions.unshift(session);
    this.activeSessionId = session.id;
    return session;
  },

  getActiveSession() {
    return this.sessions.find(s => s.id === this.activeSessionId);
  },

  switchSession(sessionId) {
    this.activeSessionId = sessionId;
    return this.getActiveSession();
  },

  addMessage(role, agentId, text, mode) {
    const session = this.getActiveSession();
    if (!session) return;

    const msg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      role,
      agentId,
      text,
      mode,
      reactions: [],
      timestamp: new Date(),
    };

    session.messages.push(msg);

    if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = text.length > 20 ? text.substring(0, 20) + '…' : text;
    }

    return msg;
  },

  async generateResponse(agentId, userText, mode) {
    const agent = getAgent(agentId);
    if (!agent) return null;

    const modeInfo = this.estimateMode(agent, userText);
    let responseText = getRandomResponse(agent, modeInfo.key);
    responseText = adjustResponseForMode(responseText, mode);

    return {
      agent,
      text: responseText,
      mode: modeInfo,
    };
  },

  estimateMode(agent, text) {
    const modes = agent.modes;

    if (/つらい|苦しい|泣|死|限界|もう無理|やめたい/.test(text)) {
      const painMode = modes.find(m =>
        ['comfort', 'dawn', 'treat', 'breath', 'silence'].includes(m.key)
      );
      if (painMode) return painMode;
    }

    if (/やりたい|挑戦|始め|夢|目標/.test(text)) {
      const actionMode = modes.find(m =>
        ['ignite', 'design', 'adventure', 'essence', 'execute'].includes(m.key)
      );
      if (actionMode) return actionMode;
    }

    if (/どうしたら|わからない|迷|悩|混乱/.test(text)) {
      const confuseMode = modes.find(m =>
        ['mirror', 'organize', 'lighthouse', 'wind', 'naive', 'wall'].includes(m.key)
      );
      if (confuseMode) return confuseMode;
    }

    if (/疲れ|休み|しんどい|無理/.test(text)) {
      const restMode = modes.find(m =>
        ['release', 'breath', 'treat', 'comfort'].includes(m.key)
      );
      if (restMode) return restMode;
    }

    if (/嬉しい|できた|やった|ありがとう|感謝/.test(text)) {
      const joyMode = modes.find(m =>
        ['blessing', 'celebrate', 'fullpower', 'back'].includes(m.key)
      );
      if (joyMode) return joyMode;
    }

    if (/べき|しなきゃ|義務|責任/.test(text)) {
      const shouldMode = modes.find(m =>
        ['release', 'naive', 'juggle', 'asis'].includes(m.key)
      );
      if (shouldMode) return shouldMode;
    }

    return modes[0];
  },

  async generateMasterResponse(userText, mode) {
    const responses = [];
    for (const agent of AGENTS) {
      const result = await this.generateResponse(agent.id, userText, mode);
      if (result) {
        responses.push(result);
      }
    }
    return responses;
  },

  generateReactions(speakerId, userText) {
    const reactions = [];
    const otherAgents = AGENTS.filter(a => a.id !== speakerId);

    const reactionCount = 2 + Math.floor(Math.random() * 2);
    const shuffled = otherAgents.sort(() => Math.random() - 0.5).slice(0, reactionCount);

    const reactionTexts = {
      ray: ['……', '静かに頷く', '映している'],
      joe: ['いいね！', 'そうだ！', '最高！'],
      mina: ['うん', 'わかる', 'そうだね'],
      sato: ['……ふん', 'まぁな', '……'],
      ken: ['同意です', '一理あります', '補足します'],
      fio: ['いいね〜', 'わかる〜', '素敵'],
      tom: ['あはは', 'おもしろ', 'へ〜'],
    };

    shuffled.forEach(a => {
      const texts = reactionTexts[a.id] || ['……'];
      reactions.push({
        agentId: a.id,
        text: texts[Math.floor(Math.random() * texts.length)],
      });
    });

    return reactions;
  },
};
