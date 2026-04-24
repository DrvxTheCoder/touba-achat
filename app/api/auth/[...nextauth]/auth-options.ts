import { DefaultSession, User, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { pagesOptions } from './pages-options';
import { UserStatus, Role, Access } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    status: UserStatus;
    access: Access[];
    isSimpleUser: boolean;
    sessionToken?: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      access: Access[];
      isSimpleUser: boolean;
      revoked?: boolean;
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
    sessionToken?: string;
    revoked?: boolean;
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
  events: {
    async signOut({ token }) {
      const sessionToken = (token as { sessionToken?: string })?.sessionToken;
      if (sessionToken) {
        try {
          await prisma.userSession.updateMany({
            where: { sessionToken, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
          });
        } catch {
          // Non-critical
        }
      }
    },
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
          revoked: token.revoked ?? false,
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
        token.sessionToken = user.sessionToken;
        token.revoked = false;
      } else if (token.sessionToken) {
        // Check revocation on every token refresh
        try {
          const session = await prisma.userSession.findUnique({
            where: { sessionToken: token.sessionToken },
            select: { isRevoked: true, lastActiveAt: true },
          });
          if (session?.isRevoked) {
            token.revoked = true;
            token.sessionToken = undefined;
          } else if (session) {
            // Update lastActiveAt
            await prisma.userSession.update({
              where: { sessionToken: token.sessionToken },
              data: { lastActiveAt: new Date() },
            });
          }
        } catch {
          // Non-critical — do not block auth on DB errors
        }
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

          const sessionToken = randomUUID();
          const ipAddress =
            (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (req?.headers?.['x-real-ip'] as string) ||
            'unknown';
          const userAgent = req?.headers?.['user-agent'] as string | undefined;

          await prisma.userSession.create({
            data: {
              userId: user.id,
              sessionToken,
              ipAddress,
              userAgent,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            access: user.access,
            status: user.status,
            isSimpleUser: user.role === Role.USER,
            sessionToken,
          } as User;
        } catch (error) {
          console.error('Erreur lors de l\'autorisation:', error);
          if (error instanceof Error && error.message.startsWith('{"error":"auth_error"')) {
            throw error;
          }
          if (error instanceof Error && (
            error.message.includes("n'existe pas") ||
            error.message.includes("pas actif") ||
            error.message.includes("Mot de passe")
          )) {
            throw new Error(JSON.stringify({ error: "auth_error", message: error.message }));
          }
          throw new Error(JSON.stringify({ error: "auth_error", message: "Une erreur est survenue. Veuillez réessayer plus tard." }));
        }
      },
    }),
  ],
};
