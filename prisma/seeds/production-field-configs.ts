import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductionFieldConfigs() {
  console.log('🌱 Seeding production field configurations...\n');

  // Get all production centers
  const centers = await prisma.productionCenter.findMany();

  if (centers.length === 0) {
    console.log('⚠️  No production centers found. Please create centers first.');
    return;
  }

  for (const center of centers) {
    console.log(`📍 Configuring ${center.name}...`);

    // Determine field configs based on center
    let approFields, sortieFields, capacity;

    if (center.name.toLowerCase().includes('ngabou')) {
      // Ngabou configuration
      console.log('   Type: Ngabou Center');

      approFields = [
        { name: 'butanier', label: 'Butanier', order: 1 },
        { name: 'recuperation', label: 'Récupération', order: 2 },
        { name: 'approSAR', label: 'Appro SAR', order: 3 },
      ];

      sortieFields = [
        { name: 'vrac_local', label: 'Vrac Local', order: 1 },  // Not "Ngabou"
        { name: 'exports', label: 'Exports', order: 2 },
        { name: 'divers', label: 'Divers', order: 3 },
      ];

      capacity = {
        numberOfLines: 2,
        capacityPerLine: 6.0,
        totalHourlyCapacity: 12.0,
      };
    } else {
      // Default (Mbao) configuration
      console.log('   Type: Default/Mbao Center');

      approFields = [
        { name: 'butanier', label: 'Butanier', order: 1 },
        { name: 'recuperation', label: 'Récupération', order: 2 },
        { name: 'approSAR', label: 'Appro SAR', order: 3 },
      ];

      sortieFields = [
        { name: 'ngabou', label: 'Ngabou', order: 1 },
        { name: 'exports', label: 'Exports', order: 2 },
        { name: 'divers', label: 'Divers', order: 3 },
      ];

      capacity = {
        numberOfLines: 2,
        capacityPerLine: 12.0,
        totalHourlyCapacity: 24.0,
      };
    }

    // Update capacity
    await prisma.productionCenter.update({
      where: { id: center.id },
      data: capacity,
    });
    console.log(`   ✓ Capacity: ${capacity.totalHourlyCapacity}T/h (${capacity.numberOfLines} × ${capacity.capacityPerLine}T/h)`);

    // Create approvisionnement field configs
    for (const field of approFields) {
      await prisma.approFieldConfig.upsert({
        where: {
          productionCenterId_name: {
            productionCenterId: center.id,
            name: field.name,
          },
        },
        create: {
          productionCenterId: center.id,
          name: field.name,
          label: field.label,
          order: field.order,
          isActive: true,
          isRequired: false,
        },
        update: {
          label: field.label,
          order: field.order,
        },
      });
    }
    console.log(`   ✓ Approvisionnement fields: ${approFields.map(f => f.label).join(', ')}`);

    // Create sortie field configs
    for (const field of sortieFields) {
      await prisma.sortieFieldConfig.upsert({
        where: {
          productionCenterId_name: {
            productionCenterId: center.id,
            name: field.name,
          },
        },
        create: {
          productionCenterId: center.id,
          name: field.name,
          label: field.label,
          order: field.order,
          isActive: true,
          isRequired: false,
        },
        update: {
          label: field.label,
          order: field.order,
        },
      });
    }
    console.log(`   ✓ Sortie fields: ${sortieFields.map(f => f.label).join(', ')}`);

    console.log(`✅ ${center.name} configured successfully\n`);
  }

  console.log('🎉 All production centers configured!');
}

seedProductionFieldConfigs()
  .catch((e) => {
    console.error('❌ Error seeding field configs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
