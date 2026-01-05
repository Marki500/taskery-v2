'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { getActiveWorkspace } from "../workspaces/actions"

export interface Project {
    id: string
    name: string
    description: string | null
    status: string
    created_at: string
    workspace_id: string
    color?: string
    icon?: string
    url?: string | null
    client_id?: string | null
}

export async function getProjects(workspaceId?: string): Promise<Project[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let targetWorkspaceId = workspaceId

    if (!targetWorkspaceId) {
        const activeWorkspace = await getActiveWorkspace()
        if (activeWorkspace) {
            targetWorkspaceId = activeWorkspace.id
        }
    }

    if (!targetWorkspaceId) return []

    // Fetch projects for the specific workspace
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', targetWorkspaceId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data || []
}

export async function createProject(name: string, description?: string, color: string = 'indigo', icon: string = 'FolderKanban', url?: string, clientId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Use active workspace or fallback to default
    let workspaceId: string | undefined
    let finalClientId = clientId === 'none' ? null : clientId;

    const activeWorkspace = await getActiveWorkspace()

    if (activeWorkspace) {
        workspaceId = activeWorkspace.id
    } else {
        // Fallback to finding one owned by user
        const { data: existingWorkspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)

        if (existingWorkspaces && existingWorkspaces.length > 0) {
            workspaceId = existingWorkspaces[0].id
        }
    }

    if (!workspaceId) {
        // Create a default workspace for this user
        const { data: newWorkspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({
                name: 'Mi Workspace',
                owner_id: user.id
            })
            .select()
            .single()

        if (wsError || !newWorkspace) {
            console.error('Error creating workspace:', wsError)
            throw new Error('Failed to create workspace')
        }
        workspaceId = newWorkspace.id
    }

    // Now create the project
    const { data, error } = await supabase
        .from('projects')
        .insert({
            name: name,
            description: description || null,
            workspace_id: workspaceId,
            status: 'active',
            color: color,
            icon: icon,
            url: url || null,
            client_id: finalClientId || null
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating project:', error)
        throw new Error('Failed to create project')
    }

    revalidatePath('/projects')
    return data
}

export async function getProjectById(id: string): Promise<Project | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching project:', error)
        return null
    }

    return data
}

export async function updateProject(id: string, name: string, description?: string | null, color?: string, icon?: string, url?: string | null, clientId?: string) {
    const supabase = await createClient()

    const updateData: any = {
        name,
        description,
        color,
        icon,
        url: url || null
    }

    if (clientId !== undefined) {
        updateData.client_id = clientId === 'none' ? null : clientId
    }

    const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error('Error updating project:', error)
        throw new Error('Failed to update project')
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { success: true }
}

// Project Members Management

export async function assignMemberToProject(projectId: string, userId: string, role: 'owner' | 'member' = 'member') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId, role })

    if (error) {
        console.error('Error assigning member:', error)
        return { error: error.message }
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function removeMemberFromProject(projectId: string, userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error removing member:', error)
        return { error: error.message }
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function getProjectMembers(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_members')
        .select(`
            user_id,
            role,
            assigned_at,
            profiles (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('project_id', projectId)

    if (error) {
        console.error('Error fetching project members:', error)
        return []
    }

    return data || []
}

export async function getProjectsWithMembers(filter: 'all' | 'assigned' = 'all', workspaceId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let targetWorkspaceId = workspaceId

    if (!targetWorkspaceId) {
        const activeWorkspace = await getActiveWorkspace()
        if (activeWorkspace) {
            targetWorkspaceId = activeWorkspace.id
        }
    }

    if (!targetWorkspaceId) return []

    // Fetch all projects with their members
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_members (
                user_id,
                role,
                profiles (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            )
        `)
        .eq('workspace_id', targetWorkspaceId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    // If filter is 'assigned', only return projects where user is a member
    if (filter === 'assigned') {
        return (data || []).filter(project =>
            project.project_members?.some((member: any) => member.user_id === user.id)
        )
    }

    return data || []
}
