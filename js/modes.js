// ==========================================
// じぶん会議 - モード制御（一閃 / 対話 / 深淵）
// ==========================================

const RESPONSE_MODES = {
  short: {
    key: 'short',
    name: '一閃',
    description: '短く鋭い一言',
    maxLength: 60,
    style: 'ひと言で。余白を大切に。',
  },
  medium: {
    key: 'medium',
    name: '対話',
    description: '自然な会話のやりとり',
    maxLength: 200,
    style: '会話のように自然に。2〜3文程度。',
  },
  long: {
    key: 'long',
    name: '深淵',
    description: '深く掘り下げた応答',
    maxLength: 500,
    style: '深く語る。比喩や物語も交えて。',
  },
};

let currentMode = 'short';

function setResponseMode(mode) {
  if (RESPONSE_MODES[mode]) {
    currentMode = mode;
  }
}

function getResponseMode() {
  return RESPONSE_MODES[currentMode];
}

function adjustResponseForMode(text, mode) {
  const config = RESPONSE_MODES[mode] || RESPONSE_MODES.short;
  if (mode === 'short') {
    const firstSentence = text.split(/[。！？]/).filter(s => s.trim())[0];
    return firstSentence ? firstSentence + '。' : text;
  }
  return text;
}
