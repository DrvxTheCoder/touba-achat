"use client"
import Link from "next/link"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog"
import { ODMRHForm } from "./components/ODMRHForm"
import { ODMSimpleForm } from "./components/ODMSimpleForm"
import { ODMDataTable } from "./components/table/ODMDataTable"
import { ODMMetrics } from "./components/ODMMetricCards"
import { OpenInNewWindowIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import router from "next/router"
import {toast} from 'sonner'
import { ContentLayout } from "@/components/user-panel/content-layout"
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs"
import { fa } from "@faker-js/faker"

export default function OrdresDeMissions() {
    const { data: session } = useSession()
    const userRole = session?.user?.role
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isODMFormLoading, setIsODMFormLoading] = useState(false)

    const isResponsable = userRole === 'RESPONSABLE'
    const isRH = userRole === 'RH'
  
    const handleSubmit = async (data: any) => {
      setIsODMFormLoading(true)
      try {
        const response = await fetch('/api/odm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
    
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Une erreur s\'est produite')
        }
    
        const newODM = await response.json()
        console.log('New ODM created:', newODM)
        
        toast.success("Ordre de Mission émis", {
          description: "Votre ordre de mission a été enregistré.",
        })
        setIsDialogOpen(false)
        return true
      } catch (error) {
        console.error('Error creating ODM:', error)
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la création de l'ODM.",
        })
        return false
      } finally {
        setIsDialogOpen(false)
        setIsODMFormLoading(false)
        router.push("dashboard/odm")
      }
    }
  
    return (
      <>
      <title>Ordre de Mission - Touba App™</title>
      <ContentLayout title="Ordres de Missions">
        <DynamicBreadcrumbs />
        <main className="flex flex-1 flex-col gap-2 px-4 md:gap-4 md:px-6">
          <div>
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-lg md:text-3xl font-bold tracking-tight">Ordres de Missions</h2>
                <div className="flex items-center space-x-2">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  {isRH ? (
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <text className="hidden lg:block">Nouveau</text> 
                            <PlusCircle className="lg:ml-2 h-4 w-4"/>
                          </Button>
                        </DialogTrigger> 
                        ) : (
                          <DialogTrigger asChild className="md:hidden block">
                          <Button variant="outline">
                            <text className="hidden lg:block">Nouveau</text> 
                            <PlusCircle className="lg:ml-2 h-4 w-4"/>
                          </Button>
                        </DialogTrigger>
                        )}

                    <DialogContent>
                      <DialogHeader>Nouveau</DialogHeader>
                      <ODMSimpleForm onSubmit={handleSubmit} isLoading={isODMFormLoading} />
                    </DialogContent>
                  </Dialog>
                </div>
            </div>
          </div>
          
          <div className={clsx("", {
            "grid flex-1 items-start md:gap-8 lg:grid-cols-3 xl:grid-cols-3 mb-8": !isRH
          })}>
            <div className={`grid auto-rows-max items-start gap-4 md:gap-4 lg:col-span-2`}>
              {!isResponsable && <ODMMetrics />}
              <ODMDataTable />
            </div>

            {!isRH && (
              <div>
                <Card className="overflow-hidden lg:block hidden mb-5">
                  <CardHeader className="mb-0">
                    <CardTitle className="text-2xl">Emettre un ODM</CardTitle>
                    <CardDescription>
                      Entrez les détails de votre mission.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ODMSimpleForm onSubmit={handleSubmit} isLoading={isODMFormLoading} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </ContentLayout>
      </>

    )
}