'use client'

import { useEffect, useState } from 'react'
import { useProjectFilter } from '@/contexts/ProjectFilterContext'
import { getDashboardStats } from './actions'
import { GreetingWidget } from "@/components/dashboard/widgets/greeting-widget"
import { MetricCards } from "@/components/dashboard/widgets/metric-cards"
import { ProductivityChart } from "@/components/dashboard/widgets/productivity-chart"
import { FocusList } from "@/components/dashboard/widgets/focus-list"
import { TaskDistributionChart } from "@/components/dashboard/widgets/task-distribution-chart"
import { TimeTrackingWidget } from "@/components/dashboard/widgets/time-tracking-widget"
import { ActivityFeed } from "@/components/dashboard/widgets/activity-feed"
import { ProjectFilterToggle } from '@/components/project-filter-toggle'

interface DashboardClientProps {
    userId: string
    userName: string
    workspaceId: string | null
    initialStats: any
}

export function DashboardClient({ userId, userName, workspaceId, initialStats }: DashboardClientProps) {
    const { filter } = useProjectFilter()
    const [stats, setStats] = useState(initialStats)
    const [loading, setLoading] = useState(false)

    // Reload stats when filter changes
    useEffect(() => {
        const loadStats = async () => {
            setLoading(true)
            try {
                const newStats = await getDashboardStats(filter)
                setStats(newStats)
            } catch (error) {
                console.error('Error loading dashboard stats:', error)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [filter])

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.03),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.03),transparent_50%)]" />

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Cargando estadísticas...</p>
                    </div>
                </div>
            )}

            {/* Filter Toggle */}
            <div className="flex justify-end">
                <ProjectFilterToggle />
            </div>

            {/* 1. Greeting Section */}
            <GreetingWidget
                userName={userName}
                pendingCount={stats.pendingTasks}
                productivityScore={stats.productivityScore}
            />

            {/* 2. Key Metrics Row */}
            <MetricCards
                projects={stats.totalProjects}
                pending={stats.pendingTasks}
                completed={stats.completedTasks}
            />

            {/* 3. Main Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart takes 2 columns */}
                <div className="lg:col-span-2">
                    <ProductivityChart data={stats.weeklyActivity} />
                </div>

                {/* Focus List takes 1 column */}
                <div className="lg:col-span-1 min-h-[400px]">
                    <FocusList tasks={stats.upcomingDeadlines} />
                </div>
            </div>

            {/* 4. Secondary Grid - Dist & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-6">
                    <TaskDistributionChart data={stats.tasksByStatus} />
                    <TimeTrackingWidget totalHours={stats.totalHoursThisWeek} />
                </div>

                {/* 5. Activity Feed */}
                <div className="h-[500px]">
                    {workspaceId && <ActivityFeed workspaceId={workspaceId} />}
                </div>
            </div>
        </div>
    )
}
