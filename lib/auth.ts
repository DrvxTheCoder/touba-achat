import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma }  from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

// Extend the default session and token types
declare module "next-auth" {
    interface Session {
      userId: string;
      role: string;
    }
  }
  
  declare module "next-auth/jwt" {
    interface JWT {
      id: string;
      role: string;
    }
  }

// Create a NextAuth instance with the adapter with credentials provider

export const {auth, handlers} = NextAuth({
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
              return {
                ...user,
                id: user.id.toString(), // Convert id to string
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
  });

