import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const buildCookie = (value, url, maxAge = 3600) => {
  const secure = url.protocol === "https:" ? " Secure;" : "";
  return `admin_session=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax;${secure}`;
};

export async function POST({ request }) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  const { accessToken } = await request.json().catch(() => ({}));
  if (!accessToken) {
    return new Response("Missing access token", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  return new Response("OK", {
    status: 200,
    headers: {
      "Set-Cookie": buildCookie("1", url),
    },
  });
}

export async function DELETE({ request }) {
  const url = new URL(request.url);
  return new Response("OK", {
    status: 200,
    headers: {
      "Set-Cookie": buildCookie("", url, 0),
    },
  });
}
