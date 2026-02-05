import { DefaultSession, User, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { pagesOptions } from './pages-options';
import { PrismaClient, UserStatus, Role, Access } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

const prisma = new PrismaClient();

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    status: UserStatus;
    access: Access[];
    isSimpleUser: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      access: Access[];
      isSimpleUser: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
    access: Access[];
    isSimpleUser: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    ...pagesOptions,
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role as Role,
          status: token.status as UserStatus,
          access: token.access,
          isSimpleUser: token.isSimpleUser,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.access = user.access;
        token.status = user.status;
        token.isSimpleUser = user.role === Role.USER;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials) {
          throw new Error("Aucune information d'identification fournie");
        }
      
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
      
          if (!user) {
            throw new Error("Cet utilisateur n'existe pas.");
          }
      
          if (user.status !== UserStatus.ACTIVE) {
            throw new Error("Ce compte n'est pas actif. Veuillez consulter l'administrateur du système.");
          }
      
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      
          if (!isPasswordValid) {
            throw new Error("Mot de passe incorrecte");
          }
          const userInfo = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            access: user.access,
            status: user.status,
            isSimpleUser: user.role === Role.USER,
          } as User;
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            access: user.access,
            status: user.status,
            isSimpleUser: user.role === Role.USER,
          } as User; // Add this type assertion
        } catch (error) {
          console.error('Erreur lors de l\'autorisation:', error);
          if (error instanceof Error) {
            throw new Error(JSON.stringify({ error: "auth_error", message: error.message }));
          } else {
            throw new Error("Une erreur inconnue s'est produite. Veuillez ressayer plus tard.");
          }
        }
      },
    }),
  ],
};