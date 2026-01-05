'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { assignMemberToProject, removeMemberFromProject, getProjectMembers } from './project-actions'

interface ProjectMembersDialogProps {
    projectId: string
    projectName: string
    workspaceMembers: Array<{
        user_id: string
        profiles: {
            id: string
            full_name: string | null
            email: string | null
            avatar_url: string | null
        }
    }>
    trigger?: React.ReactNode
}

export function ProjectMembersDialog({ projectId, projectName, workspaceMembers, trigger }: ProjectMembersDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const router = useRouter()

    useEffect(() => {
        if (open) {
            loadMembers()
        }
    }, [open])

    const loadMembers = async () => {
        setLoading(true)
        try {
            const data = await getProjectMembers(projectId)
            setMembers(data)
        } catch (error) {
            toast.error('Error al cargar miembros')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error('Selecciona un miembro')
            return
        }

        setLoading(true)
        try {
            const result = await assignMemberToProject(projectId, selectedUserId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Miembro asignado')
                setSelectedUserId('')
                await loadMembers()
                router.refresh()
            }
        } catch (error) {
            toast.error('Error al asignar miembro')
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (userId: string) => {
        setLoading(true)
        try {
            const result = await removeMemberFromProject(projectId, userId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Miembro eliminado')
                await loadMembers()
                router.refresh()
            }
        } catch (error) {
            toast.error('Error al eliminar miembro')
        } finally {
            setLoading(false)
        }
    }

    // Filter out already assigned members
    const availableMembers = workspaceMembers.filter(
        wm => !members.some(m => m.user_id === wm.user_id)
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Gestionar Miembros
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Miembros del Proyecto</DialogTitle>
                    <DialogDescription>
                        Asigna miembros del workspace a "{projectName}" para organización.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Add Member Section */}
                    <div className="flex gap-2">
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleccionar miembro..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMembers.map((member) => (
                                    <SelectItem key={member.user_id} value={member.user_id}>
                                        {member.profiles.full_name || member.profiles.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAssign} disabled={loading || !selectedUserId}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
                        </Button>
                    </div>

                    {/* Current Members List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Miembros Asignados ({members.length})</h4>
                        {loading && members.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                No hay miembros asignados todavía
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {members.map((member: any) => (
                                    <div
                                        key={member.user_id}
                                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                                <AvatarFallback className="text-xs">
                                                    {(member.profiles?.full_name || member.profiles?.email || '?')[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {member.profiles?.full_name || 'Sin nombre'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {member.profiles?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemove(member.user_id)}
                                            disabled={loading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
