import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CheckCircle2, Clock, ArrowRight } from "lucide-react"

export default async function PortalPage() {
    const supabase = await createClient()

    // Get projects assigned to the client (RLS will filter this automatically)
    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
            *,
            tasks (
                id,
                status,
                deadline
            )
        `)
        .order('created_at', { ascending: false })

    if (!projects || projects.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-2">Bienvenido a tu Portal</h2>
                <p className="text-muted-foreground">No tienes proyectos activos asignados en este momento.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Proyectos</h1>
                <p className="text-muted-foreground mt-2">
                    Seguimiento en tiempo real del estado de tus proyectos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => {
                    const totalTasks = project.tasks?.length || 0
                    const completedTasks = project.tasks?.filter((t: any) => t.status === 'done').length || 0
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                    return (
                        <Link key={project.id} href={`/portal/projects/${project.id}`} className="block group">
                            <Card className="h-full hover:shadow-lg transition-all border-l-4 border-l-primary/50 hover:border-l-primary">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                                {project.name}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 mt-2">
                                                {project.description || "Sin descripción"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Progreso</span>
                                            <span className="font-medium">{progress}%</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                <span>{completedTasks}/{totalTasks} tareas</span>
                                            </div>
                                            {project.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
