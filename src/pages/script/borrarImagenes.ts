import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.imagen.deleteMany(); // borra todas las imágenes
  console.log('🗑️ Todas las imágenes han sido eliminadas');
}

main()
  .catch((e) => {
    console.error('❌ Error al borrar:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
