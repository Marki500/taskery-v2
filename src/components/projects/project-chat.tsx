'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User as UserIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProjectChats, sendProjectMessage, ChatMessage } from '@/app/(dashboard)/projects/chat-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProjectChatProps {
    projectId: string
    title?: string
    className?: string
}

export function ProjectChat({ projectId, title = "Chat del Proyecto", className }: ProjectChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchMessages = async () => {
        try {
            const data = await getProjectChats(projectId)
            setMessages(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages()
        // Simple polling every 5 seconds for now
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [projectId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMessage.trim() || sending) return

        const tempId = Math.random().toString()
        const content = newMessage.trim()

        // Optimistic update
        const tempMessage: ChatMessage = {
            id: tempId,
            projectId,
            userId: 'me',
            content,
            createdAt: new Date().toISOString(),
            user: { name: 'Yo', avatar: null, email: '' },
            isMine: true
        }

        setMessages(prev => [...prev, tempMessage])
        setNewMessage('')
        setSending(true)

        try {
            await sendProjectMessage(projectId, content)
            // Refresh to get real ID and server timestamp
            await fetchMessages()
        } catch (error) {
            toast.error('Error al enviar mensaje')
            // Rollback optimistic update if needed, but for now simple refresh handles it next cycle
        } finally {
            setSending(false)
        }
    }

    return (
        <Card className={cn("flex flex-col h-[500px]", className)}>
            <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4" ref={scrollRef}>
                        {loading && messages.length === 0 ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                No hay mensajes todavía. ¡Di hola! 👋
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-max max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                                        msg.isMine
                                            ? "ml-auto bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    {!msg.isMine && (
                                        <span className="text-[10px] font-medium opacity-70">
                                            {msg.user.name}
                                        </span>
                                    )}
                                    <p>{msg.content}</p>
                                    <span className="text-[10px] opacity-70 self-end">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <div className="p-3 border-t bg-background">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <Input
                            placeholder="Escribe un mensaje..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}
