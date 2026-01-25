import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying migration data integrity...\n');

  // Get all migrated inventories
  const inventories = await prisma.productionInventory.findMany({
    where: { useDynamicFields: true },
    include: {
      approValues: { include: { fieldConfig: true } },
      sortieValues: { include: { fieldConfig: true } },
      productionCenter: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`📊 Checking ${inventories.length} migrated inventories...\n`);

  if (inventories.length === 0) {
    console.log('ℹ️  No migrated inventories found. Run migration first.');
    return;
  }

  let mismatchCount = 0;
  let perfectCount = 0;
  const issues: Array<{
    id: number;
    date: string;
    center: string;
    issue: string;
    details: string;
  }> = [];

  for (const inv of inventories) {
    const dateStr = inv.date.toISOString().split('T')[0];
    const centerName = inv.productionCenter?.name || 'Unknown';

    // Calculate legacy totals
    const legacyApproTotal = (inv.butanier || 0) + (inv.recuperation || 0) + (inv.approSAR || 0);
    const legacySortieTotal = (inv.ngabou || 0) + (inv.exports || 0) + (inv.divers || 0);

    // Calculate dynamic totals
    const dynamicApproTotal = inv.approValues.reduce((sum, av) => sum + av.value, 0);
    const dynamicSortieTotal = inv.sortieValues.reduce((sum, sv) => sum + sv.value, 0);

    // Check for mismatches (allow 0.01 tolerance for floating point)
    const approMatch = Math.abs(legacyApproTotal - dynamicApproTotal) < 0.01;
    const sortieMatch = Math.abs(legacySortieTotal - dynamicSortieTotal) < 0.01;

    if (!approMatch || !sortieMatch) {
      mismatchCount++;

      if (!approMatch) {
        issues.push({
          id: inv.id,
          date: dateStr,
          center: centerName,
          issue: 'Approvisionnement mismatch',
          details: `Legacy: ${legacyApproTotal.toFixed(3)}T, Dynamic: ${dynamicApproTotal.toFixed(3)}T`,
        });
      }

      if (!sortieMatch) {
        issues.push({
          id: inv.id,
          date: dateStr,
          center: centerName,
          issue: 'Sortie mismatch',
          details: `Legacy: ${legacySortieTotal.toFixed(3)}T, Dynamic: ${dynamicSortieTotal.toFixed(3)}T`,
        });
      }
    } else {
      perfectCount++;
    }
  }

  // Print results
  console.log('='.repeat(70));
  console.log('📈 Verification Results:');
  console.log('='.repeat(70));
  console.log(`  ✅ Perfect matches:       ${perfectCount} inventories`);
  console.log(`  ❌ Mismatches found:      ${mismatchCount} inventories`);
  console.log(`  📊 Total verified:        ${inventories.length} inventories`);
  console.log('='.repeat(70));

  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:\n');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. Inventory #${issue.id} (${issue.date}) - ${issue.center}`);
      console.log(`   ${issue.issue}: ${issue.details}\n`);
    });

    console.log('🔧 Recommended actions:');
    console.log('   1. Review the mismatches above');
    console.log('   2. Check if field configurations are correct');
    console.log('   3. Re-run migration if needed: npx ts-node prisma/migrations/migrate-inventory-values.ts');
  } else {
    console.log('\n🎉 Perfect! All migrated data matches legacy values exactly.');
    console.log('✅ Migration integrity verified successfully.');
  }

  // Additional checks
  console.log('\n' + '='.repeat(70));
  console.log('🔎 Additional Checks:');
  console.log('='.repeat(70));

  // Check for inventories without field values
  const inventoriesWithoutValues = inventories.filter(
    inv => inv.approValues.length === 0 || inv.sortieValues.length === 0
  );

  if (inventoriesWithoutValues.length > 0) {
    console.log(`⚠️  ${inventoriesWithoutValues.length} inventories have missing field values:`);
    inventoriesWithoutValues.forEach(inv => {
      const dateStr = inv.date.toISOString().split('T')[0];
      const missing = [];
      if (inv.approValues.length === 0) missing.push('appro');
      if (inv.sortieValues.length === 0) missing.push('sortie');
      console.log(`   - Inventory #${inv.id} (${dateStr}): Missing ${missing.join(', ')} values`);
    });
  } else {
    console.log('✅ All inventories have field values');
  }

  // Check for unmigrated inventories
  const unmigrated = await prisma.productionInventory.count({
    where: {
      useDynamicFields: false,
      status: 'TERMINE',
    },
  });

  if (unmigrated > 0) {
    console.log(`ℹ️  ${unmigrated} completed inventories are not yet migrated`);
  } else {
    console.log('✅ All completed inventories have been migrated');
  }

  console.log('='.repeat(70));
}

verifyMigration()
  .catch((e) => {
    console.error('\n❌ Error during verification:', e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
