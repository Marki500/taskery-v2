'use client'

import React from 'react'
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Play, Clock, CalendarIcon, Pencil, Eye, Trash2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useTimer, formatTime } from "@/contexts/timer-context"
import { toast } from "sonner"
import { deleteTask } from "@/app/(dashboard)/projects/actions"
import { Button } from "@/components/ui/button"
import { TaskSidebar } from "./task-sidebar"
import { cn } from "@/lib/utils"
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { SubtaskProgress } from "./subtask-list"
import { CommentCount } from "./comment-list"
import { getTagColorStyles } from "@/lib/tag-colors"

export type Task = {
    id: string
    title: string
    description?: string | null
    columnId: string
    tag?: string
    tagColor?: string | null // Color name for tag
    projectId?: string
    totalTime?: number  // Accumulated time in seconds from time_entries
    deadline?: string | null  // ISO date string for deadline
    assignedTo?: string | null // User ID of assigned person
    subtaskCount?: { total: number; completed: number } // Subtask progress
    commentCount?: number // Number of comments
}

interface TaskCardProps {
    task: Task
    onTaskUpdated?: () => void
}

// Color mapping for left border based on column status
const columnColors: Record<string, string> = {
    'todo': 'border-l-yellow-500',
    'in-progress': 'border-l-blue-500',
    'review': 'border-l-purple-500',
    'done': 'border-l-green-500',
}

// Get deadline display info with urgency colors
function getDeadlineInfo(deadline: string | null | undefined) {
    if (!deadline) return null

    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysUntil = differenceInDays(deadlineDate, now)

    let color = "text-muted-foreground"
    let bgColor = "bg-muted/50"
    let label = format(deadlineDate, "d MMM", { locale: es })

    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
        color = "text-red-600"
        bgColor = "bg-red-100 dark:bg-red-900/30"
        label = "Vencida"
    } else if (isToday(deadlineDate)) {
        color = "text-orange-600"
        bgColor = "bg-orange-100 dark:bg-orange-900/30"
        label = "Hoy"
    } else if (isTomorrow(deadlineDate)) {
        color = "text-amber-600"
        bgColor = "bg-amber-100 dark:bg-amber-900/30"
        label = "Mañana"
    } else if (daysUntil <= 3) {
        color = "text-yellow-600"
        bgColor = "bg-yellow-100 dark:bg-yellow-900/30"
    }

    return { color, bgColor, label }
}

function TaskCardComponent({ task, onTaskUpdated }: TaskCardProps) {
    const { startTimer, stopTimer, activeTask, elapsedSeconds } = useTimer()
    const isTimerActive = activeTask?.id === task.id
    const deadlineInfo = getDeadlineInfo(task.deadline)

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
    })

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    }

    const handleStartTimer = (e: React.MouseEvent) => {
        e.stopPropagation()
        startTimer({
            id: task.id,
            title: task.title,
            projectId: task.projectId || 'unknown',
            totalTime: task.totalTime || 0
        })
    }

    const handleStopTimer = (e: React.MouseEvent) => {
        e.stopPropagation()
        stopTimer()
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()

        toast.promise(deleteTask(task.id), {
            loading: 'Eliminando tarea...',
            success: () => {
                onTaskUpdated?.()
                return 'Tarea eliminada correctamente'
            },
            error: 'Error al eliminar la tarea'
        })
    }

    const leftBorderColor = columnColors[task.columnId] || 'border-l-muted'

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-muted/50 border-2 border-dashed border-primary/50 rounded-xl h-[140px]"
            />
        )
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "relative cursor-grab active:cursor-grabbing hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300 group touch-none rounded-xl overflow-hidden border-y border-r border-transparent",
                "border-l-4",
                leftBorderColor,
                isTimerActive
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'hover:border-primary/40'
            )}
        >
            {/* Action Buttons - Premium Corner Control */}
            <div className="absolute top-0 right-0 flex items-center gap-0.5 z-20 bg-card/80 backdrop-blur-md py-1.5 px-2 pl-4 rounded-bl-[20px] rounded-tr-xl border-border/40 shadow-sm transition-all duration-300 hover:bg-card hover:border-border/80 hover:shadow-md group/actions">
                {/* View Details Button */}
                <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/70 hover:text-primary transition-colors"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                </Link>
                {/* Edit Button */}
                <TaskSidebar
                    task={task}
                    onTaskUpdated={onTaskUpdated}
                    trigger={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/70 hover:text-primary transition-colors"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    }
                />

                {/* Timer Button */}
                {isTimerActive ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors animate-pulse"
                        onClick={handleStopTimer}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="h-3 w-3 bg-current rounded-sm" />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={handleStartTimer}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Play className="h-3.5 w-3.5" />
                    </Button>
                )}

                {/* Delete Button with Confirmation */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/70 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-colors"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Estás a punto de eliminar "{task.title}". Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                            >
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Drag Handle */}
                <div className="flex items-center justify-center h-7 w-6 text-muted-foreground/30 hover:text-foreground cursor-grab">
                    <GripVertical className="h-3.5 w-3.5" />
                </div>
            </div>

            <CardContent className="p-5 space-y-4 pt-7">
                <div className="flex items-start">
                    <Link
                        href={`/projects/${task.projectId}/tasks/${task.id}`}
                        className="text-xl font-bold leading-tight line-clamp-3 text-card-foreground tracking-tight hover:text-primary transition-colors cursor-pointer block w-full"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {task.title}
                    </Link>
                </div>

                {/* Deadline Display */}
                {deadlineInfo && (
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold w-fit",
                        deadlineInfo.bgColor,
                        deadlineInfo.color
                    )}>
                        <CalendarIcon className="h-4 w-4" />
                        <span>{deadlineInfo.label}</span>
                    </div>
                )}

                {/* Time Display - Always visible */}
                <div className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg transition-colors border border-transparent",
                    isTimerActive
                        ? "bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200"
                        : "bg-muted/50"
                )}>
                    <Clock className={cn(
                        "h-4 w-4",
                        isTimerActive ? "text-indigo-600 animate-pulse" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                        "text-sm font-bold font-mono",
                        isTimerActive ? "text-indigo-600" : "text-muted-foreground"
                    )}>
                        {isTimerActive
                            ? formatTime((task.totalTime || 0) + elapsedSeconds)
                            : formatTime(task.totalTime || 0)}
                    </span>
                    {isTimerActive && (
                        <span className="text-xs text-indigo-500 font-bold ml-auto uppercase tracking-wider">En curso</span>
                    )}
                </div>

                {/* Tag Badge, Subtask Progress and Comments */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                    {task.tag && (() => {
                        const tagStyles = getTagColorStyles(task.tagColor)
                        return (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-[11px] px-2.5 py-1 font-bold rounded-md uppercase tracking-wider",
                                    tagStyles.bg,
                                    tagStyles.text
                                )}
                            >
                                {task.tag}
                            </Badge>
                        )
                    })()}
                    {task.subtaskCount && task.subtaskCount.total > 0 && (
                        <SubtaskProgress
                            completed={task.subtaskCount.completed}
                            total={task.subtaskCount.total}
                        />
                    )}
                    {task.commentCount !== undefined && task.commentCount > 0 && (
                        <CommentCount count={task.commentCount} />
                    )}

                </div>
            </CardContent>
        </Card >
    )
}

export const TaskCard = React.memo(TaskCardComponent, (prev, next) => {
    // Custom comparison for performance
    return (
        prev.task.id === next.task.id &&
        prev.task.title === next.task.title &&
        prev.task.description === next.task.description &&
        prev.task.columnId === next.task.columnId &&
        prev.task.totalTime === next.task.totalTime &&
        prev.task.deadline === next.task.deadline &&
        prev.task.subtaskCount?.completed === next.task.subtaskCount?.completed &&
        prev.task.subtaskCount?.total === next.task.subtaskCount?.total &&
        prev.task.commentCount === next.task.commentCount
    )
})
