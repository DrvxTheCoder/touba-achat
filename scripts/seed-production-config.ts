// scripts/seed-production-config.ts
// Script to seed initial production configuration data

import { PrismaClient, BottleType, ReservoirType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production configuration...');

  // 1. Seed BottleTypeConfig
  console.log('📦 Seeding bottle type configurations...');
  const bottleTypes = [
    { type: BottleType.B2_7, weight: 2.7, name: '2.7kg' },
    { type: BottleType.B6, weight: 6, name: '6kg' },
    { type: BottleType.B9, weight: 9, name: '9kg' },
    { type: BottleType.B12_5, weight: 12.5, name: '12.5kg' },
    { type: BottleType.B12_5K, weight: 12.5, name: '12.5kg Kheuweul' },
    { type: BottleType.B38, weight: 38, name: '38kg' },
  ];

  for (const bottle of bottleTypes) {
    await prisma.bottleTypeConfig.upsert({
      where: { type: bottle.type },
      update: { weight: bottle.weight, name: bottle.name },
      create: bottle,
    });
  }
  console.log('✅ Bottle type configurations seeded');

  // 2. Create default ProductionCenter if none exists
  console.log('🏭 Seeding production centers...');

  // Find an admin or user with production access
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'ADMIN' },
        { access: { has: 'CREATE_PRODUCTION_INVENTORY' } }
      ]
    },
    orderBy: { id: 'asc' }
  });

  if (!adminUser) {
    console.log('❌ No admin or production user found. Please create a user first.');
    return;
  }

  const defaultCenter = await prisma.productionCenter.upsert({
    where: { name: 'Centre GPL Principal' },
    update: {},
    create: {
      name: 'Centre GPL Principal',
      address: 'Touba, Sénégal',
      chefProductions: {
        create: {
          userId: adminUser.id,
        },
      },
    },
  });
  console.log(`✅ Production center created: ${defaultCenter.name}`);

  // 3. Seed ReservoirConfig for the default center
  console.log('🔵 Seeding reservoir configurations...');
  const reservoirs = [
    { name: 'D100', type: ReservoirType.SPHERE, capacity: 3304.491 },
    { name: 'SO2', type: ReservoirType.SPHERE, capacity: 3297.610 },
    { name: 'SO3', type: ReservoirType.SPHERE, capacity: 3324.468 },
  ];

  for (const reservoir of reservoirs) {
    await prisma.reservoirConfig.upsert({
      where: {
        name_productionCenterId: {
          name: reservoir.name,
          productionCenterId: defaultCenter.id
        }
      },
      update: { type: reservoir.type, capacity: reservoir.capacity },
      create: {
        ...reservoir,
        productionCenterId: defaultCenter.id
      },
    });
  }
  console.log('✅ Reservoir configurations seeded');

  // 4. Update existing ProductionInventory records to use default center
  console.log('🔄 Updating existing production inventories...');
  const updateCount = await prisma.productionInventory.updateMany({
    where: { productionCenterId: null },
    data: { productionCenterId: defaultCenter.id }
  });
  console.log(`✅ Updated ${updateCount.count} production inventories with default center`);

  // 5. Update existing Reservoir records to link to ReservoirConfig
  console.log('🔄 Linking existing reservoirs to configurations...');
  const existingReservoirs = await prisma.reservoir.findMany({
    where: { reservoirConfigId: null }
  });

  for (const reservoir of existingReservoirs) {
    const config = await prisma.reservoirConfig.findFirst({
      where: {
        name: reservoir.name,
        productionCenterId: defaultCenter.id
      }
    });

    if (config) {
      await prisma.reservoir.update({
        where: { id: reservoir.id },
        data: { reservoirConfigId: config.id }
      });
    }
  }
  console.log(`✅ Linked ${existingReservoirs.length} existing reservoirs to configurations`);

  console.log('🎉 Production configuration seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding production configuration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
