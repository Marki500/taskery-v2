import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify if user is a client
    // We can do this by trying to fetch the client record linked to this user
    const { data: client } = await supabase
        .from('clients')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single()

    // If not a client (and maybe not an admin/member checking it out?)
    // For now we rely on the fact that if they have no client record, they might see an empty portal or we redirect them.
    // But let's assume if they accessed /portal they intend to see the client view.

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-white dark:bg-slate-900 border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/portal" className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight hidden sm:block">Portal Cliente</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {client && (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium">{client.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        )}

                        <form action="/auth/signout" method="post">
                            <Button variant="ghost" size="icon" title="Cerrar Sessión">
                                <LogOut className="h-5 w-5 text-muted-foreground hover:text-red-500 transition-colors" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
