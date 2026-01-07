'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle2, MessageSquare, UserPlus, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ActivityLog, getAllWorkspacesActivity } from "@/app/(dashboard)/activity/actions"

interface ActivityFeedProps {
    workspaceId?: string // Optional now - if not provided, shows all workspaces
}

export function ActivityFeed({ workspaceId }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Always use getAllWorkspacesActivity to show activity from all workspaces
        getAllWorkspacesActivity()
            .then(setActivities)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const getIcon = (type: ActivityLog['actionType']) => {
        switch (type) {
            case 'task_completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'task_created':
                return <Activity className="h-4 w-4 text-blue-500" />
            case 'comment_created':
                return <MessageSquare className="h-4 w-4 text-purple-500" />
            case 'member_invited':
                return <UserPlus className="h-4 w-4 text-orange-500" />
            default:
                return <Activity className="h-4 w-4 text-gray-500" />
        }
    }

    const getDescription = (log: ActivityLog) => {
        const userName = log.userName || log.userEmail?.split('@')[0] || 'Alguien'

        switch (log.actionType) {
            case 'task_created':
                return (
                    <span>
                        <span className="font-semibold">{userName}</span> creó la tarea <span className="font-medium text-foreground">"{log.metadata.title}"</span>
                    </span>
                )
            case 'task_completed':
                return (
                    <span>
                        <span className="font-semibold">{userName}</span> completó la tarea <span className="font-medium text-foreground">"{log.metadata.title}"</span>
                    </span>
                )
            case 'comment_created':
                return (
                    <span>
                        <span className="font-semibold">{userName}</span> comentó en una tarea
                    </span>
                )
            case 'member_invited':
                return (
                    <span>
                        <span className="font-semibold">{userName}</span> invitó a <span className="font-medium text-foreground">{log.metadata.email}</span>
                    </span>
                )
            default:
                return <span>Actividad desconocida</span>
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>Actividad Reciente</CardTitle>
                </div>
                <CardDescription>Últimos movimientos en el workspace</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[350px] px-6 pb-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Cargando...
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 text-center">
                            <Activity className="h-8 w-8 mb-2 opacity-50" />
                            <p>No hay actividad reciente</p>
                        </div>
                    ) : (
                        <div className="space-y-6 pt-2">
                            {activities.map((log) => (
                                <div key={log.id} className="flex gap-4 relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-border last:hidden" />

                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                            <AvatarImage src={log.userAvatar || undefined} />
                                            <AvatarFallback className="text-xs font-bold">
                                                {(log.userName?.[0] || log.userEmail?.[0] || 'U').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                                            {getIcon(log.actionType)}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-1 py-0.5">
                                        <p className="text-sm text-muted-foreground leading-snug">
                                            {getDescription(log)}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {formatDistanceToNow(new Date(log.createdAt), {
                                                addSuffix: true,
                                                locale: es
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
