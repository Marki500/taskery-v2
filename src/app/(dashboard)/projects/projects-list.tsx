'use client'

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FolderKanban, Clock, ArrowRight, Rocket, Target, Briefcase, Star, Layout } from "lucide-react"
import { NewProjectDialog } from "./new-project-dialog"
import { ProjectFilterToggle } from "@/components/project-filter-toggle"
import { cn } from "@/lib/utils"
import { ProjectSearch } from "./project-search"
import { Project, getProjectsWithMembers } from "./project-actions"
import { useProjectFilter } from "@/contexts/ProjectFilterContext"

const iconMap: Record<string, any> = {
    FolderKanban,
    Rocket,
    Target,
    Briefcase,
    Star,
    Layout,
}

const colorMap: Record<string, string> = {
    gray: 'from-gray-500 to-gray-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    teal: 'from-teal-500 to-teal-600',
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-purple-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
}

interface ProjectsListProps {
    initialProjects: Project[]
    workspaceMembers?: any[]
}

export function ProjectsList({ initialProjects, workspaceMembers = [] }: ProjectsListProps) {
    const [search, setSearch] = useState('')
    const { filter, setFilter } = useProjectFilter()
    const [projects, setProjects] = useState<Project[]>([])  // Start with empty array
    const [loading, setLoading] = useState(true)  // Start with loading true
    const [isInitialized, setIsInitialized] = useState(false)

    // Fetch projects when filter changes or on mount
    useEffect(() => {
        const loadProjects = async () => {
            setLoading(true)
            try {
                const data = await getProjectsWithMembers(filter)
                setProjects(data)
            } catch (error) {
                console.error('Error loading projects:', error)
            } finally {
                setLoading(false)
                setIsInitialized(true)
            }
        }
        loadProjects()
    }, [filter])

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-8">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <ProjectSearch value={search} onChange={setSearch} />
                <ProjectFilterToggle />
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/20">
                    <FolderKanban className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-2xl font-semibold text-muted-foreground">
                        {search ? "No se encontraron proyectos" : filter === 'assigned' ? "No tienes proyectos asignados" : "Sin proyectos todavía"}
                    </h3>
                    <p className="text-muted-foreground mt-2 mb-6 text-center max-w-md">
                        {search
                            ? `No hay proyectos que coincidan con "${search}". Prueba con otro término.`
                            : filter === 'assigned'
                                ? "Aún no te han asignado ningún proyecto. Cambia a 'Todos los Proyectos' para ver todos."
                                : "Crea tu primer proyecto para empezar a organizar tus tareas."}
                    </p>
                    {!search && filter === 'all' && <NewProjectDialog />}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project: any) => {
                        const Icon = iconMap[project.icon || 'FolderKanban'] || FolderKanban
                        const colorGradient = colorMap[project.color || 'indigo']
                        const members = project.project_members || []

                        // Extract domain for favicon
                        let faviconUrl = null
                        if (project.url) {
                            try {
                                let urlStr = project.url
                                if (!urlStr.startsWith('http')) {
                                    urlStr = `https://${urlStr}`
                                }
                                const domain = new URL(urlStr).hostname
                                faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
                            } catch (e) {
                                // Invalid URL
                            }
                        }

                        return (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="h-full border-0 shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 dark:hover:ring-indigo-500/30 transition-all duration-300 dark:shadow-[0_0_30px_-10px_rgba(99,102,241,0.1)] group relative overflow-hidden">
                                    {/* Hover Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent dark:from-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className={cn(
                                                "p-3 rounded-xl shadow-lg text-white bg-gradient-to-br flex items-center justify-center overflow-hidden ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-300",
                                                colorGradient,
                                                faviconUrl && "p-0 h-12 w-12 bg-white" // White background for favicon
                                            )}>
                                                {faviconUrl ? (
                                                    <img
                                                        src={faviconUrl}
                                                        alt={project.name}
                                                        className="w-full h-full object-contain p-2"
                                                        onError={(e) => {
                                                            // Fallback if image fails to load
                                                            const target = e.target as HTMLImageElement
                                                            target.style.display = 'none'
                                                            const parent = target.parentElement
                                                            if (parent) {
                                                                parent.classList.remove('p-0', 'bg-white')
                                                                parent.classList.add('p-3')
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Icon className="h-6 w-6" />
                                                )}
                                            </div>
                                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px] font-black tracking-widest px-2.5 py-1 border border-indigo-100 dark:border-indigo-500/30">
                                                {project.status === 'active' ? 'Activo' : project.status}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-2xl mt-4 text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-black tracking-tight">
                                            {project.name}
                                        </CardTitle>
                                        <CardDescription className="text-base line-clamp-2 min-h-[3rem] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                            {project.description || 'Sin descripción'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/50 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{new Date(project.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                            </div>

                                            {/* Members Avatars */}
                                            {members.length > 0 && (
                                                <div className="flex -space-x-2">
                                                    {members.slice(0, 3).map((member: any) => (
                                                        <Avatar key={member.user_id} className="h-6 w-6 border-2 border-background">
                                                            <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {(member.profiles?.full_name || member.profiles?.email || '?')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {members.length > 3 && (
                                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-bold border-2 border-background">
                                                            +{members.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-bold uppercase tracking-wider">
                                            <span>Abrir</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
