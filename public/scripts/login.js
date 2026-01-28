import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.__SUPABASE__ || {};
const supabaseUrl = config.url;
const supabaseAnonKey = config.key;

const message = document.getElementById("login-message");
const form = document.getElementById("login-form");

if (!supabaseUrl || !supabaseAnonKey) {
  if (message) message.textContent = "Faltan variables de Supabase en producción.";
}

const storage = typeof window !== "undefined" ? window.sessionStorage : undefined;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
  },
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (message) message.textContent = "Verificando...";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (message) message.textContent = "No se pudo iniciar sesión. Revisa tus credenciales.";
    return;
  }

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    if (message) message.textContent = "No se pudo iniciar sesión. Intenta nuevamente.";
    return;
  }

  const response = await fetch("/api/admin-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    if (message) message.textContent = "No se pudo iniciar sesión. Intenta nuevamente.";
    return;
  }

  if (message) message.textContent = "Acceso correcto. Redirigiendo...";
  setTimeout(() => {
    window.location.href = "/admin";
  }, 250);
});
