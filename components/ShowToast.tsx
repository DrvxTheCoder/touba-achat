"use client"

import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Loader, Loader2Icon } from "lucide-react"

export function ShowToast() {
  const { toast } = useToast()

  return (
    <Button
    className="mt-4"
      onClick={() => {
        toast({
          variant: "destructive",
          title: "Oops! Une erreur est survenu..",
          description: "Erreur interne du serveur.",
        })
      }}
    >
      Ajouter
    </Button>
  )
}
