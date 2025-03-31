import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.imagen.create({
    data: {
      url: '/imagenes/Xolmis pyrope.jpg',
      descripcion: 'Xolmis pyrope',
    }
  });

  console.log('✅ Imagen agregada');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
