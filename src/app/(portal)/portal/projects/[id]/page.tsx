import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"
import { ProjectChat } from "@/components/projects/project-chat"

export default async function PortalProjectPage({
    params
}: {
    params: { id: string }
}) {
    // Await params object for Next.js 15+ compatibility
    const { id } = await params
    const supabase = await createClient()

    // Fetch project details (RLS ensures access)
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (!project) {
        notFound()
    }

    // Fetch tasks
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('status', { ascending: true }) // Group slightly by status logic

    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
        'todo': { label: 'Pendiente', color: 'bg-slate-100 text-slate-700', icon: Circle },
        'in-progress': { label: 'En Progreso', color: 'bg-blue-100 text-blue-700', icon: Clock },
        'review': { label: 'Revisión', color: 'bg-purple-100 text-purple-700', icon: AlertCircle },
        'done': { label: 'Completado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <a href="/portal" className="hover:underline">Mis Proyectos</a>
                    <span>/</span>
                    <span>{project.name}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    {project.description || "Sin descripción"}
                </p>
            </div>

            {/* Task List */}
            <div className="grid gap-4">
                {tasks?.map((task) => {
                    const status = statusMap[task.status] || statusMap['todo']
                    const StatusIcon = status.icon

                    return (
                        <Card key={task.id} className="overflow-hidden hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="font-semibold text-lg">{task.title}</h3>
                                        <Badge variant="secondary" className={`shrink-0 ${status.color} border-0`}>
                                            <StatusIcon className="h-3 w-3 mr-1.5" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                    {task.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                </div>

                                {task.deadline && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full self-start sm:self-center">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}

                {(!tasks || tasks.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                        No hay tareas visibles en este proyecto.
                    </div>
                )}
            </div>

            {/* Project Chat */}
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Conversación</h2>
                <ProjectChat projectId={id} />
            </div>
        </div>
    )
}
