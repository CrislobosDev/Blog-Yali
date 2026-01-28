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

const STORAGE_BUCKET = "media";
const BLOG_FOLDER = "blog";
const GALLERY_FOLDER = "galeria";

const banner = document.querySelector(".auth-banner");
const section = document.querySelector(".page");
const logoutButton = document.getElementById("logout");

const blogForm = document.getElementById("blog-form");
const blogMessage = document.getElementById("blog-message");
const blogList = document.getElementById("blog-list");
const blogSubmit = document.getElementById("blog-submit");
const blogCancel = document.getElementById("blog-cancel");
const blogPreviewImage = document.getElementById("blog-preview-image");
const blogPreviewTitle = document.getElementById("blog-preview-title");
const blogPreviewExcerpt = document.getElementById("blog-preview-excerpt");
const blogPreviewCategory = document.getElementById("blog-preview-category");

const galleryForm = document.getElementById("gallery-form");
const galleryMessage = document.getElementById("gallery-message");
const galleryList = document.getElementById("gallery-list");
const gallerySubmit = document.getElementById("gallery-submit");
const galleryCancel = document.getElementById("gallery-cancel");
const galleryPreviewImage = document.getElementById("gallery-preview-image");
const galleryPreviewTitle = document.getElementById("gallery-preview-title");
const galleryPreviewAlt = document.getElementById("gallery-preview-alt");

const toast = document.getElementById("toast");
let toastTimeout = null;

const showToast = (text, type = "info") => {
  if (!toast) return;
  toast.textContent = text;
  toast.setAttribute("data-status", type);
  toast.classList.add("is-visible");
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
};

const setMessage = (el, text, type = "info") => {
  if (!el) return;
  el.textContent = text;
  el.setAttribute("data-status", type);
  if (text) showToast(text, type);
};

const { data } = await supabase.auth.getSession();

if (!data?.session) {
  window.location.href = "/login";
} else {
  if (banner) {
    banner.setAttribute("data-state", "ready");
    banner.textContent = `Sesión iniciada: ${data.session.user.email}`;
  }
  if (section) section.setAttribute("data-auth", "ready");
}

logoutButton?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  await fetch("/api/admin-session", { method: "DELETE" });
  window.location.href = "/login";
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    await fetch("/api/admin-session", { method: "DELETE" });
    if (banner) {
      banner.setAttribute("data-state", "expired");
      banner.textContent = "Sesión expirada. Redirigiendo al login...";
    }
    showToast("Sesión expirada. Redirigiendo al login...", "error");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }
});

const buildFilePath = (folder, file) => {
  const safeName = file.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9.-]/g, "");
  return `${folder}/${Date.now()}-${safeName}`;
};

const extractPathFromPublicUrl = (url) => {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
};

const removeImageByUrl = async (url) => {
  if (!url) return;
  const path = extractPathFromPublicUrl(url);
  if (!path) return;
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
};

const uploadImage = async (file, folder) => {
  const path = buildFilePath(folder, file);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return publicData.publicUrl;
};

const resetBlogForm = () => {
  blogForm?.reset();
  blogForm?.querySelector("[name='post_id']")?.setAttribute("value", "");
  if (blogSubmit) blogSubmit.textContent = "Publicar";
  if (blogCancel) blogCancel.hidden = true;
  blogForm?.removeAttribute("data-image");
  if (blogPreviewImage) blogPreviewImage.removeAttribute("src");
  if (blogPreviewTitle) blogPreviewTitle.textContent = "Título de la entrada";
  if (blogPreviewExcerpt) blogPreviewExcerpt.textContent = "Aquí aparecerá el extracto.";
  if (blogPreviewCategory) blogPreviewCategory.textContent = "Sin categoría";
};

const resetGalleryForm = () => {
  galleryForm?.reset();
  galleryForm?.querySelector("[name='image_id']")?.setAttribute("value", "");
  if (gallerySubmit) gallerySubmit.textContent = "Subir imagen";
  if (galleryCancel) galleryCancel.hidden = true;
  galleryForm?.removeAttribute("data-image");
  if (galleryPreviewImage) galleryPreviewImage.removeAttribute("src");
  if (galleryPreviewTitle) galleryPreviewTitle.textContent = "Descripción de la imagen";
  if (galleryPreviewAlt) galleryPreviewAlt.textContent = "Texto alternativo";
};

const previewFile = (file, target) => {
  if (!(file instanceof File) || file.size === 0) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (target) target.setAttribute("src", String(reader.result));
  };
  reader.readAsDataURL(file);
};

blogForm?.querySelector("[name='imagen']")?.addEventListener("change", (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.files && input.files[0]) {
    previewFile(input.files[0], blogPreviewImage);
  }
});

galleryForm?.querySelector("[name='imagen']")?.addEventListener("change", (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.files && input.files[0]) {
    previewFile(input.files[0], galleryPreviewImage);
  }
});

blogForm?.querySelector("[name='titulo']")?.addEventListener("input", (event) => {
  const value = event.target?.value ?? "";
  if (blogPreviewTitle) blogPreviewTitle.textContent = value || "Título de la entrada";
});

blogForm?.querySelector("[name='extracto']")?.addEventListener("input", (event) => {
  const value = event.target?.value ?? "";
  if (blogPreviewExcerpt) blogPreviewExcerpt.textContent = value || "Aquí aparecerá el extracto.";
});

blogForm?.querySelector("[name='categoria']")?.addEventListener("input", (event) => {
  const value = event.target?.value ?? "";
  if (blogPreviewCategory) blogPreviewCategory.textContent = value || "Sin categoría";
});

galleryForm?.querySelector("[name='titulo']")?.addEventListener("input", (event) => {
  const value = event.target?.value ?? "";
  if (galleryPreviewTitle) galleryPreviewTitle.textContent = value || "Descripción de la imagen";
});

galleryForm?.querySelector("[name='alt']")?.addEventListener("input", (event) => {
  const value = event.target?.value ?? "";
  if (galleryPreviewAlt) galleryPreviewAlt.textContent = value || "Texto alternativo";
});

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const loadBlogPosts = async () => {
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, image_url, category, published_at, content")
    .order("published_at", { ascending: false });

  if (error || !blogList) return;
  blogList.innerHTML = "";

  if (!posts || posts.length === 0) {
    blogList.innerHTML = "<p class='note'>Aún no hay entradas publicadas.</p>";
    return;
  }

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "list-card";

    card.innerHTML = `
      <div>
        <p class="tag">${post.category ?? "Sin categoría"}</p>
        <h3>${post.title}</h3>
        <p class="excerpt">${post.excerpt ?? ""}</p>
        <p class="meta">${formatDate(post.published_at)}</p>
      </div>
      <div class="list-actions">
        <button type="button" data-action="edit" data-id="${post.id}">Editar</button>
        <button type="button" class="danger" data-action="delete" data-id="${post.id}">Eliminar</button>
      </div>
    `;

    card.querySelector("[data-action='edit']")?.addEventListener("click", () => {
      blogForm?.querySelector("[name='post_id']")?.setAttribute("value", String(post.id));
      const titleInput = blogForm?.querySelector("[name='titulo']");
      const categoryInput = blogForm?.querySelector("[name='categoria']");
      const excerptInput = blogForm?.querySelector("[name='extracto']");
      const contentInput = blogForm?.querySelector("[name='contenido']");

      if (titleInput) titleInput.value = post.title ?? "";
      if (categoryInput) categoryInput.value = post.category ?? "";
      if (excerptInput) excerptInput.value = post.excerpt ?? "";
      if (contentInput) contentInput.value = post.content ?? "";

      blogForm?.setAttribute("data-image", post.image_url ?? "");
      if (blogPreviewImage) {
        if (post.image_url) blogPreviewImage.setAttribute("src", post.image_url);
        else blogPreviewImage.removeAttribute("src");
      }
      if (blogPreviewTitle) blogPreviewTitle.textContent = post.title ?? "Título de la entrada";
      if (blogPreviewExcerpt)
        blogPreviewExcerpt.textContent = post.excerpt ?? "Aquí aparecerá el extracto.";
      if (blogPreviewCategory)
        blogPreviewCategory.textContent = post.category ?? "Sin categoría";
      if (blogSubmit) blogSubmit.textContent = "Actualizar";
      if (blogCancel) blogCancel.hidden = false;
      blogForm?.scrollIntoView({ behavior: "smooth" });
    });

    card.querySelector("[data-action='delete']")?.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta entrada?")) return;
      if (post.image_url) await removeImageByUrl(post.image_url);
      await supabase.from("blog_posts").delete().eq("id", post.id);
      loadBlogPosts();
      showToast("Entrada eliminada.", "success");
    });

    blogList.appendChild(card);
  });
};

const loadGalleryItems = async () => {
  const { data: items, error } = await supabase
    .from("imagenes")
    .select("id, url_publica, alt_text, descripcion, created_at")
    .order("created_at", { ascending: false });

  if (error || !galleryList) return;
  galleryList.innerHTML = "";

  if (!items || items.length === 0) {
    galleryList.innerHTML = "<p class='note'>Aún no hay imágenes publicadas.</p>";
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "list-card";

    card.innerHTML = `
      <div class="thumb">
        <img src="${item.url_publica}" alt="${item.alt_text ?? "Imagen"}" />
      </div>
      <div>
        <h3>${item.descripcion ?? "Sin descripción"}</h3>
        <p class="excerpt">${item.alt_text ?? ""}</p>
        <p class="meta">${formatDate(item.created_at)}</p>
      </div>
      <div class="list-actions">
        <button type="button" data-action="edit" data-id="${item.id}">Editar</button>
        <button type="button" class="danger" data-action="delete" data-id="${item.id}">Eliminar</button>
      </div>
    `;

    card.querySelector("[data-action='edit']")?.addEventListener("click", () => {
      galleryForm?.querySelector("[name='image_id']")?.setAttribute("value", String(item.id));
      const titleInput = galleryForm?.querySelector("[name='titulo']");
      const altInput = galleryForm?.querySelector("[name='alt']");
      if (titleInput) titleInput.value = item.descripcion ?? "";
      if (altInput) altInput.value = item.alt_text ?? "";
      galleryForm?.setAttribute("data-image", item.url_publica ?? "");
      if (galleryPreviewImage) {
        if (item.url_publica) galleryPreviewImage.setAttribute("src", item.url_publica);
        else galleryPreviewImage.removeAttribute("src");
      }
      if (galleryPreviewTitle)
        galleryPreviewTitle.textContent = item.descripcion ?? "Descripción de la imagen";
      if (galleryPreviewAlt)
        galleryPreviewAlt.textContent = item.alt_text ?? "Texto alternativo";
      if (gallerySubmit) gallerySubmit.textContent = "Actualizar";
      if (galleryCancel) galleryCancel.hidden = false;
      galleryForm?.scrollIntoView({ behavior: "smooth" });
    });

    card.querySelector("[data-action='delete']")?.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta imagen?")) return;
      await removeImageByUrl(item.url_publica);
      await supabase.from("imagenes").delete().eq("id", item.id);
      loadGalleryItems();
      showToast("Imagen eliminada.", "success");
    });

    galleryList.appendChild(card);
  });
};

blogForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(blogMessage, "Guardando entrada...", "loading");

  const formData = new FormData(blogForm);
  const file = formData.get("imagen");
  const postId = formData.get("post_id");
  const existingImage = blogForm.getAttribute("data-image");

  let imageUrl = existingImage || null;
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await uploadImage(file, BLOG_FOLDER);
      if (existingImage) await removeImageByUrl(existingImage);
    } catch (error) {
      setMessage(blogMessage, "Error al subir la imagen. Intenta nuevamente.", "error");
      return;
    }
  }

  const payload = {
    title: formData.get("titulo"),
    category: formData.get("categoria"),
    excerpt: formData.get("extracto"),
    content: formData.get("contenido"),
    image_url: imageUrl,
  };

  if (postId) {
    const { error } = await supabase.from("blog_posts").update(payload).eq("id", postId);
    if (error) {
      setMessage(blogMessage, "Error al actualizar la entrada.", "error");
      return;
    }
    setMessage(blogMessage, "Entrada actualizada correctamente.", "success");
  } else {
    const { error } = await supabase.from("blog_posts").insert({
      ...payload,
      published_at: new Date().toISOString(),
    });
    if (error) {
      setMessage(blogMessage, "Error al guardar la entrada.", "error");
      return;
    }
    setMessage(blogMessage, "Entrada publicada correctamente.", "success");
  }

  resetBlogForm();
  loadBlogPosts();
});

galleryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(galleryMessage, "Guardando imagen...", "loading");

  const formData = new FormData(galleryForm);
  const file = formData.get("imagen");
  const imageId = formData.get("image_id");
  const existingImage = galleryForm.getAttribute("data-image");

  let imageUrl = existingImage || null;
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await uploadImage(file, GALLERY_FOLDER);
      if (existingImage) await removeImageByUrl(existingImage);
    } catch (error) {
      setMessage(galleryMessage, "Error al subir la imagen. Intenta nuevamente.", "error");
      return;
    }
  }

  if (!imageUrl) {
    setMessage(galleryMessage, "Selecciona una imagen para continuar.", "error");
    return;
  }

  const payload = {
    url_publica: imageUrl,
    alt_text: formData.get("alt"),
    descripcion: formData.get("titulo"),
  };

  if (imageId) {
    const { error } = await supabase.from("imagenes").update(payload).eq("id", imageId);
    if (error) {
      setMessage(galleryMessage, "Error al actualizar la imagen.", "error");
      return;
    }
    setMessage(galleryMessage, "Imagen actualizada correctamente.", "success");
  } else {
    const { error } = await supabase.from("imagenes").insert(payload);
    if (error) {
      setMessage(galleryMessage, "Error al guardar la imagen.", "error");
      return;
    }
    setMessage(galleryMessage, "Imagen publicada en la galería.", "success");
  }

  resetGalleryForm();
  loadGalleryItems();
});

blogCancel?.addEventListener("click", () => {
  resetBlogForm();
  setMessage(blogMessage, "", "info");
});

galleryCancel?.addEventListener("click", () => {
  resetGalleryForm();
  setMessage(galleryMessage, "", "info");
});

await loadBlogPosts();
await loadGalleryItems();
