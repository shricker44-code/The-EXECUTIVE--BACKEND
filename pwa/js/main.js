const VERDICTS = [
  { icon: '📊', title: 'THE HOOK VERDICT', desc: '3 seconds. That\'s all you get. If your opener doesn\'t stop the scroll, you\'re finished before you started.' },
  { icon: '⏰', title: 'THE CONSISTENCY DECREE', desc: '3-5 posts per week, minimum. Treat it like showing up to work. No excuses, no exceptions.' },
  { icon: '🎵', title: 'THE SOUND STRATEGY', desc: 'Use trending sounds on the RISE, not the peak. Early movers win. Late movers get buried.' },
  { icon: '💬', title: 'THE ENGAGEMENT RULE', desc: 'Reply to every comment in the first 60 minutes. Non-negotiable. This is your job now.' },
  { icon: '🎯', title: 'THE NICHE DIRECTIVE', desc: 'Pick 3 content pillars and own them. Scattered creators lose. Focused creators win. Period.' },
  { icon: '📈', title: 'THE NUMBERS BOARDROOM', desc: 'Watch your completion rate above everything. If they\'re not finishing your video, you\'re fired.' },
  { icon: '🔁', title: 'THE LOOP RULING', desc: 'Videos that loop seamlessly get rewatched. Boost your completion rate. Engineer the loop.' },
  { icon: '💰', title: 'THE MONETIZATION VERDICT', desc: 'Views don\'t pay bills. Conversions do. Every video needs a purpose beyond the view count.' },
];

let currentTab = 'boardroom';
let currentScanTab = 'url';
let isMuted = false;
let currentAutoAudio = new Audio();
let audioUnlocked = false;
let usageWarningShown = false;

const UI_TRANSLATIONS = {
  en: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "Your TikTok Boardroom Advisor",
    "header-sub": "TIKTOK BOARDROOM ADVISOR",
    "quick-prompts-label": "PRESENT YOUR CASE",
    "input-placeholder": "State your case to The Executive...",
    "nav-boardroom": "Boardroom",
    "nav-profile": "Profile",
    "nav-scan": "Scan",
    "nav-score": "Score",
    "nav-verdicts": "Verdicts",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "Clear Chat",
    "profile-header-title": "CREATOR PROFILE",
    "profile-header-sub": "YOUR DOSSIER. THE EXECUTIVE NEEDS THE FACTS.",
    "scan-header-title": "CONTENT SCAN",
    "scan-header-sub": "SUBMIT YOUR CONTENT. RECEIVE THE VERDICT.",
    "score-header-title": "EXECUTIVE SCORE",
    "score-header-sub": "TRACK YOUR GROWTH. EARN YOUR RANK.",
    "verdicts-header-title": "THE EXECUTIVE'S RULINGS",
    "verdicts-header-sub": "TAP ANY RULING TO DISCUSS IN BOARDROOM",
    "field-language": "LANGUAGE",
  },
  fr: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "Votre conseiller TikTok",
    "header-sub": "CONSEILLER TIKTOK",
    "quick-prompts-label": "PRÉSENTE TON DOSSIER",
    "input-placeholder": "Présente ton dossier à The Executive...",
    "nav-boardroom": "Bureau",
    "nav-profile": "Profil",
    "nav-scan": "Scan",
    "nav-score": "Score",
    "nav-verdicts": "Verdicts",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "Effacer la conversation",
    "profile-header-title": "PROFIL CRÉATEUR",
    "profile-header-sub": "TON DOSSIER. THE EXECUTIVE A BESOIN DES FAITS.",
    "scan-header-title": "ANALYSE DE CONTENU",
    "scan-header-sub": "SOUMETS TON CONTENU. REÇOIS LE VERDICT.",
    "score-header-title": "SCORE EXECUTIVE",
    "score-header-sub": "SUIS TA CROISSANCE. GAGNE TON RANG.",
    "verdicts-header-title": "LES JUGEMENTS DE THE EXECUTIVE",
    "verdicts-header-sub": "TOUCHE UN JUGEMENT POUR EN DISCUTER AU BUREAU",
    "field-language": "LANGUE",
  },
  pt: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "Seu conselheiro do TikTok",
    "header-sub": "CONSELHEIRO DO TIKTOK",
    "quick-prompts-label": "APRESENTE SEU CASO",
    "input-placeholder": "Apresente seu caso a The Executive...",
    "nav-boardroom": "Escritório",
    "nav-profile": "Perfil",
    "nav-scan": "Scan",
    "nav-score": "Score",
    "nav-verdicts": "Vereditos",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "Limpar conversa",
    "profile-header-title": "PERFIL DO CRIADOR",
    "profile-header-sub": "SEU DOSSIÊ. THE EXECUTIVE PRECISA DOS FATOS.",
    "scan-header-title": "ANÁLISE DE CONTEÚDO",
    "scan-header-sub": "ENVIE SEU CONTEÚDO. RECEBA O VEREDITO.",
    "score-header-title": "SCORE EXECUTIVE",
    "score-header-sub": "ACOMPANHE SEU CRESCIMENTO. GANHE SEU RANK.",
    "verdicts-header-title": "OS VEREDITOS DE THE EXECUTIVE",
    "verdicts-header-sub": "TOQUE EM QUALQUER VEREDITO PARA DISCUTIR NO ESCRITÓRIO",
    "field-language": "IDIOMA",
  },
};

function applyUITranslations() {
  const lang = (currentUser && currentUser.language) || 'en';
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });
}

window.addEventListener('load', () => {
  renderVerdicts();
  loadProfile();
  loadDisplayName();
  playSplashThenInit();
});

window.addEventListener('load', () => {
  const messagesEl = document.getElementById('messages');
  if (messagesEl) {
    messagesEl.addEventListener('scroll', updateScrollButton);
  }
});

document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

function isNearBottom(el, threshold = 80) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

function scrollToBottom() {
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
  document.getElementById('scroll-bottom-btn').classList.remove('visible');
}

function updateScrollButton() {
  const messages = document.getElementById('messages');
  const btn = document.getElementById('scroll-bottom-btn');
  if (!messages || !btn) return;
  if (isNearBottom(messages)) {
    btn.classList.remove('visible');
  } else {
    btn.classList.add('visible');
  }
}

function unlockAudio() {
  if (audioUnlocked) return;
  currentAutoAudio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC7keyLxgNBgIsIzYtRUYzTB4NKLKXBFERUdmegLkGmMwHkyxdMdV/JOG20HZeKUuYJdSb+MgU5WKmNL/ODaB0LrGgHZL8G16DEEoQ7AKAgHF5cQqm2iP3ITqhBhTVUuTa9qQQb+O5aCgSJKQjRnfCwaZjF5RUcJfLtqDdOsFCsq/L/8yBTBUlYQBFGeWAAAAAAAAB+AaAAAA";
  currentAutoAudio.play()
    .then(() => {
      currentAutoAudio.pause();
      audioUnlocked = true;
    })
    .catch(() => {
      audioUnlocked = true;
    });
}

const SPLASH_MIN_DURATION_MS = 3000;

async function playSplashThenInit() {
  const container = document.getElementById('splash-lottie');
  const startTime = Date.now();

  let anim;
  try {
    const response = await fetch('/images/logo_animation_reveal.json');
    const animationData = await response.json();

    anim = lottie.loadAnimation({
      container,
      renderer: 'canvas',
      loop: false,
      autoplay: true,
      animationData,
    });
  } catch (e) {
    console.log('Lottie load failed:', e);
    initApp();
    return;
  }

  const finishSplash = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(SPLASH_MIN_DURATION_MS - elapsed, 0);
    setTimeout(() => {
      initApp();
    }, remaining);
  };

  anim.addEventListener('complete', finishSplash);

  setTimeout(finishSplash, 8000);
}

async function initApp() {
  const user = loadUser();
  if (user) {
    showApp(user);
    return;
  }

  showAuthScreen();
}

function showAuthScreen() {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
}

function showBlockedScreen(message) {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('blocked-screen').classList.remove('hidden');
  document.getElementById('blocked-message').textContent = message;
}

let sessionCheckInterval = null;

function updateUpgradeButtonVisibility() {
  const btn = document.querySelector('.field-card button[onclick="upgradeToBasePlan()"]');
  const card = btn ? btn.closest('.field-card') : null;
  if (card && currentUser && currentUser.is_paid) {
    card.style.display = 'none';
  }
}

function showApp(user) {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('blocked-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateUpgradeButtonVisibility();
  applyUITranslations();
  if (user && user.user_id) {
    subscribeToPush(user.user_id);
    startSessionCheck(user.user_id);
    initAccountsAndHistory();
  }
}

async function initAccountsAndHistory() {
  await loadAccountSwitcher();
  await loadCurrentAccountHistory();
}

async function loadCurrentAccountHistory() {
  const messages = document.getElementById('messages');
  messages.style.scrollBehavior = 'auto';

  const history = await fetchChatHistory(currentAccountId);
  if (history.length === 0) {
    addInitialMessage();
  } else {
    history.forEach(msg => {
      addMessage(msg.role, msg.content);
      conversationHistory.push({ role: msg.role, content: msg.content });
    });
  }
  messages.scrollTop = messages.scrollHeight;
  messages.style.scrollBehavior = '';
}

function startSessionCheck(userId) {
  if (sessionCheckInterval) clearInterval(sessionCheckInterval);
  sessionCheckInterval = setInterval(async () => {
    try {
      const result = await checkSession(userId);
      if (!result.valid) {
        clearInterval(sessionCheckInterval);
        signOut();
        alert(result.message);
        location.reload();
      }
    } catch (e) {
      console.log('Session check failed:', e);
    }
  }, 30000);
}
function handleSignOut() {
  signOut();
  location.reload();
}

async function handleSignUp() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const firstName = document.getElementById('auth-firstname').value.trim();

  if (!email || !password || !firstName) {
    alert('Fill in all fields.');
    return;
  }

  const btn = document.getElementById('auth-submit-btn');
  btn.textContent = 'ENTERING BOARDROOM...';
  btn.disabled = true;

  try {
    const result = await signUp(email, password, firstName);
    if (result.blocked) {
      showBlockedScreen(result.message);
      return;
    }
    if (result.success) {
      showApp(result);
    } else {
      alert('Signup failed. Try again.');
      btn.textContent = 'ENTER THE BOARDROOM';
      btn.disabled = false;
    }
  } catch {
    alert('Connection failed. Try again.');
    btn.textContent = 'ENTER THE BOARDROOM';
    btn.disabled = false;
  }
}

async function handleSignIn() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();

  if (!email || !password) {
    alert('Enter your email and password.');
    return;
  }

  const btn = document.getElementById('auth-submit-btn');
  btn.textContent = 'ENTERING BOARDROOM...';
  btn.disabled = true;

  try {
    const result = await signIn(email, password);
    if (result.success) {
      showApp(result);
    } else {
      alert('Sign in failed. Check your credentials.');
      btn.textContent = 'ENTER THE BOARDROOM';
      btn.disabled = false;
    }
  } catch {
    alert('Connection failed. Try again.');
    btn.textContent = 'ENTER THE BOARDROOM';
    btn.disabled = false;
  }
}

function toggleAuthMode() {
  const isSignUp = document.getElementById('auth-firstname-group').style.display !== 'none';
  if (isSignUp) {
    document.getElementById('auth-firstname-group').style.display = 'none';
    document.getElementById('auth-title').textContent = 'WELCOME BACK';
    document.getElementById('auth-subtitle').textContent = 'THE BOARDROOM IS WAITING';
    document.getElementById('auth-submit-btn').textContent = 'ENTER THE BOARDROOM';
    document.getElementById('auth-submit-btn').onclick = handleSignIn;
    document.getElementById('auth-toggle').textContent = "New here? Start your free trial";
  } else {
    document.getElementById('auth-firstname-group').style.display = 'block';
    document.getElementById('auth-title').textContent = 'THE BOARDROOM';
    document.getElementById('auth-subtitle').textContent = 'YOUR 14-DAY TRIAL STARTS NOW';
    document.getElementById('auth-submit-btn').textContent = 'ENTER THE BOARDROOM';
    document.getElementById('auth-submit-btn').onclick = handleSignUp;
    document.getElementById('auth-toggle').textContent = "Already have an account? Sign in";
  }
}
function showSignIn() {
  document.getElementById('blocked-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('auth-firstname-group').style.display = 'none';
  document.getElementById('auth-title').textContent = 'THE EXECUTIVE';
  document.getElementById('auth-subtitle').textContent = 'WELCOME BACK';
  document.getElementById('auth-submit-btn').textContent = 'ENTER THE BOARDROOM';
  document.getElementById('auth-submit-btn').onclick = handleSignIn;
  document.getElementById('auth-toggle').textContent = "New here? Start your free trial";
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  const tabs = ['boardroom', 'profile', 'scan', 'score', 'verdicts'];
  const idx = tabs.indexOf(tab);
  if (idx >= 0) document.querySelectorAll('.nav-btn')[idx].classList.add('active');
  currentTab = tab;
  if (tab === 'score') loadComputedScore();
    if (tab === 'profile') {
    loadUsageDisplay();
    updateLanguageButtons();
  }
}

function addInitialMessage() {
  const messages = document.getElementById('messages');
  const bubble = document.createElement('div');
  bubble.className = 'message assistant';
  const greeting = currentUser && currentUser.first_name
    ? `${currentUser.first_name}. Sit down. My office is open. Start talking.`
    : `Sit down. My office is open. Start talking.`;
  const formatted = greeting
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*[^*].*?\*/g, '')
    .replace(/\n/g, '<br>');
  bubble.innerHTML = '<div class="avatar">E</div><div class="bubble assistant">' + formatted + '</div>';
  messages.appendChild(bubble);
}

function addMessage(role, content) {
  const messages = document.getElementById('messages');
  const qp = document.getElementById('quick-prompts');
  if (qp) qp.style.display = 'none';
  const bubble = document.createElement('div');
  bubble.className = 'message ' + role;
  if (role === 'assistant') {
    bubble.innerHTML = '<div class="avatar">E</div><div class="bubble assistant">' + content.replace(/\n/g, '<br>') + '</div>';
  } else {
    bubble.innerHTML = '<div class="bubble user">' + content.replace(/\n/g, '<br>') + '</div>';
  }
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  if (role === 'assistant') {
    checkVerdictTracking();
  }
}

function checkVerdictTracking() {
  const lastVerdict = localStorage.getItem('last_verdict_time');
  if (!lastVerdict) {
    localStorage.setItem('last_verdict_time', Date.now());
    return;
  }

  const hoursSince = (Date.now() - parseInt(lastVerdict)) / (1000 * 60 * 60);

  if (hoursSince >= 48) {
    setTimeout(() => {
      const prompt = document.createElement('div');
      prompt.className = 'verdict-tracking-prompt';
      prompt.innerHTML = `
        <div class="tracking-message">Have you posted since your last verdict?</div>
        <div class="tracking-buttons">
          <button class="tracking-yes" onclick="verdictTrackingResponse(true)">YES, I POSTED</button>
          <button class="tracking-no" onclick="verdictTrackingResponse(false)">NOT YET</button>
        </div>
      `;
      document.getElementById('messages').appendChild(prompt);
      document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    }, 1000);
  }

  localStorage.setItem('last_verdict_time', Date.now());
}

async function verdictTrackingResponse(posted) {
  document.querySelector('.verdict-tracking-prompt')?.remove();
  if (posted) {
    await sendToExecutive("I posted since my last verdict.");
  } else {
    await sendToExecutive("I haven't posted since my last verdict yet.");
  }
}

async function handleSend() {
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  unlockAudio();
  await sendToExecutive(text);
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function sendQuickPrompt(prompt) {
  unlockAudio();
  await sendToExecutive(prompt);
}

function toggleMute() {
  unlockAudio();
  isMuted = !isMuted;
  const btn = document.getElementById('mute-btn');
  btn.textContent = isMuted ? '🔇' : '🔊';
  btn.classList.toggle('muted', isMuted);

  if (isMuted && currentAutoAudio && !currentAutoAudio.paused) {
    currentAutoAudio.pause();
    currentAutoAudio.currentTime = 0;
  }
}

function addPlaybackButton(bubbleEl, text, existingAudioBase64 = null) {
  const btn = document.createElement('button');
  btn.className = 'playback-btn';
  btn.innerHTML = '🔊 Play';
  btn.onclick = async () => {
    if (isMuted) {
      alert('Voice is muted. Unmute to play.');
      return;
    }
    btn.disabled = true;
    btn.innerHTML = '⏳ Loading...';
    try {
      const audioBase64 = existingAudioBase64 || await generateSpeech(text);
      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        btn.innerHTML = '🔊 Playing...';
        audio.play();
        audio.onended = () => {
          btn.innerHTML = '🔊 Play';
          btn.disabled = false;
        };
      } else {
        btn.innerHTML = '🔊 Play';
        btn.disabled = false;
      }
    } catch (e) {
      console.log('TTS playback failed:', e);
      btn.innerHTML = '🔊 Play';
      btn.disabled = false;
    }
  };
  bubbleEl.appendChild(document.createElement('br'));
  bubbleEl.appendChild(btn);
}

async function sendToExecutive(text) {
  addMessage('user', text);
  document.getElementById('typing').classList.remove('hidden');
  document.getElementById('send-btn').disabled = true;

  const qp = document.getElementById('quick-prompts');
  if (qp) qp.style.display = 'none';

  const messages = document.getElementById('messages');
  messages.style.scrollBehavior = 'auto';
  let bubbleEl = null;
  let displayedText = '';
  let typewriterTimer = null;
  let lastExpressionUpdate = 0;

  function revealNextChar(fullText) {
    if (displayedText.length < fullText.length) {
      displayedText += fullText[displayedText.length];
      const formatted = displayedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      bubbleEl.innerHTML = formatted + '<span class="cursor-blink">|</span>';

      const now = Date.now();
      if (now - lastExpressionUpdate > 400) {
        updateExpression(displayedText);
        lastExpressionUpdate = now;
      }

      if (isNearBottom(messages)) {
        messages.scrollTop = messages.scrollHeight;
      }
      updateScrollButton();

      typewriterTimer = setTimeout(() => revealNextChar(fullText), 45);
    } else {
      const formatted = displayedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      bubbleEl.innerHTML = formatted;
      typewriterTimer = null;
    }
  }

  try {
    const isFirstMessage = conversationHistory.length === 0;

    let finalText = '';
    await sendMessage(text, (chunkText, fullText) => {
      finalText = fullText;
    });

    finalText = finalText.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '').replace(/\s{2,}/g, ' ').trim();

    if (isFirstMessage && currentUser && currentUser.first_name) {
      finalText = `${currentUser.first_name}. ${finalText}`;
    }

    let audioBase64 = null;
    if (!isMuted) {
      try {
        audioBase64 = await generateSpeech(finalText);
      } catch (e) {
        console.log('TTS generation failed:', e);
      }
    }

    document.getElementById('typing').classList.add('hidden');
    const wrapper = document.createElement('div');
    wrapper.className = 'message assistant';
    wrapper.innerHTML = '<div class="avatar">E</div><div class="bubble assistant"></div>';
    messages.appendChild(wrapper);
    bubbleEl = wrapper.querySelector('.bubble');

    if (audioBase64) {
      currentAutoAudio.src = `data:audio/mp3;base64,${audioBase64}`;
      currentAutoAudio.currentTime = 0;
      currentAutoAudio.play().catch(e => console.log('Auto-play blocked:', e));
    }
    revealNextChar(finalText);

    await new Promise((resolve) => {
      const checkDone = setInterval(() => {
        if (displayedText.length >= finalText.length && !typewriterTimer) {
          clearInterval(checkDone);
          resolve();
        }
      }, 50);
    });

    if (document.body.contains(bubbleEl)) {
      updateExpression(displayedText);
      checkVerdictTracking();
      checkUsageWarning();

      addPlaybackButton(bubbleEl, finalText, audioBase64);

      if (isNearBottom(messages)) {
        messages.scrollTop = messages.scrollHeight;
      }
    }
  } catch (e) {
    console.error('sendToExecutive error:', e);
    document.getElementById('typing').classList.add('hidden');
    addMessage('assistant', "Connection failed. In business, that's unacceptable. Check your network and try again.");
  } finally {
    document.getElementById('send-btn').disabled = false;
    messages.style.scrollBehavior = '';
  }
}

function saveProfile() {
  const profile = {
    username: document.getElementById('p-username').value,
    niche: document.getElementById('p-niche').value,
    followers: document.getElementById('p-followers').value,
    views: document.getElementById('p-views').value,
    freq: document.getElementById('p-freq').value,
    goal: document.getElementById('p-goal').value,
  };
  localStorage.setItem('executive_profile', JSON.stringify(profile));
  alert('Profile saved. Now I know who I am dealing with.');
}

function loadProfile() {
  const data = localStorage.getItem('executive_profile');
  if (!data) return;
  const profile = JSON.parse(data);
  if (profile.username) document.getElementById('p-username').value = profile.username;
  if (profile.niche) document.getElementById('p-niche').value = profile.niche;
  if (profile.followers) document.getElementById('p-followers').value = profile.followers;
  if (profile.views) document.getElementById('p-views').value = profile.views;
  if (profile.freq) document.getElementById('p-freq').value = profile.freq;
  if (profile.goal) document.getElementById('p-goal').value = profile.goal;
}

function loadDisplayName() {
  if (currentUser && currentUser.first_name) {
    const input = document.getElementById('p-displayname');
    if (input) input.value = currentUser.first_name;
  }
}

async function handleUpdateName() {
  const newName = document.getElementById('p-displayname').value.trim();
  if (!newName) { alert('Enter a name first.'); return; }
  const btn = event.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  try {
    const result = await updateDisplayName(newName);
    if (result.success) {
      btn.textContent = '✓ UPDATED';
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    } else {
      btn.textContent = 'FAILED — TRY AGAIN';
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    }
  } catch (e) {
    btn.textContent = 'FAILED — TRY AGAIN';
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
  }
}

async function handleSetCheckInTime() {
  const time = document.getElementById('p-checkin-time').value;
  if (!time) { alert('Pick a time first.'); return; }
  const btn = event.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  try {
    const result = await setCheckInTime(time);
    if (result.success) {
      btn.textContent = '✓ SET';
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    } else {
      btn.textContent = 'FAILED — TRY AGAIN';
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    }
  } catch (e) {
    btn.textContent = 'FAILED — TRY AGAIN';
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
  }
}

async function getProfileVerdict() {
  const profile = {
    username: document.getElementById('p-username').value,
    niche: document.getElementById('p-niche').value,
    followers: document.getElementById('p-followers').value,
    views: document.getElementById('p-views').value,
    freq: document.getElementById('p-freq').value,
    goal: document.getElementById('p-goal').value,
  };
  const summary = Object.entries(profile).filter(function(e) { return e[1]; }).map(function(e) { return e[0] + ': ' + e[1]; }).join('\n');
  if (!summary) { alert('Fill in your profile first.'); return; }
  switchTab('boardroom');
  await sendToExecutive('Here is my complete creator profile:\n\n' + summary + '\n\nGive me a full boardroom analysis of where I stand and exactly what I need to do to reach my goal.');
}

async function requestScanVerdict() {
  const resultEl = document.getElementById('scan-result');
  resultEl.classList.add('hidden');
  resultEl.textContent = '';

  const input = document.getElementById('scan-manual-input').value.trim();
  if (!input) { alert('Describe your account first.'); return; }

  try {
    const verdict = await scanContent('manual', input);
    resultEl.textContent = verdict;
    resultEl.classList.remove('hidden');
  } catch (e) {
    alert('Connection failed. Try again.');
  }
}

async function requestQuickScan() {
  const niche = document.getElementById('qs-niche').value.trim();
  const followers = document.getElementById('qs-followers').value.trim();
  const views = document.getElementById('qs-views').value.trim();

  if (!niche || !followers || !views) {
    alert('Fill in all three fields.');
    return;
  }

  const resultEl = document.getElementById('quick-scan-result');
  resultEl.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/scan/quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, followers, views })
    });
    const data = await response.json();

    resultEl.innerHTML = `
      <div style="font-style: italic; margin-bottom: 12px;">${data.hook}</div>
      <button class="verdict-btn" onclick="enterBoardroomFromQuickScan('${niche.replace(/'/g, "\\'")}', '${followers.replace(/'/g, "\\'")}', '${views.replace(/'/g, "\\'")}')">ENTER THE BOARDROOM →</button>
    `;
    resultEl.classList.remove('hidden');
  } catch (e) {
    alert('Connection failed. Try again.');
  }
}

async function enterBoardroomFromQuickScan(niche, followers, views) {
  switchTab('boardroom');
  await sendToExecutive(`My niche is ${niche}, I have ${followers} followers, and average ${views} views per video. Give me the full boardroom analysis.`);
}

async function loadComputedScore() {
  const container = document.getElementById('score-categories');
  container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">Calculating your score...</div>';

  const data = await fetchScore();
  if (!data || data.error) {
    container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">Not enough data yet. Submit a scan to get scored.</div>';
    document.getElementById('score-total').textContent = '0';
    document.getElementById('score-fill').style.width = '0%';
    document.getElementById('score-label').textContent = 'NO DATA YET';
    return;
  }

  window.currentScoreData = data;

  document.getElementById('score-total').textContent = data.total;
  document.getElementById('score-fill').style.width = data.total + '%';
  const labelEl = document.getElementById('score-label');
  labelEl.textContent = data.label;
  const colors = { 'BOARDROOM ELITE': '#FFD700', 'EXECUTIVE TIER': '#D4AF37', 'JUNIOR EXEC': '#C0C0C0', 'NEEDS WORK': '#CD7F32', "YOU'RE FIRED": '#FF4444', 'NO DATA YET': '#888' };
  labelEl.style.color = colors[data.label] || '#888';

  const cats = [
    { key: 'consistency', label: 'CONSISTENCY', icon: '⏰' },
    { key: 'hooks', label: 'HOOK STRENGTH', icon: '🎣' },
    { key: 'engagement', label: 'ENGAGEMENT', icon: '💬' },
    { key: 'strategy', label: 'STRATEGY', icon: '🎯' },
  ];
  container.innerHTML = cats.map(c => `
    <div class="category-card">
      <div class="category-header">
        <span class="category-icon">${c.icon}</span>
        <span class="category-name">${c.label}</span>
        <span class="category-score">${data[c.key]}/25</span>
      </div>
    </div>
  `).join('');
}

async function getScoreVerdict() {
  const data = window.currentScoreData;
  if (!data) { alert('Load your score first.'); return; }
  switchTab('boardroom');
  await sendToExecutive(`My computed Executive Score is ${data.total}/100. Consistency: ${data.consistency}/25, Hooks: ${data.hooks}/25, Engagement: ${data.engagement}/25, Strategy: ${data.strategy}/25. What is my biggest weakness and what do I fix first?`);
}

function renderVerdicts() {
  const list = document.getElementById('verdicts-list');
  list.innerHTML = VERDICTS.map(function(v) {
    return '<div class="verdict-ruling" onclick="discussVerdict(\'' + v.title.replace(/'/g, "\\'") + '\')"><div class="verdict-icon-box">' + v.icon + '</div><div class="verdict-body"><div class="verdict-title">' + v.title + '</div><div class="verdict-desc">' + v.desc + '</div></div><div class="verdict-arrow">›</div></div>';
  }).join('');
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    await fetch(`${NOTIFICATIONS_BASE}/subscription-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status: 'failed' })
    }).catch(() => {});
    return;
  }

  try {
    const keyResponse = await fetch(`${NOTIFICATIONS_BASE}/vapid-key`);
    const { public_key } = await keyResponse.json();

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key),
    });

    await fetch(`${NOTIFICATIONS_BASE}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        subscription: subscription.toJSON(),
      })
    });

    await fetch(`${NOTIFICATIONS_BASE}/subscription-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status: 'success' })
    });

    console.log('Push notifications enabled');
  } catch (e) {
    console.log('Push subscription failed:', e);
    await fetch(`${NOTIFICATIONS_BASE}/subscription-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, status: 'failed' })
    }).catch(() => {});
  }
}

async function discussVerdict(title) {
  switchTab('boardroom');
  await sendToExecutive('Give me your executive ruling on: ' + title);
}

let userAccounts = [];
let hasMultiAccount = false;

async function loadAccountSwitcher() {
  const result = await getAccounts();
  hasMultiAccount = result.hasMultiAccount;
  userAccounts = result.accounts;

  if (!currentAccountId && userAccounts.length > 0) {
    currentAccountId = userAccounts[0].id;
  }

  renderAccountSwitcher();
}

function renderAccountSwitcher() {
  const container = document.getElementById('account-switcher');
  if (!container) return;

  container.classList.remove('hidden');

  const options = userAccounts.map(acc => {
    const active = acc.id === currentAccountId ? 'active' : '';
    return `
      <span class="account-pill-wrap">
        <button class="account-pill ${active}" onclick="switchAccount('${acc.id}')">${acc.label}</button>
        <button class="account-rename-x" onclick="handleRenameAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="Rename account">✎</button>
        <button class="account-delete-x" onclick="handleDeleteAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="Delete account">×</button>
      </span>
    `;
  }).join('');

  container.innerHTML = `
    ${options}
    <button class="account-pill account-add" onclick="handleAddAccount()">+ Add</button>
  `;
  renderSidebarAccounts();
}

async function handleAddAccount() {
  const label = prompt('Name this account (e.g. @yourhandle):');
  if (!label || !label.trim()) return;

  const result = await createAccount(label.trim());
  if (result.success) {
    await loadAccountSwitcher();
    switchAccount(result.account.id);
  } else {
    alert(result.detail || 'Could not add account.');
  }
}

async function switchAccount(accountId) {
  if (currentAutoAudio && !currentAutoAudio.paused) {
    currentAutoAudio.pause();
    currentAutoAudio.currentTime = 0;
  }
  currentAccountId = accountId;
  clearHistory();
  const messages = document.getElementById('messages');
  messages.innerHTML = '';
  messages.style.scrollBehavior = 'auto';
  renderAccountSwitcher();
  switchTab('boardroom');

  const history = await fetchChatHistory(accountId);
  if (history.length === 0) {
    addInitialMessage();
  } else {
    history.forEach(msg => {
      addMessage(msg.role, msg.content);
      conversationHistory.push({ role: msg.role, content: msg.content });
    });
  }
  messages.scrollTop = messages.scrollHeight;
  messages.style.scrollBehavior = '';
}

async function handleRenameAccount(accountId, currentLabel) {
  const newLabel = prompt('Rename account:', currentLabel);
  if (!newLabel || !newLabel.trim() || newLabel.trim() === currentLabel) return;

  const result = await renameAccount(accountId, newLabel.trim());
  if (result.success) {
    await loadAccountSwitcher();
  } else {
    alert(result.detail || 'Could not rename account.');
  }
}

async function handleDeleteAccount(accountId, label) {
  const confirmed = confirm(`Delete "${label}"? This removes its entire history permanently.`);
  if (!confirmed) return;

  const result = await deleteAccount(accountId);
  if (result.success) {
    if (currentAccountId === accountId) {
      currentAccountId = result.new_account ? result.new_account.id : null;
      await loadAccountSwitcher();
      switchAccount(currentAccountId);
    } else {
      await loadAccountSwitcher();
    }
  } else {
    alert(result.detail || 'Could not delete account.');
  }
}

function clearChat() {
  const confirmed = confirm('Clear this conversation? This cannot be undone.');
  if (!confirmed) return;

  clearHistory();
  document.getElementById('messages').innerHTML = '';
  addInitialMessage();
  const qp = document.getElementById('quick-prompts');
  if (qp) qp.style.display = 'flex';
}

function toggleSidebar() {
  document.getElementById('mobile-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('mobile-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function sidebarNavigate(tab) {
  switchTab(tab);
  closeSidebar();
}

function sidebarSwitchAccount(accountId) {
  switchAccount(accountId);
  closeSidebar();
}

function sidebarClearChat() {
  clearChat();
  closeSidebar();
}

function renderSidebarAccounts() {
  const container = document.getElementById('sidebar-accounts');
  if (!container) return;

  const rows = userAccounts.map(acc => {
    const active = acc.id === currentAccountId ? 'active' : '';
    return `
      <div class="sidebar-account-row ${active}">
        <button class="sidebar-account-name" onclick="sidebarSwitchAccount('${acc.id}')">${acc.label}</button>
        <button class="sidebar-account-icon" onclick="handleRenameAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="Rename">✎</button>
        <button class="sidebar-account-icon" onclick="handleDeleteAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="Delete">×</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sidebar-section-label">CHATS</div>
    ${rows}
    <button class="sidebar-add-account" onclick="handleAddAccount()">+ Add Account</button>
  `;
}

async function loadUsageDisplay() {
  const el = document.getElementById('usage-display');
  if (!el) return;

  const data = await fetchUsage();
  if (!data || data.error) {
    el.textContent = '';
    return;
  }

  if (data.is_paid) {
    el.innerHTML = `Daily usage: ${data.daily_cap - data.daily_remaining} / ${data.daily_cap} tokens today`;
  } else {
    el.innerHTML = `Daily: ${data.daily_cap - data.daily_remaining} / ${data.daily_cap} tokens today<br>Trial total: ${data.trial_cap - data.trial_remaining} / ${data.trial_cap} tokens used`;
  }
}

async function checkUsageWarning() {
  if (usageWarningShown) return;
  const data = await fetchUsage();
  if (!data || data.error) return;

  const usedPct = ((data.daily_cap - data.daily_remaining) / data.daily_cap) * 100;
  if (usedPct >= 80) {
    usageWarningShown = true;
    const banner = document.createElement('div');
    banner.className = 'verdict-tracking-prompt';
    banner.innerHTML = `<div class="tracking-message">⚠️ You're close to your daily token limit (${data.daily_cap - data.daily_remaining}/${data.daily_cap}). It resets at midnight UTC.</div>`;
    document.getElementById('messages').appendChild(banner);
    if (isNearBottom(document.getElementById('messages'))) {
      document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    }
  }
}

async function setLanguage(language) {
  const result = await setUserLanguage(language);
  if (result.success) {
    currentUser.language = language;
    localStorage.setItem('executive_user', JSON.stringify(currentUser));
    updateLanguageButtons();
    applyUITranslations();
  } else {
    alert(result.detail || 'Could not update language.');
  }
}

function updateLanguageButtons() {
  const lang = (currentUser && currentUser.language) || 'en';
  ['en', 'fr', 'pt'].forEach(code => {
    const btn = document.getElementById(`lang-${code}`);
    if (btn) btn.classList.toggle('active', code === lang);
  });
}