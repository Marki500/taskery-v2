'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { startTimeEntry, stopTimeEntry, getActiveTimeEntryWithTask } from '@/app/(dashboard)/projects/time-actions'
import { toast } from 'sonner'

// Types for the timer context
export interface ActiveTimerTask {
    id: string
    title: string
    projectId: string
    totalTime?: number  // Previously accumulated time in seconds
}

interface TimerContextType {
    activeTask: ActiveTimerTask | null
    activeTimeEntryId: string | null
    elapsedSeconds: number
    totalElapsed: number  // totalTime + elapsedSeconds
    isRunning: boolean
    isRestoring: boolean  // True while restoring timer from database
    startTimer: (task: ActiveTimerTask) => Promise<void>
    stopTimer: () => Promise<{ taskId: string; newTotalTime: number } | null>
    pauseTimer: () => void
    resumeTimer: () => void
    lastStoppedTask: { taskId: string; newTotalTime: number } | null
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [activeTask, setActiveTask] = useState<ActiveTimerTask | null>(null)
    const [activeTimeEntryId, setActiveTimeEntryId] = useState<string | null>(null)
    const [startTime, setStartTime] = useState<number | null>(null)  // Timestamp when timer started
    const [pausedElapsed, setPausedElapsed] = useState(0)  // Seconds elapsed when paused
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [baseTotalTime, setBaseTotalTime] = useState(0)  // Previously accumulated time
    const [isRunning, setIsRunning] = useState(false)
    const [isRestoring, setIsRestoring] = useState(true)  // Start as restoring
    const [lastStoppedTask, setLastStoppedTask] = useState<{ taskId: string; newTotalTime: number } | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const hasRestored = useRef(false)

    // Restore timer from database on mount
    useEffect(() => {
        if (hasRestored.current) return
        hasRestored.current = true

        const restoreTimer = async () => {
            try {
                const activeEntry = await getActiveTimeEntryWithTask()
                if (activeEntry) {
                    // Calculate elapsed time from started_at
                    const startedAt = new Date(activeEntry.timeEntry.started_at).getTime()
                    const now = Date.now()
                    const elapsedMs = now - startedAt

                    // Restore timer state
                    setActiveTask({
                        id: activeEntry.task.id,
                        title: activeEntry.task.title,
                        projectId: activeEntry.task.project_id,
                        totalTime: activeEntry.task.totalTime
                    })
                    setActiveTimeEntryId(activeEntry.timeEntry.id)
                    setBaseTotalTime(activeEntry.task.totalTime)
                    setStartTime(startedAt)
                    setPausedElapsed(0)
                    setElapsedSeconds(Math.floor(elapsedMs / 1000))
                    setIsRunning(true)

                    toast.info('Temporizador restaurado')
                }
            } catch (error) {
                console.error('Error restoring timer:', error)
            } finally {
                setIsRestoring(false)
            }
        }

        restoreTimer()
    }, [])

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Interval logic - now calculates from real timestamp
    useEffect(() => {
        if (isRunning && startTime !== null) {
            // Update immediately
            const calculateElapsed = () => {
                const now = Date.now()
                const elapsed = Math.floor((now - startTime) / 1000) + pausedElapsed
                setElapsedSeconds(elapsed)
            }

            calculateElapsed()

            // Update display every second
            intervalRef.current = setInterval(calculateElapsed, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, startTime, pausedElapsed])

    const startTimer = useCallback(async (task: ActiveTimerTask) => {
        try {
            // Create time entry in database
            const timeEntry = await startTimeEntry(task.id)
            if (timeEntry) {
                setActiveTimeEntryId(timeEntry.id)
            }
            setActiveTask(task)
            setBaseTotalTime(task.totalTime || 0)  // Store previously accumulated time
            setStartTime(Date.now())  // Store actual start timestamp
            setPausedElapsed(0)
            setElapsedSeconds(0)
            setIsRunning(true)
        } catch (error) {
            console.error('Error starting timer:', error)
            toast.error('Error al iniciar el cronómetro')
        }
    }, [])

    const stopTimer = useCallback(async () => {
        if (activeTimeEntryId && elapsedSeconds > 0 && activeTask) {
            try {
                // Save time entry to database
                await stopTimeEntry(activeTimeEntryId, elapsedSeconds)
                toast.success(`Tiempo guardado: ${formatTime(elapsedSeconds)}`)

                // Calculate new total time for the task
                const newTotalTime = (activeTask.totalTime || 0) + elapsedSeconds
                const taskId = activeTask.id

                // Reset state
                setActiveTask(null)
                setActiveTimeEntryId(null)
                setStartTime(null)
                setPausedElapsed(0)
                setBaseTotalTime(0)
                setElapsedSeconds(0)
                setIsRunning(false)

                // Set last stopped task for listeners
                setLastStoppedTask({ taskId, newTotalTime })

                return { taskId, newTotalTime }
            } catch (error) {
                console.error('Error stopping timer:', error)
                toast.error('Error al guardar el tiempo')
            }
        }

        setActiveTask(null)
        setActiveTimeEntryId(null)
        setStartTime(null)
        setPausedElapsed(0)
        setBaseTotalTime(0)
        setElapsedSeconds(0)
        setIsRunning(false)
        return null
    }, [activeTimeEntryId, elapsedSeconds, activeTask])

    const pauseTimer = useCallback(() => {
        if (isRunning && startTime !== null) {
            // Store the elapsed time so far
            const now = Date.now()
            const elapsed = Math.floor((now - startTime) / 1000) + pausedElapsed
            setPausedElapsed(elapsed)
            setStartTime(null)
            setIsRunning(false)
        }
    }, [isRunning, startTime, pausedElapsed])

    const resumeTimer = useCallback(() => {
        if (activeTask && !isRunning) {
            setStartTime(Date.now())  // New start time for this session
            setIsRunning(true)
        }
    }, [activeTask, isRunning])

    return (
        <TimerContext.Provider
            value={{
                activeTask,
                activeTimeEntryId,
                elapsedSeconds,
                totalElapsed: baseTotalTime + elapsedSeconds,
                isRunning,
                isRestoring,
                startTimer,
                stopTimer,
                pauseTimer,
                resumeTimer,
                lastStoppedTask,
            }}
        >
            {children}
        </TimerContext.Provider>
    )
}

export function useTimer() {
    const context = useContext(TimerContext)
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider')
    }
    return context
}

// Helper function to format seconds into HH:MM:SS
export function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (n: number) => n.toString().padStart(2, '0')

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${pad(minutes)}:${pad(seconds)}`
}

