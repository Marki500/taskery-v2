'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, FolderKanban, Rocket, Target, Briefcase, Star, Layout, Check } from "lucide-react"
import { updateProject, Project, getProjectMembers, assignMemberToProject, removeMemberFromProject } from "./project-actions"
import { cn } from "@/lib/utils"
import { getClients } from "../clients/actions"
import { getActiveWorkspace } from "../workspaces/actions"

interface EditProjectDialogProps {
    project: Project
    workspaceMembers?: any[]
}

const colors = [
    { name: 'gray', bg: 'bg-gray-500' },
    { name: 'red', bg: 'bg-red-500' },
    { name: 'orange', bg: 'bg-orange-500' },
    { name: 'yellow', bg: 'bg-yellow-500' },
    { name: 'green', bg: 'bg-green-500' },
    { name: 'teal', bg: 'bg-teal-500' },
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'indigo', bg: 'bg-indigo-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'pink', bg: 'bg-pink-500' },
]

const icons = [
    { name: 'FolderKanban', icon: FolderKanban },
    { name: 'Rocket', icon: Rocket },
    { name: 'Target', icon: Target },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Star', icon: Star },
    { name: 'Layout', icon: Layout },
]

export function EditProjectDialog({ project, workspaceMembers = [] }: EditProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || "")
    const [url, setUrl] = useState(project.url || "")
    const [color, setColor] = useState(project.color || 'indigo')
    const [iconName, setIconName] = useState(project.icon || 'FolderKanban')
    const [clientId, setClientId] = useState(project.client_id || "none")
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [initialMembers, setInitialMembers] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Load current project members when dialog opens
    useEffect(() => {
        if (open) {
            const loadMembers = async () => {
                const members = await getProjectMembers(project.id)
                const memberIds = members.map((m: any) => m.user_id)
                setSelectedMembers(memberIds)
                setInitialMembers(memberIds)
            }
            loadMembers()
        }
    }, [open, project.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            await updateProject(project.id, name.trim(), description.trim() || null, color, iconName, url.trim() || null, clientId)

            // Update project members
            const membersToAdd = selectedMembers.filter(id => !initialMembers.includes(id))
            const membersToRemove = initialMembers.filter(id => !selectedMembers.includes(id))

            await Promise.all([
                ...membersToAdd.map(userId => assignMemberToProject(project.id, userId)),
                ...membersToRemove.map(userId => removeMemberFromProject(project.id, userId))
            ])

            toast.success("Proyecto actualizado")
            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Error al actualizar el proyecto")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar Proyecto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Editar Proyecto</DialogTitle>
                        <DialogDescription className="text-base font-medium">
                            Cambia los detalles de tu proyecto para mantenerlo organizado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-lg font-bold">Nombre</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Rediseño Web"
                                className="text-lg p-4"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-lg font-bold">Descripción</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="De qué trata este proyecto..."
                                className="resize-none text-lg p-4"
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url" className="text-lg font-bold">URL del Proyecto (Favicon)</Label>
                            <Input
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://ejemplo.com"
                                className="text-lg p-4"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Si incluyes la URL de la web, usaremos su favicon como icono del proyecto.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-lg font-bold">Color del Proyecto</Label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setColor(c.name)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                            c.bg,
                                            color === c.name ? "border-foreground ring-2 ring-primary ring-offset-2 scale-110" : "border-transparent"
                                        )}
                                    >
                                        {color === c.name && <Check className="h-4 w-4 text-white" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-lg font-bold">Icono</Label>
                            <div className="flex flex-wrap gap-3">
                                {icons.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => setIconName(item.name)}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all",
                                                iconName === item.name
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-muted bg-muted/20 text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <Icon className="h-6 w-6" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="client" className="text-lg">Cliente (Opcional)</Label>
                            <ClientSelect value={clientId} onChange={setClientId} />
                        </div>

                        {/* Member Selection */}
                        <div className="grid gap-2">
                            <Label className="text-lg font-bold">Miembros Asignados</Label>
                            {workspaceMembers.length > 0 ? (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        {workspaceMembers.map((member) => (
                                            <Button
                                                key={member.user_id}
                                                type="button"
                                                variant={selectedMembers.includes(member.user_id) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedMembers(prev =>
                                                        prev.includes(member.user_id)
                                                            ? prev.filter(id => id !== member.user_id)
                                                            : [...prev, member.user_id]
                                                    )
                                                }}
                                            >
                                                {member.profiles?.full_name || member.profiles?.email || 'Usuario'}
                                            </Button>
                                        ))}
                                    </div>
                                    {selectedMembers.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {selectedMembers.length} miembro(s) asignado(s)
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No hay otros miembros en el workspace. Invita colaboradores para asignarlos a proyectos.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-lg py-4">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="text-lg py-4">
                            {isLoading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ClientSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
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
        <select
            className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="none">Ninguno</option>
            {list.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
    )
}
