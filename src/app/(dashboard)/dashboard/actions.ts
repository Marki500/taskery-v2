'use server'

import { createClient } from "@/utils/supabase/server"

export interface TaskWithDeadline {
    id: string
    title: string
    projectId: string
    projectName: string
    status: string
    deadline: string
}

export async function getTasksWithDeadlines(): Promise<TaskWithDeadline[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user's workspaces
    const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) return []

    const workspaceIds = memberships.map(m => m.workspace_id)

    // Get projects in those workspaces
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('workspace_id', workspaceIds)

    if (!projects || projects.length === 0) return []

    const projectIds = projects.map(p => p.id)
    const projectMap = new Map(projects.map(p => [p.id, p.name]))

    // Get tasks with deadlines
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, project_id, status, deadline')
        .in('project_id', projectIds)
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true })

    if (error || !tasks) {
        console.error('Error fetching tasks with deadlines:', error)
        return []
    }

    return tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        projectId: task.project_id,
        projectName: projectMap.get(task.project_id) || 'Unknown',
        status: task.status,
        deadline: task.deadline
    }))
}

export async function getDashboardStats(filter: 'all' | 'assigned' = 'all') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const emptyStats = {
        totalProjects: 0,
        pendingTasks: 0,
        completedTasks: 0,
        completedThisWeek: 0,
        weeklyActivity: [],
        upcomingDeadlines: [],
        productivityScore: 0,
        tasksByStatus: { todo: 0, inProgress: 0, review: 0, done: 0 },
        totalHoursThisWeek: 0
    }

    if (!user) return emptyStats

    // Date calculations
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Monday
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Get workspaces
    const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)

    if (!memberships?.length) return emptyStats
    const workspaceIds = memberships.map(m => m.workspace_id)

    // Get projects with members
    const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            project_members (
                user_id
            )
        `)
        .in('workspace_id', workspaceIds)

    console.log('🔍 DEBUG getDashboardStats - Workspace IDs:', workspaceIds)
    console.log('🔍 DEBUG getDashboardStats - Projects:', projectsData)
    console.log('🔍 DEBUG getDashboardStats - Projects Error:', projectsError)

    // Apply filter
    let projects = projectsData || []
    if (filter === 'assigned') {
        projects = projects.filter((project: any) =>
            project.project_members?.some((member: any) => member.user_id === user.id)
        )
    }

    const projectIds = projects?.map((p: any) => p.id) || []

    if (projectIds.length === 0) {
        return {
            totalProjects: 0,
            pendingTasks: 0,
            completedTasks: 0,
            completedThisWeek: 0,
            weeklyActivity: [],
            upcomingDeadlines: [],
            productivityScore: 0,
            tasksByStatus: { todo: 0, inProgress: 0, review: 0, done: 0 },
            totalHoursThisWeek: 0
        }
    }

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, created_at, deadline, title, project_id')
        .in('project_id', projectIds)

    console.log('🔍 DEBUG getDashboardStats - Project IDs:', projectIds)
    console.log('🔍 DEBUG getDashboardStats - Tasks:', tasks)
    console.log('🔍 DEBUG getDashboardStats - Tasks Error:', tasksError)
    console.log('🔍 DEBUG getDashboardStats - Tasks Length:', tasks?.length)

    if (!tasks) return emptyStats

    // Calculate metrics
    const pendingTasks = tasks.filter(t => t.status !== 'done').length
    const completedTasks = tasks.filter(t => t.status === 'done').length

    const completedThisWeek = tasks.filter(t =>
        t.status === 'done' &&
        new Date(t.created_at) >= startOfWeek // Approximation: usually we check update time for completion, but created is safer if we don't track updated_at specific to status
    ).length

    // Upcoming deadlines (today/tomorrow)
    const upcomingDeadlines = tasks
        .filter(t => t.deadline && new Date(t.deadline) >= now && new Date(t.deadline) <= new Date(now.getTime() + 48 * 60 * 60 * 1000) && t.status !== 'done')
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5)

    // Real weekly activity from workspace_activity
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: activityLogs } = await supabase
        .from('workspace_activity')
        .select('action_type, created_at')
        .in('workspace_id', workspaceIds)
        .gte('created_at', sevenDaysAgo.toISOString())

    const daysMap = new Map<string, { total: number, completed: number }>()

    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        // Store as YYYY-MM-DD for grouping
        const dateKey = d.toISOString().split('T')[0]
        // Store day name for display (e.g. "L", "M")
        const dayName = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()]
        daysMap.set(dateKey, { total: 0, completed: 0 })
    }

    if (activityLogs) {
        activityLogs.forEach((log: any) => {
            const dateKey = new Date(log.created_at).toISOString().split('T')[0]
            if (daysMap.has(dateKey)) {
                const dayStats = daysMap.get(dateKey)!
                if (log.action_type === 'task_created') {
                    dayStats.total += 1
                } else if (log.action_type === 'task_completed') {
                    dayStats.completed += 1
                }
            }
        })
    }

    // Convert map to array and sort by date (oldest first)
    const weeklyActivity = Array.from(daysMap.entries())
        .map(([dateKey, stats]) => {
            const date = new Date(dateKey)
            const dayName = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()]
            return {
                name: dayName,
                total: stats.total,
                completed: stats.completed,
                date: date // keep date for potential sorting reference if needed
            }
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(({ name, total, completed }) => ({ name, total, completed }))

    // Task distribution by status for donut chart
    const tasksByStatus = {
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
    }

    // Get time tracking data for this week
    const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration')
        .in('task_id', tasks.map(t => t.id))
        .gte('started_at', startOfWeek.toISOString())

    const totalSecondsThisWeek = timeEntries?.reduce((sum, entry) => sum + (entry.duration || 0), 0) || 0
    const totalHoursThisWeek = Math.round((totalSecondsThisWeek / 3600) * 10) / 10 // Round to 1 decimal

    return {
        totalProjects: projects?.length || 0,
        pendingTasks,
        completedTasks,
        completedThisWeek,
        weeklyActivity,
        upcomingDeadlines,
        productivityScore: completedTasks + pendingTasks > 0 ? Math.round((completedTasks / (completedTasks + pendingTasks)) * 100) : 0,
        tasksByStatus,
        totalHoursThisWeek
    }
}
