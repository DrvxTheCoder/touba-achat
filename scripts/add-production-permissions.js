// scripts/add-production-permissions.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Recherche des utilisateurs avec des rôles autorisés...\n');

    // Récupérer tous les utilisateurs avec des rôles administratifs
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'RESPONSABLE', 'IT_ADMIN', 'DAF', 'DOG', 'DCM', 'DRH']
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        access: true
      }
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec les rôles requis.');
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);

    for (const user of users) {
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Permissions actuelles: ${user.access.join(', ') || 'Aucune'}`);

      // Vérifier si l'utilisateur a déjà les permissions
      const hasCreatePermission = user.access.includes('CREATE_PRODUCTION_INVENTORY');
      const hasViewPermission = user.access.includes('VIEW_PRODUCTION_DASHBOARD');

      if (hasCreatePermission && hasViewPermission) {
        console.log(`   ✅ Cet utilisateur a déjà toutes les permissions de production\n`);
        continue;
      }

      // Ajouter les permissions manquantes
      const newAccess = [...new Set([
        ...user.access,
        'CREATE_PRODUCTION_INVENTORY',
        'VIEW_PRODUCTION_DASHBOARD',
        'VALIDATE_PRODUCTION_INVENTORY',
        'EXPORT_PRODUCTION_REPORTS'
      ])];

      await prisma.user.update({
        where: { id: user.id },
        data: { access: newAccess }
      });

      console.log(`   ✨ Permissions de production ajoutées!`);
      console.log(`   Nouvelles permissions: ${newAccess.join(', ')}\n`);
    }

    console.log('✅ Terminé! Les permissions ont été ajoutées.');
    console.log('\n💡 Déconnectez-vous et reconnectez-vous pour que les changements prennent effet.\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
