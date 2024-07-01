import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import isEqual from 'lodash/isEqual';
import { pagesOptions } from './pages-options';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // debug: true,
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
        id: token.idToken as string,
        role: token.role as string, // Add the user role
      },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        // return user as JWT
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // const parsedUrl = new URL(url, baseUrl);
      // if (parsedUrl.searchParams.has('callbackUrl')) {
      //   return `${baseUrl}${parsedUrl.searchParams.get('callbackUrl')}`;
      // }
      // if (parsedUrl.origin === baseUrl) {
      //   return url;
      // }
      return baseUrl;
    },
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {},
      async authorize(credentials: any) {
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
          console.log('User found:', user);
      
          if (user) {
            const isMatch = await bcrypt.compare(credentials.password, user.password);
            console.log(`Password match: ${isMatch}`);
            if (isMatch) {
              return user as any;
            } else {
              console.log('Password mismatch');
            }
          } else {
            console.log('No user found with that email');
          }
        } catch (error) {
          console.error('Error during authorization:', error);
        }
        return null;
      }
      ,
    }),
  ],
};
