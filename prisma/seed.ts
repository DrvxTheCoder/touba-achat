import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Import bcryptjs

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const saltRounds = 10; // You can adjust the salt rounds as needed

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await prisma.user.upsert({
    where: {email: 'paul.flan@touba-oil.com'},
    update: {},
    create: {
      email: 'paul.flan@touba-oil.com',
      name: 'Paul Flan',
      role: "ADMIN",
      password: hashedPassword, // Store the hashed password
    },
  });
  console.log(newUser);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });