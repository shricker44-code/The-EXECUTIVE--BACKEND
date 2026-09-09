const API_BASE = 'https://the-executive-backend.onrender.com/api';
const NOTIFICATIONS_BASE = 'https://the-executive-backend.onrender.com/api/notifications';

const ACCOUNTS_BASE = 'https://the-executive-backend.onrender.com/api/accounts';

let currentAccountId = null;

async function getAccounts() {
  if (!currentUser) return { hasMultiAccount: false, accounts: [], defaultLabel: 'Default' };
  const response = await fetch(`${ACCOUNTS_BASE}/${currentUser.user_id}`);
  const data = await response.json();
  return {
    hasMultiAccount: data.has_multi_account || false,
    accounts: data.accounts || [],
    defaultLabel: data.default_label || 'Default'
  };
}

async function createAccount(label) {
  const response = await fetch(`${ACCOUNTS_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.user_id, label })
  });
  return await response.json();
}

async function deleteAccount(accountId) {
  const response = await fetch(`${ACCOUNTS_BASE}/${accountId}?user_id=${currentUser.user_id}`, {
    method: 'DELETE'
  });
  return await response.json();
}

let conversationHistory = [];
let currentUser = null;

// Device fingerprinting
async function getDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ];
  const raw = components.join('|');

  // Simple non-cryptographic hash (works over plain HTTP, unlike crypto.subtle)
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // convert to 32-bit int
  }
  return Math.abs(hash).toString(16);
}

async function signUp(email, password, firstName) {
  const fingerprint = await getDeviceFingerprint();
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      device_fingerprint: fingerprint,
    })
  });
  const data = await response.json();
  if (data.success) {
    currentUser = data;
    localStorage.setItem('executive_user', JSON.stringify(data));
  }
  return data;
}

async function signIn(email, password) {
  const fingerprint = await getDeviceFingerprint();
  const response = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      device_fingerprint: fingerprint,
    })
  });
  const data = await response.json();
  if (data.success) {
    currentUser = data;
    localStorage.setItem('executive_user', JSON.stringify(data));
  }
  return data;
}

async function checkSession(userId) {
  const fingerprint = await getDeviceFingerprint();
  const response = await fetch(`${API_BASE}/auth/check-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      device_fingerprint: fingerprint,
    })
  });
  return await response.json();
}

function loadUser() {
  const saved = localStorage.getItem('executive_user');
  if (saved) {
    currentUser = JSON.parse(saved);
  }
  return currentUser;
}

function signOut() {
  currentUser = null;
  localStorage.removeItem('executive_user');
  conversationHistory = [];
}

async function sendMessage(userMessage, onChunk) {
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });

   const body = { messages: conversationHistory };
  if (currentUser) body.user_id = currentUser.user_id;
  if (currentAccountId) body.account_id = currentAccountId;

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error('API request failed');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    fullText += chunkText;
    if (onChunk) onChunk(chunkText, fullText);
  }

  conversationHistory.push({
    role: 'assistant',
    content: fullText
  });

  return fullText;
}

async function updateDisplayName(newName) {
  const response = await fetch(`${API_BASE}/auth/update-name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUser.user_id,
      first_name: newName,
    })
  });
  const data = await response.json();
  if (data.success) {
    currentUser.first_name = data.first_name;
    localStorage.setItem('executive_user', JSON.stringify(currentUser));
  }
  return data;
}

async function generateSpeech(text) {
  if (!currentUser) return null;
  console.log('generateSpeech called, text length:', text.length);
  const response = await fetch(`${API_BASE}/chat/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      user_id: currentUser.user_id,
    })
  });
  const data = await response.json();
  console.log('generateSpeech response:', data);
  return data.audio;
}

async function scanContent(type, input) {
  const formData = new FormData();
  if (currentUser) formData.append('user_id', currentUser.user_id);
  if (currentAccountId) formData.append('account_id', currentAccountId);
  formData.append('manual_input', input);

  const response = await fetch(`${API_BASE}/scan/`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Scan failed');
  const data = await response.json();
  return data.verdict;
}

async function setCheckInTime(time) {
  if (!currentUser) return { success: false, error: 'Not signed in' };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const response = await fetch(`${NOTIFICATIONS_BASE}/set-checkin-time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUser.user_id,
      daily_report_time: time,
      timezone,
    })
  });

  return await response.json();
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

async function subscribeToPush() {
  if (!currentUser) return { success: false, error: 'Not signed in' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Push not supported on this device' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'Permission denied' };
  }

  const registration = await navigator.serviceWorker.ready;

  const keyResponse = await fetch(`${NOTIFICATIONS_BASE}/vapid-key`);
  const { public_key } = await keyResponse.json();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(public_key),
  });

  const response = await fetch(`${NOTIFICATIONS_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUser.user_id,
      subscription: subscription.toJSON(),
    })
  });

  return await response.json();
}

async function upgradeToBasePlan() {
  if (!currentUser) return;
  const response = await fetch(`${API_BASE}/billing/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.user_id })
  });
  const data = await response.json();
  if (data.checkout_url) {
    window.location.href = data.checkout_url;
  } else {
    alert('Could not start checkout. Try again.');
  }
}

async function fetchScore() {
  if (!currentUser) return null;
  const params = currentAccountId ? `?account_id=${currentAccountId}` : '';
  const response = await fetch(`${API_BASE}/score/${currentUser.user_id}${params}`);
  return await response.json();
}

function clearHistory() {
  conversationHistory = [];
}

async function renameDefaultAccount(newLabel) {
  const response = await fetch(`${ACCOUNTS_BASE}/default/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUser.user_id, label: newLabel })
  });
  return await response.json();
}

async function fetchChatHistory(accountId) {
  if (!currentUser) return [];
  const params = new URLSearchParams({ user_id: currentUser.user_id });
  if (accountId) params.append('account_id', accountId);
  const response = await fetch(`${API_BASE}/chat/history?${params}`);
  const data = await response.json();
  return data.messages || [];
}

async function fetchUsage() {
  if (!currentUser) return null;
  const response = await fetch(`${API_BASE}/chat/usage?user_id=${currentUser.user_id}`);
  return await response.json();
}