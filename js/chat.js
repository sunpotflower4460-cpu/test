// ==========================================
// じぶん会議 – 会話ロジック v6.0
// localStorage 永続化 + セッション削除
// + Opinion popups, Meeting mode, Minutes,
//   API key management, Real API calls
// ==========================================

const STORAGE_KEY      = 'jibun-kaigi-sessions';
const API_KEY_STORAGE  = 'jibun-kaigi-api-keys';

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
      if (data) this.sessions = JSON.parse(data);
    } catch (e) {
      this.sessions = [];
    }
  },

  // --- Sessions ---
  createNewSession() {
    const session = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
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
  addMessage(role, agentId, text, mode, extra) {
    const session = this.getActiveSession();
    if (!session) return;
    const msg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      role, agentId, text, mode,
      reactions: [],
      timestamp: new Date().toISOString(),
      ...(extra || {}),
    };
    session.messages.push(msg);
    if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = text.length > 20 ? text.substring(0, 20) + '…' : text;
    }
    this.save();
    return msg;
  },

  // --- API Key Management ---
  getApiKeys() {
    try {
      return JSON.parse(localStorage.getItem(API_KEY_STORAGE) || '{}');
    } catch (e) { return {}; }
  },

  saveApiKeys(keys) {
    try {
      localStorage.setItem(API_KEY_STORAGE, JSON.stringify(keys));
    } catch (e) {}
  },

  getApiKey(agentId) {
    const keys = this.getApiKeys();
    // Per-agent key, fallback to global
    return keys[agentId] || keys['global'] || null;
  },

  // --- Build system prompt for real API calls ---
  buildSystemPrompt(agent, modeKey) {
    const modeStyle = RESPONSE_MODES[modeKey]
      ? RESPONSE_MODES[modeKey].style
      : '';
    const len = modeKey === 'short' ? '一言〜二言で簡潔に' : modeKey === 'medium' ? '2〜3文程度で' : '深く丁寧に、比喩も交えて';
    return `あなたは「${agent.name}」（${agent.title}）です。

【アイデンティティ】
${agent.layer0?.identity || ''}

【使命】
${agent.layer0?.mission || ''}

【本質】
${agent.core?.essence || ''}

【トーン】
${agent.guidance?.tone || ''}

【応答スタイル】
${modeStyle}
${len}。日本語で。キャラクターとして一貫して。押し付けない。`;
  },

  // --- Real Anthropic API call (with CORS fallback) ---
  async callAnthropicAPI(agentId, userText, historyMessages, modeKey, apiKey) {
    const agent = getAgent(agentId);
    if (!agent || !apiKey) return null;

    const maxTokens = modeKey === 'short' ? 100 : modeKey === 'medium' ? 250 : 600;
    const systemPrompt = this.buildSystemPrompt(agent, modeKey);

    // Build message history (last 8 turns, only matching agent's role)
    const msgs = [];
    const recent = (historyMessages || []).slice(-16);
    recent.forEach(m => {
      if (m.role === 'user') {
        msgs.push({ role: 'user', content: m.text });
      } else if (m.agentId === agentId && msgs.length > 0 && msgs[msgs.length - 1].role === 'user') {
        msgs.push({ role: 'assistant', content: m.text });
      }
    });
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') {
      msgs.push({ role: 'user', content: userText });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: msgs,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'API error ' + response.status);
    }
    const data = await response.json();
    return data.content?.[0]?.text || null;
  },

  // --- Response generation (real API → mock fallback) ---
  async generateResponse(agentId, userText, modeKey) {
    const agent = getAgent(agentId);
    if (!agent) return null;

    const modeInfo = this.estimateMode(agent, userText);
    let responseText = null;

    // Try real API first
    const apiKey = this.getApiKey(agentId);
    if (apiKey) {
      try {
        const session = this.getActiveSession();
        const history = session ? session.messages : [];
        responseText = await this.callAnthropicAPI(agentId, userText, history, modeKey, apiKey);
      } catch (err) {
        console.warn('[API] Falling back to mock:', err.message);
      }
    }

    // Mock fallback
    if (!responseText) {
      responseText = getRandomResponse(agent, modeInfo.key);
      responseText = adjustResponseForMode(responseText, modeKey);
    }

    return { agent, text: responseText, mode: modeInfo };
  },

  estimateMode(agent, text) {
    const modes = agent._legacy_modes;
    if (/つらい|苦しい|泣|死にたい|限界|もう無理|やめたい|消えたい/.test(text)) {
      const m = modes.find(m => ['comfort', 'dawn', 'treat', 'breath', 'silence'].includes(m.key));
      if (m) return { ...m, reason: '苦痛のキーワードを検出' };
    }
    if (/やりたい|挑戦|始め|夢|目標|やるぞ/.test(text)) {
      const m = modes.find(m => ['ignite', 'design', 'adventure', 'essence', 'execute'].includes(m.key));
      if (m) return { ...m, reason: '行動・目標のキーワードを検出' };
    }
    if (/どうしたら|わからない|迷|悩|混乱/.test(text)) {
      const m = modes.find(m => ['mirror', 'organize', 'lighthouse', 'wind', 'naive', 'wall'].includes(m.key));
      if (m) return { ...m, reason: '迷い・混乱のキーワードを検出' };
    }
    if (/疲れ|休み|しんどい|だるい/.test(text)) {
      const m = modes.find(m => ['release', 'breath', 'treat', 'comfort'].includes(m.key));
      if (m) return { ...m, reason: '疲労のキーワードを検出' };
    }
    if (/嬉しい|できた|やった|ありがとう|感謝|楽しい/.test(text)) {
      const m = modes.find(m => ['blessing', 'celebrate', 'fullpower', 'back'].includes(m.key));
      if (m) return { ...m, reason: '喜びのキーワードを検出' };
    }
    if (/べき|しなきゃ|義務|責任|しないと/.test(text)) {
      const m = modes.find(m => ['release', 'naive', 'juggle', 'asis'].includes(m.key));
      if (m) return { ...m, reason: '義務感のキーワードを検出' };
    }
    return { ...modes[0], reason: null };
  },

  // --- Opinion popups: 3 agents briefly comment ---
  generateOpinions(mainAgentId, userText, count) {
    count = count || 3;
    const others = AGENTS.filter(a => a.id !== mainAgentId);
    // Fisher-Yates shuffle
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    return others.slice(0, count).map(agent => {
      const pool = agent.opinionPool || ['……'];
      return {
        agent,
        text: pool[Math.floor(Math.random() * pool.length)],
      };
    });
  },

  // --- Meeting: generate response for one agent in sequence ---
  async generateMeetingResponse(agentId, userText, previousResponses, modeKey) {
    const agent = getAgent(agentId);
    if (!agent) return null;

    const modeInfo = this.estimateMode(agent, userText);
    let responseText = null;

    const apiKey = this.getApiKey(agentId);
    if (apiKey && previousResponses && previousResponses.length > 0) {
      // Build context-aware prompt with previous responses
      const prevContext = previousResponses.map(r =>
        `${r.agent.name}: ${r.text}`
      ).join('\n');
      const contextualPrompt = `${userText}\n\n[前の発言]\n${prevContext}`;
      try {
        const session = this.getActiveSession();
        responseText = await this.callAnthropicAPI(
          agentId, contextualPrompt, session ? session.messages : [], modeKey, apiKey
        );
      } catch (err) {
        console.warn('[Meeting API] Fallback:', err.message);
      }
    } else if (apiKey) {
      try {
        const session = this.getActiveSession();
        responseText = await this.callAnthropicAPI(agentId, userText, session ? session.messages : [], modeKey, apiKey);
      } catch (err) {
        console.warn('[Meeting API] Fallback:', err.message);
      }
    }

    // Mock fallback with previous-response awareness
    if (!responseText) {
      const base = getRandomResponse(agent, modeInfo.key);
      responseText = adjustResponseForMode(base, modeKey);

      // Add a brief reference to previous speaker if any (mock)
      if (previousResponses && previousResponses.length > 0) {
        const prev = previousResponses[previousResponses.length - 1];
        const bridges = [
          `${prev.agent.name}の言葉を聞いて……`,
          `${prev.agent.name}が言ったことを踏まえると、`,
          `なるほど、${prev.agent.name}の視点もある。私は——`,
        ];
        const bridge = bridges[Math.floor(Math.random() * bridges.length)];
        if (modeKey !== 'short') {
          responseText = bridge + responseText;
        }
      }
    }

    return { agent, text: responseText, mode: modeInfo };
  },

  // --- Minutes: summarize current session ---
  generateMinutes() {
    const session = this.getActiveSession();
    if (!session || !session.messages.length) return null;

    const userMsgs = session.messages.filter(m => m.role === 'user');
    const agentMsgs = session.messages.filter(m => m.role === 'agent');

    // Extract keywords from user messages
    const allText = userMsgs.map(m => m.text).join('。');
    const keywords = this._extractKeywords(allText);

    // Agent participation count
    const agentCounts = {};
    agentMsgs.forEach(m => {
      agentCounts[m.agentId] = (agentCounts[m.agentId] || 0) + 1;
    });

    // Emotional arc from keywords
    const arc = this._emotionalArc(userMsgs);

    // Conversation summary
    const summary = this._summarizeFlow(userMsgs, agentMsgs);

    // Gentle suggestions from 2-3 agents
    const suggestions = this._generateSuggestions(session.messages);

    return { keywords, agentCounts, arc, summary, suggestions, messageCount: session.messages.length };
  },

  _extractKeywords(text) {
    const stopWords = ['です', 'ます', 'した', 'ない', 'ある', 'いる', 'する', 'ので', 'けど', 'から', 'って', 'でも', 'でし', 'まし', 'こと', 'それ', 'これ', 'あの', 'その'];
    const words = text.replace(/[。、！？「」『』…]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
    const counts = {};
    words.forEach(w => {
      if (!stopWords.some(sw => w.includes(sw))) counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  },

  _emotionalArc(userMsgs) {
    const labels = [];
    userMsgs.forEach(m => {
      const t = m.text;
      if (/つらい|苦しい|泣|死にたい|限界/.test(t)) labels.push('苦しみ');
      else if (/疲れ|しんどい|休み/.test(t)) labels.push('疲れ');
      else if (/悩|迷|わからない/.test(t)) labels.push('迷い');
      else if (/やりたい|夢|目標|挑戦/.test(t)) labels.push('意欲');
      else if (/嬉しい|できた|ありがとう|楽しい/.test(t)) labels.push('喜び');
      else if (/怒|悔しい|許せない/.test(t)) labels.push('怒り');
      else labels.push('対話');
    });
    // Deduplicate consecutive same labels
    return labels.filter((v, i) => i === 0 || v !== labels[i - 1]);
  },

  _summarizeFlow(userMsgs, agentMsgs) {
    if (!userMsgs.length) return '会話がまだありません。';
    const first = userMsgs[0].text;
    const last = userMsgs[userMsgs.length - 1].text;
    const turns = userMsgs.length;
    const agents = [...new Set(agentMsgs.map(m => {
      const a = getAgent(m.agentId);
      return a ? a.name : m.agentId;
    }))];

    let flow = `${turns}回の発言を通じて会話が展開しました。`;
    if (first) flow += `\n最初の話題: 「${first.substring(0, 30)}${first.length > 30 ? '…' : ''}」`;
    if (last && turns > 1) flow += `\n最新の発言: 「${last.substring(0, 30)}${last.length > 30 ? '…' : ''}」`;
    if (agents.length) flow += `\n参加エージェント: ${agents.join('、')}`;
    return flow;
  },

  _generateSuggestions(messages) {
    const suggestions = [
      { agentId: 'ray',  text: 'この会話の中で一番心に残った言葉を、もう一度眺めてみませんか？' },
      { agentId: 'joe',  text: '今日の対話から、何か一つだけ行動に移せることはありますか？' },
      { agentId: 'mina', text: '少し休んで、自分を労ってあげてください。それだけで十分です。' },
      { agentId: 'ken',  text: '話の中で出てきた課題を、一度書き出して整理してみましょう。' },
      { agentId: 'fio',  text: '今感じていることを、絵や言葉、何かに残してみるのもいいかも。' },
      { agentId: 'sato', text: '一番避けていた問いに、ちゃんと向き合ってみる時かもしれない。' },
      { agentId: 'tom',  text: 'ぶっちゃけ、一番大事だと思うことに絞ってみたら？' },
    ];

    // Pick 3 relevant suggestions based on message content
    const allText = messages.map(m => m.text).join(' ');
    const scored = suggestions.map(s => {
      let score = Math.random(); // some randomness
      const agent = getAgent(s.agentId);
      if (agent) {
        (agent.directorKeywords || []).forEach(kw => {
          if (allText.includes(kw)) score += 1;
        });
      }
      return { ...s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  },

  // --- Reactions ---
  generateReactions(speakerId, userText) {
    const reactions = [];
    const others = AGENTS.filter(a => a.id !== speakerId);
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    const picked = others.slice(0, count);

    const texts = {
      ray:  ['……', '静かに頷く', '映している'],
      joe:  ['いいね！', 'そうだ！', '最高！'],
      mina: ['うん', 'わかる', 'そうだね'],
      sato: ['……ふん', 'まぁな', '……'],
      ken:  ['同意です', '一理あります', '補足します'],
      fio:  ['いいね〜', 'わかる〜', '素敵'],
      tom:  ['あはは', 'おもしろ', 'へ〜'],
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
