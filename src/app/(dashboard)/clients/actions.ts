'use server'

import { createClient as createSupabaseClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { revalidatePath } from "next/cache"


export type Client = {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    notes: string | null
    avatar_url: string | null
    workspace_id: string
    created_at: string
    user_id?: string | null
    linked_user_email?: string
}

export async function getClients(workspaceId: string): Promise<Client[]> {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            linked_user:profiles!user_id(email)
        `)
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching clients:', error)
        return []
    }

    return data.map((client: any) => ({
        ...client,
        linked_user_email: client.linked_user?.email
    })) as Client[]
}

export async function createClient(workspaceId: string, data: Partial<Client>) {
    const supabase = await createSupabaseClient()

    const { data: client, error } = await supabase
        .from('clients')
        .insert({
            workspace_id: workspaceId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            notes: data.notes,
            avatar_url: data.avatar_url,
            user_id: null // Will be set when admin invites them
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating client:', error)
        return { error: 'Error creating client' }
    }

    revalidatePath('/clients')
    return { success: true, client }
}

export async function updateClient(clientId: string, data: Partial<Client>) {
    const supabase = await createSupabaseClient()

    const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        avatar_url: data.avatar_url,
    }

    const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)

    if (error) {
        console.error('Error updating client:', error)
        return { error: 'Error updating client' }
    }

    revalidatePath('/clients')
    return { success: true }
}

export async function deleteClient(clientId: string) {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

    if (error) {
        console.error('Error deleting client:', error)
        return { error: 'Error deleting client' }
    }

    revalidatePath('/clients')
    return { success: true }
}

import { createAdminClient } from "@/utils/supabase/admin"

export async function inviteClientUser(clientId: string) {
    const supabase = await createSupabaseClient()
    const supabaseAdmin = createAdminClient()

    // 1. Get client info
    const { data: client } = await supabase
        .from('clients')
        .select('email, user_id')
        .eq('id', clientId)
        .single()

    if (!client || !client.email) {
        return { success: false, error: 'Cliente no encontrado o sin email.' }
    }

    if (client.user_id) {
        return { success: false, error: 'Este cliente ya ha sido invitado.' }
    }

    // 2. Check if user already exists with this email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === client.email)

    if (existingUser) {
        return { success: false, error: 'Ya existe un usuario con este email.' }
    }

    // 3. Invite user
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        client.email,
        { redirectTo: redirectUrl }
    )

    if (inviteError) {
        console.error('Error inviting user:', inviteError)
        return { success: false, error: 'Error al enviar invitación.' }
    }

    // 4. Link user_id to client immediately
    if (inviteData.user) {
        const { error: updateError } = await supabaseAdmin
            .from('clients')
            .update({ user_id: inviteData.user.id })
            .eq('id', clientId)

        if (updateError) {
            console.error('Error linking user to client:', updateError)
            // Don't fail the whole operation, invitation was sent
        }
    }

    revalidatePath('/clients')
    return { success: true, message: 'Invitación enviada correctamente.' }
}
