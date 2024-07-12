import { DefaultSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { pagesOptions } from './pages-options';
import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

const prisma = new PrismaClient();

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    status: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      status: UserStatus;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    status: UserStatus;
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
          role: token.role,
          status: token.status,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.status = user.status;
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
          throw new Error(JSON.stringify({ 
            error: "auth_error", 
            message: "Aucune information d'identification fournie" 
          }));
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error(JSON.stringify({ 
              error: "user_not_found", 
              message: "Aucun utilisateur trouvé avec cet email" 
            }));
          }

          if (user.status !== UserStatus.ACTIVE) {
            throw new Error(JSON.stringify({ 
              error: "inactive_account", 
              message: "Ce compte n'est pas actif. Veuillez consulter l'administrateur du système." 
            }));
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error(JSON.stringify({ 
              error: "invalid_credentials", 
              message: "Mot de passe incorrect" 
            }));
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
          };
        } catch (error) {
          console.error('Erreur lors de l\'autorisation:', error);
          throw error;
        }
      },
    }),
  ],
};