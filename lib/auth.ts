import NextAuth, { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Access, Role, UserStatus } from "@prisma/client";

// Extend the default session and token types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      isSimpleUser: boolean;
      access: Access[]; // Add this line
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    status: UserStatus;
    isSimpleUser: boolean;
    access: Access[]; // Add this line
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
    access: Access[];
    isSimpleUser: boolean;
  }
}

// Create a NextAuth instance with the adapter with credentials provider
export const { auth, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (user && await bcrypt.compare(credentials.password, user.password)) {
            if (user.status !== UserStatus.ACTIVE) {
              throw new Error(JSON.stringify({
                error: "inactive_account",
                message: "Ce compte n'est pas actif. Veuillez consulter l'administrateur du système.",
              }));
            }

            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
              access: user.access,
              status: user.status,
              isSimpleUser: user.role === Role.USER,
            };
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.isSimpleUser = user.isSimpleUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.isSimpleUser = token.isSimpleUser;
      }
      return session;
    },
  },
});