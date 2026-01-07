'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "../activity/actions"

export interface TaskComment {
    id: string
    taskId: string
    userId: string
    content: string
    createdAt: string
    user: {
        name: string
        avatar: string | null
    }
}

export async function getTaskDetails(taskId: string) {
    const supabase = await createClient()

    const { data: task, error } = await supabase
        .from('tasks')
        .select(`
            *,
            project:projects(name, id)
        `)
        .eq('id', taskId)
        .single()

    if (error || !task) {
        console.error('Error fetching task details:', error)
        return null
    }

    return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        projectId: task.project.id,
        projectName: task.project.name,
        tag: task.tag,
        tagColor: task.tag_color,
        assignedTo: task.assigned_to,
        createdAt: task.created_at,
        notes: task.notes
    }
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('task_comments')
        .select(`
            *,
            user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching comments:', error)
        return []
    }

    return data.map((c: any) => ({
        id: c.id,
        taskId: c.task_id,
        userId: c.user_id,
        content: c.content,
        createdAt: c.created_at,
        user: {
            name: c.user?.full_name || 'Usuario',
            avatar: c.user?.avatar_url
        }
    }))
}

export async function addTaskComment(taskId: string, projectId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
        .from('task_comments')
        .insert({
            task_id: taskId,
            user_id: user.id,
            content
        })
        .select()
        .single()

    if (error) {
        throw new Error('Failed to add comment')
    }

    // Get workspace ID from project to log activity
    const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single()

    if (project) {
        await logActivity(
            project.workspace_id,
            'comment_created',
            taskId, // We link activity to the task, not the comment itself, so it shows up in task history
            'comment',
            { commentId: data.id }
        )
    }

    revalidatePath(`/projects/${projectId}/tasks/${taskId}`)
    return { success: true }
}
