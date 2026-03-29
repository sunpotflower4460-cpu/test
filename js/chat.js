// ==========================================
// じぶん会議 – 会話ロジック v3.0
// localStorage 永続化 + セッション削除
// ==========================================

const STORAGE_KEY = 'jibun-kaigi-sessions';

const Chat = {
  sessions: [],
  activeSessionId: null,

  init() {
    this.load();
    if (this.sessions.length === 0) {
      this.createNewSession();
    } else {
      this.activeSessionId = this.sessions[0].id;
    }
  },

  // --- Persistence ---
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
    } catch (e) { /* quota exceeded – silent fail */ }
  },

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.sessions = JSON.parse(data);
      }
    } catch (e) {
      this.sessions = [];
    }
  },

  // --- Sessions ---
  createNewSession() {
    const session = {
      id: 'session-' + Date.now(),
      title: '新しい会議',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    this.sessions.unshift(session);
    this.activeSessionId = session.id;
    this.save();
    return session;
  },

  getActiveSession() {
    return this.sessions.find(s => s.id === this.activeSessionId);
  },

  switchSession(sessionId) {
    this.activeSessionId = sessionId;
    return this.getActiveSession();
  },

  deleteSession(sessionId) {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return;

    this.sessions.splice(index, 1);

    if (this.activeSessionId === sessionId) {
      if (this.sessions.length > 0) {
        this.activeSessionId = this.sessions[0].id;
      } else {
        this.createNewSession();
      }
    }

    this.save();
    return this.getActiveSession();
  },

  // --- Messages ---
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
      timestamp: new Date().toISOString(),
    };

    session.messages.push(msg);

    // Auto-title from first user message
    if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = text.length > 20 ? text.substring(0, 20) + '…' : text;
    }

    this.save();
    return msg;
  },

  // --- Response generation ---
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
    const modes = agent._legacy_modes;

    // Pain / crisis
    if (/つらい|苦しい|泣|死にたい|限界|もう無理|やめたい|消えたい/.test(text)) {
      const m = modes.find(m =>
        ['comfort', 'dawn', 'treat', 'breath', 'silence'].includes(m.key)
      );
      if (m) return { ...m, reason: '苦痛のキーワードを検出' };
    }

    // Action / dream
    if (/やりたい|挑戦|始め|夢|目標|やるぞ/.test(text)) {
      const m = modes.find(m =>
        ['ignite', 'design', 'adventure', 'essence', 'execute'].includes(m.key)
      );
      if (m) return { ...m, reason: '行動・目標のキーワードを検出' };
    }

    // Confusion
    if (/どうしたら|わからない|迷|悩|混乱/.test(text)) {
      const m = modes.find(m =>
        ['mirror', 'organize', 'lighthouse', 'wind', 'naive', 'wall'].includes(m.key)
      );
      if (m) return { ...m, reason: '迷い・混乱のキーワードを検出' };
    }

    // Fatigue
    if (/疲れ|休み|しんどい|だるい/.test(text)) {
      const m = modes.find(m =>
        ['release', 'breath', 'treat', 'comfort'].includes(m.key)
      );
      if (m) return { ...m, reason: '疲労のキーワードを検出' };
    }

    // Joy
    if (/嬉しい|できた|やった|ありがとう|感謝|楽しい/.test(text)) {
      const m = modes.find(m =>
        ['blessing', 'celebrate', 'fullpower', 'back'].includes(m.key)
      );
      if (m) return { ...m, reason: '喜びのキーワードを検出' };
    }

    // Obligation
    if (/べき|しなきゃ|義務|責任|しないと/.test(text)) {
      const m = modes.find(m =>
        ['release', 'naive', 'juggle', 'asis'].includes(m.key)
      );
      if (m) return { ...m, reason: '義務感のキーワードを検出' };
    }

    return { ...modes[0], reason: null };
  },

  // --- Reactions ---
  generateReactions(speakerId, userText) {
    const reactions = [];
    const others = AGENTS.filter(a => a.id !== speakerId);
    const count = 2 + Math.floor(Math.random() * 2);
    const picked = others.sort(() => Math.random() - 0.5).slice(0, count);

    const texts = {
      ray: ['……', '静かに頷く', '映している'],
      joe: ['いいね！', 'そうだ！', '最高！'],
      mina: ['うん', 'わかる', 'そうだね'],
      sato: ['……ふん', 'まぁな', '……'],
      ken: ['同意です', '一理あります', '補足します'],
      fio: ['いいね〜', 'わかる〜', '素敵'],
      tom: ['あはは', 'おもしろ', 'へ〜'],
    };

    picked.forEach(a => {
      const pool = texts[a.id] || ['……'];
      reactions.push({
        agentId: a.id,
        text: pool[Math.floor(Math.random() * pool.length)],
      });
    });

    return reactions;
  },
};
