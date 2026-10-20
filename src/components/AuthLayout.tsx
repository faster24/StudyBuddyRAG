import type { ReactNode } from "react"
import { BookOpenCheck, GraduationCap, Library, MessageSquareText } from "lucide-react"

import { ModeToggle } from "@/components/ModeToggle.tsx"

const highlights = [
    { icon: MessageSquareText, text: "An AI tutor that answers from your own notes" },
    { icon: BookOpenCheck, text: "Practice quizzes with instant scoring and explanations" },
    { icon: Library, text: "Flashcards generated from your Knowledge Base" },
]

// Split layout for sign-in / sign-up: brand panel on large screens, form always visible
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-2">
            <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
                <div
                    className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative flex items-center gap-2.5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/15" aria-hidden="true">
                        <GraduationCap className="size-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">StudyBuddy</span>
                </div>
                <div className="relative space-y-8">
                    <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
                        Study smarter with an AI tutor that knows your material.
                    </p>
                    <ul className="space-y-4">
                        {highlights.map((item) => (
                            <li key={item.text} className="flex items-center gap-3 text-primary-foreground/90">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15" aria-hidden="true">
                                    <item.icon className="size-4" />
                                </div>
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-sm text-primary-foreground/70">Built for exam prep, from IGCSE to university.</p>
            </aside>

            <main className="relative flex flex-col items-center justify-center gap-6 p-4 sm:p-8">
                <div className="absolute right-4 top-4">
                    <ModeToggle />
                </div>
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
                        <GraduationCap className="size-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">StudyBuddy</span>
                </div>
                {children}
            </main>
        </div>
    )
}
