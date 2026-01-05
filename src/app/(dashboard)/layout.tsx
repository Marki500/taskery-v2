import { Sidebar } from "@/components/dashboard/sidebar"
import { FloatingTimer } from "@/components/timer/floating-timer"
import { CommandMenu } from "@/components/command-menu"
import { CommandMenuProvider } from "@/components/command-menu-context"
import { ProjectFilterProvider } from "@/contexts/ProjectFilterContext"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CommandMenuProvider>
            <ProjectFilterProvider>
                <div className="flex min-h-screen bg-background w-full">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 bg-slate-50/50 dark:bg-black/50">
                        {children}
                    </main>
                    <FloatingTimer />
                    <CommandMenu />
                </div>
            </ProjectFilterProvider>
        </CommandMenuProvider>
    )
}
