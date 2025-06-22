import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST({ request }: { request: Request }) {
  // --- Paso de depuración: Imprime el tipo de request para verificar ---
  console.log('Tipo de request en API:', typeof request);
  console.log('¿request tiene .json()?', typeof (request as any).json);
  // --- Fin paso de depuración ---

  let url: string;
  let altText: string | undefined;

  try {
    // Es crucial verificar el Content-Type para saber cómo parsear el body
    const contentType = request.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      console.error('Content-Type no es application/json:', contentType);
      return new Response(JSON.stringify({ error: 'Tipo de contenido no soportado. Se espera application/json.' }), {
        status: 415, // Unsupported Media Type
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Intentamos leer el cuerpo como JSON
    const body = await request.json(); // <-- Aquí es donde ocurre el error
    url = body.url;
    altText = body.altText;

  } catch (error: any) {
    console.error('Error al parsear el cuerpo JSON de la solicitud:', error);
    // Si request.json() no es una función, el error debería aparecer aquí
    if (error instanceof TypeError && error.message.includes('request.json is not a function')) {
        return new Response(JSON.stringify({ error: 'El objeto de solicitud no tiene el método .json(). Esto es inesperado en Astro. Verifica tu setup.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ error: 'Error al procesar los datos enviados. Asegúrate de que el JSON es válido.' }), {
      status: 400, // Bad Request
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Validar que la URL no esté vacía
  if (!url) {
    return new Response(JSON.stringify({ error: 'La URL de la imagen es requerida.' }), {
      status: 400, // Bad Request
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Guardar el nuevo registro de imagen en la base de datos
    const nuevaImagen = await prisma.imagen.create({
      data: {
        url: url,
        altText: altText || null,
      },
    });

    // 4. Responder con la imagen creada
    return new Response(JSON.stringify(nuevaImagen), {
      status: 201, // Created
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error al añadir imagen a la DB:', error);

    if (error.code === 'P2002' && error.meta?.target?.includes('url')) {
      return new Response(JSON.stringify({ error: 'Ya existe una imagen con esta URL.' }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Error interno del servidor al añadir la imagen.' }), {
      status: 500, // Internal Server Error
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await prisma.$disconnect();
  }
}