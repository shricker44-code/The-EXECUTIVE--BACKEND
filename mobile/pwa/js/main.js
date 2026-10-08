const VERDICTS = [
  { id: 'hook', icon: '📊' },
  { id: 'consistency', icon: '⏰' },
  { id: 'sound', icon: '🎵' },
  { id: 'engagement', icon: '💬' },
  { id: 'niche', icon: '🎯' },
  { id: 'numbers', icon: '📈' },
  { id: 'loop', icon: '🔁' },
  { id: 'monetization', icon: '💰' },
];

let currentTab = 'boardroom';
let isMuted = false;
let currentAutoAudio = new Audio();
let audioUnlocked = false;
let usageWarningShown = false;
let currentVolume = parseFloat(localStorage.getItem('executive_volume')) || 1.0;

const CAPCUT_SCREENSHOTS = {
  speed_ramp:            { file: 'speed_ramp.png',            caption: 'CapCut — Speed Ramp' },
  autocaptions:          { file: 'autocaptions.png',          caption: 'CapCut — Auto Captions' },
  keyframes_transitions: { file: 'keyframes_transitions.png', caption: 'CapCut — Keyframes & Transitions' },
  multitrack_chromakey:  { file: 'multitrack_chromakey.png',  caption: 'CapCut — Multi-track & Chroma Key' },
  templates:             { file: 'templates.png',             caption: 'CapCut — Templates' },
};

const EXAMPLE_ASSETS = {
  hook_before_after:      { file: 'hook_before_after.png',      caption: 'Before/After — Hook Rewrite' },
  caption_fix_example:    { file: 'caption_fix_example.png',    caption: 'Before/After — Caption Fix' },
  engagement_trend_chart: { file: 'engagement_trend_chart.png', caption: 'Engagement Trend — After Assignment' },
  posting_schedule_example: { file: 'posting_schedule_example.png', caption: 'Before/After — Posting Schedule' },
  niche_focus_example:    { file: 'niche_focus_example.png',    caption: 'Before/After — Niche Focus' },
};

function extractExampleAssetTag(text) {
  const match = text.match(/\[EXAMPLE_ASSET:(\w+)\]/);
  if (!match) return { text, tag: null };
  const cleanText = text.replace(match[0], '').replace(/\s+$/, '');
  return { text: cleanText, tag: match[1] };
}

function appendExampleAssetImage(bubbleEl, tag) {
  const info = EXAMPLE_ASSETS[tag];
  if (!info) return;
  const img = document.createElement('img');
  img.src = '/images/examples/' + info.file;
  img.alt = info.caption;
  img.className = 'capcut-screenshot';
  img.loading = 'lazy';
  bubbleEl.appendChild(img);
  const cap = document.createElement('div');
  cap.className = 'capcut-caption';
  cap.textContent = info.caption;
  bubbleEl.appendChild(cap);
}

function extractCapcutTag(text) {
  const match = text.match(/\[CAPCUT_SCREENSHOT:(\w+)\]/);
  if (!match) return { text, tag: null };
  const cleanText = text.replace(match[0], '').replace(/\s+$/, '');
  return { text: cleanText, tag: match[1] };
}

function appendCapcutImage(bubbleEl, tag) {
  const info = CAPCUT_SCREENSHOTS[tag];
  if (!info) return;
  const img = document.createElement('img');
  img.src = '/images/capcut/' + info.file;
  img.alt = info.caption;
  img.className = 'capcut-screenshot';
  img.loading = 'lazy';
  bubbleEl.appendChild(img);
  const cap = document.createElement('div');
  cap.className = 'capcut-caption';
  cap.textContent = info.caption;
  bubbleEl.appendChild(cap);
}

const UI_TRANSLATIONS = {
  en: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "Your TikTok Boardroom Advisor",
    "header-sub": "TIKTOK BOARDROOM ADVISOR",
    "typing-text": "The Executive is deliberating...",
    "quick-prompts-label": "PRESENT YOUR CASE",
    "qp-1": "Evaluate my content strategy",
    "qp-2": "Why aren't my views growing?",
    "qp-3": "What's my winning formula?",
    "qp-4": "How do I dominate my niche?",
    "qp-5": "Fire my worst habit",
    "qp-6": "Am I wasting my posting time?",
    "input-placeholder": "State your case to The Executive...",
    "nav-boardroom": "Boardroom",
    "nav-profile": "Profile",
    "nav-scan": "Scan",
    "nav-score": "Score",
    "nav-verdicts": "Verdicts",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "Clear Chat",
    "auth-title-signup": "THE EXECUTIVE",
    "auth-subtitle-signup": "YOUR 14-DAY TRIAL STARTS NOW",
    "auth-label-firstname": "FIRST NAME",
    "auth-placeholder-firstname": "Your first name",
    "auth-label-email": "EMAIL",
    "auth-label-password": "PASSWORD",
    "auth-submit-btn": "ENTER THE BOARDROOM",
    "auth-toggle-signup": "Already have an account? Sign in",
    "blocked-welcome-back": "WELCOME BACK",
    "blocked-signin-btn": "SIGN IN TO MY ACCOUNT",
    "blocked-upgrade-btn": "Upgrade to Executive Plan →",
    "profile-header-title": "CREATOR PROFILE",
    "profile-header-sub": "YOUR DOSSIER. THE EXECUTIVE NEEDS THE FACTS.",
    "field-plan": "EXECUTIVE PLAN",
    "upgrade-btn": "UPGRADE TO EXECUTIVE PLAN — $15/MO",
    "field-language": "LANGUAGE",
    "field-callyou": "WHAT SHOULD THE EXECUTIVE CALL YOU?",
    "ph-name": "Your name",
    "btn-update-name": "UPDATE NAME",
    "field-username": "TIKTOK USERNAME",
    "field-niche": "YOUR NICHE",
    "ph-niche": "e.g. fitness, comedy, cooking",
    "field-followers": "FOLLOWER COUNT",
    "field-views": "AVERAGE VIEWS",
    "field-freq": "POSTING FREQUENCY",
    "ph-freq": "e.g. 3x per week",
    "field-goal": "YOUR GOAL",
    "ph-goal": "e.g. reach 10k followers",
    "field-checkin": "DAILY CHECK-IN TIME",
    "btn-set-checkin": "SET REPORTING TIME",
    "btn-save-profile": "SAVE PROFILE",
    "btn-get-analysis": "GET MY EXECUTIVE ANALYSIS →",
    "btn-sign-out": "SIGN OUT",
    "scan-header-title": "CONTENT SCAN",
    "scan-header-sub": "SUBMIT YOUR CONTENT. RECEIVE THE VERDICT.",
    "scan-find-label": "📸 FIND YOUR TIKTOK ANALYTICS",
    "scan-instructions": "1. Open TikTok<br>2. Go to Profile<br>3. Tap the three lines (top right)<br>4. Tap Creator Tools<br>5. Tap Analytics<br>6. Screenshot the Overview tab<br>7. Upload it below",
    "scan-quick-label": "⚡ QUICK SCAN — GET AN INSTANT REACTION",
    "ph-follower-count": "Follower count",
    "ph-avg-views": "Average views",
    "btn-instant-reaction": "GET INSTANT REACTION",
    "scan-describe-label": "DESCRIBE YOUR ACCOUNT",
    "ph-describe-account": "Niche, followers, avg views, posting frequency, best post, what's flopping...",
    "btn-request-verdict": "REQUEST THE VERDICT",
    "score-header-title": "EXECUTIVE SCORE",
    "score-header-sub": "TRACK YOUR GROWTH. EARN YOUR RANK.",
    "btn-get-score-verdict": "GET VERDICT ON MY SCORE →",
    "verdicts-header-title": "THE EXECUTIVE'S RULINGS",
    "verdicts-header-sub": "TAP ANY RULING TO DISCUSS IN BOARDROOM",
    "usage-daily": "Daily usage: {used} / {cap} tokens today",
    "usage-daily-trial": "Daily: {used} / {cap} tokens today<br>Trial total: {trialUsed} / {trialCap} tokens used",
    "auth-submit-entering": "ENTERING...",
    "signup-failed-alert": "Sign up failed. Try again.",
    "connection-failed-alert": "Connection failed. Check your internet and try again.",
    "enter-email-password-alert": "Enter your email and password.",
    "signin-failed-alert": "Sign in failed. Check your credentials and try again.",
    "auth-title-welcome-back": "WELCOME BACK",
    "auth-subtitle-boardroom-waiting": "THE BOARDROOM IS WAITING",
    "auth-toggle-to-signup": "Need an account? Sign up",
    "auth-title-brand": "THE EXECUTIVE",
    "posted-question": "Have you posted since your last verdict?",
    "posted-yes": "Yes, I posted",
    "posted-no": "Not yet",
    "unmute-title": "Unmute voice",
    "mute-title": "Mute voice",
    "play-btn": "▶ Play",
    "voice-muted-alert": "Voice is muted. Unmute to hear The Executive.",
    "loading-btn": "Loading...",
    "playing-btn": "Playing...",
    "connection-failed-chat": "Connection failed. The Executive didn't get that — try again.",
    "profile-saved-alert": "Profile saved.",
    "enter-name-alert": "Enter a name first.",
    "update-name-updated": "Updated",
    "update-name-failed": "Failed",
    "pick-time-alert": "Pick a check-in time first.",
    "checkin-set": "Set",
    "fill-profile-alert": "Fill in your niche, followers, and views first.",
    "calculating-score": "Calculating your score...",
    "not-enough-data": "Not enough data yet. Fill in your profile to get scored.",
    "no-data-label": "NO DATA YET",
    "cat-consistency": "Consistency",
    "cat-hooks": "Hooks",
    "cat-engagement": "Engagement",
    "cat-strategy": "Strategy",
    "load-score-alert": "Could not load your score. Try again.",
    "rename-account-title": "Rename account",
    "account-add-btn": "+ Add account",
    "account-name-prompt": "Name this account",
    "account-add-failed": "Could not add account. Try again.",
    "rename-title": "Rename",
    "sidebar-chats-label": "ACCOUNTS",
    "sidebar-add-account": "+ Add account",
    "usage-warning": "You're at {used} / {cap} tokens today. Pace yourself.",
    "language-update-failed": "Could not update language. Try again.",
    "greeting-named": "{name}. Have a seat. I don't do small talk, so let's get right to it — tell me your niche, your numbers, and what's not working.",
    "greeting-anon": "Have a seat. I don't do small talk, so let's get right to it — tell me your niche, your numbers, and what's not working.",
    "account-delete-confirm": "Delete \"{label}\"? This only removes this account — your other accounts and your profile stay put.",
    "delete-account-title": "Delete account",
    "delete-title": "Delete",
    "account-rename-prompt": "Rename this account",
    "account-rename-failed": "Could not rename this account. Try again.",
    "account-delete-failed": "Could not delete this account. Try again.",
    "clear-chat-confirm": "Clear this chat? This cannot be undone.",
  },
  fr: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "Votre conseiller TikTok",
    "header-sub": "CONSEILLER TIKTOK",
    "typing-text": "The Executive délibère...",
    "quick-prompts-label": "PRÉSENTE TON DOSSIER",
    "qp-1": "Évalue ma stratégie de contenu",
    "qp-2": "Pourquoi mes vues ne progressent pas ?",
    "qp-3": "C'est quoi ma formule gagnante ?",
    "qp-4": "Comment dominer ma niche ?",
    "qp-5": "Vire ma pire habitude",
    "qp-6": "Est-ce que je gaspille mon temps de publication ?",
    "input-placeholder": "Présente ton dossier à The Executive...",
    "nav-boardroom": "Bureau",
    "nav-profile": "Profil",
    "nav-scan": "Scan",
    "nav-score": "Score",
    "nav-verdicts": "Verdicts",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "Effacer la conversation",
    "auth-title-signup": "THE EXECUTIVE",
    "auth-subtitle-signup": "TON ESSAI DE 14 JOURS COMMENCE MAINTENANT",
    "auth-label-firstname": "PRÉNOM",
    "auth-placeholder-firstname": "Ton prénom",
    "auth-label-email": "COURRIEL",
    "auth-label-password": "MOT DE PASSE",
    "auth-submit-btn": "ENTRE DANS LE BUREAU",
    "auth-toggle-signup": "Déjà un compte ? Connecte-toi",
    "blocked-welcome-back": "BON RETOUR",
    "blocked-signin-btn": "CONNECTE-TOI À MON COMPTE",
    "blocked-upgrade-btn": "Passer au plan Executive →",
    "profile-header-title": "PROFIL CRÉATEUR",
    "profile-header-sub": "TON DOSSIER. THE EXECUTIVE A BESOIN DES FAITS.",
    "field-plan": "PLAN EXECUTIVE",
    "upgrade-btn": "PASSER AU PLAN EXECUTIVE — 15$/MOIS",
    "field-language": "LANGUE",
    "field-callyou": "COMMENT THE EXECUTIVE DOIT-IL T'APPELER ?",
    "ph-name": "Ton nom",
    "btn-update-name": "METTRE À JOUR LE NOM",
    "field-username": "NOM D'UTILISATEUR TIKTOK",
    "field-niche": "TA NICHE",
    "ph-niche": "ex. fitness, humour, cuisine",
    "field-followers": "NOMBRE D'ABONNÉS",
    "field-views": "VUES MOYENNES",
    "field-freq": "FRÉQUENCE DE PUBLICATION",
    "ph-freq": "ex. 3x par semaine",
    "field-goal": "TON OBJECTIF",
    "ph-goal": "ex. atteindre 10k abonnés",
    "field-checkin": "HEURE DE POINT QUOTIDIEN",
    "btn-set-checkin": "DÉFINIR L'HEURE DE RAPPORT",
    "btn-save-profile": "ENREGISTRER LE PROFIL",
    "btn-get-analysis": "OBTENIR MON ANALYSE EXECUTIVE →",
    "btn-sign-out": "SE DÉCONNECTER",
    "scan-header-title": "ANALYSE DE CONTENU",
    "scan-header-sub": "SOUMETS TON CONTENU. REÇOIS LE VERDICT.",
    "scan-find-label": "📸 TROUVE TES ANALYTICS TIKTOK",
    "scan-instructions": "1. Ouvre TikTok<br>2. Va sur Profil<br>3. Touche les trois lignes (en haut à droite)<br>4. Touche Outils créateur<br>5. Touche Analytics<br>6. Capture l'onglet Aperçu<br>7. Téléverse-la ci-dessous",
    "scan-quick-label": "⚡ SCAN RAPIDE — OBTIENS UNE RÉACTION INSTANTANÉE",
    "ph-follower-count": "Nombre d'abonnés",
    "ph-avg-views": "Vues moyennes",
    "btn-instant-reaction": "OBTENIR UNE RÉACTION INSTANTANÉE",
    "scan-describe-label": "DÉCRIS TON COMPTE",
    "ph-describe-account": "Niche, abonnés, vues moyennes, fréquence de publication, meilleure publication, ce qui flop...",
    "btn-request-verdict": "DEMANDER LE VERDICT",
    "score-header-title": "SCORE EXECUTIVE",
    "score-header-sub": "SUIS TA CROISSANCE. GAGNE TON RANG.",
    "btn-get-score-verdict": "OBTENIR UN VERDICT SUR MON SCORE →",
    "verdicts-header-title": "LES JUGEMENTS DE THE EXECUTIVE",
    "verdicts-header-sub": "TOUCHE UN JUGEMENT POUR EN DISCUTER AU BUREAU",
    "usage-daily": "Utilisation quotidienne : {used} / {cap} tokens aujourd'hui",
    "usage-daily-trial": "Quotidien : {used} / {cap} tokens aujourd'hui<br>Total essai : {trialUsed} / {trialCap} tokens utilisés",
    "auth-submit-entering": "ENTRÉE...",
    "signup-failed-alert": "L'inscription a échoué. Réessaie.",
    "connection-failed-alert": "Connexion échouée. Vérifie ta connexion et réessaie.",
    "enter-email-password-alert": "Entre ton courriel et ton mot de passe.",
    "signin-failed-alert": "Connexion échouée. Vérifie tes identifiants et réessaie.",
    "auth-title-welcome-back": "BON RETOUR",
    "auth-subtitle-boardroom-waiting": "LE BUREAU T'ATTEND",
    "auth-toggle-to-signup": "Pas de compte ? Inscris-toi",
    "auth-title-brand": "THE EXECUTIVE",
    "posted-question": "As-tu publié depuis ton dernier jugement ?",
    "posted-yes": "Oui, j'ai publié",
    "posted-no": "Pas encore",
    "unmute-title": "Réactiver le son",
    "mute-title": "Couper le son",
    "play-btn": "▶ Écouter",
    "voice-muted-alert": "Le son est coupé. Réactive-le pour entendre The Executive.",
    "loading-btn": "Chargement...",
    "playing-btn": "Lecture...",
    "connection-failed-chat": "Connexion échouée. The Executive n'a pas reçu ça — réessaie.",
    "profile-saved-alert": "Profil enregistré.",
    "enter-name-alert": "Entre d'abord un nom.",
    "update-name-updated": "Mis à jour",
    "update-name-failed": "Échec",
    "pick-time-alert": "Choisis d'abord une heure de point.",
    "checkin-set": "Défini",
    "fill-profile-alert": "Remplis d'abord ta niche, tes abonnés et tes vues.",
    "calculating-score": "Calcul de ton score...",
    "not-enough-data": "Pas encore assez de données. Remplis ton profil pour obtenir un score.",
    "no-data-label": "AUCUNE DONNÉE",
    "cat-consistency": "Constance",
    "cat-hooks": "Accroches",
    "cat-engagement": "Engagement",
    "cat-strategy": "Stratégie",
    "load-score-alert": "Impossible de charger ton score. Réessaie.",
    "rename-account-title": "Renommer le compte",
    "account-add-btn": "+ Ajouter un compte",
    "account-name-prompt": "Nomme ce compte",
    "account-add-failed": "Impossible d'ajouter le compte. Réessaie.",
    "rename-title": "Renommer",
    "sidebar-chats-label": "COMPTES",
    "sidebar-add-account": "+ Ajouter un compte",
    "usage-warning": "Tu es à {used} / {cap} tokens aujourd'hui. Gère ton rythme.",
    "language-update-failed": "Impossible de mettre à jour la langue. Réessaie.",
    "greeting-named": "{name}. Assieds-toi. Je ne fais pas de bavardage, alors allons droit au but — dis-moi ta niche, tes chiffres, et ce qui ne marche pas.",
    "greeting-anon": "Assieds-toi. Je ne fais pas de bavardage, alors allons droit au but — dis-moi ta niche, tes chiffres, et ce qui ne marche pas.",
    "account-delete-confirm": "Supprimer « {label} » ? Cela ne supprime que ce compte — tes autres comptes et ton profil restent intacts.",
    "delete-account-title": "Supprimer le compte",
    "delete-title": "Supprimer",
    "account-rename-prompt": "Renommer ce compte",
    "account-rename-failed": "Impossible de renommer ce compte. Réessaie.",
    "account-delete-failed": "Impossible de supprimer ce compte. Réessaie.",
    "clear-chat-confirm": "Effacer cette conversation ? Cette action est irréversible.",
  },
  pt: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "Seu conselheiro do TikTok",
    "header-sub": "CONSELHEIRO DO TIKTOK",
    "typing-text": "The Executive está deliberando...",
    "quick-prompts-label": "APRESENTE SEU CASO",
    "qp-1": "Avalie minha estratégia de conteúdo",
    "qp-2": "Por que minhas visualizações não crescem?",
    "qp-3": "Qual é minha fórmula vencedora?",
    "qp-4": "Como domino meu nicho?",
    "qp-5": "Demita meu pior hábito",
    "qp-6": "Estou desperdiçando meu tempo de postagem?",
    "input-placeholder": "Apresente seu caso a The Executive...",
    "nav-boardroom": "Escritório",
    "nav-profile": "Perfil",
    "nav-scan": "Scan",
    "nav-score": "Score",
    "nav-verdicts": "Vereditos",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "Limpar conversa",
    "auth-title-signup": "THE EXECUTIVE",
    "auth-subtitle-signup": "SEU TESTE DE 14 DIAS COMEÇA AGORA",
    "auth-label-firstname": "PRIMEIRO NOME",
    "auth-placeholder-firstname": "Seu primeiro nome",
    "auth-label-email": "EMAIL",
    "auth-label-password": "SENHA",
    "auth-submit-btn": "ENTRE NO ESCRITÓRIO",
    "auth-toggle-signup": "Já tem uma conta? Entre",
    "blocked-welcome-back": "BEM-VINDO DE VOLTA",
    "blocked-signin-btn": "ENTRAR NA MINHA CONTA",
    "blocked-upgrade-btn": "Fazer upgrade para o plano Executive →",
    "profile-header-title": "PERFIL DO CRIADOR",
    "profile-header-sub": "SEU DOSSIÊ. THE EXECUTIVE PRECISA DOS FATOS.",
    "field-plan": "PLANO EXECUTIVE",
    "upgrade-btn": "FAZER UPGRADE PARA O PLANO EXECUTIVE — $15/MÊS",
    "field-language": "IDIOMA",
    "field-callyou": "COMO THE EXECUTIVE DEVE TE CHAMAR?",
    "ph-name": "Seu nome",
    "btn-update-name": "ATUALIZAR NOME",
    "field-username": "USUÁRIO DO TIKTOK",
    "field-niche": "SEU NICHO",
    "ph-niche": "ex. fitness, comédia, culinária",
    "field-followers": "NÚMERO DE SEGUIDORES",
    "field-views": "VISUALIZAÇÕES MÉDIAS",
    "field-freq": "FREQUÊNCIA DE POSTAGEM",
    "ph-freq": "ex. 3x por semana",
    "field-goal": "SEU OBJETIVO",
    "ph-goal": "ex. alcançar 10 mil seguidores",
    "field-checkin": "HORÁRIO DE CHECK-IN DIÁRIO",
    "btn-set-checkin": "DEFINIR HORÁRIO DE RELATÓRIO",
    "btn-save-profile": "SALVAR PERFIL",
    "btn-get-analysis": "OBTER MINHA ANÁLISE EXECUTIVE →",
    "btn-sign-out": "SAIR DA CONTA",
    "scan-header-title": "ANÁLISE DE CONTEÚDO",
    "scan-header-sub": "ENVIE SEU CONTEÚDO. RECEBA O VEREDITO.",
    "scan-find-label": "📸 ENCONTRE SEUS ANALYTICS DO TIKTOK",
    "scan-instructions": "1. Abra o TikTok<br>2. Vá em Perfil<br>3. Toque nas três linhas (canto superior direito)<br>4. Toque em Ferramentas do Criador<br>5. Toque em Analytics<br>6. Capture a aba Visão Geral<br>7. Envie abaixo",
    "scan-quick-label": "⚡ SCAN RÁPIDO — RECEBA UMA REAÇÃO INSTANTÂNEA",
    "ph-follower-count": "Número de seguidores",
    "ph-avg-views": "Visualizações médias",
    "btn-instant-reaction": "OBTER REAÇÃO INSTANTÂNEA",
    "scan-describe-label": "DESCREVA SUA CONTA",
    "ph-describe-account": "Nicho, seguidores, visualizações médias, frequência de postagem, melhor postagem, o que não está funcionando...",
    "btn-request-verdict": "SOLICITAR O VEREDITO",
    "score-header-title": "SCORE EXECUTIVE",
    "score-header-sub": "ACOMPANHE SEU CRESCIMENTO. GANHE SEU RANK.",
    "btn-get-score-verdict": "OBTER VEREDITO SOBRE MEU SCORE →",
    "verdicts-header-title": "OS VEREDITOS DE THE EXECUTIVE",
    "verdicts-header-sub": "TOQUE EM QUALQUER VEREDITO PARA DISCUTIR NO ESCRITÓRIO",
    "usage-daily": "Uso diário: {used} / {cap} tokens hoje",
    "usage-daily-trial": "Diário: {used} / {cap} tokens hoje<br>Total do teste: {trialUsed} / {trialCap} tokens usados",
    "auth-submit-entering": "ENTRANDO...",
    "signup-failed-alert": "Falha no cadastro. Tente novamente.",
    "connection-failed-alert": "Falha na conexão. Verifique sua internet e tente novamente.",
    "enter-email-password-alert": "Digite seu email e senha.",
    "signin-failed-alert": "Falha ao entrar. Verifique suas credenciais e tente novamente.",
    "auth-title-welcome-back": "BEM-VINDO DE VOLTA",
    "auth-subtitle-boardroom-waiting": "O ESCRITÓRIO ESTÁ ESPERANDO",
    "auth-toggle-to-signup": "Não tem conta? Cadastre-se",
    "auth-title-brand": "THE EXECUTIVE",
    "posted-question": "Você postou desde seu último veredito?",
    "posted-yes": "Sim, eu postei",
    "posted-no": "Ainda não",
    "unmute-title": "Ativar som",
    "mute-title": "Silenciar",
    "play-btn": "▶ Ouvir",
    "voice-muted-alert": "O som está desativado. Ative para ouvir The Executive.",
    "loading-btn": "Carregando...",
    "playing-btn": "Reproduzindo...",
    "connection-failed-chat": "Falha na conexão. The Executive não recebeu isso — tente novamente.",
    "profile-saved-alert": "Perfil salvo.",
    "enter-name-alert": "Digite um nome primeiro.",
    "update-name-updated": "Atualizado",
    "update-name-failed": "Falhou",
    "pick-time-alert": "Escolha um horário de check-in primeiro.",
    "checkin-set": "Definido",
    "fill-profile-alert": "Preencha seu nicho, seguidores e visualizações primeiro.",
    "calculating-score": "Calculando seu score...",
    "not-enough-data": "Ainda não há dados suficientes. Preencha seu perfil para receber um score.",
    "no-data-label": "SEM DADOS AINDA",
    "cat-consistency": "Consistência",
    "cat-hooks": "Ganchos",
    "cat-engagement": "Engajamento",
    "cat-strategy": "Estratégia",
    "load-score-alert": "Não foi possível carregar seu score. Tente novamente.",
    "rename-account-title": "Renomear conta",
    "account-add-btn": "+ Adicionar conta",
    "account-name-prompt": "Nomeie esta conta",
    "account-add-failed": "Não foi possível adicionar a conta. Tente novamente.",
    "rename-title": "Renomear",
    "sidebar-chats-label": "CONTAS",
    "sidebar-add-account": "+ Adicionar conta",
    "usage-warning": "Você está em {used} / {cap} tokens hoje. Controle seu ritmo.",
    "language-update-failed": "Não foi possível atualizar o idioma. Tente novamente.",
    "greeting-named": "{name}. Sente-se. Não perco tempo com conversa fiada, então vamos direto ao ponto — me diga seu nicho, seus números, e o que não está funcionando.",
    "greeting-anon": "Sente-se. Não perco tempo com conversa fiada, então vamos direto ao ponto — me diga seu nicho, seus números, e o que não está funcionando.",
    "account-delete-confirm": "Excluir \"{label}\"? Isso remove apenas esta conta — suas outras contas e seu perfil continuam intactos.",
    "delete-account-title": "Excluir conta",
    "delete-title": "Excluir",
    "account-rename-prompt": "Renomear esta conta",
    "account-rename-failed": "Não foi possível renomear esta conta. Tente novamente.",
    "account-delete-failed": "Não foi possível excluir esta conta. Tente novamente.",
    "clear-chat-confirm": "Limpar esta conversa? Isso não pode ser desfeito.",
  },
  hi: {
    "splash-title": "THE EXECUTIVE",
    "splash-sub": "आपका TikTok बोर्डरूम सलाहकार",
    "header-sub": "TIKTOK बोर्डरूम सलाहकार",
    "typing-text": "द एग्ज़िक्यूटिव विचार कर रहे हैं...",
    "quick-prompts-label": "अपना मामला पेश करें",
    "qp-1": "मेरी कंटेंट स्ट्रैटेजी का मूल्यांकन करें",
    "qp-2": "मेरे व्यूज़ क्यों नहीं बढ़ रहे?",
    "qp-3": "मेरा विनिंग फॉर्मूला क्या है?",
    "qp-4": "मैं अपने niche में कैसे हावी हो सकता हूं?",
    "qp-5": "मेरी सबसे खराब आदत निकालो",
    "qp-6": "क्या मैं अपना पोस्टिंग समय बर्बाद कर रहा हूं?",
    "input-placeholder": "द एग्ज़िक्यूटिव को अपना मामला बताएं...",
    "nav-boardroom": "बोर्डरूम",
    "nav-profile": "प्रोफाइल",
    "nav-scan": "स्कैन",
    "nav-score": "स्कोर",
    "nav-verdicts": "फैसले",
    "sidebar-title": "THE EXECUTIVE",
    "sidebar-clear-chat": "चैट साफ़ करें",
    "auth-title-signup": "THE EXECUTIVE",
    "auth-subtitle-signup": "आपका 14-दिन का ट्रायल अभी शुरू होता है",
    "auth-label-firstname": "पहला नाम",
    "auth-placeholder-firstname": "आपका पहला नाम",
    "auth-label-email": "ईमेल",
    "auth-label-password": "पासवर्ड",
    "auth-submit-btn": "बोर्डरूम में प्रवेश करें",
    "auth-toggle-signup": "पहले से खाता है? साइन इन करें",
    "blocked-welcome-back": "वापसी पर स्वागत है",
    "blocked-signin-btn": "मेरे खाते में साइन इन करें",
    "blocked-upgrade-btn": "एग्ज़िक्यूटिव प्लान में अपग्रेड करें →",
    "profile-header-title": "क्रिएटर प्रोफाइल",
    "profile-header-sub": "आपकी फाइल। एग्ज़िक्यूटिव को तथ्य चाहिए।",
    "field-plan": "एग्ज़िक्यूटिव प्लान",
    "upgrade-btn": "एग्ज़िक्यूटिव प्लान में अपग्रेड करें — $15/माह",
    "field-language": "भाषा",
    "field-callyou": "एग्ज़िक्यूटिव आपको क्या कहकर बुलाए?",
    "ph-name": "आपका नाम",
    "btn-update-name": "नाम अपडेट करें",
    "field-username": "TIKTOK यूज़रनेम",
    "field-niche": "आपकी niche",
    "ph-niche": "जैसे फिटनेस, कॉमेडी, कुकिंग",
    "field-followers": "फॉलोवर संख्या",
    "field-views": "औसत व्यूज़",
    "field-freq": "पोस्टिंग फ्रीक्वेंसी",
    "ph-freq": "जैसे सप्ताह में 3 बार",
    "field-goal": "आपका लक्ष्य",
    "ph-goal": "जैसे 10k फॉलोवर तक पहुंचना",
    "field-checkin": "डेली चेक-इन समय",
    "btn-set-checkin": "रिपोर्टिंग समय सेट करें",
    "btn-save-profile": "प्रोफाइल सेव करें",
    "btn-get-analysis": "मेरा एग्ज़िक्यूटिव विश्लेषण पाएं →",
    "btn-sign-out": "साइन आउट",
    "scan-header-title": "कंटेंट स्कैन",
    "scan-header-sub": "अपना कंटेंट सबमिट करें। फैसला पाएं।",
    "scan-find-label": "📸 अपनी TikTok एनालिटिक्स खोजें",
    "scan-instructions": "1. TikTok खोलें<br>2. प्रोफाइल पर जाएं<br>3. तीन लाइनों पर टैप करें (ऊपर दाईं ओर)<br>4. क्रिएटर टूल्स पर टैप करें<br>5. एनालिटिक्स पर टैप करें<br>6. ओवरव्यू टैब का स्क्रीनशॉट लें<br>7. नीचे अपलोड करें",
    "scan-quick-label": "⚡ क्विक स्कैन — तुरंत प्रतिक्रिया पाएं",
    "ph-follower-count": "फॉलोवर संख्या",
    "ph-avg-views": "औसत व्यूज़",
    "btn-instant-reaction": "तुरंत प्रतिक्रिया पाएं",
    "scan-describe-label": "अपना खाता बताएं",
    "ph-describe-account": "niche, फॉलोवर, औसत व्यूज़, पोस्टिंग फ्रीक्वेंसी, सबसे अच्छी पोस्ट, क्या फ्लॉप हो रहा है...",
    "btn-request-verdict": "फैसला मांगें",
    "score-header-title": "एग्ज़िक्यूटिव स्कोर",
    "score-header-sub": "अपनी ग्रोथ ट्रैक करें। अपनी रैंक कमाएं।",
    "btn-get-score-verdict": "मेरे स्कोर पर फैसला पाएं →",
    "verdicts-header-title": "एग्ज़िक्यूटिव के फैसले",
    "verdicts-header-sub": "बोर्डरूम में चर्चा करने के लिए किसी भी फैसले पर टैप करें",
    "greeting-named": "{name}। बैठिए। मैं फ़ालतू बातें नहीं करता, तो सीधे मुद्दे पर आते हैं — अपनी niche, अपने नंबर, और क्या काम नहीं कर रहा है, मुझे बताइए।",
    "greeting-anon": "बैठिए। मैं फ़ालतू बातें नहीं करता, तो सीधे मुद्दे पर आते हैं — अपनी niche, अपने नंबर, और क्या काम नहीं कर रहा है, मुझे बताइए।",
    "account-delete-confirm": "\"{label}\" को हटाएं? इससे केवल यह अकाउंट हटेगा — आपके बाकी अकाउंट और प्रोफाइल सुरक्षित रहेंगे।",
    "delete-account-title": "अकाउंट हटाएं",
    "delete-title": "हटाएं",
    "account-rename-prompt": "इस अकाउंट का नाम बदलें",
    "account-rename-failed": "इस अकाउंट का नाम नहीं बदला जा सका। फिर से कोशिश करें।",
    "account-delete-failed": "इस अकाउंट को हटाया नहीं जा सका। फिर से कोशिश करें।",
    "clear-chat-confirm": "यह चैट साफ़ करें? इसे वापस नहीं किया जा सकता।",
    "usage-daily": "आज का उपयोग: {used} / {cap} tokens",
    "usage-daily-trial": "आज: {used} / {cap} tokens<br>कुल ट्रायल: {trialUsed} / {trialCap} tokens इस्तेमाल हुए",
    "auth-submit-entering": "प्रवेश हो रहा है...",
    "signup-failed-alert": "साइन अप विफल रहा। फिर से कोशिश करें।",
    "connection-failed-alert": "कनेक्शन विफल रहा। अपना इंटरनेट जांचें और फिर से कोशिश करें।",
    "enter-email-password-alert": "अपना ईमेल और पासवर्ड डालें।",
    "signin-failed-alert": "साइन इन विफल रहा। अपनी जानकारी जांचें और फिर से कोशिश करें।",
    "auth-title-welcome-back": "वापसी पर स्वागत है",
    "auth-subtitle-boardroom-waiting": "बोर्डरूम इंतज़ार कर रहा है",
    "auth-toggle-to-signup": "अकाउंट नहीं है? साइन अप करें",
    "auth-title-brand": "THE EXECUTIVE",
    "posted-question": "क्या आपने अपने पिछले फैसले के बाद पोस्ट किया?",
    "posted-yes": "हां, मैंने पोस्ट किया",
    "posted-no": "अभी नहीं",
    "unmute-title": "आवाज़ चालू करें",
    "mute-title": "आवाज़ बंद करें",
    "play-btn": "▶ सुनें",
    "voice-muted-alert": "आवाज़ बंद है। द एग्ज़िक्यूटिव को सुनने के लिए इसे चालू करें।",
    "loading-btn": "लोड हो रहा है...",
    "playing-btn": "चल रहा है...",
    "connection-failed-chat": "कनेक्शन विफल रहा। द एग्ज़िक्यूटिव को यह नहीं मिला — फिर से कोशिश करें।",
    "profile-saved-alert": "प्रोफाइल सेव हो गई।",
    "enter-name-alert": "पहले एक नाम डालें।",
    "update-name-updated": "अपडेट हो गया",
    "update-name-failed": "विफल",
    "pick-time-alert": "पहले चेक-इन समय चुनें।",
    "checkin-set": "सेट हो गया",
    "fill-profile-alert": "पहले अपनी niche, फॉलोवर और व्यूज़ भरें।",
    "calculating-score": "आपका स्कोर गणना हो रहा है...",
    "not-enough-data": "अभी पर्याप्त डेटा नहीं है। स्कोर पाने के लिए अपनी प्रोफाइल भरें।",
    "no-data-label": "अभी तक कोई डेटा नहीं",
    "cat-consistency": "निरंतरता",
    "cat-hooks": "हुक्स",
    "cat-engagement": "इंगेजमेंट",
    "cat-strategy": "स्ट्रैटेजी",
    "load-score-alert": "आपका स्कोर लोड नहीं हो सका। फिर से कोशिश करें।",
    "rename-account-title": "अकाउंट का नाम बदलें",
    "account-add-btn": "+ अकाउंट जोड़ें",
    "account-name-prompt": "इस अकाउंट का नाम दें",
    "account-add-failed": "अकाउंट जोड़ा नहीं जा सका। फिर से कोशिश करें।",
    "rename-title": "नाम बदलें",
    "sidebar-chats-label": "अकाउंट्स",
    "sidebar-add-account": "+ अकाउंट जोड़ें",
    "usage-warning": "आज आप {used} / {cap} tokens पर हैं। अपनी गति संभालें।",
    "language-update-failed": "भाषा अपडेट नहीं हो सकी। फिर से कोशिश करें।",
  },
};

const VERDICT_TRANSLATIONS = {
  en: {
    hook: { title: "THE HOOK VERDICT", desc: "3 seconds. That's all you get. If your opener doesn't stop the scroll, you're finished before you started." },
    consistency: { title: "THE CONSISTENCY DECREE", desc: "3-5 posts per week, minimum. Treat it like showing up to work. No excuses, no exceptions." },
    sound: { title: "THE SOUND STRATEGY", desc: "Use trending sounds on the RISE, not the peak. Early movers win. Late movers get buried." },
    engagement: { title: "THE ENGAGEMENT RULE", desc: "Reply to every comment in the first 60 minutes. Non-negotiable. This is your job now." },
    niche: { title: "THE NICHE DIRECTIVE", desc: "Pick 3 content pillars and own them. Scattered creators lose. Focused creators win. Period." },
    numbers: { title: "THE NUMBERS BOARDROOM", desc: "Watch your completion rate above everything. If they're not finishing your video, you're fired." },
    loop: { title: "THE LOOP RULING", desc: "Videos that loop seamlessly get rewatched. Boost your completion rate. Engineer the loop." },
    monetization: { title: "THE MONETIZATION VERDICT", desc: "Views don't pay bills. Conversions do. Every video needs a purpose beyond the view count." },
  },
  fr: {
    hook: { title: "LE VERDICT DE L'ACCROCHE", desc: "3 secondes. C'est tout ce que tu as. Si ton ouverture n'arrête pas le défilement, c'est fini avant même d'avoir commencé." },
    consistency: { title: "LE DÉCRET DE CONSTANCE", desc: "3 à 5 publications par semaine, minimum. Traite ça comme un emploi. Aucune excuse, aucune exception." },
    sound: { title: "LA STRATÉGIE SONORE", desc: "Utilise les sons tendance EN MONTÉE, pas au sommet. Les premiers arrivés gagnent. Les retardataires sont enterrés." },
    engagement: { title: "LA RÈGLE D'ENGAGEMENT", desc: "Réponds à chaque commentaire dans les 60 premières minutes. Non négociable. C'est ton travail maintenant." },
    niche: { title: "LA DIRECTIVE DE NICHE", desc: "Choisis 3 piliers de contenu et maîtrise-les. Les créateurs dispersés perdent. Les créateurs concentrés gagnent. Point final." },
    numbers: { title: "LE BUREAU DES CHIFFRES", desc: "Surveille ton taux de complétion avant tout. Si les gens ne terminent pas ta vidéo, tu es renvoyé." },
    loop: { title: "LE JUGEMENT DE LA BOUCLE", desc: "Les vidéos qui bouclent parfaitement sont revisionnées. Augmente ton taux de complétion. Conçois la boucle." },
    monetization: { title: "LE VERDICT DE MONÉTISATION", desc: "Les vues ne paient pas les factures. Les conversions, oui. Chaque vidéo doit avoir un but au-delà du nombre de vues." },
  },
  pt: {
    hook: { title: "O VEREDITO DO GANCHO", desc: "3 segundos. É só isso que você tem. Se sua abertura não parar a rolagem, você já perdeu antes de começar." },
    consistency: { title: "O DECRETO DA CONSISTÊNCIA", desc: "3 a 5 posts por semana, no mínimo. Trate como ir ao trabalho. Sem desculpas, sem exceções." },
    sound: { title: "A ESTRATÉGIA DE SOM", desc: "Use sons em ALTA, não no pico. Quem entra cedo ganha. Quem entra tarde é enterrado." },
    engagement: { title: "A REGRA DE ENGAJAMENTO", desc: "Responda a todo comentário nos primeiros 60 minutos. Inegociável. Este é seu trabalho agora." },
    niche: { title: "A DIRETRIZ DE NICHO", desc: "Escolha 3 pilares de conteúdo e domine-os. Criadores dispersos perdem. Criadores focados ganham. Ponto final." },
    numbers: { title: "O ESCRITÓRIO DOS NÚMEROS", desc: "Observe sua taxa de conclusão acima de tudo. Se não estão terminando seu vídeo, você está demitido." },
    loop: { title: "O JULGAMENTO DO LOOP", desc: "Vídeos que fazem loop perfeito são revistos. Aumente sua taxa de conclusão. Projete o loop." },
    monetization: { title: "O VEREDITO DA MONETIZAÇÃO", desc: "Visualizações não pagam contas. Conversões, sim. Todo vídeo precisa de um propósito além da contagem de views." },
  },
    hi: {
    hook: { title: "द हुक वर्डिक्ट", desc: "3 सेकंड। बस इतना ही मिलता है। अगर आपकी शुरुआत स्क्रॉल नहीं रोकती, तो शुरू होने से पहले ही खेल खत्म।" },
    consistency: { title: "द कंसिस्टेंसी डिक्री", desc: "हफ्ते में कम से कम 3-5 पोस्ट। इसे काम पर जाने जैसा समझें। कोई बहाना नहीं, कोई छूट नहीं।" },
    sound: { title: "द साउंड स्ट्रैटेजी", desc: "ट्रेंडिंग साउंड्स को उभरते समय इस्तेमाल करें, पीक पर नहीं। जल्दी शुरू करने वाले जीतते हैं। देर करने वाले दब जाते हैं।" },
    engagement: { title: "द इंगेजमेंट रूल", desc: "पहले 60 मिनट में हर कमेंट का जवाब दें। कोई समझौता नहीं। यही अब आपका काम है।" },
    niche: { title: "द निच डायरेक्टिव", desc: "3 कंटेंट पिलर चुनें और उन पर हावी हों। बिखरे हुए क्रिएटर हारते हैं। फोकस्ड क्रिएटर जीतते हैं। बस।" },
    numbers: { title: "द नंबर्स बोर्डरूम", desc: "सबसे पहले अपना कंप्लीशन रेट देखें। अगर लोग आपकी वीडियो पूरी नहीं देख रहे, तो आप फायर हैं।" },
    loop: { title: "द लूप रूलिंग", desc: "जो वीडियो सहजता से लूप होती हैं, उन्हें बार-बार देखा जाता है। अपना कंप्लीशन रेट बढ़ाएं। लूप डिज़ाइन करें।" },
    monetization: { title: "द मोनेटाइजेशन वर्डिक्ट", desc: "व्यूज़ बिल नहीं भरते। कन्वर्जन भरते हैं। हर वीडियो का व्यू काउंट से आगे एक मकसद होना चाहिए।" },
  },
};

function getLang() {
  return (currentUser && currentUser.language) || 'en';
}

function t(key, vars) {
  const dict = UI_TRANSLATIONS[getLang()] || UI_TRANSLATIONS.en;
  let str = dict[key] !== undefined ? dict[key] : (UI_TRANSLATIONS.en[key] !== undefined ? UI_TRANSLATIONS.en[key] : key);
  if (vars) {
    Object.keys(vars).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return str;
}

function applyUITranslations() {
  const lang = getLang();
  const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.id === 'score-label' && window.currentScoreData) return; // already showing a live score label
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key]) el.innerHTML = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key]) el.title = dict[key];
  });

  renderVerdicts();
  renderAccountSwitcher();
  renderSidebarAccounts();
}

window.addEventListener('load', () => {
  renderVerdicts();
  loadDisplayName();
  playSplashThenInit();
  const volSlider = document.getElementById('volume-slider');
  if (volSlider) volSlider.value = currentVolume;
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
  currentAutoAudio.volume = currentVolume;
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

let pendingAppUser = null;
let questionnaireEditMode = false;

async function showApp(user) {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('blocked-screen').classList.add('hidden');

  if (user && user.user_id) {
    // signin already tells us this - skip the extra round trip when it's present.
    // Cached sessions from before this field existed fall through to the status check below.
    if (user.questionnaire_completed === true) {
      enterApp(user);
      return;
    }

    try {
      const status = (user.questionnaire_completed === false)
        ? { completed: false }
        : await checkQuestionnaireStatus(user.user_id);
      if (status && !status.completed) {
        pendingAppUser = user;
        questionnaireEditMode = false;
        showQuestionnaireScreen(status);
        return;
      }
    } catch (e) {
      console.log('Questionnaire status check failed, letting them in:', e);
    }
  }

  enterApp(user);
}

function enterApp(user) {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('blocked-screen').classList.add('hidden');
  document.getElementById('questionnaire-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  updateUpgradeButtonVisibility();
  applyUITranslations();
  applyTheme(user.theme);
  if (user && user.user_id) {
    subscribeToPush(user.user_id);
    startSessionCheck(user.user_id);
    initAccountsAndHistory();
    checkUpgradePopup();
    loadProfileFromQuestionnaireStatus();
  }
}

// --- Onboarding questionnaire ---------------------------------------------
// Required, static (no AI call) screen shown once between signup/signin and
// the boardroom. Answers personalize every verdict from message one, and
// replace manual Profile-tab data entry (those fields become read-only
// displays of what's captured here, or by screenshot upload later).

const QUESTIONNAIRE_NICHES = [
  'Fitness', 'Beauty', 'Food', 'Finance', 'Fashion', 'Gaming',
  'Education', 'Lifestyle', 'Motivation/Business', 'Entertainment/Comedy', 'AI Content Creator'
];

const QUESTIONNAIRE_STYLE_OPTIONS = [
  { value: 'funny_meme', label: 'Funny / meme' },
  { value: 'raw_relatable', label: 'Raw & relatable' },
  { value: 'polished_aesthetic', label: 'Polished / aesthetic' },
  { value: 'educational_expert', label: 'Educational / expert' },
  { value: 'high_energy_motivational', label: 'High-energy / motivational' },
];

const QUESTIONNAIRE_CHALLENGE_OPTIONS = [
  { value: 'views_not_growing', label: 'Views not growing' },
  { value: 'dont_know_what_to_post', label: "Don't know what to post" },
  { value: 'engagement_low', label: 'Engagement is low' },
  { value: 'cant_stay_consistent', label: "Can't stay consistent" },
  { value: 'just_starting_out', label: 'Just starting out' },
];

const QUESTIONNAIRE_GOAL_OPTIONS = [
  { value: 'follower_milestone', label: 'Hit a follower milestone' },
  { value: 'go_viral_once', label: 'Go viral once' },
  { value: 'build_personal_brand', label: 'Build a personal brand' },
  { value: 'get_sponsorships', label: 'Get sponsorships' },
  { value: 'just_having_fun', label: 'Just having fun' },
];

const QUESTIONNAIRE_LABELS = {
  style: Object.fromEntries(QUESTIONNAIRE_STYLE_OPTIONS.map(o => [o.value, o.label])),
  challenge: Object.fromEntries(QUESTIONNAIRE_CHALLENGE_OPTIONS.map(o => [o.value, o.label])),
  goal: Object.fromEntries(QUESTIONNAIRE_GOAL_OPTIONS.map(o => [o.value, o.label])),
};

let questionnaireAnswers = { niche: '', content_style: '', biggest_challenge: '', goal: '' };

async function checkQuestionnaireStatus(userId) {
  try {
    const res = await fetch(`${API_BASE}/questionnaire/status?user_id=${encodeURIComponent(userId)}`);
    return await res.json();
  } catch (e) {
    console.log('checkQuestionnaireStatus failed:', e);
    return null;
  }
}

function renderChipRow(containerId, options, group, preselected) {
  const container = document.getElementById(containerId);
  container.innerHTML = options.map(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const label = typeof opt === 'string' ? opt : opt.label;
    const selected = preselected === value ? 'selected' : '';
    return `<button type="button" class="q-chip ${selected}" data-value="${value}" onclick="selectQuestionnaireChip('${group}', '${value}', this)">${label}</button>`;
  }).join('');
}

function selectQuestionnaireChip(group, value, btnEl) {
  const container = btnEl.parentElement;
  container.querySelectorAll('.q-chip').forEach(c => c.classList.remove('selected'));
  btnEl.classList.add('selected');
  questionnaireAnswers[group] = value;

  if (group === 'niche') {
    const otherInput = document.getElementById('q-niche-other');
    if (value === 'Other') {
      otherInput.classList.remove('hidden');
      otherInput.focus();
      questionnaireAnswers.niche = otherInput.value.trim();
    } else {
      otherInput.classList.add('hidden');
    }
  }
}

function showQuestionnaireScreen(status) {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('questionnaire-screen').classList.remove('hidden');

  questionnaireAnswers = {
    niche: (status && status.niche) || '',
    content_style: (status && status.content_style) || '',
    biggest_challenge: (status && status.biggest_challenge) || '',
    goal: (status && status.goal) || '',
  };

  if (status && status.tiktok_username) {
    document.getElementById('q-handle').value = status.tiktok_username;
  }

  const nicheIsCustom = questionnaireAnswers.niche && !QUESTIONNAIRE_NICHES.includes(questionnaireAnswers.niche);
  renderChipRow('q-niche-chips', [...QUESTIONNAIRE_NICHES, 'Other'], 'niche', nicheIsCustom ? 'Other' : questionnaireAnswers.niche);
  if (nicheIsCustom) {
    document.getElementById('q-niche-other').value = questionnaireAnswers.niche;
    document.getElementById('q-niche-other').classList.remove('hidden');
  }

  renderChipRow('q-style-chips', QUESTIONNAIRE_STYLE_OPTIONS, 'content_style', questionnaireAnswers.content_style);
  renderChipRow('q-challenge-chips', QUESTIONNAIRE_CHALLENGE_OPTIONS, 'biggest_challenge', questionnaireAnswers.biggest_challenge);
  renderChipRow('q-goal-chips', QUESTIONNAIRE_GOAL_OPTIONS, 'goal', questionnaireAnswers.goal);

  document.getElementById('q-error').classList.add('hidden');
}

function openQuestionnaireForEdit() {
  if (!currentUser || !currentUser.user_id) return;
  questionnaireEditMode = true;
  checkQuestionnaireStatus(currentUser.user_id).then(status => {
    showQuestionnaireScreen(status || {});
  });
}

async function handleQuestionnaireSubmit() {
  const errorEl = document.getElementById('q-error');
  errorEl.classList.add('hidden');

  const userId = (pendingAppUser && pendingAppUser.user_id) || (currentUser && currentUser.user_id);
  if (!userId) return;

  const handle = document.getElementById('q-handle').value.trim();
  const otherNicheInput = document.getElementById('q-niche-other');
  if (!otherNicheInput.classList.contains('hidden')) {
    questionnaireAnswers.niche = otherNicheInput.value.trim();
  }

  if (!handle) {
    errorEl.textContent = 'Enter your TikTok handle.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (!questionnaireAnswers.niche) {
    errorEl.textContent = 'Pick (or type) your niche.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (!questionnaireAnswers.content_style || !questionnaireAnswers.biggest_challenge || !questionnaireAnswers.goal) {
    errorEl.textContent = 'Answer all questions before stepping in.';
    errorEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('q-submit-btn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'ENTERING...';

  try {
    const res = await fetch(`${API_BASE}/questionnaire/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        tiktok_username: handle,
        niche: questionnaireAnswers.niche,
        content_style: questionnaireAnswers.content_style,
        biggest_challenge: questionnaireAnswers.biggest_challenge,
        goal: questionnaireAnswers.goal,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      errorEl.textContent = data.detail || 'Something went wrong. Try again.';
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = originalText;
      return;
    }

    populateProfileFromQuestionnaire(data);

    if (questionnaireEditMode) {
      document.getElementById('questionnaire-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      questionnaireEditMode = false;
    } else {
      const user = pendingAppUser || currentUser;
      pendingAppUser = null;
      enterApp(user);
    }
  } catch (e) {
    console.error('Questionnaire submit failed:', e);
    errorEl.textContent = 'Connection failed. Try again.';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function populateProfileFromQuestionnaire(data) {
  const usernameEl = document.getElementById('p-username');
  const nicheEl = document.getElementById('p-niche');
  const styleEl = document.getElementById('p-style');
  const challengeEl = document.getElementById('p-challenge');
  const goalEl = document.getElementById('p-goal');
  const freqEl = document.getElementById('p-freq');
  if (usernameEl) usernameEl.value = data.tiktok_username ? `@${data.tiktok_username}` : '';
  if (nicheEl) nicheEl.value = data.niche || '';
  if (styleEl) styleEl.value = QUESTIONNAIRE_LABELS.style[data.content_style] || data.content_style || '';
  if (challengeEl) challengeEl.value = QUESTIONNAIRE_LABELS.challenge[data.biggest_challenge] || data.biggest_challenge || '';
  if (goalEl) goalEl.value = QUESTIONNAIRE_LABELS.goal[data.goal] || data.goal || '';
  // posting_frequency is inferred from screenshot upload cadence, not asked in the
  // questionnaire - stays blank until there's enough upload history to estimate from.
  if (freqEl) freqEl.value = data.posting_frequency || '';
}

async function loadProfileFromQuestionnaireStatus() {
  if (!currentUser || !currentUser.user_id) return;
  const status = await checkQuestionnaireStatus(currentUser.user_id);
  if (status && status.completed) {
    populateProfileFromQuestionnaire(status);
  }
}

async function checkUpgradePopup() {
  if (!currentUser || currentUser.is_paid) return;

  const today = new Date().toDateString();
  const key = 'upgrade_popup_date_' + currentUser.user_id;
  if (localStorage.getItem(key) === today) return;

  const data = await fetchUsage();
  if (!data || data.is_paid) return;

  localStorage.setItem(key, today);
  renderUpgradePopup(data);
}

function renderUpgradePopup(data) {
  const existing = document.getElementById('upgrade-popup-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'upgrade-popup-overlay';
  overlay.className = 'upgrade-popup-overlay';

  const expired = data.trial_expired;
  const daysLeft = data.trial_days_remaining;

  const headline = expired
    ? 'YOUR TRIAL HAS ENDED'
    : `${daysLeft} DAY${daysLeft === 1 ? '' : 'S'} LEFT IN YOUR TRIAL`;

  const body = expired
    ? "Your fourteen days are up. If you want back in the boardroom, upgrade now."
    : "Lock in your strategy before the clock runs out. Upgrade any time to keep the boardroom open permanently.";

  overlay.innerHTML = `
    <div class="upgrade-popup-card">
      <div class="upgrade-popup-headline">${headline}</div>
      <div class="upgrade-popup-body">${body}</div>
      <button class="cta upgrade-popup-cta" onclick="upgradeToBasePlan()">Upgrade to Executive Plan — $15/mo</button>
      <button class="upgrade-popup-dismiss" onclick="document.getElementById('upgrade-popup-overlay').remove()">Not now</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentUser) {
    checkUpgradePopup();
  }
});

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
  const consented = document.getElementById('auth-consent').checked;

  if (!email || !password || !firstName) {
    alert('Fill in all fields.');
    return;
  }

  if (!consented) {
    alert('You must consent to sending analytics screenshots to create an account.');
    return;
  }

  const btn = document.getElementById('auth-submit-btn');
  btn.textContent = t('auth-submit-entering');
  btn.disabled = true;

  try {
        const result = await signUp(email, password, firstName, consented);
    if (result.blocked) {
      showBlockedScreen(result.message);
      return;
    }
    if (result.success && result.needs_verification) {
      showBlockedScreen(`Check your inbox at ${result.email} and click the verification link to activate your account.`);
      return;
    }
    if (result.success) {
      showApp(result);
    } else {
      alert(t('signup-failed-alert'));
      btn.textContent = t('auth-submit-btn');
      btn.disabled = false;
    }
  } catch {
    alert(t('connection-failed-alert'));
    btn.textContent = t('auth-submit-btn');
    btn.disabled = false;
  }
}

async function handleSignIn() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();

  if (!email || !password) {
    alert(t('enter-email-password-alert'));
    return;
  }

  const btn = document.getElementById('auth-submit-btn');
  btn.textContent = t('auth-submit-entering');
  btn.disabled = true;

    try {
    const result = await signIn(email, password);
    if (result.success) {
      showApp(result);
    } else if (result.needs_verification) {
      showBlockedScreen(result.detail);
      return;
    } else {
      alert(t('signin-failed-alert'));
      btn.textContent = t('auth-submit-btn');
      btn.disabled = false;
    }
  } catch {
    alert(t('connection-failed-alert'));
    btn.textContent = t('auth-submit-btn');
    btn.disabled = false;
  }
}

function toggleAuthMode() {
  const isSignUp = document.getElementById('auth-firstname-group').style.display !== 'none';
  if (isSignUp) {
    document.getElementById('auth-firstname-group').style.display = 'none';
    document.getElementById('consent-group').style.display = 'none';
    document.getElementById('forgot-password-link').classList.remove('hidden');
    document.getElementById('auth-title').textContent = t('auth-title-welcome-back');
    document.getElementById('auth-subtitle').textContent = t('auth-subtitle-boardroom-waiting');
    document.getElementById('auth-submit-btn').textContent = t('auth-submit-btn');
    document.getElementById('auth-submit-btn').onclick = handleSignIn;
    document.getElementById('auth-toggle').textContent = t('auth-toggle-to-signup');
    } else {
    document.getElementById('auth-firstname-group').style.display = 'block';
    document.getElementById('consent-group').style.display = 'flex';
    document.getElementById('forgot-password-link').classList.add('hidden');
  }
 }
function showSignIn() {
  document.getElementById('blocked-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('auth-firstname-group').style.display = 'none';
  document.getElementById('auth-title').textContent = t('auth-title-brand');
  document.getElementById('auth-subtitle').textContent = t('auth-title-welcome-back');
  document.getElementById('auth-submit-btn').textContent = t('auth-submit-btn');
  document.getElementById('auth-submit-btn').onclick = handleSignIn;
  document.getElementById('auth-toggle').textContent = t('auth-toggle-to-signup');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
    const tabs = ['boardroom', 'profile', 'score', 'verdicts'];
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
    ? t('greeting-named', { name: currentUser.first_name })
    : t('greeting-anon');
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

       let capcutTag = null;
      let exampleTag = null;
      if (role === 'assistant') {
        const extracted = extractCapcutTag(content);
        content = extracted.text;
        capcutTag = extracted.tag;
        const extractedExample = extractExampleAssetTag(content);
        content = extractedExample.text;
        exampleTag = extractedExample.tag;
        bubble.innerHTML = '<div class="avatar">E</div><div class="bubble assistant">' + content.replace(/\n/g, '<br>') + '</div>';
      } else {
        bubble.innerHTML = '<div class="bubble user">' + content.replace(/\n/g, '<br>') + '</div>';
      }
      messages.appendChild(bubble);
      if (capcutTag) {
        appendCapcutImage(bubble.querySelector('.bubble'), capcutTag);
      }
      if (exampleTag) {
        appendExampleAssetImage(bubble.querySelector('.bubble'), exampleTag);
      }
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
        <div class="tracking-message">${t('posted-question')}</div>
        <div class="tracking-buttons">
          <button class="tracking-yes" onclick="verdictTrackingResponse(true)">${t('posted-yes')}</button>
          <button class="tracking-no" onclick="verdictTrackingResponse(false)">${t('posted-no')}</button>
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

  if (pendingScreenshots.length > 0) {
    const files = pendingScreenshots.map(item => item.file);
    const dataUrls = pendingScreenshots.map(item => item.dataUrl);
    pendingScreenshots = [];
    renderPendingAttachments();
    input.value = '';
    input.style.height = 'auto';
    unlockAudio();
    await sendScreenshots(files, dataUrls);
    return;
  }

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

async function sendQuickPromptKey(key) {
  await sendQuickPrompt(t(key));
}

function toggleMute() {
  unlockAudio();
  isMuted = !isMuted;
  const btn = document.getElementById('mute-btn');
  btn.textContent = isMuted ? '🔇' : '🔊';
  btn.title = isMuted ? t('unmute-title') : t('mute-title');
  btn.classList.toggle('muted', isMuted);

  if (isMuted && currentAutoAudio && !currentAutoAudio.paused) {
    currentAutoAudio.pause();
    currentAutoAudio.currentTime = 0;
  }
}

function addPlaybackButton(bubbleEl, text, existingAudioBase64 = null) {
  const btn = document.createElement('button');
  btn.className = 'playback-btn';
  btn.innerHTML = t('play-btn');
  btn.onclick = async () => {
    if (isMuted) {
      alert(t('voice-muted-alert'));
      return;
    }
    btn.disabled = true;
    btn.innerHTML = t('loading-btn');
    try {
      const audioBase64 = existingAudioBase64 || await generateSpeech(text);
      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.volume = currentVolume;
        btn.innerHTML = t('playing-btn');
        audio.play();
        audio.onended = () => {
          btn.innerHTML = t('play-btn');
          btn.disabled = false;
        };
      } else {
        btn.innerHTML = t('play-btn');
        btn.disabled = false;
      }
    } catch (e) {
      console.log('TTS playback failed:', e);
      btn.innerHTML = t('play-btn');
      btn.disabled = false;
    }
  };
  bubbleEl.appendChild(document.createElement('br'));
  bubbleEl.appendChild(btn);
}

// Smooth word-by-word reveal (replaces the old per-character typewriter).
// Change this number to speed the text up (higher) or slow it down (lower).
const REVEAL_CHARS_PER_SEC = 30;

function smoothReveal(fullText, bubbleEl, messagesEl, onProgress) {
  return new Promise((resolve) => {
    const pieces = [];
    const re = /\*\*|\n|[^\S\n]+|[^\s*]+|\*/g;
    let bold = false;
    let m;
    while ((m = re.exec(fullText)) !== null) {
      const s = m[0];
      const start = m.index;
      const end = re.lastIndex;
      if (s === '**') { bold = !bold; pieces.push({ kind: 'mark', start, end }); }
      else if (s === '\n') pieces.push({ kind: 'br', start, end });
      else if (/^[^\S\n]+$/.test(s)) pieces.push({ kind: 'sp', start, end });
      else pieces.push({ kind: 'w', s, bold, start, end });
    }

    bubbleEl.textContent = '';
    let shown = 0;
    let t0 = null;

    function append(p) {
      if (p.kind === 'w') {
        const el = document.createElement(p.bold ? 'strong' : 'span');
        el.className = 'w';
        el.textContent = p.s;
        bubbleEl.appendChild(el);
      } else if (p.kind === 'sp') {
        bubbleEl.appendChild(document.createTextNode(' '));
      } else if (p.kind === 'br') {
        bubbleEl.appendChild(document.createElement('br'));
      }
    }

    function tick(ts) {
      if (!bubbleEl.isConnected) { resolve(); return; }
      if (t0 === null) t0 = ts;
      const target = ((ts - t0) / 1000) * REVEAL_CHARS_PER_SEC;
      let lastEnd = -1;
      while (shown < pieces.length && pieces[shown].start <= target) {
        const p = pieces[shown++];
        append(p);
        lastEnd = p.end;
      }
      if (lastEnd >= 0) {
        if (onProgress) onProgress(fullText.slice(0, lastEnd));
        if (isNearBottom(messagesEl)) messagesEl.scrollTop = messagesEl.scrollHeight;
        updateScrollButton();
      }
      if (shown < pieces.length) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
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
  let lastExpressionUpdate = 0;

  try {
    const isFirstMessage = conversationHistory.length === 0;

    let finalText = '';
    await sendMessage(text, (chunkText, fullText) => {
      finalText = fullText;
    });

    finalText = finalText.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '').replace(/\s{2,}/g, ' ').trim();

    const capcutExtracted = extractCapcutTag(finalText);
    finalText = capcutExtracted.text;
    const capcutTag = capcutExtracted.tag;

    const exampleExtracted = extractExampleAssetTag(finalText);
    finalText = exampleExtracted.text;
    const exampleTag = exampleExtracted.tag;
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
      currentAutoAudio.volume = currentVolume;
      currentAutoAudio.play().catch(e => console.log('Auto-play blocked:', e));
    }

    await smoothReveal(finalText, bubbleEl, messages, (shown) => {
      displayedText = shown;
      const now = Date.now();
      if (now - lastExpressionUpdate > 400) {
        updateExpression(shown);
        lastExpressionUpdate = now;
      }
    });
    displayedText = finalText;

    if (document.body.contains(bubbleEl)) {
      updateExpression(displayedText);
      checkVerdictTracking();
      checkUsageWarning();

      addPlaybackButton(bubbleEl, finalText, audioBase64);
      if (capcutTag) appendCapcutImage(bubbleEl, capcutTag);
      if (exampleTag) appendExampleAssetImage(bubbleEl, exampleTag);

      if (isNearBottom(messages)) {
        messages.scrollTop = messages.scrollHeight;
      }
    }
  } catch (e) {
    console.error('sendToExecutive error:', e);
    document.getElementById('typing').classList.add('hidden');
    addMessage('assistant', t('connection-failed-chat'));
  } finally {
    document.getElementById('send-btn').disabled = false;
    messages.style.scrollBehavior = '';
  }
}

function loadDisplayName() {
  if (currentUser && currentUser.first_name) {
    const input = document.getElementById('p-displayname');
    if (input) input.value = currentUser.first_name;
  }
}

async function handleUpdateName() {
  const newName = document.getElementById('p-displayname').value.trim();
  if (!newName) { alert(t('enter-name-alert')); return; }
  const btn = event.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  try {
    const result = await updateDisplayName(newName);
    if (result.success) {
      btn.textContent = t('update-name-updated');
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    } else {
      btn.textContent = t('update-name-failed');
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    }
  } catch (e) {
    btn.textContent = t('update-name-failed');
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
  }
}

async function handleSetCheckInTime() {
  const time = document.getElementById('p-checkin-time').value;
  if (!time) { alert(t('pick-time-alert')); return; }
  const btn = event.target;
  const originalText = btn.textContent;
  btn.disabled = true;
  try {
    const result = await setCheckInTime(time);
    if (result.success) {
      btn.textContent = t('checkin-set');
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    } else {
      btn.textContent = t('update-name-failed');
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1500);
    }
  } catch (e) {
    btn.textContent = t('update-name-failed');
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
  if (!summary) { alert(t('fill-profile-alert')); return; }
  switchTab('boardroom');
  await sendToExecutive('Here is my complete creator profile:\n\n' + summary + '\n\nGive me a full boardroom analysis of where I stand and exactly what I need to do to reach my goal.');
}

async function loadComputedScore() {
  const container = document.getElementById('score-categories');
  container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-secondary);">${t('calculating-score')}</div>`;

  const data = await fetchScore();
  if (!data || data.error || data.detail || typeof data.total !== 'number') {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-secondary);">${t('not-enough-data')}</div>`;
    document.getElementById('score-total').textContent = '0';
    document.getElementById('score-fill').style.width = '0%';
    document.getElementById('score-label').textContent = t('no-data-label');
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
    { key: 'consistency', label: t('cat-consistency'), icon: '⏰' },
    { key: 'hooks', label: t('cat-hooks'), icon: '🎣' },
    { key: 'engagement', label: t('cat-engagement'), icon: '💬' },
    { key: 'strategy', label: t('cat-strategy'), icon: '🎯' },
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
  if (!data) { alert(t('load-score-alert')); return; }
  switchTab('boardroom');
  await sendToExecutive(`My computed Executive Score is ${data.total}/100. Consistency: ${data.consistency}/25, Hooks: ${data.hooks}/25, Engagement: ${data.engagement}/25, Strategy: ${data.strategy}/25. What is my biggest weakness and what do I fix first?`);
}

function renderVerdicts() {
  const list = document.getElementById('verdicts-list');
  if (!list) return;
  const dict = VERDICT_TRANSLATIONS[getLang()] || VERDICT_TRANSLATIONS.en;
  list.innerHTML = VERDICTS.map(function(v) {
    const text = dict[v.id] || VERDICT_TRANSLATIONS.en[v.id];
    return '<div class="verdict-ruling" onclick="discussVerdict(\'' + text.title.replace(/'/g, "\\'") + '\')"><div class="verdict-icon-box">' + v.icon + '</div><div class="verdict-body"><div class="verdict-title">' + text.title + '</div><div class="verdict-desc">' + text.desc + '</div></div><div class="verdict-arrow">›</div></div>';
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
        <button class="account-rename-x" onclick="handleRenameAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="${t('rename-account-title')}">✎</button>
        <button class="account-delete-x" onclick="handleDeleteAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="${t('delete-account-title')}">×</button>
      </span>
    `;
  }).join('');

  container.innerHTML = `
    ${options}
    <button class="account-pill account-add" onclick="handleAddAccount()">${t('account-add-btn')}</button>
  `;
  renderSidebarAccounts();
}

async function handleAddAccount() {
  const label = prompt(t('account-name-prompt'));
  if (!label || !label.trim()) return;

  const result = await createAccount(label.trim());
  if (result.success) {
    await loadAccountSwitcher();
    switchAccount(result.account.id);
  } else {
    alert(result.detail || t('account-add-failed'));
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
  const newLabel = prompt(t('account-rename-prompt'), currentLabel);
  if (!newLabel || !newLabel.trim() || newLabel.trim() === currentLabel) return;

  const result = await renameAccount(accountId, newLabel.trim());
  if (result.success) {
    await loadAccountSwitcher();
  } else {
    alert(result.detail || t('account-rename-failed'));
  }
}

async function handleDeleteAccount(accountId, label) {
  const confirmed = confirm(t('account-delete-confirm', { label }));
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
    alert(result.detail || t('account-delete-failed'));
  }
}

function clearChat() {
  const confirmed = confirm(t('clear-chat-confirm'));
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
        <button class="sidebar-account-icon" onclick="handleRenameAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="${t('rename-title')}">✎</button>
        <button class="sidebar-account-icon" onclick="handleDeleteAccount('${acc.id}', '${acc.label.replace(/'/g, "\\'")}')" title="${t('delete-title')}">×</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sidebar-section-label">${t('sidebar-chats-label')}</div>
    ${rows}
    <button class="sidebar-add-account" onclick="handleAddAccount()">${t('sidebar-add-account')}</button>
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
    el.innerHTML = t('usage-daily', { used: data.daily_cap - data.daily_remaining, cap: data.daily_cap });
  } else {
    el.innerHTML = t('usage-daily-trial', {
      used: data.daily_cap - data.daily_remaining, cap: data.daily_cap,
      trialUsed: data.trial_cap - data.trial_remaining, trialCap: data.trial_cap
    });
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
    banner.innerHTML = `<div class="tracking-message">${t('usage-warning', { used: data.daily_cap - data.daily_remaining, cap: data.daily_cap })}</div>`;
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
    alert(result.detail || t('language-update-failed'));
  }
}

function updateLanguageButtons() {
  const lang = (currentUser && currentUser.language) || 'en';
  ['en', 'fr', 'pt', 'hi'].forEach(code => {
    const btn = document.getElementById(`lang-${code}`);
    if (btn) btn.classList.toggle('active', code === lang);
  });
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  if (theme.accent) root.style.setProperty('--gold', theme.accent);
  if (theme.background) root.style.setProperty('--black', theme.background);
  if (theme.text_primary) root.style.setProperty('--text-primary', theme.text_primary);
  if (theme.text_secondary) root.style.setProperty('--text-muted', theme.text_secondary);
  if (theme.bubble_user) root.style.setProperty('--bubble-user-color', theme.bubble_user);
  if (theme.bubble_assistant) root.style.setProperty('--bubble-assistant-color', theme.bubble_assistant);
}

async function handleThemeChange() {
  const theme = {
    accent: document.getElementById('theme-accent').value,
    background: document.getElementById('theme-background').value,
    text_primary: document.getElementById('theme-text-primary').value,
    text_secondary: document.getElementById('theme-text-secondary').value,
    bubble_user: document.getElementById('theme-bubble-user').value,
    bubble_assistant: document.getElementById('theme-bubble-assistant').value,
  };
  applyTheme(theme);
  await setUserTheme(theme);
  currentUser.theme = theme;
  localStorage.setItem('executive_user', JSON.stringify(currentUser));
}

function resetTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--gold');
  root.style.removeProperty('--black');
  root.style.removeProperty('--text-primary');
  root.style.removeProperty('--text-muted');
  root.style.removeProperty('--bubble-user-color');
  root.style.removeProperty('--bubble-assistant-color');
  setUserTheme({});
  currentUser.theme = {};
  localStorage.setItem('executive_user', JSON.stringify(currentUser));
  loadThemeInputs();
}

function loadThemeInputs() {
  if (!currentUser || !currentUser.theme) return;
  const t = currentUser.theme;
  if (t.accent) document.getElementById('theme-accent').value = t.accent;
  if (t.background) document.getElementById('theme-background').value = t.background;
  if (t.text_primary) document.getElementById('theme-text-primary').value = t.text_primary;
  if (t.text_secondary) document.getElementById('theme-text-secondary').value = t.text_secondary;
  if (t.bubble_user) document.getElementById('theme-bubble-user').value = t.bubble_user;
  if (t.bubble_assistant) document.getElementById('theme-bubble-assistant').value = t.bubble_assistant;
}

function setVolume(value) {
  currentVolume = parseFloat(value);
  localStorage.setItem('executive_volume', currentVolume);
  if (currentAutoAudio) currentAutoAudio.volume = currentVolume;
}

function toggleSettingsSection() {
  const content = document.getElementById('settings-content');
  const arrow = document.getElementById('settings-arrow');
  content.classList.toggle('hidden');
  arrow.textContent = content.classList.contains('hidden') ? '▼' : '▲';
}

async function handleCancelSubscription() {
  const confirmed = confirm('Cancel your Executive Plan subscription? You will lose paid access immediately.');
  if (!confirmed) return;

  const result = await cancelSubscription();
  if (result.success) {
    alert('Subscription canceled.');
    currentUser.is_paid = false;
    localStorage.setItem('executive_user', JSON.stringify(currentUser));
    location.reload();
  } else {
    alert(result.detail || 'Could not cancel subscription.');
  }
}

async function handleDeleteAccountPermanently() {
  const confirmed = confirm('Permanently delete your account? This cannot be undone after 30 days. Type nothing else to confirm — press OK to proceed.');
  if (!confirmed) return;

  const doubleConfirmed = confirm('Are you absolutely sure? This will delete all your data.');
  if (!doubleConfirmed) return;

  const result = await deleteAccountPermanently();
  if (result.success) {
    alert('Your account has been deleted.');
    signOut();
    location.reload();
  } else {
    alert(result.detail || 'Could not delete account.');
  }
}

let pendingScreenshotType = 'analytics';
let pendingScreenshots = []; // { file, dataUrl }

function handleAttachClick() {
  document.getElementById('attach-menu').classList.toggle('hidden');
}

function selectScreenshotType(type) {
  pendingScreenshotType = type;
  document.getElementById('attach-menu').classList.add('hidden');
  document.getElementById('screenshot-input').click();
}

function addImageMessage(dataUrls) {
  const messages = document.getElementById('messages');
  const bubble = document.createElement('div');
  bubble.className = 'message user';
  const imgsHtml = dataUrls.map(url =>
    `<img src="${url}" style="max-width: 140px; border-radius: 12px; display: inline-block; margin: 2px;" />`
  ).join('');
  bubble.innerHTML = `<div class="bubble user" style="display:flex; flex-wrap:wrap; gap:4px;">${imgsHtml}</div>`;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

async function handleScreenshotSelected(event) {
  const files = Array.from(event.target.files);
  event.target.value = '';
  if (!files.length) return;

  const newItems = await Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ file, dataUrl: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));

  pendingScreenshots.push(...newItems);
  renderPendingAttachments();
}

function renderPendingAttachments() {
  const strip = document.getElementById('pending-attachments');
  if (!pendingScreenshots.length) {
    strip.classList.add('hidden');
    strip.innerHTML = '';
    return;
  }
  strip.classList.remove('hidden');
  strip.innerHTML = pendingScreenshots.map((item, i) => `
    <div style="position:relative; display:inline-block;">
      <img src="${item.dataUrl}" style="width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid #2a2a2a; display:block;" />
      <button onclick="removePendingScreenshot(${i})" style="position:absolute; top:-6px; right:-6px; width:18px; height:18px; border-radius:50%; background:#000; color:#fff; border:1px solid #555; font-size:11px; line-height:1; cursor:pointer; padding:0;">×</button>
    </div>
  `).join('');
}

function removePendingScreenshot(index) {
  pendingScreenshots.splice(index, 1);
  renderPendingAttachments();
}

async function sendScreenshots(files, dataUrls) {
  addImageMessage(dataUrls);
  conversationHistory.push({ role: 'user', content: `[${files.length} screenshot${files.length > 1 ? 's' : ''} uploaded]` });

  document.getElementById('typing').classList.remove('hidden');
  document.getElementById('send-btn').disabled = true;

  const messages = document.getElementById('messages');
  messages.style.scrollBehavior = 'auto';
  let bubbleEl = null;
  let displayedText = '';
  let lastExpressionUpdate = 0;

  try {
    const data = await scanScreenshot(files, pendingScreenshotType);
    const finalText = data.verdict;

    conversationHistory.push({ role: 'assistant', content: finalText });

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
      currentAutoAudio.volume = currentVolume;
      currentAutoAudio.play().catch(e => console.log('Auto-play blocked:', e));
    }
    await smoothReveal(finalText, bubbleEl, messages, (shown) => {
      displayedText = shown;
      const now = Date.now();
      if (now - lastExpressionUpdate > 400) {
        updateExpression(shown);
        lastExpressionUpdate = now;
      }
    });
    displayedText = finalText;

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
    console.error('sendScreenshots error:', e);
    document.getElementById('typing').classList.add('hidden');
    addMessage('assistant', t('connection-failed-chat'));
  } finally {
    document.getElementById('send-btn').disabled = false;
    messages.style.scrollBehavior = '';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
  btn.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
}

async function handleForgotPassword() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) {
    alert('Enter your email above first, then click "Forgot password?"');
    return;
  }
  try {
    await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    alert('If that email is registered, a reset link has been sent. Check your inbox.');
  } catch {
    alert('Connection failed. Try again.');
  }
}