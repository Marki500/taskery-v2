'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createClient, updateClient, deleteClient, Client } from './actions'

interface ClientDialogProps {
    workspaceId: string
    client?: Client
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ClientDialog({ workspaceId, client, trigger, open, onOpenChange }: ClientDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const isEditing = !!client
    const actualOpen = open !== undefined ? open : isOpen
    const setActualOpen = onOpenChange || setIsOpen

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            address: formData.get('address') as string,
            notes: formData.get('notes') as string,
        }

        try {
            if (isEditing) {
                const result = await updateClient(client.id, data)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Cliente actualizado')
                    setActualOpen(false)
                }
            } else {
                const result = await createClient(workspaceId, data)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Cliente creado')
                    setActualOpen(false)
                }
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!client?.id) return

        if (!confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) return

        setLoading(true)
        try {
            const result = await deleteClient(client.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Cliente eliminado')
                setActualOpen(false)
            }
        } catch (error) {
            toast.error('Error al eliminar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={actualOpen} onOpenChange={setActualOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Modifica los datos del cliente aquí.' : 'Añade un nuevo cliente a tu workspace.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                defaultValue={client?.name}
                                placeholder="Empresa S.L. o Juan Pérez"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={client?.email || ''}
                                    placeholder="contacto@empresa.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={client?.phone || ''}
                                    placeholder="+34 600 000 000"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={client?.address || ''}
                                placeholder="Calle Principal 123, Madrid"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={client?.notes || ''}
                                placeholder="Información adicional..."
                                className="h-24"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex sm:justify-between gap-2">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleDelete}
                                disabled={loading}
                                className="mr-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setActualOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
