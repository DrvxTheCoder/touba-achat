import { PrismaClient, Role, Access, EDBStatus, CategoryType, EDBEventType, AttachmentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;

  // Test database connection
  try {
    await prisma.$connect();
    console.log('Connexion à la base de données réussie.');
  } catch (error) {
    console.error('Échec de la connexion à la base de données:', error);
    process.exit(1);
  }

  // Create departments
  const departmentNames = [
    'Administration IT',
    'Direction Administrative et Financière',
    'Direction Ressources Humaines',
    'Direction Générale',
    'Direction Opérations Gaz',
    'Direction Commerciale Marketing',
  ];

  const departments = await Promise.all(
    departmentNames.map(async (name) => {
      const existingDepartment = await prisma.department.findFirst({ where: { name } });
      if (existingDepartment) {
        return existingDepartment;
      } else {
        return prisma.department.create({ data: { name } });
      }
    })
  );


  console.log('Départements créés avec succès.');

  // Create categories
  const categories = [
    { name: 'Équipement de distribution', type: CategoryType.DEFAULT },
    { name: 'Matériel de stockage', type: CategoryType.DEFAULT },
    { name: 'Véhicules et transport', type: CategoryType.DEFAULT },
    { name: 'Équipement de sécurité', type: CategoryType.DEFAULT },
    { name: 'Fournitures de bureau', type: CategoryType.DEFAULT },
    { name: 'Matériel informatique', type: CategoryType.DEFAULT },
    { name: 'Maintenance et réparations', type: CategoryType.DEFAULT },
    { name: 'Formation et développement', type: CategoryType.DEFAULT },
    { name: 'Équipement de protection individuelle', type: CategoryType.DEFAULT },
    { name: 'Outils et équipements spécialisés', type: CategoryType.DEFAULT },
    { name: 'Marketing et publicité', type: CategoryType.DEFAULT },
    { name: 'Services professionnels', type: CategoryType.DEFAULT },
    { name: 'Logiciels et licences', type: CategoryType.DEFAULT },
    { name: 'Mobilier de bureau', type: CategoryType.DEFAULT },
    { name: 'Uniformes et vêtements de travail', type: CategoryType.DEFAULT },
    { name: 'Équipement de communication', type: CategoryType.DEFAULT },
    { name: 'Fournitures d\'entretien', type: CategoryType.DEFAULT },
    { name: 'Carburant pour véhicules de société', type: CategoryType.DEFAULT },
    { name: 'Équipement environnemental', type: CategoryType.DEFAULT },
    { name: 'Divers / Non-catégorisé', type: CategoryType.DEFAULT },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('Catégories créées avec succès.');

  // Create users and employees
  const usersData = [
    {
      name: 'Administrateur',
      email: 'admin@touba-oil.com',
      role: Role.ADMIN,
      access: [Access.APPROVE_EDB, Access.FINAL_APPROVAL],
      departmentName: 'Administration IT',
      matriculation: 'ADM001',
      jobTitle: 'Administrateur Plateforme',
    },
    {
      name: 'Djiby Seye',
      email: 'dseye@touba-oil.com',
      role: Role.DIRECTEUR_GENERAL,
      access: [Access.APPROVE_EDB, Access.FINAL_APPROVAL],
      departmentName: 'Direction Générale',
      matriculation: '25241',
      jobTitle: 'Directeur Général',
    },
    {
      name: 'Keba Gnabaly',
      email: 'keba.gnabaly@touba-oil.com',
      role: Role.MAGASINIER,
      access: [Access.ATTACH_DOCUMENTS],
      departmentName: 'Direction Opérations Gaz',
      matriculation: '24040',
      jobTitle: 'Responsable Service Achat',
    },
    {
      name: 'Mame Diarra Bousso Dieng',
      email: 'mdiarra.dieng@touba-oil.com',
      role: Role.MAGASINIER,
      access: [Access.ATTACH_DOCUMENTS],
      departmentName: 'Direction Opérations Gaz',
      matriculation: '26349',
      jobTitle: 'Responsable Service Achat',
    },
    {
      name: 'Rokhaya Thiam',
      email: 'service.achat@touba-oil.com',
      role: Role.MAGASINIER,
      access: [Access.ATTACH_DOCUMENTS],
      departmentName: 'Direction Opérations Gaz',
      matriculation: '26296',
      jobTitle: 'Responsable Service Achat',
    },
    {
      name: 'Beskaye Diop',
      email: 'beskaye.diop@touba-oil.com',
      role: Role.RESPONSABLE,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Administrative et Financière',
      matriculation: '26263',
      jobTitle: 'Responsable Comptabilité',
    },
    {
      name: 'Alboury Ndao',
      email: 'alboury.ndao@touba-oil.com',
      role: Role.RESPONSABLE,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Administrative et Financière',
      matriculation: '25672',
      jobTitle: 'Responsable Informatique',
    },
    {
      name: 'Mamadou Diouf',
      email: 'mamadou.diouf@touba-oil.com',
      role: Role.RESPONSABLE,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Commerciale Marketing',
      matriculation: '26300',
      jobTitle: 'Responsable Commercial',
    },
    {
      name: 'Ibra Diop',
      email: 'ibra.diop@touba-oil.com',
      role: Role.DIRECTEUR,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Ressources Humaines',
      matriculation: '26294',
      jobTitle: 'Directeur Ressources Humaines',
    },
    {
      name: 'Bineta Dieng',
      email: 'bineta.dieng@touba-oil.com',
      role: Role.RH,
      access: [Access.APPROVE_EDB, Access.RH_PROCESS],
      departmentName: 'Direction Ressources Humaines',
      matriculation: '26309',
      jobTitle: 'Chargée Ressources Humaines',
    },
    {
      name: 'Safietou Ndour',
      email: 'mme.ndour@touba-oil.com',
      role: Role.DIRECTEUR,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Administrative et Financière',
      matriculation: '26290',
      jobTitle: 'Directrice Administrative et Financière',
    },
    {
      name: 'Caty Coulibaly',
      email: 'mme.coulibaly@touba-oil.com',
      role: Role.DIRECTEUR,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Commerciale Marketing',
      matriculation: '25122',
      jobTitle: 'Directrice Commerciale Marketing',
    },
    {
      name: 'Daouda Badji',
      email: 'daouda.badji@touba-oil.com',
      role: Role.DIRECTEUR,
      access: [Access.APPROVE_EDB],
      departmentName: 'Direction Opérations Gaz',
      matriculation: '25239',
      jobTitle: 'Directeur Opérations Gaz',
    },
    {
      name: 'Aminata Gaye',
      email: 'aminata.gaye@touba-oil.com',
      role: Role.USER,
      access: [],
      departmentName: 'Direction Générale',
      matriculation: '26346',
      jobTitle: 'Responsable Juridique et Contentieux, Assistante DG',
    },
    {
      name: 'Paul Flan',
      email: 'paul.flan@touba-oil.com',
      role: Role.IT_ADMIN,
      access: [Access.IT_APPROVAL],
      departmentName: 'Direction Administrative et Financière',
      matriculation: '26344',
      jobTitle: 'Assistant Informatique',
    },
    {
      name: 'Arame Niang',
      email: 'arame.niang@touba-oil.com',
      role: Role.USER,
      access: [Access.CHOOSE_SUPPLIER],
      departmentName: 'Direction Commerciale Marketing',
      matriculation: '26284',
      jobTitle: 'Agent Commerciale',
    },

  ];

  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        access: userData.access,
        password: hashedPassword,
      },
    });

    const department = departments.find(d => d.name === userData.departmentName);

    if (!department) {
      console.error(`Département non trouvé: ${userData.departmentName}`);
      continue;
    }

    await prisma.employee.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
        matriculation: userData.matriculation,
        phoneNumber: '+221-123456789', // Placeholder phone number
        userId: user.id,
        currentDepartmentId: department.id,
        jobTitle: userData.jobTitle,
      },
    });

    console.log(`Utilisateur et employé créés/mis à jour: ${userData.name}`);
  }

  // Create a user without an employee record
  const nonEmployeeUser = await prisma.user.upsert({
    where: { email: 'audit@touba-oil.com' },
    update: {},
    create: {
      name: 'Audit',
      email: 'audit@touba-oil.com',
      role: Role.AUDIT,
      access: [],
      password: await bcrypt.hash('audit123', saltRounds),
    },
  });

  console.log(`Utilisateur non-employé créé/mis à jour: ${nonEmployeeUser.name}`);

  // // Create sample EtatDeBesoin
  // const sampleEDB = await prisma.etatDeBesoin.create({
  //   data: {
  //     edbId: 'EDB001',
  //     title: 'Achat de matériel informatique',
  //     description: { details: 'Besoin de 5 nouveaux ordinateurs portables pour l\'équipe de développement.' },
  //     status: EDBStatus.SUBMITTED,
  //     department: { connect: { name: 'Administration IT' } },
  //     creator: { connect: { email: 'paul.flan@touba-oil.com' } },
  //     userCreator: { connect: { email: 'paul.flan@touba-oil.com' } },
  //     category: { connect: { name: 'Matériel informatique' } },
  //     itApprovalRequired: true,
  //   },
  // });

  // console.log('EtatDeBesoin exemple créé avec succès.');

  // // Create sample EtatDeBesoinAuditLog
  // await prisma.etatDeBesoinAuditLog.create({
  //   data: {
  //     etatDeBesoin: { connect: { id: sampleEDB.id } },
  //     user: { connect: { email: 'paul.flan@touba-oil.com' } },
  //     eventType: EDBEventType.SUBMITTED,
  //     details: { action: 'Soumission initiale de l\'EDB' },
  //   },
  // });

  // console.log('Journal d\'audit EDB exemple créé avec succès.');

  // // Create sample Attachment
  // await prisma.attachment.create({
  //   data: {
  //     edb: { connect: { id: sampleEDB.id } },
  //     filePath: '/uploads/devis_informatique.pdf',
  //     fileName: 'devis_informatique.pdf',
  //     supplierName: 'InfoTech SARL',
  //     totalAmount: 5000000,
  //     uploader: { connect: { email: 'paul.flan@touba-oil.com' } },
  //     type: AttachmentType.INITIAL,
  //   },
  // });

  // console.log('Pièce jointe exemple créée avec succès.');

  console.log('Alimentation de la base de données terminée.');
}

main()
  .catch((e) => {
    console.error('Une erreur s\'est produite lors de l\'alimentation de la base de données:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });