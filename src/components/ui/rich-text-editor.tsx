'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useCallback } from 'react'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    onBlur?: () => void
    placeholder?: string
    className?: string
    editable?: boolean
}

export function RichTextEditor({
    content,
    onChange,
    onBlur,
    placeholder = 'Escribe aquí...',
    className,
    editable = true
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: content || '',
        editable,
        immediatelyRender: false, // Prevent SSR hydration mismatch
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onBlur: () => {
            onBlur?.()
        },
    })

    // Update content when prop changes externally
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '')
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    const ToolbarButton = ({
        onClick,
        active,
        children,
        title
    }: {
        onClick: () => void
        active?: boolean
        children: React.ReactNode
        title: string
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                'p-1.5 rounded-md transition-colors',
                active
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
            )}
        >
            {children}
        </button>
    )

    return (
        <div className={cn(
            'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden',
            className
        )}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Negrita (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Cursiva (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Lista con viñetas"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Lista numerada"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Editor with list styles */}
            <style jsx global>{`
                .tiptap-editor ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .tiptap-editor ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .tiptap-editor li {
                    margin: 0.25rem 0;
                }
                .tiptap-editor li p {
                    margin: 0;
                }
            `}</style>
            <div className="tiptap-editor">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
