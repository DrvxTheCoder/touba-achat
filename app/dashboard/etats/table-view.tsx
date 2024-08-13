import { promises as fs } from "fs"
import path from "path"
import { Metadata } from "next"
import Image from "next/image"
import { z } from "zod"

import { columns } from "./components/columns"
import { DataTable } from "./components/unused/data-table"
import { UserNav } from "./components/user-nav"
import { taskSchema } from "./data-2/schema"
import { Button } from "@/components/ui/button";

async function getTasks() {
  const data = await fs.readFile(
    path.join(process.cwd(), "app/dashboard/etats/data/tasks.json")
  )

  const tasks = JSON.parse(data.toString())

  return z.array(taskSchema).parse(tasks)
}
export default async function Etats(){
  const tasks = await getTasks()
    return(
      <>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-5">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">États de besoins</h1>
        </div>
        <DataTable data={tasks} columns={columns} />
      </main>
      </>

    );
}