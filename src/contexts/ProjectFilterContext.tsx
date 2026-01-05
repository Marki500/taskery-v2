'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type ProjectFilter = 'all' | 'assigned'

interface ProjectFilterContextType {
    filter: ProjectFilter
    setFilter: (filter: ProjectFilter) => void
}

const ProjectFilterContext = createContext<ProjectFilterContextType | undefined>(undefined)

export function ProjectFilterProvider({ children }: { children: React.ReactNode }) {
    const [filter, setFilterState] = useState<ProjectFilter>('all')

    // Load filter from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('projectsFilter') as ProjectFilter | null
        if (saved) {
            setFilterState(saved)
        }
    }, [])

    // Save to localStorage when changed
    const setFilter = (newFilter: ProjectFilter) => {
        setFilterState(newFilter)
        localStorage.setItem('projectsFilter', newFilter)
    }

    return (
        <ProjectFilterContext.Provider value={{ filter, setFilter }}>
            {children}
        </ProjectFilterContext.Provider>
    )
}

export function useProjectFilter() {
    const context = useContext(ProjectFilterContext)
    if (!context) {
        throw new Error('useProjectFilter must be used within ProjectFilterProvider')
    }
    return context
}
