import { NextRequest, NextResponse } from 'next/server';
import { addEmployee } from './addEmployee';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await addEmployee(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}