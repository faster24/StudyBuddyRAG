import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpenCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"

import PageHeader from "@/components/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/errors"
import QuizService from "@/services/quizService"
import type { QuizSummary } from "@/types/type.ts"

const formatScore = (score?: number | null): string => (score === null || score === undefined ? "—" : `${Math.round(score)}%`)

const formatDate = (value: string): string =>
    new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })

export default function MyQuizzes() {
    const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const loadQuizzes = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await QuizService.list()
            setQuizzes(response.quizzes)
        } catch (err) {
            setError(getErrorMessage(err, "We couldn't load your quizzes."))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadQuizzes()
    }, [loadQuizzes])

    const handleDelete = async (quiz: QuizSummary) => {
        if (!window.confirm(`Delete "${quiz.title}" and its attempts?`)) {
            return
        }

        try {
            setDeletingId(quiz.id)
            await QuizService.remove(quiz.id)
            setQuizzes((current) => current.filter((item) => item.id !== quiz.id))
            toast.success("Quiz deleted")
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to delete quiz"))
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <main className="w-full space-y-6">
            <PageHeader
                icon={BookOpenCheck}
                title="My Quizzes"
                description="Take your generated quizzes and track your scores."
                actions={
                    <Button asChild>
                        <Link to="/generate-questions">New quiz</Link>
                    </Button>
                }
            />

            {error ? (
                <Alert variant="destructive">
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>{error}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => void loadQuizzes()}>
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : null}

            {isLoading ? (
                <section className="grid gap-4 md:grid-cols-2">
                    {[0, 1].map((key) => (
                        <Skeleton key={key} className="h-36 rounded-xl" />
                    ))}
                </section>
            ) : null}

            {!isLoading && !error && quizzes.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No quizzes yet</CardTitle>
                        <CardDescription>Generate your first quiz to start practising.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link to="/generate-questions">Generate a quiz</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            {!isLoading && quizzes.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2">
                    {quizzes.map((quiz) => (
                        <Card key={quiz.id} className="flex flex-col">
                            <CardHeader className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-lg leading-snug">{quiz.title}</CardTitle>
                                    <Badge variant="secondary" className="shrink-0 capitalize">
                                        {quiz.difficulty}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    {[quiz.subject, `${quiz.num_questions} questions`, formatDate(quiz.created_at)]
                                        .filter(Boolean)
                                        .join(" • ")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto space-y-4">
                                <dl className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div className="rounded-md bg-muted/60 p-2">
                                        <dt className="text-xs text-muted-foreground">Attempts</dt>
                                        <dd className="font-semibold">{quiz.attempts_count}</dd>
                                    </div>
                                    <div className="rounded-md bg-muted/60 p-2">
                                        <dt className="text-xs text-muted-foreground">Best</dt>
                                        <dd className="font-semibold">{formatScore(quiz.best_score)}</dd>
                                    </div>
                                    <div className="rounded-md bg-muted/60 p-2">
                                        <dt className="text-xs text-muted-foreground">Last</dt>
                                        <dd className="font-semibold">{formatScore(quiz.last_score)}</dd>
                                    </div>
                                </dl>
                                <div className="flex gap-2">
                                    <Button asChild className="flex-1">
                                        <Link to={`/my-quizzes/${quiz.id}`}>
                                            {quiz.attempts_count > 0 ? "Retake quiz" : "Start quiz"}
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label={`Delete ${quiz.title}`}
                                        disabled={deletingId === quiz.id}
                                        onClick={() => void handleDelete(quiz)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            ) : null}
        </main>
    )
}
