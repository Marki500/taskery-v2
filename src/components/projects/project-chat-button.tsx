'use client'

import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { ProjectChat } from './project-chat'

interface ProjectChatButtonProps {
    projectId: string
    projectName: string
}

export function ProjectChatButton({ projectId, projectName }: ProjectChatButtonProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[400px] w-full p-0 flex flex-col">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Chat: {projectName}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 min-h-0 bg-background">
                    <ProjectChat
                        projectId={projectId}
                        title=""
                        className="border-0 shadow-none h-full bg-transparent"
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
