"use client"
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Ban,
  Bell,
  CircleUser,
  Clock,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EDB } from "../etats-de-besoin/data/types";
import { EDBTableRow } from "../etats-de-besoin/components/EDBTableRow";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { ContentLayout } from "@/components/user-panel/content-layout"
import { accounts, mails } from "@/app/dashboard/components/data"
import { MailList } from "@/app/dashboard/components/mail-list"
import { SpinnerCircular } from "spinners-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function TestPage() {
    return (
        <>
    <ContentLayout title="Page de Test">
        <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
            <BreadcrumbPage>Test Page</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
        </BreadcrumbList>
        </Breadcrumb>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Inventory</h1>
          </div>
          <div
            className="flex items-center justify-center rounded-lg h-[50em] border border-dashed"
          >
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                You have no products
              </h3>
              <p className="text-sm text-muted-foreground">
                You can start selling as soon as you add a product.
              </p>
              <Button className="mt-4">Add Product</Button>
            </div>
          </div>
        </main>
    </ContentLayout>
        </>
    );

}