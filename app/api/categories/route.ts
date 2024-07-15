// app/api/categories/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CategoryType } from '@prisma/client'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    
    // Check for existing category with the same name (case-insensitive)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Une catégorie avec ce nom existe déjà' }, { status: 400 })
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        type: CategoryType.CUSTOM,
      },
    })
    return NextResponse.json(newCategory)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const category = await prisma.category.findUnique({ where: { id } })
    if (category?.type === CategoryType.DEFAULT) {
      return NextResponse.json({ error: 'Cannot delete a default category' }, { status: 400 })
    }
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}