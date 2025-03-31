import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ url }) {
  const pagina = Number(url.searchParams.get('pagina') || '1');
  const porPagina = 6;
  const skip = (pagina - 1) * porPagina;

  const imagenes = await prisma.imagen.findMany({
    skip,
    take: porPagina,
    orderBy: { fechaSubida: 'desc' }
  });

  return new Response(JSON.stringify(imagenes), {
    headers: { 'Content-Type': 'application/json' }
  });
}
