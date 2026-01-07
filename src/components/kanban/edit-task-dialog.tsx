'use client'

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Pencil, Trash2, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EditTaskDialogProps {
    task: {
        id: string
        title: string
        tag?: string
        deadline?: string | null
    }
    onSave: (id: string, title: string, tag?: string, deadline?: string | null) => Promise<void>
    onDelete?: (id: string) => Promise<void>
}

export function EditTaskDialog({ task, onSave, onDelete }: EditTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState(task.title)
    const [tag, setTag] = useState(task.tag || "")
    const [deadline, setDeadline] = useState<Date | undefined>(
        task.deadline ? new Date(task.deadline) : undefined
    )
    const [isLoading, setIsLoading] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false) // Control calendar popover

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            toast.error("El título es obligatorio")
            return
        }

        setIsLoading(true)
        try {
            const deadlineISO = deadline ? deadline.toISOString() : null
            await onSave(task.id, title.trim(), tag.trim() || undefined, deadlineISO)
            toast.success("Tarea actualizada")
            setOpen(false)
        } catch (error) {
            toast.error("Error al actualizar")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        setIsLoading(true)
        try {
            await onDelete(task.id)
            toast.success("Tarea eliminada")
            setOpen(false)
        } catch (error) {
            toast.error("Error al eliminar")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDateSelect = (date: Date | undefined) => {
        setDeadline(date)
        setCalendarOpen(false) // Close calendar on selection
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Editar Tarea</DialogTitle>
                        <DialogDescription>
                            Modifica los detalles de tu tarea.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title" className="text-base">Título</Label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg p-3"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tag" className="text-base">Etiqueta</Label>
                            <Input
                                id="edit-tag"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                placeholder="Ej: Backend, UI, Bug..."
                                className="text-lg p-3"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-base">Fecha límite</Label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal text-lg p-3 h-auto",
                                            !deadline && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {deadline ? format(deadline, "PPP", { locale: es }) : "Seleccionar fecha"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={deadline}
                                        onSelect={handleDateSelect}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            {deadline && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeadline(undefined)}
                                    className="text-muted-foreground"
                                >
                                    Quitar fecha límite
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                        {onDelete && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="mr-auto"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
