const EXPRESSIONS = {
  neutral: '/images/expressions/neutral.jpeg',
  dismissal: '/images/expressions/dismissal.jpeg',
  disappointment: '/images/expressions/disappointment.jpeg',
  sarcasm: '/images/expressions/sarcasm.jpeg',
  comedy: '/images/expressions/comedy.jpeg',
  serious: '/images/expressions/serious.jpeg',
  praise: '/images/expressions/praise.jpeg',
  frustration: '/images/expressions/frustration.jpeg',
  thinking: '/images/expressions/thinking.jpeg',
  shock: '/images/expressions/shock.jpeg',
  confidence: '/images/expressions/confidence.jpeg',
};

const KEYWORDS = {
  frustration: ['seriously', 'how many times', 'again and again', 'i am not going to repeat', 'this is exhausting', 'come on'],
  shock: ['you did what', 'excuse me', 'wait', 'hold on', 'you cannot be serious', 'run that back'],
  dismissal: ['get out', 'we are done', 'enough', 'my time', 'next time', 'fired from', 'get out of my boardroom'],
  disappointment: ['should have', 'again', 'still not', 'after everything', 'unbelievable'],
  sarcasm: ['congratulations', 'impressive', 'genius', 'apparently', 'somehow', 'interesting choice'],
  comedy: ['let me get this straight', 'you are telling me', 'excuse me', 'close', 'joke'],
  thinking: ['let me think', 'here is what i am seeing', 'let us break this down', 'consider this', 'look at your numbers'],
  serious: ['listen carefully', 'this is important', 'your data', 'right now', 'one more time'],
  confidence: ['here is the truth', 'i know exactly', 'trust me', 'that is not a comparison', 'i am the reason'],
  praise: ['well done', 'finally', 'excellent', 'proud', 'now that is a winning move'],
};

// Priority order: more intense/rare emotions win over calmer defaults when multiple match
const PRIORITY = ['shock', 'dismissal', 'frustration', 'disappointment', 'sarcasm', 'comedy', 'confidence', 'thinking', 'serious', 'praise'];

function matchesKeyword(lowerText, keyword) {
  // Word-boundary match so short keywords like "close" don't trigger inside unrelated words
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
  return pattern.test(lowerText);
}

function getExpression(text) {
  if (!text) return EXPRESSIONS.neutral;
  const lower = text.toLowerCase();
  for (const expression of PRIORITY) {
    if (KEYWORDS[expression].some(keyword => matchesKeyword(lower, keyword))) {
      return EXPRESSIONS[expression];
    }
  }
  return EXPRESSIONS.neutral;
}

function updateExpression(text) {
  const src = getExpression(text);
  const container = document.getElementById('expression-container');
  const img = document.getElementById('expression-img');
  if (!img || !container) return;

  if (img.src.endsWith(src)) {
    container.classList.remove('hidden');
    return;
  }

  img.classList.add('expression-fading');
  setTimeout(() => {
    img.src = src;
    container.classList.remove('hidden');
    img.classList.remove('expression-fading');
  }, 150);
}