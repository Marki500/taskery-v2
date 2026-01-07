'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Task } from "@/components/kanban/task-card"
import { logActivity } from "../activity/actions"

// Re-export updateTaskStatus as moveTask to match plan vocabulary and allow future expansion for reordering
export async function moveTask(taskId: string, newStatus: string, newIndex: number) {
    // Current implementation only updates status. 
    // TODO: Implement reordering logic when 'order' column is added to database.

    return updateTaskStatus(taskId, newStatus)
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

    if (error) {
        console.error('Error updating task status:', error)
        throw new Error('Failed to update task status')
    }

    revalidatePath('/projects/[id]', 'page')
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
    const supabase = await createClient()

    // Fetch tasks with their accumulated time from time_entries
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    // Fetch time entries for all tasks in this project
    const taskIds = tasks.map((t: any) => t.id)

    const [timeEntriesResult, subtasksResult, commentsResult] = await Promise.all([
        supabase
            .from('time_entries')
            .select('task_id, duration')
            .in('task_id', taskIds)
            .not('duration', 'is', null),
        supabase
            .from('subtasks')
            .select('task_id, completed')
            .in('task_id', taskIds),
        supabase
            .from('task_comments')
            .select('task_id')
            .in('task_id', taskIds)
    ])

    // Calculate total time per task
    const timeByTask: Record<string, number> = {}
    if (timeEntriesResult.data) {
        timeEntriesResult.data.forEach((entry: any) => {
            timeByTask[entry.task_id] = (timeByTask[entry.task_id] || 0) + (entry.duration || 0)
        })
    }

    // Calculate subtask counts per task
    const subtasksByTask: Record<string, { total: number; completed: number }> = {}
    if (subtasksResult.data) {
        subtasksResult.data.forEach((s: any) => {
            if (!subtasksByTask[s.task_id]) {
                subtasksByTask[s.task_id] = { total: 0, completed: 0 }
            }
            subtasksByTask[s.task_id].total++
            if (s.completed) {
                subtasksByTask[s.task_id].completed++
            }
        })
    }

    // Calculate comment counts per task
    const commentsByTask: Record<string, number> = {}
    if (commentsResult.data) {
        commentsResult.data.forEach((c: any) => {
            commentsByTask[c.task_id] = (commentsByTask[c.task_id] || 0) + 1
        })
    }

    return tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || null,
        columnId: task.status,
        tag: task.tag,
        tagColor: task.tag_color || null,
        projectId: projectId,
        totalTime: timeByTask[task.id] || 0,
        deadline: task.deadline || null,
        assignedTo: task.assigned_to || null,
        subtaskCount: subtasksByTask[task.id] || undefined,
        commentCount: commentsByTask[task.id] || 0
    }))
}


export interface WorkspaceMember {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
}

export async function getWorkspaceMembers(projectId: string): Promise<WorkspaceMember[]> {
    const supabase = await createClient()

    // Get the workspace for this project
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (!project) return []

    // Get all members of this workspace
    const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id, profiles(id, email, full_name, avatar_url)')
        .eq('workspace_id', project.workspace_id)

    if (!members) return []

    return members.map((m: any) => ({
        id: m.profiles?.id || m.user_id,
        email: m.profiles?.email || 'No email',
        fullName: m.profiles?.full_name,
        avatarUrl: m.profiles?.avatar_url
    }))
}

export async function createTask(
    projectId: string,
    title: string,
    tag?: string,
    deadline?: string | null,
    description?: string | null,
    assignedTo?: string | null
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            title: title,
            description: description || null,
            status: 'todo',
            tag: tag || null,
            deadline: deadline || null,
            assigned_to: assignedTo || (user ? user.id : null)
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating task:', error)
        throw new Error('Failed to create task')
    }

    // Log creation
    try {
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id')
            .eq('id', projectId)
            .single()

        if (project) {
            await logActivity(
                project.workspace_id,
                'task_created',
                data.id,
                'task',
                { title }
            )
        }
    } catch (e) {
        console.error('Error logging task creation:', e)
    }

    revalidatePath('/projects/[id]', 'page')
    return data
}

export interface TaskUpdateData {
    title: string
    description?: string | null
    tag?: string | null
    tagColor?: string | null
    deadline?: string | null
    assignedTo?: string | null
    status?: string
    priority?: string
    notes?: string | null
}

export async function updateTask(taskId: string, data: TaskUpdateData) {
    const supabase = await createClient()

    const updateData: any = {
        title: data.title,
        description: data.description || null,
        tag: data.tag || null,
        tag_color: data.tagColor || null,
        deadline: data.deadline || null,
        assigned_to: data.assignedTo || null,
        notes: data.notes !== undefined ? data.notes : undefined,
    }

    // Note: priority field is not in the database schema, so we don't include it

    if (data.status) {
        updateData.status = data.status
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error('Error updating task:', error)
        throw new Error('Failed to update task')
    }

    // Log completion
    if (data.status === 'done') {
        try {
            const { data: taskData } = await supabase
                .from('tasks')
                .select('project_id, projects!inner(workspace_id)')
                .eq('id', taskId)
                .single()

            if (taskData?.projects) {
                // @ts-ignore
                const workspaceId = taskData.projects.workspace_id
                await logActivity(
                    workspaceId,
                    'task_completed',
                    taskId,
                    'task',
                    { title: data.title }
                )
            }
        } catch (e) {
            console.error('Error logging completion:', e)
        }
    }

    revalidatePath('/projects/[id]', 'page')
    revalidatePath('/dashboard', 'page')
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) {
        console.error('Error deleting task:', error)
        throw new Error('Failed to delete task')
    }

    revalidatePath('/projects/[id]', 'page')
}
