import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function addEmployee(body: any) {
  const { name, department, matriculation, email, password, role, phone } = body;

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'L\'email pour cet utilisateur existe déjà!', status: 400 };
    }

    // Check if matriculation already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { matriculation },
    });

    if (existingEmployee) {
      return { error: 'Ce matricule existe déjà!', status: 400 };
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    // Create the employee
    await prisma.employee.create({
      data: {
        name,
        email,
        matriculation,
        phoneNumber: phone,
        userId: user.id,
        currentDepartmentId: department,
      },
    });

    return { message: 'Employé ajouté avec succès', status: 200 };
  } catch (error) {
    console.error(error);
    return { error: 'Une erreur s\'est produite lors de la création du compte employé', status: 500 };
  }
}