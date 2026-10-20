import { type ComponentType, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, BookOpenCheck, CheckCircle2, Circle, FileText, Layers3, LayoutDashboard, Target } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { navItems } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import AuthService from "@/services/authService"
import DocumentService from "@/services/documentService"
import FlashcardService from "@/services/flashcardService"
import QuizService from "@/services/quizService"
import type { DocumentMetadata, QuizSummary, User } from "@/types/type.ts"

type OverviewData = {
    user: User | null
    documents: DocumentMetadata[] | null
    quizzes: QuizSummary[] | null
    flashcardTotal: number | null
}

const quickActionHrefs = ["/chat", "/generate-questions", "/flashcards", "/knowledge-base"]
const quickActions = navItems.filter((item) => quickActionHrefs.includes(item.href))

const greeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
}

const valueOf = <T,>(result: PromiseSettledResult<T>): T | null => (result.status === "fulfilled" ? result.value : null)

function StatCard({ label, value, hint, icon: Icon }: {
    label: string
    value: string
    hint: string
    icon: ComponentType<{ className?: string }>
}) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex" aria-hidden="true">
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    const [data, setData] = useState<OverviewData | null>(null)

    useEffect(() => {
        let active = true
        // Each source loads independently so one failing request doesn't blank the page
        void Promise.allSettled([
            AuthService.getCurrentUser(),
            DocumentService.list(),
            QuizService.list(),
            FlashcardService.list(1),
        ]).then(([user, documents, quizzes, flashcards]) => {
            if (!active) {
                return
            }
            setData({
                user: valueOf(user),
                documents: valueOf(documents)?.documents ?? null,
                quizzes: valueOf(quizzes)?.quizzes ?? null,
                flashcardTotal: valueOf(flashcards)?.total ?? null,
            })
        })
        return () => {
            active = false
        }
    }, [])

    const readyDocuments = data?.documents?.filter((doc) => doc.status === "completed").length
    const attemptedQuizzes = data?.quizzes?.filter((quiz) => quiz.best_score !== null && quiz.best_score !== undefined) ?? []
    const averageBest = attemptedQuizzes.length
        ? Math.round(attemptedQuizzes.reduce((sum, quiz) => sum + (quiz.best_score ?? 0), 0) / attemptedQuizzes.length)
        : null
    const recentQuizzes = (data?.quizzes ?? []).slice(0, 4)

    const gettingStarted = [
        { done: (readyDocuments ?? 0) > 0, label: "Upload your notes to the Knowledge Base", href: "/knowledge-base" },
        { done: (data?.quizzes?.length ?? 0) > 0, label: "Generate your first practice quiz", href: "/generate-questions" },
        { done: attemptedQuizzes.length > 0, label: "Take a quiz and check your score", href: "/my-quizzes" },
    ]
    const showGettingStarted = data !== null && gettingStarted.some((step) => !step.done)

    const name = data?.user?.display_name?.trim().split(/\s+/)[0]

    return (
        <main className="w-full space-y-6">
            <PageHeader
                icon={LayoutDashboard}
                title={data ? `${greeting()}${name ? `, ${name}` : ""}` : "Overview"}
                description="Pick up where you left off, or start something new."
            />

            <section aria-label="Your progress" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {data === null ? (
                    [0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-[116px] rounded-xl" />)
                ) : (
                    <>
                        <StatCard
                            icon={FileText}
                            label="Notes ready"
                            value={readyDocuments === undefined ? "—" : String(readyDocuments)}
                            hint="Documents the tutor can use"
                        />
                        <StatCard
                            icon={BookOpenCheck}
                            label="Quizzes"
                            value={data.quizzes ? String(data.quizzes.length) : "—"}
                            hint={`${attemptedQuizzes.length} attempted`}
                        />
                        <StatCard
                            icon={Target}
                            label="Average best score"
                            value={averageBest === null ? "—" : `${averageBest}%`}
                            hint={averageBest === null ? "Take a quiz to see this" : "Across attempted quizzes"}
                        />
                        <StatCard
                            icon={Layers3}
                            label="Flashcards"
                            value={data.flashcardTotal === null ? "—" : String(data.flashcardTotal)}
                            hint="Cards generated so far"
                        />
                    </>
                )}
            </section>

            <section aria-labelledby="quick-actions-heading" className="space-y-3">
                <h2 id="quick-actions-heading" className="text-lg font-semibold">Quick actions</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            to={action.href}
                            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            <Card className="h-full transition-colors duration-200 group-hover:border-primary/40 group-hover:bg-accent/40">
                                <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                                        <action.icon className="size-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium">{action.title}</p>
                                        <p className="text-sm text-muted-foreground">{action.description}</p>
                                    </div>
                                    <span className="hidden items-center gap-1 text-sm font-medium text-primary sm:flex">
                                        Open
                                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <section className={cn("grid gap-4", showGettingStarted && "lg:grid-cols-[1fr_minmax(0,22rem)]")}>
                <Card>
                    <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                        <div className="space-y-1">
                            <CardTitle>Recent quizzes</CardTitle>
                            <CardDescription>Your latest practice sets</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/my-quizzes">View all</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {data === null ? (
                            <div className="space-y-2">
                                {[0, 1, 2].map((key) => <Skeleton key={key} className="h-14 rounded-lg" />)}
                            </div>
                        ) : recentQuizzes.length === 0 ? (
                            <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5">
                                <p className="text-sm text-muted-foreground">No quizzes yet. Generate one from any topic or your uploaded notes.</p>
                                <Button asChild size="sm">
                                    <Link to="/generate-questions">Generate a quiz</Link>
                                </Button>
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {recentQuizzes.map((quiz) => (
                                    <li key={quiz.id}>
                                        <Link
                                            to={`/my-quizzes/${quiz.id}`}
                                            className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{quiz.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {[quiz.subject, `${quiz.num_questions} questions`].filter(Boolean).join(" · ")}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant="secondary" className="capitalize">{quiz.difficulty}</Badge>
                                                <span className="w-12 text-right text-sm font-semibold tabular-nums">
                                                    {quiz.best_score === null || quiz.best_score === undefined ? "New" : `${Math.round(quiz.best_score)}%`}
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {showGettingStarted ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Getting started</CardTitle>
                            <CardDescription>Three steps to get the most out of StudyBuddy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-1">
                                {gettingStarted.map((step) => (
                                    <li key={step.label}>
                                        <Link
                                            to={step.href}
                                            className="flex items-center gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            {step.done ? (
                                                <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Done" />
                                            ) : (
                                                <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="To do" />
                                            )}
                                            <span className={cn(step.done && "text-muted-foreground line-through")}>{step.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                ) : null}
            </section>
        </main>
    )
}
