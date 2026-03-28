import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const statusEl = document.querySelector("#supabase-status");
const config = window.APP_CONFIG?.supabase;

function updateStatus(message, state) {
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("ready", "missing");

  if (state) {
    statusEl.classList.add(state);
  }
}

if (!config?.url || !config?.anonKey) {
  updateStatus("Config missing. Copy config.example.js to config.js and add your Supabase values.", "missing");
} else {
  const supabase = createClient(config.url, config.anonKey);
  window.supabase = supabase;
  updateStatus("Supabase client initialized and ready for auth or data features.", "ready");
}
