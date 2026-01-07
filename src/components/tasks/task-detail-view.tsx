'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
    Calendar as CalendarIcon,
    Clock,
    MessageSquare,
    Tag,
    CheckCircle2,
    User,
    ChevronLeft,
    ChevronDown,
    Circle,
    PlayCircle,
    Eye,
    ListTodo
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ActivityLog } from '@/app/(dashboard)/activity/actions'
import { TaskComment, addTaskComment } from '@/app/(dashboard)/projects/task-actions'
import { Subtask, getSubtasks } from "@/app/(dashboard)/projects/subtask-actions"
import { WorkspaceMember, updateTask, TaskUpdateData } from "@/app/(dashboard)/projects/actions"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatTime } from "@/contexts/timer-context"
import { tagColors, tagColorOptions, getTagColorStyles, TagColorName } from "@/lib/tag-colors"
import { SubtaskList } from '@/components/kanban/subtask-list'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { EditTimeDialog } from '@/components/timer/edit-time-dialog'

interface TaskDetailViewProps {
    task: any
    comments: TaskComment[]
    activity: ActivityLog[]
    subtasks: Subtask[]
    members: WorkspaceMember[]
    currentUserId: string
}

const statusOptions = [
    { value: 'todo', label: 'Por hacer', icon: Circle, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { value: 'in-progress', label: 'En progreso', icon: PlayCircle, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { value: 'review', label: 'Revisión', icon: Eye, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { value: 'done', label: 'Completada', icon: CheckCircle2, color: 'bg-green-500', textColor: 'text-green-600' },
]

export function TaskDetailView({ task, comments: initialComments, activity, subtasks: initialSubtasks, members, currentUserId }: TaskDetailViewProps) {
    const router = useRouter()

    // Editable State
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || "")
    const [status, setStatus] = useState(task.status) // Note: task.status here refers to columnId usually
    const [priority, setPriority] = useState(task.priority || 'Normal')
    const [deadline, setDeadline] = useState<Date | undefined>(
        task.deadline ? new Date(task.deadline) : undefined
    )
    const [tag, setTag] = useState(task.tag || "")
    const [tagColor, setTagColor] = useState<string>(task.tagColor || 'gray')
    const [assignedTo, setAssignedTo] = useState<string | null>(task.assignedTo || null)
    const [notes, setNotes] = useState(task.notes || "")

    // Lists State
    const [comments, setComments] = useState(initialComments)
    const [newComment, setNewComment] = useState('')
    const [subtasks, setSubtasks] = useState(initialSubtasks)

    // UI State
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    const handleBack = () => {
        router.back()
    }

    const handleUpdateTask = async (overrideData?: Partial<TaskUpdateData>) => {
        setIsSaving(true)
        try {
            const updateData: TaskUpdateData = {
                title: title.trim(),
                description: description.trim() || null,
                tag: tag.trim() || null,
                tagColor: tag.trim() ? tagColor : null,
                deadline: deadline ? deadline.toISOString() : null,
                assignedTo: assignedTo,
                status: status,
                // Note: priority is not in the database schema
                ...overrideData
            }

            // If explicit status update (e.g. clicking a pill), update local state immediately
            if (overrideData?.status) setStatus(overrideData.status)
            if (overrideData?.assignedTo !== undefined) setAssignedTo(overrideData.assignedTo)
            if (overrideData?.deadline !== undefined) setDeadline(overrideData.deadline ? new Date(overrideData.deadline) : undefined)
            if (overrideData?.tag !== undefined) setTag(overrideData.tag || '')
            if (overrideData?.tagColor !== undefined) setTagColor(overrideData.tagColor || 'gray')

            await updateTask(task.id, updateData)
            router.refresh()
            toast.success("Tarea guardada")
        } catch (error) {
            toast.error("Error al guardar cambios")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return

        setIsSubmittingComment(true)
        try {
            await addTaskComment(task.id, task.projectId, newComment)
            setNewComment('')
            router.refresh()
            toast.success('Comentario añadido')
        } catch (error) {
            toast.error('Error al añadir comentario')
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const selectedMember = members.find(m => m.id === assignedTo)
    const currentStatusConfig = statusOptions.find(s => s.value === status)

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header / Back */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full h-8 w-8 p-0">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{task.projectName}</span>
                    <span>/</span>
                    <span className="font-semibold text-foreground">Detalle de Tarea</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Button
                        onClick={() => handleUpdateTask({ notes })}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content: Details + Descriptions + Activity */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Task Info Card */}
                    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                        <CardContent className="p-8 space-y-6">
                            {/* Title & Status Header */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "capitalize px-3 py-1 text-sm font-medium border-0 ring-1 ring-inset",
                                                    status === 'done' ? "bg-green-500/10 text-green-700 ring-green-600/20" : "bg-slate-100 dark:bg-slate-800 ring-slate-200"
                                                )}
                                            >
                                                {currentStatusConfig?.icon && <currentStatusConfig.icon className="w-4 h-4 mr-2" />}
                                                {currentStatusConfig?.label || status}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-1 w-48" align="start">
                                            <div className="grid gap-1">
                                                {statusOptions.map(option => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleUpdateTask({ status: option.value })}
                                                        className={cn(
                                                            "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left w-full",
                                                            status === option.value && "bg-muted font-medium"
                                                        )}
                                                    >
                                                        <option.icon className="w-4 h-4 text-muted-foreground" />
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-3xl font-black tracking-tight leading-tight border-none p-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/30"
                                    placeholder="Nombre de la tarea"
                                />
                            </div>

                            <Separator />

                            {/* Main Descriptions */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    Descripción
                                </h3>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[150px] resize-none border-0 bg-muted/30 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl leading-relaxed"
                                    placeholder="Añade una descripción detallada..."
                                />
                            </div>

                            <Separator />

                            {/* Notes */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    Notas
                                </h3>
                                <RichTextEditor
                                    content={notes}
                                    onChange={setNotes}
                                    placeholder="Añade notas adicionales con formato..."
                                />
                            </div>

                            <Separator />

                            {/* Subtasks */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <ListTodo className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-bold text-lg">Subtareas</h3>
                                </div>
                                <SubtaskList
                                    taskId={task.id}
                                    initialSubtasks={subtasks}
                                    onUpdate={async () => {
                                        const latest = await getSubtasks(task.id)
                                        setSubtasks(latest)
                                        router.refresh()
                                    }}
                                />
                            </div>

                            {/* Activity Feed */}
                            <div className="pt-8">
                                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    Actividad Reciente
                                </h3>
                                <ScrollArea className="h-[300px] pr-4 bg-muted/10 rounded-xl p-4 border border-border/50">
                                    <div className="space-y-6">
                                        {activity.map((log) => (
                                            <div key={log.id} className="flex gap-4 relative group">
                                                {/* Line connector */}
                                                <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-border last:hidden group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900 transition-colors" />

                                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm z-10">
                                                    <AvatarImage src={log.userAvatar || undefined} />
                                                    <AvatarFallback>{log.userName?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1 pt-1">
                                                    <p className="text-sm font-medium">
                                                        <span className="font-bold text-foreground">{log.userName || 'Usuario'}</span>{' '}
                                                        <span className="text-muted-foreground">
                                                            {log.actionType === 'task_created' && 'creó la tarea'}
                                                            {log.actionType === 'task_completed' && 'completó la tarea'}
                                                            {log.actionType === 'comment_created' && 'comentó'}
                                                            {log.actionType === 'task_updated' && 'actualizó la tarea'}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        {format(new Date(log.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {activity.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                No hay actividad reciente.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Properties & Comments */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Properties Card */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg">Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {/* Assigned To */}
                                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span className="text-sm font-medium">Asignado</span>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 font-normal">
                                                {selectedMember ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={selectedMember.avatarUrl || undefined} />
                                                            <AvatarFallback className="text-[10px]">{selectedMember.fullName?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-semibold text-foreground">{selectedMember.fullName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">Sin asignar</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-60 p-2" align="end">
                                            <ScrollArea className="h-60">
                                                <div className="space-y-1">
                                                    <button onClick={() => handleUpdateTask({ assignedTo: null })} className="w-full text-left px-2 py-1.5 hover:bg-muted rounded text-sm">Sin asignar</button>
                                                    {members.map(m => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => handleUpdateTask({ assignedTo: m.id })}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-sm"
                                                        >
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={m.avatarUrl || undefined} />
                                                                <AvatarFallback>{m.fullName?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <span>{m.fullName}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Deadline */}
                                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">Fecha límite</span>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className={cn("h-auto py-1 px-2 font-normal", !deadline && "text-muted-foreground")}>
                                                {deadline ? format(deadline, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                mode="single"
                                                selected={deadline}
                                                onSelect={(d) => handleUpdateTask({ deadline: d ? d.toISOString() : null })}
                                                initialFocus
                                                locale={es}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Tag */}
                                <div className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Tag className="w-4 h-4" />
                                        <span className="text-sm font-medium">Etiqueta</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={tag}
                                            onChange={(e) => setTag(e.target.value)}
                                            onBlur={() => handleUpdateTask()}
                                            className="h-7 w-24 text-right border-0 bg-transparent focus-visible:ring-0 p-0 text-sm font-medium placeholder:text-muted-foreground/50"
                                            placeholder="Backend..."
                                        />
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className={cn("w-3 h-3 rounded-full cursor-pointer", tagColors[tagColor as TagColorName]?.dot || 'bg-gray-500')} />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-2" align="end">
                                                <div className="grid grid-cols-5 gap-2">
                                                    {tagColorOptions.map((c) => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => handleUpdateTask({ tagColor: c.value })}
                                                            className={cn("w-5 h-5 rounded-full", tagColors[c.value].dot)}
                                                            title={c.label}
                                                        />
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Time Spent */}
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">Tiempo Total</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-300">
                                            {formatTime(task.totalTime || 0)}
                                        </span>
                                        <EditTimeDialog
                                            taskId={task.id}
                                            currentTotalSeconds={task.totalTime || 0}
                                            onTimeUpdated={() => router.refresh()}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments Widget */}
                    <Card className="border-0 shadow-lg flex-1 flex flex-col min-h-[400px]">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="w-5 h-5 text-indigo-500" />
                                Comentarios
                                <Badge variant="secondary" className="ml-auto rounded-full px-2">
                                    {comments.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-6 gap-4">
                            <ScrollArea className="flex-1 pr-4 max-h-[400px]">
                                <div className="space-y-6">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage src={comment.user.avatar || undefined} />
                                                <AvatarFallback>{comment.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {comment.user.name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {format(new Date(comment.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div className="text-sm bg-muted/50 p-3 rounded-xl rounded-tl-none text-slate-600 dark:text-slate-300 group-hover:bg-muted transition-colors">
                                                    {comment.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground text-sm italic">
                                            Sé el primero en comentar.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="pt-4 mt-auto border-t">
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Escribe un comentario..."
                                        className="resize-none min-h-[80px] rounded-xl bg-muted/30 border-0 ring-1 ring-border focus-visible:ring-indigo-500 transition-all font-medium placeholder:text-muted-foreground/50"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSubmitComment()
                                            }
                                        }}
                                    />
                                    <Button
                                        className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                                        onClick={handleSubmitComment}
                                        disabled={isSubmittingComment || !newComment.trim()}
                                    >
                                        {isSubmittingComment ? 'Enviando...' : 'Publicar Comentario'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
