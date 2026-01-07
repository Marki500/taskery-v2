'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export interface TimeEntry {
    id: string
    task_id: string
    user_id: string
    started_at: string
    ended_at: string | null
    duration: number | null
}

// Start a new time entry when timer begins
export async function startTimeEntry(taskId: string): Promise<TimeEntry | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('time_entries')
        .insert({
            task_id: taskId,
            user_id: user.id,
            started_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (error) {
        console.error('Error starting time entry:', error)
        throw new Error('Failed to start time entry')
    }

    return data
}

// Stop an active time entry when timer stops
export async function stopTimeEntry(timeEntryId: string, durationSeconds: number): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('time_entries')
        .update({
            ended_at: new Date().toISOString(),
            duration: durationSeconds
        })
        .eq('id', timeEntryId)

    if (error) {
        console.error('Error stopping time entry:', error)
        throw new Error('Failed to stop time entry')
    }

    // Revalidate the projects pages to refresh totalTime display
    revalidatePath('/projects', 'layout')
}

// Get total accumulated time for a task (sum of all durations)
export async function getTaskTotalTime(taskId: string): Promise<number> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('task_id', taskId)
        .not('duration', 'is', null)

    if (error) {
        console.error('Error fetching task time:', error)
        return 0
    }

    return data.reduce((total, entry) => total + (entry.duration || 0), 0)
}

// Get all time entries for a task
export async function getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .order('started_at', { ascending: false })

    if (error) {
        console.error('Error fetching time entries:', error)
        return []
    }

    return data || []
}

// Get active (unclosed) time entry for current user
export async function getActiveTimeEntry(): Promise<TimeEntry | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error('Error fetching active time entry:', error)
        return null
    }

    return data
}

// Get active time entry with task details for timer restoration
export interface ActiveTimeEntryWithTask {
    timeEntry: TimeEntry
    task: {
        id: string
        title: string
        project_id: string
        totalTime: number
    }
}

export async function getActiveTimeEntryWithTask(): Promise<ActiveTimeEntryWithTask | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get active time entry
    const { data: timeEntry, error: timeEntryError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (timeEntryError || !timeEntry) {
        return null
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .eq('id', timeEntry.task_id)
        .single()

    if (taskError || !task) {
        return null
    }

    // Get total time for the task (excluding current entry)
    const totalTime = await getTaskTotalTime(task.id)

    return {
        timeEntry,
        task: {
            id: task.id,
            title: task.title,
            project_id: task.project_id,
            totalTime
        }
    }
}

// Update time entry duration manually
export async function updateTimeEntryDuration(timeEntryId: string, newDuration: number): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('time_entries')
        .update({ duration: newDuration })
        .eq('id', timeEntryId)

    if (error) {
        console.error('Error updating time entry duration:', error)
        throw new Error('Failed to update time entry')
    }

    revalidatePath('/projects', 'layout')
}

// Add manual time entry (for manual time editing)
export async function addManualTimeEntry(taskId: string, durationSeconds: number): Promise<void> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const now = new Date()
    // If adding time (positive), start time is in past.
    // If removing time (negative), start time is same as end time to avoid future dates.
    const startedAt = durationSeconds > 0
        ? new Date(now.getTime() - durationSeconds * 1000)
        : now

    const { error } = await supabase
        .from('time_entries')
        .insert({
            task_id: taskId,
            user_id: user.id,
            started_at: startedAt.toISOString(),
            ended_at: now.toISOString(),
            duration: durationSeconds
        })

    if (error) {
        console.error('Error adding manual time entry:', error)
        throw new Error('Failed to add manual time entry')
    }

    revalidatePath('/projects', 'layout')
}

