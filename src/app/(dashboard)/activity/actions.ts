'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export interface ActivityLog {
    id: string
    workspaceId: string
    userId: string
    actionType: 'task_created' | 'task_completed' | 'task_updated' | 'comment_created' | 'member_invited' | 'member_removed' | 'member_joined'
    entityId: string
    entityType: 'task' | 'comment' | 'invitation' | 'member'
    metadata: Record<string, any>
    createdAt: string
    // User info
    userName?: string
    userEmail?: string
    userAvatar?: string | null
}

/**
 * Log a new activity
 */
export async function logActivity(
    workspaceId: string,
    actionType: ActivityLog['actionType'],
    entityId: string,
    entityType: ActivityLog['entityType'],
    metadata: Record<string, any> = {}
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
        const { error } = await supabase.from('workspace_activity').insert({
            workspace_id: workspaceId,
            user_id: user.id,
            action_type: actionType,
            entity_id: entityId,
            entity_type: entityType,
            metadata
        })

        if (error) {
            console.error('Error logging activity:', error)
        }
    } catch (error) {
        console.error('Error logging activity:', error)
        // We don't want to fail the main action if logging fails
    }
}

/**
 * Get recent activity for a workspace
 */
export async function getWorkspaceActivity(workspaceId: string, limit = 20): Promise<ActivityLog[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('workspace_activity')
        .select(`
            *,
            user:profiles!user_id(full_name, email, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !data) {
        console.error('Error fetching activity:', error)
        return []
    }

    return data.map((log: any) => ({
        id: log.id,
        workspaceId: log.workspace_id,
        userId: log.user_id,
        actionType: log.action_type,
        entityId: log.entity_id,
        entityType: log.entity_type,
        metadata: log.metadata || {},
        createdAt: log.created_at,
        userName: log.user?.full_name || null,
        userEmail: log.user?.email || null,
        userAvatar: log.user?.avatar_url || null
    }))
}

/**
 * Get recent activity from ALL workspaces the user belongs to
 */
export async function getAllWorkspacesActivity(limit = 20): Promise<ActivityLog[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get all workspaces the user belongs to
    const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) return []

    const workspaceIds = memberships.map(m => m.workspace_id)

    // Get activities from all workspaces
    const { data, error } = await supabase
        .from('workspace_activity')
        .select(`
            *,
            user:profiles!user_id(full_name, email, avatar_url)
        `)
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !data) {
        console.error('Error fetching all workspaces activity:', error)
        return []
    }

    return data.map((log: any) => ({
        id: log.id,
        workspaceId: log.workspace_id,
        userId: log.user_id,
        actionType: log.action_type,
        entityId: log.entity_id,
        entityType: log.entity_type,
        metadata: log.metadata || {},
        createdAt: log.created_at,
        userName: log.user?.full_name || null,
        userEmail: log.user?.email || null,
        userAvatar: log.user?.avatar_url || null
    }))
}

export async function getTaskActivity(taskId: string, limit = 50): Promise<ActivityLog[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('workspace_activity')
        .select(`
            *,
            user:profiles!user_id(full_name, email, avatar_url)
        `)
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !data) {
        console.error('Error fetching task activity:', error)
        return []
    }

    return data.map((log: any) => ({
        id: log.id,
        workspaceId: log.workspace_id,
        userId: log.user_id,
        actionType: log.action_type,
        entityId: log.entity_id,
        entityType: log.entity_type,
        metadata: log.metadata || {},
        createdAt: log.created_at,
        userName: log.user?.full_name || null,
        userEmail: log.user?.email || null,
        userAvatar: log.user?.avatar_url || null
    }))
}
