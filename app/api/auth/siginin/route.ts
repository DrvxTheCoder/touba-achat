// app/api/auth/signin/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../[...nextauth]/auth-options';
import NextAuth from 'next-auth/next';

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();
    const res = await NextAuth(
      {
        ...authOptions,
        callbacks: {
          ...authOptions.callbacks,
          async signIn({ user, account, profile, email, credentials }) {
            // Your custom sign in logic here
            // For example, you might want to check if the user is active
            if (user.status !== 'ACTIVE') {
              throw new Error(JSON.stringify({
                error: 'inactive_account',
                message: "Ce compte n'est pas actif. Veuillez consulter l'administrateur du système."
              }));
            }
            return true;
          },
        },
      }
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        console.log(parsedError);
        return NextResponse.json(          { 
          error: 'server_error',
          message: 'Une erreur interne du serveur s\'est produite. Veuillez ressayer plus tard.'
        }, 
        { status: 401 });
      } catch {
        // If parsing fails, it's not one of our custom errors
        console.log(error.message)
        return NextResponse.json(
          { 
            error: 'unknown_error',
            message: 'Une erreur inattendue s\'est produite'
          }, 
          { status: 500 }
        );
      }
    } else {
      // Handle cases where the caught value is not an Error object
      return NextResponse.json(
        { 
          error: 'unknown_error',
          message: 'Une erreur inattendue s\'est produite' 
        }, 
        { status: 500 }
      );
    }
  }
}