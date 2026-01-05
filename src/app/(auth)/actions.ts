'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check if user is a client
    const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

    revalidatePath('/', 'layout')

    // Redirect based on user type
    if (client) {
        redirect('/portal')
    } else {
        redirect('/projects')
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || 'http://localhost:3000'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || origin}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    // If Supabase returns a session, they are logged in (Auto Confirm is ON)
    const { data } = await supabase.auth.getSession()
    if (data.session) {
        // Create default workspace for new user
        const workspaceName = fullName || email.split('@')[0]

        // Create workspace
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({
                name: `Workspace de ${workspaceName}`,
                owner_id: data.session.user.id
            })
            .select()
            .single()

        if (workspace && !wsError) {
            // Add user as admin member
            await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: data.session.user.id,
                    role: 'admin'
                })
        }

        revalidatePath('/', 'layout')
        redirect('/dashboard')
    }

    // If no session, it means they need to confirm email
    return { success: true }
}
