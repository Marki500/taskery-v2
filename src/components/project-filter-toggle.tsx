'use client'

import { Button } from "@/components/ui/button"
import { useProjectFilter } from "@/contexts/ProjectFilterContext"

export function ProjectFilterToggle() {
    const { filter, setFilter } = useProjectFilter()

    return (
        <div className="flex gap-2">
            <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
            >
                Todos los Proyectos
            </Button>
            <Button
                variant={filter === 'assigned' ? 'default' : 'outline'}
                onClick={() => setFilter('assigned')}
                size="sm"
            >
                Mis Proyectos
            </Button>
        </div>
    )
}
