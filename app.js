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

async function refreshSession() {
  if (!supabase) return;

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    setAuthStatus(`Session error: ${error.message}`);
    return;
  }

  const email = data.session?.user?.email;

  if (email) {
    setAuthStatus(`Signed in as ${email}`, true);
  } else {
    setAuthStatus("Not signed in.");
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
}

async function handleContactSubmit(event) {
  event.preventDefault();

  if (!supabase) {
    setContactStatus("Add your Supabase config first.");
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    message: String(formData.get("message") || "").trim()
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
}

function bindEvents() {
  authForm?.addEventListener("submit", handleAuthSubmit);
  contactForm?.addEventListener("submit", handleContactSubmit);
  signOutButton?.addEventListener("click", handleSignOut);
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

  supabase = createClient(config.url, config.anonKey);
  window.supabase = supabase;

  updateStatus("Supabase client initialized and ready.", "ready");

  supabase.auth.onAuthStateChange(() => {
    refreshSession();
  });

  await refreshSession();
  await loadSamples();
}

initializeApp();
