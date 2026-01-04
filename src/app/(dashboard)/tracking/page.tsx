import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer, Clock, Play, Calendar as CalendarIcon, Hash } from "lucide-react"
import { formatTime } from "@/contexts/timer-context" // Helper from context (or I can duplicate it)
import { Badge } from "@/components/ui/badge"

// Helper to format seconds if context import server-side is tricky (it's safe usually but let's be robust)
function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

interface TimeEntry {
    id: string
    started_at: string
    ended_at: string | null
    duration: number | null
    task: {
        id: string
        title: string
        project: {
            id: string
            name: string
            workspace_id: string
        } | null
    } | null
}

export default async function TrackingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch time entries with task and project info
    const { data, error } = await supabase
        .from('time_entries')
        .select(`
            id,
            started_at,
            ended_at,
            duration,
            task:tasks (
                id,
                title,
                project:projects (
                    id,
                    name,
                    workspace_id
                )
            )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(100) // Limit for performance

    if (error) {
        console.error('Error fetching time entries:', error)
    }

    // Manual cast because Supabase types might infer arrays for joins
    const entries = (data || []).map(entry => ({
        ...entry,
        task: Array.isArray(entry.task) ? entry.task[0] : entry.task
    })) as unknown as TimeEntry[]

    // Group by date
    const groupedEntries: Record<string, typeof entries> = {}

    entries?.forEach(entry => {
        const date = new Date(entry.started_at).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        if (!groupedEntries[date]) {
            groupedEntries[date] = []
        }
        groupedEntries[date].push(entry)
    })

    const hasEntries = entries && entries.length > 0
    const totalDuration = entries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Timer className="h-8 w-8 text-primary" />
                        Time Tracking
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Historial de tus sesiones de trabajo
                    </p>
                </div>

                {hasEntries && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Registrado</p>
                                <p className="text-2xl font-bold font-mono text-primary">
                                    {formatDuration(totalDuration)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {!hasEntries ? (
                <Card className="rounded-2xl shadow-sm border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No hay actividad registrada</h3>
                        <p className="max-w-md mx-auto">
                            Inicia el contador en cualquier tarea para empezar a registrar tu tiempo. Tu historial aparecerá aquí.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedEntries).map(([date, dayEntries]) => {
                        const dayTotal = dayEntries?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;

                        return (
                            <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="font-medium text-lg capitalize flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {date}
                                    </h3>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {formatDuration(dayTotal)}
                                    </Badge>
                                </div>

                                <Card className="overflow-hidden shadow-sm">
                                    <div className="divide-y divide-border">
                                        {dayEntries?.map((entry) => (
                                            <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4 group">
                                                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <Play className="h-4 w-4 fill-current" />
                                                </div>

                                                <div className="flex-1 min-w-0 grid gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium truncate">
                                                            {entry.task?.title || 'Tarea eliminada'}
                                                        </span>
                                                        {entry.task?.project && (
                                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                {entry.task.project.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                                                        <span>
                                                            {new Date(entry.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            {' - '}
                                                            {entry.ended_at
                                                                ? new Date(entry.ended_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                                                : 'En curso...'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-lg font-bold font-mono tracking-tight tabular-nums">
                                                        {formatDuration(entry.duration || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
