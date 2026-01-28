import { defineMiddleware } from "astro/middleware";

const isAdminCookiePresent = (cookieHeader) => {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("admin_session="));
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const cookieHeader = context.request.headers.get("cookie");
    if (!isAdminCookiePresent(cookieHeader)) {
      return context.redirect("/login");
    }
  }

  return next();
});
