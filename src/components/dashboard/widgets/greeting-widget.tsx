'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sun, Moon, CloudSun, LucideIcon } from "lucide-react"

interface GreetingWidgetProps {
    userName: string
    pendingCount: number
    productivityScore: number
}

export function GreetingWidget({ userName, pendingCount, productivityScore }: GreetingWidgetProps) {
    // Use state to avoid hydration mismatch - server and client may have different times
    const [greeting, setGreeting] = useState("Hola")
    const [Icon, setIcon] = useState<LucideIcon>(Sun)

    useEffect(() => {
        const hour = new Date().getHours()

        if (hour < 12) {
            setGreeting("Buenos días")
            setIcon(Sun)
        } else if (hour < 20) {
            setGreeting("Buenas tardes")
            setIcon(CloudSun)
        } else {
            setGreeting("Buenas noches")
            setIcon(Moon)
        }
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-8 rounded-3xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-indigo-500/30 shadow-2xl shadow-indigo-100/20 dark:shadow-indigo-500/10 relative overflow-hidden"
        >
            {/* Ambient Neon Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-wide uppercase">
                    <Icon className="h-5 w-5" />
                    <span>{greeting}</span>
                </div>
                <h1 className="text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                    {userName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                    Tienes <span className="font-bold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-200 dark:border-indigo-500/30">{pendingCount} tareas</span> pendientes para hoy.
                </p>
            </div>

            <div className="flex items-center gap-8 p-6 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border border-white/20 dark:border-indigo-500/20 rounded-2xl shadow-lg shadow-indigo-500/5">
                <div className="text-center group">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-widest">Productividad</div>
                    <div className="text-3xl font-black bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        {productivityScore}%
                    </div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-300 dark:via-indigo-500/30 to-transparent" />
                <div className="text-center group">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-widest">Foco</div>
                    <div className="text-3xl font-black bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        Alto
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
