import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function main() {
  const saltRounds = 10;

  // Test database connection
  try {
    await prisma.$connect();
    console.log('Connected to the database successfully.');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }

  // Create departments
  const departmentNames = [
    'Administration IT',
    'Direction Administrative et Financière',
    'Direction Ressources Humaines',
    'Direction Générale',
    'Direction Opération Gaz',
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

  console.log('Departments created successfully.');

  // Create users and employees
  const usersData = [
    {
      name: 'Administrateur',
      email: 'admin@touba-oil.com',
      role: Role.ADMIN,
      departmentName: 'Administration IT',
      matriculation: 'ADM001',
    },
    {
      name: 'Bescaye Diop',
      email: 'bescaye.diop@touba-oil.com',
      role: Role.RESPONSABLE,
      departmentName: 'Direction Administrative et Financière',
      matriculation: '26263',
    },
    {
      name: 'Ibra Diop',
      email: 'ibra.diop@touba-oil.com',
      role: Role.DIRECTEUR,
      departmentName: 'Direction Ressources Humaines',
      matriculation: '26294',
    },
    {
      name: 'Aminata Gaye',
      email: 'aminata.gaye@touba-oil.com',
      role: Role.USER,
      departmentName: 'Direction Générale',
      matriculation: '26346',
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
        password: hashedPassword,
      },
    });

    const department = departments.find(d => d.name === userData.departmentName);

    if (!department) {
      console.error(`Department not found: ${userData.departmentName}`);
      continue;
    }

    await prisma.employee.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        name: userData.name,
        email: userData.email,
        matriculation: userData.matriculation,
        phoneNumber: '+1234567890', // Placeholder phone number
        userId: user.id,
        departmentId: department.id,
      },
    });

    console.log(`Upserted user and employee: ${userData.name}`);
  }

  // Create a user without an employee record
  const nonEmployeeUser = await prisma.user.upsert({
    where: { email: 'consultant@example.com' },
    update: {},
    create: {
      name: 'Auditeur',
      email: 'consultant@example.com',
      role: Role.AUDIT,
      password: await bcrypt.hash('consultant123', saltRounds),
    },
  });

  console.log(`Upserted non-employee user: ${nonEmployeeUser.name}`);

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
