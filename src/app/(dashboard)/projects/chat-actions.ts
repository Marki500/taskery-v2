'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "../activity/actions"

export interface ChatMessage {
    id: string
    projectId: string
    userId: string
    content: string
    createdAt: string
    user: {
        name: string
        avatar: string | null
        email: string
    }
    isMine: boolean
}

export async function getProjectChats(projectId: string): Promise<ChatMessage[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('project_chats')
        .select(`
            *,
            user:profiles!user_id(full_name, avatar_url, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching chats:', error)
        return []
    }

    return data.map((c: any) => ({
        id: c.id,
        projectId: c.project_id,
        userId: c.user_id,
        content: c.content,
        createdAt: c.created_at,
        user: {
            name: c.user?.full_name || c.user?.email?.split('@')[0] || 'Usuario',
            avatar: c.user?.avatar_url,
            email: c.user?.email
        },
        isMine: c.user_id === user.id
    }))
}

export async function sendProjectMessage(projectId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
        .from('project_chats')
        .insert({
            project_id: projectId,
            user_id: user.id,
            content
        })
        .select()
        .single()

    if (error) {
        console.error('Error sending message:', error)
        throw new Error('Failed to send message')
    }

    // Try to log activity (only if workspace member, might fail for clients but that's fine?)
    // Actually, clients probably shouldn't log "workspace activity" visible to everyone in the same way,
    // or maybe they should?
    // Let's safe-guard it.
    try {
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id')
            .eq('id', projectId)
            .single()

        if (project) {
            // Check if user is workspace member to avoid RLS error on workspace_activity if clients can't insert there
            // Clients usually can't insert into workspace_activity unless we added policy.
            // For now, let's skip activity log for chat to keep it simple, or wrap in try/catch.
            // Or better: Let's assume real-time update is enough.
        }
    } catch (e) {
        // Ignore activity log errors
    }

    revalidatePath(`/portal/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}`)
    return { success: true, message: data }
}
