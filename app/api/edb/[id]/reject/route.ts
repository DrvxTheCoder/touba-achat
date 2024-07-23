// import { NextApiRequest, NextApiResponse } from 'next';
// import { PrismaClient } from '@prisma/client';
// import { getServerSession } from "next-auth/next";
// import { authOptions } from '../../../auth/[...nextauth]/auth-options';

// const prisma = new PrismaClient();

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const session = await getServerSession(req, res, authOptions);
//   if (!session) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   const { id } = req.query;

//   try {
//     const edb = await prisma.etatDeBesoin.findUnique({
//       where: { id: Number(id) },
//       include: { department: true },
//     });

//     if (!edb) {
//       return res.status(404).json({ message: 'EDB not found' });
//     }

//     // Check if the user has the right to reject this EDB
//     const canReject = await checkUserCanReject(session.user.id, edb);
//     if (!canReject) {
//       return res.status(403).json({ message: 'You do not have permission to reject this EDB' });
//     }

//     const updatedEdb = await prisma.etatDeBesoin.update({
//       where: { id: Number(id) },
//       data: { 
//         status: 'REJECTED',
//         approverId: parseInt(session.user.id),
//       },
//     });

//     res.status(200).json(updatedEdb);
//   } catch (error) {
//     console.error('Error rejecting EDB:', error);
//     res.status(500).json({ message: 'Error rejecting EDB' });
//   }
// }

// async function checkUserCanReject(userId: string, edb: any) {
//   // Implement your logic here to check if the user can reject the EDB
//   // This might involve checking the user's role, department, etc.
//   return true; // Placeholder
// }