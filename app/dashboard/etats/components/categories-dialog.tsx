import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoaderIcon, Tag, Tags, Trash2Icon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CategoryType } from "@prisma/client"
import { Icons } from "@/components/icons"
import { toast } from "sonner"

type Category = {
  id: number;
  name: string;
  type: CategoryType;
}

export function CategoriesDialog() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const handlecloseDialog = () => {
    setError(null);
    setNewCategory("");
  };

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Erreur serveur')
      const fetchedCategories = await response.json()
      setCategories(fetchedCategories)
    } catch (err) {
      setError("Erreur lors de la récupération des catégories")
    } finally {
      setIsLoading(false)
    }
  }

  const addCategory = async () => {

    if (!newCategory.trim()) {
        toast.error("Erreur",{
          description: "Le champ ne pas être vide!",
        });
        return;
      }

    else if (newCategory.trim() !== "") {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategory.trim() })
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur serveur')
        }
        const createdCategory = await response.json()
        setCategories([...categories, createdCategory])
        setNewCategory("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'ajout de la catégorie")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
  }

  const deleteCategory = async () => {
    if (categoryToDelete) {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/categories', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: categoryToDelete.id })
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur serveur')
        }
        setCategories(categories.filter((c) => c.id !== categoryToDelete.id))
        setCategoryToDelete(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la suppression de la catégorie")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog onOpenChange={handlecloseDialog} >
      <DialogTrigger asChild>
        <Button variant="outline" size={'icon'}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Tag className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Catégories</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestion des catégories</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Nouvelle catégorie"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button onClick={addCategory} disabled={isLoading}>{isLoading && (<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />)}Ajouter</Button>
        </div>
        {error && <div className="text-red-500"><small>{error}</small></div>}
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between py-2 group"
            >
              <div className="flex items-center text-sm">
                {category.type === CategoryType.DEFAULT ? (<Tag className="mr-2 h-4 w-4" />) : (<Tags className="mr-2 h-4 w-4" />)}
                {category.name}
              </div>
              {category.type === CategoryType.CUSTOM && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => confirmDeleteCategory(category)}
                  disabled={isLoading}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
      <AlertDialog open={categoryToDelete !== null} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cette catégorie sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCategory} className="bg-destructive text-white hover:bg-destructive/90" disabled={isLoading}>
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}