import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const statusEl = document.querySelector("#supabase-status");
const authForm = document.querySelector("#auth-form");
const authEmailInput = document.querySelector("#auth-email");
const authStatusEl = document.querySelector("#auth-status");
const signOutButton = document.querySelector("#sign-out-button");
const sampleStatusEl = document.querySelector("#sample-status");
const sampleListEl = document.querySelector("#sample-list");
const contactForm = document.querySelector("#contact-form");
const contactStatusEl = document.querySelector("#contact-status");
const messagesStatusEl = document.querySelector("#messages-status");
const messagesListEl = document.querySelector("#messages-list");
const refreshMessagesButton = document.querySelector("#refresh-messages-button");
const config = window.APP_CONFIG?.supabase;

let supabase = null;

function updateStatus(message, state) {
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("ready", "missing");

  if (state) {
    statusEl.classList.add(state);
  }
}

function setAuthStatus(message, isSignedIn = false) {
  if (authStatusEl) {
    authStatusEl.textContent = message;
  }

  if (signOutButton) {
    signOutButton.classList.toggle("hidden", !isSignedIn);
  }
}

function setSampleStatus(message) {
  if (sampleStatusEl) {
    sampleStatusEl.textContent = message;
  }
}

function setContactStatus(message) {
  if (contactStatusEl) {
    contactStatusEl.textContent = message;
  }
}

function setMessagesStatus(message) {
  if (messagesStatusEl) {
    messagesStatusEl.textContent = message;
  }
}

function renderSamples(rows) {
  if (!sampleListEl) return;

  sampleListEl.innerHTML = "";

  if (!rows.length) {
    const item = document.createElement("li");
    item.textContent = "No sample rows yet. Run the SQL script to seed starter content.";
    sampleListEl.appendChild(item);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${row.title}</strong><span>${row.body}</span>`;
    sampleListEl.appendChild(item);
  });
}

function renderMessages(rows) {
  if (!messagesListEl) return;

  messagesListEl.innerHTML = "";

  if (!rows.length) {
    messagesListEl.classList.remove("hidden");
    const item = document.createElement("li");
    item.textContent = "No contact messages yet. Submit the form above to create the first one.";
    messagesListEl.appendChild(item);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("li");
    const submittedBy = row.submitted_by_email || row.email;
    const createdAt = row.created_at ? new Date(row.created_at).toLocaleString() : "Just now";
    item.innerHTML = `
      <strong>${row.name}</strong>
      <div class="message-meta">${submittedBy} · ${createdAt}</div>
      <div class="message-body">${row.message}</div>
    `;
    messagesListEl.appendChild(item);
  });

  messagesListEl.classList.remove("hidden");
}

async function refreshSession() {
  if (!supabase) return;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    setAuthStatus(`Session error: ${sessionError.message}`);
    return;
  }

  const sessionUser = sessionData.session?.user;

  if (sessionUser?.email) {
    setAuthStatus(`Signed in as ${sessionUser.email}`, true);
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    setAuthStatus(`User lookup error: ${userError.message}`);
    return;
  }

  const email = userData.user?.email;

  if (email) {
    setAuthStatus(`Signed in as ${email}`, true);
    refreshMessagesButton?.classList.remove("hidden");
  } else {
    setAuthStatus("Not signed in.");
    refreshMessagesButton?.classList.add("hidden");
    messagesListEl?.classList.add("hidden");
    setMessagesStatus("Sign in to load saved messages.");
  }
}

async function loadSamples() {
  if (!supabase) return;

  setSampleStatus("Loading sample data...");
  const { data, error } = await supabase
    .from("sample_messages")
    .select("title, body")
    .order("created_at", { ascending: true });

  if (error) {
    setSampleStatus(`Could not load sample data: ${error.message}`);
    renderSamples([]);
    return;
  }

  setSampleStatus(`Loaded ${data.length} sample message${data.length === 1 ? "" : "s"}.`);
  renderSamples(data);
}

async function loadMessages() {
  if (!supabase) return;

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    messagesListEl?.classList.add("hidden");
    setMessagesStatus("Sign in to load saved messages.");
    return;
  }

  setMessagesStatus("Loading inbox...");

  const { data, error } = await supabase
    .from("contact_messages")
    .select("name, email, message, created_at, submitted_by_email")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    messagesListEl?.classList.add("hidden");
    setMessagesStatus(`Could not load inbox: ${error.message}`);
    return;
  }

  setMessagesStatus(`Loaded ${data.length} saved message${data.length === 1 ? "" : "s"}.`);
  renderMessages(data);
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  if (!supabase) {
    setAuthStatus("Add your Supabase config first.");
    return;
  }

  const email = authEmailInput?.value?.trim();

  if (!email) {
    setAuthStatus("Enter an email address first.");
    return;
  }

  setAuthStatus("Sending magic link...");

  const redirectTo = window.location.origin;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    setAuthStatus(`Could not send magic link: ${error.message}`);
    return;
  }

  setAuthStatus(`Magic link sent to ${email}. Check your inbox.`);
  authForm?.reset();
}

async function handleSignOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();

  if (error) {
    setAuthStatus(`Could not sign out: ${error.message}`, true);
    return;
  }

  setAuthStatus("Signed out.");
  messagesListEl?.classList.add("hidden");
  setMessagesStatus("Sign in to load saved messages.");
}

async function handleContactSubmit(event) {
  event.preventDefault();

  if (!supabase) {
    setContactStatus("Add your Supabase config first.");
    return;
  }

  const formData = new FormData(event.currentTarget);
  const { data: userData } = await supabase.auth.getUser();
  const authUser = userData.user;
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    user_id: authUser?.id || null,
    submitted_by_email: authUser?.email || null
  };

  if (!payload.name || !payload.email || !payload.message) {
    setContactStatus("Please complete all contact fields.");
    return;
  }

  setContactStatus("Sending message...");

  const { error } = await supabase.from("contact_messages").insert(payload);

  if (error) {
    setContactStatus(`Could not save message: ${error.message}`);
    return;
  }

  setContactStatus("Message saved to Supabase.");
  contactForm?.reset();
  await loadMessages();
}

function bindEvents() {
  authForm?.addEventListener("submit", handleAuthSubmit);
  contactForm?.addEventListener("submit", handleContactSubmit);
  signOutButton?.addEventListener("click", handleSignOut);
  refreshMessagesButton?.addEventListener("click", loadMessages);
}

async function initializeApp() {
  bindEvents();

  if (!config?.url || !config?.anonKey) {
    updateStatus("Config missing. Add your Supabase URL and publishable key to config.js.", "missing");
    setAuthStatus("Add config to enable auth.");
    setSampleStatus("Add config to load sample data.");
    setContactStatus("Add config to enable form submission.");
    return;
  }

  supabase = createClient(config.url, config.anonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true
    }
  });
  window.supabase = supabase;

  updateStatus("Supabase client initialized and ready.", "ready");

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      setAuthStatus(`Could not finish sign-in: ${error.message}`);
    } else {
      url.searchParams.delete("code");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }

  supabase.auth.onAuthStateChange(() => {
    refreshSession();
    loadMessages();
  });

  await refreshSession();
  await loadSamples();
  await loadMessages();
}

initializeApp();
