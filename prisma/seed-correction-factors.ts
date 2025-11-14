// prisma/seed-correction-factors.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Table de facteurs de correction - Extrait de FACTEUR_DE_CORRECTION_DENSITES.xlsx
// 121 températures de 15.0°C à 32.9°C
const CORRECTION_FACTORS = [
  {
    "temperature": 15.0,
    "facteurLiquide": 0.0,
    "facteurGaz": 0.002449
  },
  {
    "temperature": 15.1,
    "facteurLiquide": 0.0001,
    "facteurGaz": 0.002448
  },
  {
    "temperature": 15.2,
    "facteurLiquide": 0.0002,
    "facteurGaz": 0.002447
  },
  {
    "temperature": 15.3,
    "facteurLiquide": 0.0003,
    "facteurGaz": 0.002446
  },
  {
    "temperature": 15.4,
    "facteurLiquide": 0.0004,
    "facteurGaz": 0.002445
  },
  {
    "temperature": 15.5,
    "facteurLiquide": 0.0005,
    "facteurGaz": 0.002444
  },
  {
    "temperature": 15.6,
    "facteurLiquide": 0.0007,
    "facteurGaz": 0.002443
  },
  {
    "temperature": 15.7,
    "facteurLiquide": 0.0008,
    "facteurGaz": 0.002442
  },
  {
    "temperature": 15.8,
    "facteurLiquide": 0.0009,
    "facteurGaz": 0.002441
  },
  {
    "temperature": 15.9,
    "facteurLiquide": 0.001,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 16.0,
    "facteurLiquide": 0.0011,
    "facteurGaz": 0.002439
  },
  {
    "temperature": 16.1,
    "facteurLiquide": 0.0012,
    "facteurGaz": 0.002438
  },
  {
    "temperature": 16.2,
    "facteurLiquide": 0.0013,
    "facteurGaz": 0.002437
  },
  {
    "temperature": 16.3,
    "facteurLiquide": 0.0015,
    "facteurGaz": 0.002436
  },
  {
    "temperature": 16.4,
    "facteurLiquide": 0.0016,
    "facteurGaz": 0.002435
  },
  {
    "temperature": 16.5,
    "facteurLiquide": 0.0017,
    "facteurGaz": 0.002434
  },
  {
    "temperature": 16.6,
    "facteurLiquide": 0.0018,
    "facteurGaz": 0.002433
  },
  {
    "temperature": 16.7,
    "facteurLiquide": 0.0019,
    "facteurGaz": 0.002432
  },
  {
    "temperature": 16.8,
    "facteurLiquide": 0.0021,
    "facteurGaz": 0.002431
  },
  {
    "temperature": 16.9,
    "facteurLiquide": 0.0022,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 17.0,
    "facteurLiquide": 0.0023,
    "facteurGaz": 0.002429
  },
  {
    "temperature": 17.1,
    "facteurLiquide": 0.0024,
    "facteurGaz": 0.002428
  },
  {
    "temperature": 17.2,
    "facteurLiquide": 0.0025,
    "facteurGaz": 0.002427
  },
  {
    "temperature": 17.3,
    "facteurLiquide": 0.0026,
    "facteurGaz": 0.002426
  },
  {
    "temperature": 17.4,
    "facteurLiquide": 0.0027,
    "facteurGaz": 0.002425
  },
  {
    "temperature": 17.5,
    "facteurLiquide": 0.0028,
    "facteurGaz": 0.002424
  },
  {
    "temperature": 17.6,
    "facteurLiquide": 0.003,
    "facteurGaz": 0.002423
  },
  {
    "temperature": 17.7,
    "facteurLiquide": 0.0031,
    "facteurGaz": 0.002422
  },
  {
    "temperature": 17.8,
    "facteurLiquide": 0.0032,
    "facteurGaz": 0.002421
  },
  {
    "temperature": 17.9,
    "facteurLiquide": 0.0033,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 18.0,
    "facteurLiquide": 0.0034,
    "facteurGaz": 0.002419
  },
  {
    "temperature": 18.1,
    "facteurLiquide": 0.0035,
    "facteurGaz": 0.002418
  },
  {
    "temperature": 18.2,
    "facteurLiquide": 0.0036,
    "facteurGaz": 0.002417
  },
  {
    "temperature": 18.3,
    "facteurLiquide": 0.0038,
    "facteurGaz": 0.002416
  },
  {
    "temperature": 18.4,
    "facteurLiquide": 0.0039,
    "facteurGaz": 0.002415
  },
  {
    "temperature": 18.5,
    "facteurLiquide": 0.004,
    "facteurGaz": 0.002413
  },
  {
    "temperature": 18.6,
    "facteurLiquide": 0.0041,
    "facteurGaz": 0.002412
  },
  {
    "temperature": 18.7,
    "facteurLiquide": 0.0042,
    "facteurGaz": 0.002411
  },
  {
    "temperature": 18.8,
    "facteurLiquide": 0.0043,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.9,
    "facteurLiquide": 0.0044,
    "facteurGaz": 0.002409
  },
  {
    "temperature": 19.0,
    "facteurLiquide": 0.0045,
    "facteurGaz": 0.002408
  },
  {
    "temperature": 19.1,
    "facteurLiquide": 0.0047,
    "facteurGaz": 0.002407
  },
  {
    "temperature": 19.2,
    "facteurLiquide": 0.0048,
    "facteurGaz": 0.002406
  },
  {
    "temperature": 19.3,
    "facteurLiquide": 0.005,
    "facteurGaz": 0.002405
  },
  {
    "temperature": 19.4,
    "facteurLiquide": 0.0051,
    "facteurGaz": 0.002404
  },
  {
    "temperature": 19.5,
    "facteurLiquide": 0.0052,
    "facteurGaz": 0.002403
  },
  {
    "temperature": 19.6,
    "facteurLiquide": 0.0053,
    "facteurGaz": 0.002403
  },
  {
    "temperature": 19.7,
    "facteurLiquide": 0.0054,
    "facteurGaz": 0.002402
  },
  {
    "temperature": 19.8,
    "facteurLiquide": 0.0056,
    "facteurGaz": 0.002401
  },
  {
    "temperature": 19.9,
    "facteurLiquide": 0.0057,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 20.0,
    "facteurLiquide": 0.0058,
    "facteurGaz": 0.002399
  },
  {
    "temperature": 20.1,
    "facteurLiquide": 0.0059,
    "facteurGaz": 0.002398
  },
  {
    "temperature": 20.2,
    "facteurLiquide": 0.006,
    "facteurGaz": 0.002397
  },
  {
    "temperature": 20.3,
    "facteurLiquide": 0.0061,
    "facteurGaz": 0.002396
  },
  {
    "temperature": 20.4,
    "facteurLiquide": 0.0062,
    "facteurGaz": 0.002395
  },
  {
    "temperature": 20.5,
    "facteurLiquide": 0.0063,
    "facteurGaz": 0.002394
  },
  {
    "temperature": 20.6,
    "facteurLiquide": 0.0065,
    "facteurGaz": 0.002393
  },
  {
    "temperature": 20.7,
    "facteurLiquide": 0.0066,
    "facteurGaz": 0.002392
  },
  {
    "temperature": 20.8,
    "facteurLiquide": 0.0067,
    "facteurGaz": 0.002391
  },
  {
    "temperature": 20.9,
    "facteurLiquide": 0.0068,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 21.0,
    "facteurLiquide": 0.0069,
    "facteurGaz": 0.002389
  },
  {
    "temperature": 27.0,
    "facteurLiquide": 0.0139,
    "facteurGaz": 0.002331
  },
  {
    "temperature": 27.1,
    "facteurLiquide": 0.014,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 27.2,
    "facteurLiquide": 0.0141,
    "facteurGaz": 0.002329
  },
  {
    "temperature": 27.3,
    "facteurLiquide": 0.0142,
    "facteurGaz": 0.002328
  },
  {
    "temperature": 27.4,
    "facteurLiquide": 0.0143,
    "facteurGaz": 0.002327
  },
  {
    "temperature": 27.5,
    "facteurLiquide": 0.0144,
    "facteurGaz": 0.002326
  },
  {
    "temperature": 27.6,
    "facteurLiquide": 0.0146,
    "facteurGaz": 0.002325
  },
  {
    "temperature": 27.7,
    "facteurLiquide": 0.0147,
    "facteurGaz": 0.002324
  },
  {
    "temperature": 27.8,
    "facteurLiquide": 0.0148,
    "facteurGaz": 0.002323
  },
  {
    "temperature": 27.9,
    "facteurLiquide": 0.0149,
    "facteurGaz": 0.002322
  },
  {
    "temperature": 28.0,
    "facteurLiquide": 0.015,
    "facteurGaz": 0.002321
  },
  {
    "temperature": 28.1,
    "facteurLiquide": 0.0151,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 28.2,
    "facteurLiquide": 0.0152,
    "facteurGaz": 0.002319
  },
  {
    "temperature": 28.3,
    "facteurLiquide": 0.0154,
    "facteurGaz": 0.002318
  },
  {
    "temperature": 28.4,
    "facteurLiquide": 0.0155,
    "facteurGaz": 0.002317
  },
  {
    "temperature": 28.5,
    "facteurLiquide": 0.0156,
    "facteurGaz": 0.002316
  },
  {
    "temperature": 28.6,
    "facteurLiquide": 0.0157,
    "facteurGaz": 0.002315
  },
  {
    "temperature": 28.7,
    "facteurLiquide": 0.0158,
    "facteurGaz": 0.002314
  },
  {
    "temperature": 28.8,
    "facteurLiquide": 0.016,
    "facteurGaz": 0.002313
  },
  {
    "temperature": 28.9,
    "facteurLiquide": 0.0161,
    "facteurGaz": 0.002312
  },
  {
    "temperature": 29.0,
    "facteurLiquide": 0.0162,
    "facteurGaz": 0.002311
  },
  {
    "temperature": 29.1,
    "facteurLiquide": 0.0163,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 29.2,
    "facteurLiquide": 0.0164,
    "facteurGaz": 0.002309
  },
  {
    "temperature": 29.3,
    "facteurLiquide": 0.0165,
    "facteurGaz": 0.002308
  },
  {
    "temperature": 29.4,
    "facteurLiquide": 0.0167,
    "facteurGaz": 0.002307
  },
  {
    "temperature": 29.5,
    "facteurLiquide": 0.0168,
    "facteurGaz": 0.002307
  },
  {
    "temperature": 29.6,
    "facteurLiquide": 0.0169,
    "facteurGaz": 0.002306
  },
  {
    "temperature": 29.7,
    "facteurLiquide": 0.017,
    "facteurGaz": 0.002305
  },
  {
    "temperature": 29.8,
    "facteurLiquide": 0.0172,
    "facteurGaz": 0.002304
  },
  {
    "temperature": 29.9,
    "facteurLiquide": 0.0173,
    "facteurGaz": 0.002303
  },
  {
    "temperature": 30.0,
    "facteurLiquide": 0.0174,
    "facteurGaz": 0.002303
  },
  {
    "temperature": 30.1,
    "facteurLiquide": 0.0175,
    "facteurGaz": 0.002302
  },
  {
    "temperature": 30.2,
    "facteurLiquide": 0.0176,
    "facteurGaz": 0.002301
  },
  {
    "temperature": 30.3,
    "facteurLiquide": 0.0177,
    "facteurGaz": 0.002301
  },
  {
    "temperature": 30.4,
    "facteurLiquide": 0.0178,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.5,
    "facteurLiquide": 0.0179,
    "facteurGaz": 0.002299
  },
  {
    "temperature": 30.6,
    "facteurLiquide": 0.0181,
    "facteurGaz": 0.002298
  },
  {
    "temperature": 30.7,
    "facteurLiquide": 0.0181,
    "facteurGaz": 0.002298
  },
  {
    "temperature": 30.8,
    "facteurLiquide": 0.0182,
    "facteurGaz": 0.002296
  },
  {
    "temperature": 30.9,
    "facteurLiquide": 0.0183,
    "facteurGaz": 0.02295
  },
  {
    "temperature": 31.0,
    "facteurLiquide": 0.0184,
    "facteurGaz": 0.002294
  },
  {
    "temperature": 31.1,
    "facteurLiquide": 0.0185,
    "facteurGaz": 0.002293
  },
  {
    "temperature": 31.2,
    "facteurLiquide": 0.0186,
    "facteurGaz": 0.002292
  },
  {
    "temperature": 31.3,
    "facteurLiquide": 0.0187,
    "facteurGaz": 0.002291
  },
  {
    "temperature": 31.4,
    "facteurLiquide": 0.0189,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.5,
    "facteurLiquide": 0.019,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.6,
    "facteurLiquide": 0.0191,
    "facteurGaz": 0.002289
  },
  {
    "temperature": 31.7,
    "facteurLiquide": 0.0192,
    "facteurGaz": 0.002288
  },
  {
    "temperature": 31.8,
    "facteurLiquide": 0.0194,
    "facteurGaz": 0.002287
  },
  {
    "temperature": 31.9,
    "facteurLiquide": 0.0195,
    "facteurGaz": 0.002287
  },
  {
    "temperature": 32.0,
    "facteurLiquide": 0.0196,
    "facteurGaz": 0.002286
  },
  {
    "temperature": 32.1,
    "facteurLiquide": 0.0197,
    "facteurGaz": 0.002285
  },
  {
    "temperature": 32.2,
    "facteurLiquide": 0.0198,
    "facteurGaz": 0.002284
  },
  {
    "temperature": 32.3,
    "facteurLiquide": 0.0199,
    "facteurGaz": 0.002283
  },
  {
    "temperature": 32.4,
    "facteurLiquide": 0.0201,
    "facteurGaz": 0.02282
  },
  {
    "temperature": 32.5,
    "facteurLiquide": 0.0202,
    "facteurGaz": 0.002281
  },
  {
    "temperature": 32.6,
    "facteurLiquide": 0.0203,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.7,
    "facteurLiquide": 0.0204,
    "facteurGaz": 0.002279
  },
  {
    "temperature": 32.8,
    "facteurLiquide": 0.0205,
    "facteurGaz": 0.002279
  },
  {
    "temperature": 32.9,
    "facteurLiquide": 0.0206,
    "facteurGaz": 0.002278
  }
];

async function main() {
  console.log('🌱 Seeding correction factors table...');
  console.log(`📊 ${CORRECTION_FACTORS.length} températures à insérer`);

  // Supprimer les anciennes données
  const deleted = await prisma.correctionFactorTable.deleteMany({});
  console.log(`🗑️  ${deleted.count} anciennes entrées supprimées`);

  let created = 0;

  // Insérer les nouvelles données
  for (const factor of CORRECTION_FACTORS) {
    await prisma.correctionFactorTable.create({
      data: {
        temperature: factor.temperature,
        facteurLiquide: factor.facteurLiquide,
        facteurVapeur: factor.facteurGaz
      }
    });
    created++;
    
    // Afficher la progression tous les 20 entrées
    if (created % 20 === 0) {
      console.log(`   ⏳ ${created}/${CORRECTION_FACTORS.length} entrées créées...`);
    }
  }

  console.log(`\n✅ Seed terminé avec succès!`);
  console.log(`   - ${created} entrées créées`);
  console.log(`   - Plage: ${CORRECTION_FACTORS[0].temperature}°C à ${CORRECTION_FACTORS[CORRECTION_FACTORS.length - 1].temperature}°C`);
  
  // Vérification rapide
  const count = await prisma.correctionFactorTable.count();
  console.log(`   - Vérification DB: ${count} entrées trouvées`);
  
  // Test quelques valeurs
  console.log(`\n🧪 Tests de vérification:`);
  const testTemps = [15.0, 27.1, 29.4, 29.5];
  for (const temp of testTemps) {
    const result = await prisma.correctionFactorTable.findUnique({
      where: { temperature: temp }
    });
    if (result) {
      console.log(`   ✅ ${temp.toFixed(1)}°C: Liquide=${result.facteurLiquide.toFixed(6)}, Gaz=${result.facteurVapeur.toFixed(6)}`);
    } else {
      console.log(`   ❌ ${temp.toFixed(1)}°C: NON TROUVÉ`);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });