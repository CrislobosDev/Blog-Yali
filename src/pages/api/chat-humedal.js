const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_QUESTION_LENGTH = 600;
const MAX_HISTORY_MESSAGES = 10;
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

const SYSTEM_PROMPT = `
Eres el asistente virtual oficial de Yali Salvaje.

Tu objetivo es ayudar a visitantes, fotógrafos, turistas, estudiantes y amantes de la naturaleza a conocer y visitar el Humedal El Yali, además de difundir el proyecto Yali Salvaje.

Tu rol es:

- Informar sobre el Humedal El Yali
- Ayudar a planificar visitas
- Explicar biodiversidad y aves
- Promover educación ambiental
- Orientar a fotógrafos de naturaleza
- Representar el proyecto Yali Salvaje

---

INFORMACION BASE CONFIABLE

Ubicación:
- El Humedal El Yali está en la costa de la Región de Valparaíso, Chile.
- Comuna de Santo Domingo.
- Aproximadamente a 120 km de Santiago.

Características:
- Es un santuario de biodiversidad.
- Tiene alrededor de 16 cuerpos de agua.
- Su extensión aproximada es 11.000 hectáreas.
- Es sitio Ramsar de importancia internacional.

Límites geográficos:
- Norte: Estero Tricao
- Sur: Estero Maitenlahue
- Este: Ruta de la Fruta
- Oeste: Océano Pacífico

Importancia ecológica:
- Hábitat de aves migratorias y especies nativas.
- Zona clave para observación de aves.
- Ecosistema protegido.

Proyecto Yali Salvaje:
- Promueve conservación.
- Educación ambiental.
- Fotografía de naturaleza.
- Difusión del humedal.

---

COMPORTAMIENTO DEL ASISTENTE

Debes responder como un guía experto en el humedal.

Tus respuestas deben ser:

- claras
- útiles
- concretas
- naturales
- en español

---

IMPORTANTE: ASISTENTE ACTIVO

Además de responder, debes hacer preguntas útiles al usuario para ayudarlo mejor.

Ejemplos de preguntas que puedes hacer:

- ¿Quieres visitar el humedal o solo informarte?
- ¿Desde qué ciudad vendrías?
- ¿Te interesa observar aves o hacer fotografía?
- ¿Es tu primera vez visitando El Yali?
- ¿En qué época planeas ir?
- ¿Te interesan especialmente los flamencos u otras aves?
- ¿Quieres saber cómo llegar exactamente?
- ¿Quieres recomendaciones de horarios?

Haz máximo 1 o 2 preguntas por respuesta.

---

REGLAS IMPORTANTES

- No inventes datos.
- Si no sabes algo, di: "No tengo ese dato confirmado".
- No inventes fechas, cifras ni especies.
- Si preguntan algo fuera del humedal o proyecto, redirige el tema.

Ejemplo:
"Eso está fuera del alcance del asistente, pero puedo ayudarte con información del Humedal El Yali."

---

PRIORIDAD: UTILIDAD PRACTICA

Ayuda con:

- cómo llegar
- cuándo visitar
- qué aves ver
- mejores horarios
- recomendaciones para visitantes
- fotografía
- conservación

---

TONO

- cercano
- natural
- profesional
- como guía local experto

Representas a Yali Salvaje.
`;


const normalizeRole = (role) => (role === "assistant" ? "model" : "user");

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const role = item.role === "assistant" ? "assistant" : "user";
      const text = typeof item.text === "string" ? item.text.trim() : "";
      return { role, text };
    })
    .filter((item) => item.text.length > 0 && item.text.length <= MAX_QUESTION_LENGTH)
    .slice(-MAX_HISTORY_MESSAGES);
};

const extractText = (responseData) => {
  const candidates = Array.isArray(responseData?.candidates) ? responseData.candidates : [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .filter((part) => typeof part?.text === "string")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
};

export async function POST({ request }) {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  const configuredModel = import.meta.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return Response.json({ error: "Falta configurar GEMINI_API_KEY en el servidor." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const userMessage = typeof body?.message === "string" ? body.message.trim() : "";
  const history = sanitizeHistory(body?.history);

  if (!userMessage) {
    return Response.json({ error: "La pregunta esta vacia." }, { status: 400 });
  }

  if (userMessage.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      { error: `La pregunta supera el maximo de ${MAX_QUESTION_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const contents = [
    ...history.map((item) => ({
      role: normalizeRole(item.role),
      parts: [{ text: item.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const modelsToTry = [configuredModel, ...FALLBACK_MODELS].filter(
    (value, index, arr) => value && arr.indexOf(value) === index,
  );
  let aiResponse = null;
  let lastErrorData = null;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 340,
          topP: 0.85,
          topK: 40,
        },
      }),
    });

    if (response.ok) {
      aiResponse = response;
      break;
    }

    const errorData = await response.json().catch(() => ({}));
    lastErrorData = errorData;
    const providerMessage = String(errorData?.error?.message || "");
    const notFoundModel =
      response.status === 404 || providerMessage.includes("is not found for API version");

    if (!notFoundModel) {
      aiResponse = response;
      break;
    }
  }

  if (!aiResponse) {
    return Response.json({ error: "No fue posible conectarse con Gemini en este momento." }, { status: 502 });
  }

  if (!aiResponse.ok) {
    const errorData = lastErrorData || (await aiResponse.json().catch(() => ({})));
    const providerMessage = errorData?.error?.message;

    console.error("Error Gemini chat-humedal:", aiResponse.status, errorData);

    if (aiResponse.status === 429) {
      return Response.json(
        {
          error:
            "El asistente no esta disponible por limite de cuota en Gemini. Revisa tu free tier y limites del proyecto.",
        },
        { status: 429 },
      );
    }

    if (aiResponse.status === 401 || aiResponse.status === 403) {
      return Response.json(
        { error: "No se pudo autenticar con Gemini. Revisa GEMINI_API_KEY." },
        { status: 502 },
      );
    }

    return Response.json(
      { error: providerMessage || "No fue posible generar una respuesta en este momento." },
      { status: 502 },
    );
  }

  const data = await aiResponse.json();
  const answer = extractText(data);

  if (!answer) {
    return Response.json({ error: "La IA no devolvio contenido util." }, { status: 502 });
  }

  return Response.json({ answer });
}
