'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, MapPin } from "lucide-react"
import { ClientDialog } from "./client-dialog"
import { NewProjectDialog } from "../projects/new-project-dialog"
import { InviteClientButton } from "./invite-client-button"
import { Client } from "./actions"

interface ClientsListProps {
    clients: Client[]
    workspaceId: string
}

export function ClientsList({ clients, workspaceId }: ClientsListProps) {
    if (clients.length === 0) {
        return (
            <Card className="border-dashed shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No hay clientes todavía</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Añade clientes para asociarlos a tus proyectos y llevar un mejor control.
                    </p>
                    <ClientDialog workspaceId={workspaceId} />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map((client) => (
                <Card key={client.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
                    <CardHeader className="pb-3 flex flex-row items-center gap-4 space-y-0">
                        <Avatar className="h-12 w-12 border-2 border-slate-100 dark:border-slate-800">
                            <AvatarImage src={client.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                                {client.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <CardTitle className="truncate text-base" title={client.name}>
                                {client.name}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                                Creado el {new Date(client.created_at).toLocaleDateString()}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {client.email && (
                            <div className="flex items-center gap-2 text-muted-foreground truncate" title={client.email}>
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{client.email}</span>
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{client.phone}</span>
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-center gap-2 text-muted-foreground truncate">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{client.address}</span>
                            </div>
                        )}
                        {!client.email && !client.phone && !client.address && (
                            <div className="text-muted-foreground/50 italic text-xs">Sin información de contacto</div>
                        )}

                        <div className="pt-2 flex justify-end gap-2">
                            <InviteClientButton
                                clientId={client.id}
                                clientEmail={client.email}
                                hasUser={!!client.user_id}
                            />
                            <ClientDialog
                                workspaceId={workspaceId}
                                client={client}
                                trigger={
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        Editar
                                    </Button>
                                }
                            />
                            <NewProjectDialog
                                defaultClientId={client.id}
                                trigger={
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        Asignar Proyecto
                                    </Button>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
