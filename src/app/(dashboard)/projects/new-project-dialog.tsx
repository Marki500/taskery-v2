'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createProject } from "./project-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getClients } from "../clients/actions"
import { getActiveWorkspace } from "../workspaces/actions"
import { useEffect } from "react"

interface NewProjectDialogProps {
    defaultClientId?: string
    trigger?: React.ReactNode
}

export function NewProjectDialog({ defaultClientId, trigger }: NewProjectDialogProps = {}) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [url, setUrl] = useState("")
    const [color, setColor] = useState('indigo')
    const [icon, setIcon] = useState('FolderKanban')
    const [clientId, setClientId] = useState(defaultClientId || "")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("El nombre es obligatorio")
            return
        }

        setIsLoading(true)
        try {
            const project = await createProject(name.trim(), description.trim() || undefined, color, icon, url.trim() || undefined, clientId || undefined)
            toast.success("Proyecto creado correctamente")
            setName("")
            setDescription("")
            setUrl("")
            setOpen(false)
            // Navigate to the new project
            router.push(`/projects/${project.id}`)
        } catch (error) {
            toast.error("Error al crear el proyecto")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="text-lg py-3 px-5">
                        <Plus className="mr-2 h-5 w-5" />
                        Nuevo Proyecto
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Crear Nuevo Proyecto</DialogTitle>
                        <DialogDescription className="text-base">
                            Los proyectos te ayudan a organizar tus tareas y colaborar con tu equipo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-lg">Nombre del Proyecto</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Rediseño Web, App Móvil..."
                                className="text-lg p-4"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-lg">Descripción (Opcional)</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="¿De qué trata este proyecto?"
                                className="text-lg p-4"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url" className="text-lg">URL del Proyecto (Opcional)</Label>
                            <Input
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://ejemplo.com"
                                className="text-lg p-4"
                            />
                            <p className="text-xs text-muted-foreground ml-1">
                                Se usará el favicon como icono si se proporciona una URL.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="client" className="text-lg">Cliente (Opcional)</Label>
                            <ClientSelect value={clientId} onChange={setClientId} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full text-lg py-4">
                            {isLoading ? "Creando..." : "Crear Proyecto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    )
}

function ClientSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // A simpler way: just fetch clients on mount. 
    // In a real app we might pass workspaces or use a proper hook.
    // For now, let's just cheat and fetch from client side action if possible, 
    // or just assume we have access to a list action.
    // We can import getClients but it needs workspaceId.
    // We don't easily have workspaceId here in client component without passing it.
    // However, the action `getProjects` retrieves active workspace automatically.
    // Let's create a specific action helper or just fetch all?
    // Actually, `NewProjectDialog` doesn't know the workspace ID yet until `createProject` determines it.

    // Simplification: We'll fetch clients for the *active* workspace via a new server action wrapper, 
    // or just assume user has one workspace.
    // Let's make an inline fetch to an API route or server action?
    // `getClients` requires workspaceId. 
    // Let's modify the component to load clients.

    // BETTER APPROACH: Add a useEffect to fetch clients using a new action that gets active workspace clients.
    // But I can't easily add a new action right now without editing another file.
    // I can modify `getClients` to be optional workspaceId? No.

    // I will use `useEffect` and `getActiveWorkspace` pattern if I can?
    // Let's import `getActiveWorkspaceId`? No such action public.

    // Let's just create a `getWorkspaceClients` action in `project-actions.ts`?
    // No, let's assume we can pass the clients or fetch them.

    // To make this work quickly: I'll use `import { getClients } from '../clients/actions'`
    // But I need workspaceId.
    // I'll add `import { getActiveWorkspace } from '../workspaces/actions'` and call it here?
    // No, `getActiveWorkspace` is server action.

    return (
        <select
            className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Ninguno</option>
            {/* We will populate this via data fetching */}
            <ClientOptions />
        </select>
    )
}



function ClientOptions() {
    const [list, setList] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const ws = await getActiveWorkspace()
            if (ws) {
                const data = await getClients(ws.id)
                setList(data)
            }
        }
        load()
    }, [])

    return (
        <>
            {list.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </>
    )
}
