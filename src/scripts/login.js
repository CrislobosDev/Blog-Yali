import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const storage = typeof window !== "undefined" ? window.sessionStorage : undefined;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
  },
});

const message = document.getElementById("login-message");
const form = document.getElementById("login-form");

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
