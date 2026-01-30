import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateInventoryValues() {
  console.log('🔄 Starting migration of inventory values to dynamic fields...\n');

  // Get all inventories that haven't been migrated yet
  const inventories = await prisma.productionInventory.findMany({
    where: {
      useDynamicFields: false,
      status: 'TERMINE', // Only migrate completed inventories
    },
    include: {
      productionCenter: {
        include: {
          approFieldConfigs: true,
          sortieFieldConfigs: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`📊 Found ${inventories.length} inventories to migrate\n`);

  if (inventories.length === 0) {
    console.log('✅ No inventories to migrate. All up to date!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const inventory of inventories) {
    try {
      const dateStr = inventory.date.toISOString().split('T')[0];
      console.log(`📝 [${successCount + errorCount + skippedCount + 1}/${inventories.length}] Processing inventory #${inventory.id} (${dateStr})...`);

      if (!inventory.productionCenter) {
        console.log('   ⚠️  Skipped - No production center assigned');
        skippedCount++;
        continue;
      }

      if (inventory.productionCenter.approFieldConfigs.length === 0) {
        console.log('   ⚠️  Skipped - Production center has no field configurations');
        skippedCount++;
        continue;
      }

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Migrate Approvisionnement values
        const approFieldMap: Record<string, number> = {
          'butanier': inventory.butanier || 0,
          'recuperation': inventory.recuperation || 0,
          'approSAR': inventory.approSAR || 0,
        };

        let approCount = 0;
        for (const fieldConfig of inventory.productionCenter!.approFieldConfigs) {
          if (fieldConfig.name in approFieldMap) {
            await tx.approValue.upsert({
              where: {
                inventoryId_fieldConfigId: {
                  inventoryId: inventory.id,
                  fieldConfigId: fieldConfig.id,
                },
              },
              create: {
                inventoryId: inventory.id,
                fieldConfigId: fieldConfig.id,
                value: approFieldMap[fieldConfig.name],
              },
              update: {
                value: approFieldMap[fieldConfig.name],
              },
            });
            approCount++;
          }
        }

        // Migrate Sortie values
        // For Ngabou center: map old "ngabou" field to new "vrac_local" field
        const sortieFieldMap: Record<string, number> = {
          'ngabou': inventory.ngabou || 0,
          'vrac_local': inventory.ngabou || 0,  // Map ngabou value to vrac_local for Ngabou center
          'exports': inventory.exports || 0,
          'divers': inventory.divers || 0,
        };

        let sortieCount = 0;
        for (const fieldConfig of inventory.productionCenter!.sortieFieldConfigs) {
          if (fieldConfig.name in sortieFieldMap) {
            await tx.sortieValue.upsert({
              where: {
                inventoryId_fieldConfigId: {
                  inventoryId: inventory.id,
                  fieldConfigId: fieldConfig.id,
                },
              },
              create: {
                inventoryId: inventory.id,
                fieldConfigId: fieldConfig.id,
                value: sortieFieldMap[fieldConfig.name],
              },
              update: {
                value: sortieFieldMap[fieldConfig.name],
              },
            });
            sortieCount++;
          }
        }

        // Mark inventory as migrated
        await tx.productionInventory.update({
          where: { id: inventory.id },
          data: { useDynamicFields: true },
        });

        console.log(`   ✅ Migrated: ${approCount} appro fields, ${sortieCount} sortie fields`);
      });

      successCount++;

    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 Migration Summary:');
  console.log('='.repeat(50));
  console.log(`  ✅ Successfully migrated: ${successCount}`);
  console.log(`  ⚠️  Skipped:              ${skippedCount}`);
  console.log(`  ❌ Errors:                ${errorCount}`);
  console.log(`  📊 Total processed:       ${inventories.length}`);
  console.log('='.repeat(50));

  if (errorCount === 0 && skippedCount === 0) {
    console.log('\n🎉 All inventories migrated successfully!');
  } else if (errorCount === 0) {
    console.log('\n✅ Migration completed with some inventories skipped.');
  } else {
    console.log('\n⚠️  Migration completed with errors. Please review the log above.');
  }
}

migrateInventoryValues()
  .catch((e) => {
    console.error('\n❌ Fatal error during migration:', e);
    console.error('\nStack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
