# Production Fields & Capacity Migration Guide

This guide will help you migrate your production system from hardcoded approvisionnement/sorties fields to a flexible, configuration-based system with dynamic production capacity.

## 🎯 What This Migration Does

### Before:
- ❌ Hardcoded fields: `butanier`, `recuperation`, `approSAR`, `ngabou`, `exports`, `divers`
- ❌ Fixed 24T/h capacity assumption
- ❌ Same fields for all centers
- ❌ Ngabou center showing "Ngabou" as a sortie field (doesn't make sense)

### After:
- ✅ Configurable fields per production center
- ✅ Dynamic capacity configuration (Mbao: 24T/h, Ngabou: 12T/h)
- ✅ Each center can have unique approvisionnement/sorties fields
- ✅ Ngabou uses "Vrac Local" instead of "Ngabou"
- ✅ All existing data preserved and migrated safely

---

## 📋 Prerequisites

Before starting, ensure:
- [ ] You have a backup of your database
- [ ] You're on a development/staging environment (recommended for first run)
- [ ] Node.js and npm/pnpm are installed
- [ ] You have approximately 42 production inventories to migrate

---

## 🚀 Migration Steps

### Step 1: Apply Database Schema Changes

```bash
# Generate and apply the migration
npx prisma migrate dev --name add_dynamic_production_fields

# This creates:
# - ApproFieldConfig table
# - SortieFieldConfig table
# - ApproValue table
# - SortieValue table
# - Adds capacity fields to ProductionCenter
# - Adds useDynamicFields flag to ProductionInventory
```

**Expected output:**
```
✔ Generated Prisma Client
✔ Applied migration: add_dynamic_production_fields
```

---

### Step 2: Seed Field Configurations

This creates the default field configurations for each production center and sets their capacities.

```bash
npx ts-node prisma/seeds/production-field-configs.ts
```

**Expected output:**
```
🌱 Seeding production field configurations...

📍 Configuring Mbao...
   Type: Default/Mbao Center
   ✓ Capacity: 24T/h (2 × 12T/h)
   ✓ Approvisionnement fields: Butanier, Récupération, Appro SAR
   ✓ Sortie fields: Ngabou, Exports, Divers
✅ Mbao configured successfully

📍 Configuring Ngabou...
   Type: Ngabou Center
   ✓ Capacity: 12T/h (2 × 6T/h)
   ✓ Approvisionnement fields: Butanier, Récupération, Appro SAR
   ✓ Sortie fields: Vrac Local, Exports, Divers
✅ Ngabou configured successfully

🎉 All production centers configured!
```

---

### Step 3: Migrate Existing Inventory Data

This migrates your ~42 existing inventories from the old hardcoded fields to the new dynamic field system.

```bash
npx ts-node prisma/migrations/migrate-inventory-values.ts
```

**Expected output:**
```
🔄 Starting migration of inventory values to dynamic fields...

📊 Found 42 inventories to migrate

📝 [1/42] Processing inventory #1 (2024-11-15)...
   ✅ Migrated: 3 appro fields, 3 sortie fields
📝 [2/42] Processing inventory #2 (2024-11-16)...
   ✅ Migrated: 3 appro fields, 3 sortie fields
...
📝 [42/42] Processing inventory #42 (2024-12-26)...
   ✅ Migrated: 3 appro fields, 3 sortie fields

==================================================
📈 Migration Summary:
==================================================
  ✅ Successfully migrated: 42
  ⚠️  Skipped:              0
  ❌ Errors:                0
  📊 Total processed:       42
==================================================

🎉 All inventories migrated successfully!
```

**⏱️ Time estimate:** < 10 seconds for 42 inventories

---

### Step 4: Verify Data Integrity

This verification script ensures all data was migrated correctly.

```bash
npx ts-node prisma/migrations/verify-migration.ts
```

**Expected output:**
```
🔍 Verifying migration data integrity...

📊 Checking 42 migrated inventories...

======================================================================
📈 Verification Results:
======================================================================
  ✅ Perfect matches:       42 inventories
  ❌ Mismatches found:      0 inventories
  📊 Total verified:        42 inventories
======================================================================

🎉 Perfect! All migrated data matches legacy values exactly.
✅ Migration integrity verified successfully.

======================================================================
🔎 Additional Checks:
======================================================================
✅ All inventories have field values
✅ All completed inventories have been migrated
======================================================================
```

---

## 🎉 Success! What's Changed?

### Database:
- ✅ New tables created for dynamic fields
- ✅ All 42 inventories migrated to new system
- ✅ Legacy fields preserved (for safety)
- ✅ Production capacities configured

### Dashboard:
- 🔄 **Next Step**: Dashboard will now show dynamic capacity (12T/h for Ngabou, 24T/h for Mbao)
- 🔄 **Next Step**: Rendement percentage will be calculated against correct capacity

### PDF Exports:
- 🔄 **Next Step**: Monthly PDFs will show dynamic "% XT" column based on center capacity
- 🔄 **Next Step**: Field columns will be dynamic based on center configuration

---

## 🛠️ Troubleshooting

### Issue: Migration shows errors

**Solution:** Check the error message. Common issues:
- No production centers configured → Create centers first
- Missing field configurations → Run step 2 again
- Database connection issues → Check your `.env` file

### Issue: Verification shows mismatches

**Possible causes:**
- Field configurations don't match legacy structure
- Data was modified during migration

**Solution:**
```bash
# Re-run migration (it's idempotent - safe to run multiple times)
npx ts-node prisma/migrations/migrate-inventory-values.ts

# Verify again
npx ts-node prisma/migrations/verify-migration.ts
```

### Issue: Want to rollback

**To rollback:**
```bash
# Set all inventories back to legacy mode
npx prisma studio
# In Prisma Studio: Update all ProductionInventory records, set useDynamicFields = false

# Or via SQL:
UPDATE "ProductionInventory" SET "useDynamicFields" = false;
```

The legacy fields (`butanier`, `ngabou`, etc.) are still there, so rollback is safe.

---

## 📊 What Happens to New Inventories?

After migration:
- ✅ New inventories will automatically use dynamic fields
- ✅ Forms will render fields based on production center configuration
- ✅ Stock calculations work with both old and new data
- ✅ Reports and PDFs handle both formats seamlessly

---

## 🔐 Safety Features

1. **Non-destructive**: Legacy fields kept intact
2. **Atomic transactions**: Each inventory migration is all-or-nothing
3. **Idempotent scripts**: Safe to run multiple times
4. **Verification included**: Built-in data integrity checks
5. **Easy rollback**: Just flip `useDynamicFields` flag

---

## 📞 Need Help?

If you encounter issues during migration:
1. Check the error messages in the console
2. Review this guide's troubleshooting section
3. Ensure you have a database backup before retrying
4. The migration is designed to be safe - you can re-run scripts if needed

---

## ✅ Post-Migration Checklist

After successful migration:
- [ ] All 42 inventories migrated (check verification output)
- [ ] Production center capacities configured
- [ ] Field configurations created for each center
- [ ] Data verification passed with 0 mismatches
- [ ] Dashboard shows correct capacity percentages
- [ ] Test creating a new inventory (should use dynamic fields)
- [ ] Test exporting monthly PDF (should show dynamic columns)

---

## 🎊 You're Done!

Your production system is now fully flexible and ready to handle:
- Multiple production centers with different capacities
- Custom approvisionnement/sorties fields per center
- Accurate rendement calculations based on actual capacity
- Future expansion to new centers without code changes

**Migration time:** ~2 minutes total
**Data at risk:** None (legacy fields preserved)
**Downtime required:** Zero (can migrate while system is running)
