'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { addManualTimeEntry } from '@/app/(dashboard)/projects/time-actions'
import { toast } from 'sonner'
import { Clock, Pencil } from 'lucide-react'

interface EditTimeDialogProps {
    taskId: string
    currentTotalSeconds: number
    onTimeUpdated?: () => void
}

export function EditTimeDialog({ taskId, currentTotalSeconds, onTimeUpdated }: EditTimeDialogProps) {
    const [open, setOpen] = useState(false)
    const [hours, setHours] = useState('0')
    const [minutes, setMinutes] = useState('0')
    const [isLoading, setIsLoading] = useState(false)

    // Initial load of current time
    useEffect(() => {
        if (open) {
            const h = Math.floor(currentTotalSeconds / 3600)
            const m = Math.floor((currentTotalSeconds % 3600) / 60)
            setHours(h.toString())
            setMinutes(m.toString())
        }
    }, [open, currentTotalSeconds])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const h = parseInt(hours) || 0
        const m = parseInt(minutes) || 0

        const newTotalSeconds = (h * 60 * 60) + (m * 60)

        // Calculate the difference to add/subtract
        const diffSeconds = newTotalSeconds - currentTotalSeconds

        if (diffSeconds === 0) {
            setOpen(false)
            return
        }

        setIsLoading(true)
        try {
            await addManualTimeEntry(taskId, diffSeconds)
            toast.success('Tiempo actualizado correctamente')
            setOpen(false)
            onTimeUpdated?.()
        } catch (error) {
            toast.error('Error al actualizar el tiempo')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Editar tiempo total
                        </DialogTitle>
                        <DialogDescription>
                            Modifica el tiempo total dedicado a esta tarea.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="hours">Horas</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="text-center text-lg mt-1"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="minutes">Minutos</Label>
                                <Input
                                    id="minutes"
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="text-center text-lg mt-1"
                                />
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                            Tiempo actual: {Math.floor(currentTotalSeconds / 3600)}h {Math.floor((currentTotalSeconds % 3600) / 60)}m
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
