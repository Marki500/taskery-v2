'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"

interface FocusListProps {
    tasks: any[]
}

export function FocusList({ tasks }: FocusListProps) {
    return (
        <Card className="h-full border-0 shadow-2xl flex flex-col bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 dark:hover:ring-indigo-500/30 transition-all duration-300 dark:shadow-[0_0_30px_-10px_rgba(99,102,241,0.1)]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10">
                        <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200">Foco del Día</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                        <Calendar className="h-12 w-12" />
                        <p>No tienes tareas críticas hoy.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task, i) => (
                            <Link
                                href={`/projects/${task.project_id || task.projectId}`}
                                key={task.id}
                                className="block"
                            >
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors group cursor-pointer"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="font-semibold text-foreground leading-snug group-hover:text-indigo-600 transition-colors">
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-medium">
                                                    {task.priority || 'Normal'}
                                                </span>
                                                {task.deadline && (
                                                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2" />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
