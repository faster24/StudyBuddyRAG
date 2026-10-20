import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from "lucide-react"

import Markdown from "@/components/Markdown"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import QuizService from "@/services/quizService"
import type { QuizAttemptResponse, QuizDetail, QuizOption } from "@/types/type.ts"

const optionStateClass = (
    option: QuizOption,
    selectedId: string | undefined,
    correctId: string | undefined,
): string => {
    if (correctId) {
        if (option.id === correctId) {
            return "border-success bg-success/10"
        }
        if (option.id === selectedId) {
            return "border-destructive bg-destructive/10"
        }
        return "opacity-70"
    }
    return option.id === selectedId ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/60"
}

export default function QuizTake() {
    const { quizId = "" } = useParams()
    const [quiz, setQuiz] = useState<QuizDetail | null>(null)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [result, setResult] = useState<QuizAttemptResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const loadQuiz = useCallback(async () => {
        try {
            setIsLoading(true)
            setLoadError(null)
            setQuiz(await QuizService.get(quizId))
        } catch (err) {
            setLoadError(getErrorMessage(err, "We couldn't load this quiz."))
        } finally {
            setIsLoading(false)
        }
    }, [quizId])

    useEffect(() => {
        void loadQuiz()
    }, [loadQuiz])

    const answeredCount = quiz ? quiz.questions.filter((q) => answers[q.id]).length : 0
    const allAnswered = quiz !== null && answeredCount === quiz.questions.length

    const handleSubmit = async () => {
        if (!quiz || !allAnswered || isSubmitting) {
            return
        }
        try {
            setIsSubmitting(true)
            setSubmitError(null)
            setResult(await QuizService.submitAttempt(quiz.id, { answers }))
            window.scrollTo({ top: 0, behavior: "smooth" })
        } catch (err) {
            setSubmitError(getErrorMessage(err, "We couldn't submit your answers. Please try again."))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRetake = () => {
        setAnswers({})
        setResult(null)
        setSubmitError(null)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const resultsById = new Map(result?.results.map((r) => [r.question_id, r]) ?? [])

    return (
        <main className="w-full space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/my-quizzes">
                    <ArrowLeft className="h-4 w-4" />
                    My Quizzes
                </Link>
            </Button>

            {isLoading ? (
                <section className="space-y-4">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-48 rounded-xl" />
                </section>
            ) : null}

            {loadError ? (
                <Alert variant="destructive">
                    <AlertTitle>Quiz unavailable</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>{loadError}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => void loadQuiz()}>
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : null}

            {quiz ? (
                <>
                    <header className="space-y-2">
                        <h1 className="text-2xl font-semibold">{quiz.title}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="capitalize">{quiz.difficulty}</Badge>
                            {quiz.subject ? <span>{quiz.subject}</span> : null}
                            <span>{quiz.questions.length} questions</span>
                        </div>
                    </header>

                    {result ? (
                        <Card className="border-primary/40">
                            <CardHeader>
                                <CardTitle className="text-3xl">
                                    {result.score} / {result.total}
                                    <span className="ml-3 text-lg font-normal text-muted-foreground">
                                        {Math.round(result.percentage)}%
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {result.percentage === 100
                                        ? "Perfect score. Great work!"
                                        : "Review the explanations below, then try again."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button type="button" variant="outline" onClick={handleRetake}>
                                    <RotateCcw className="h-4 w-4" />
                                    Retake quiz
                                </Button>
                            </CardContent>
                        </Card>
                    ) : null}

                    <ol className="space-y-4">
                        {quiz.questions.map((question, index) => {
                            const questionResult = resultsById.get(question.id)
                            const selectedId = questionResult?.selected_option_id ?? answers[question.id]
                            return (
                                <li key={question.id}>
                                    <Card>
                                        <CardHeader className="space-y-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Question {index + 1}
                                                </p>
                                                {questionResult ? (
                                                    questionResult.is_correct ? (
                                                        <CheckCircle2 className="h-5 w-5 text-success" aria-label="Correct" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-destructive" aria-label="Incorrect" />
                                                    )
                                                ) : null}
                                            </div>
                                            <Markdown className="text-base font-medium">{question.question}</Markdown>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div role="radiogroup" aria-label={`Question ${index + 1} options`} className="space-y-2">
                                                {question.options.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={selectedId === option.id}
                                                        disabled={Boolean(result)}
                                                        onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                                                        className={cn(
                                                            "flex w-full items-start gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                                                            optionStateClass(option, selectedId, questionResult?.correct_option_id),
                                                        )}
                                                    >
                                                        <span className="font-semibold">{option.id}.</span>
                                                        <Markdown className="flex-1">{option.text}</Markdown>
                                                    </button>
                                                ))}
                                            </div>

                                            {questionResult && questionResult.explanation ? (
                                                <div className="space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Explanation</p>
                                                    <Markdown>{questionResult.explanation}</Markdown>
                                                    {questionResult.citations.length > 0 ? (
                                                        <p className="pt-1 text-xs text-muted-foreground">
                                                            Based on{" "}
                                                            {questionResult.citations.some((c) => c.doc_id) ? "your uploaded notes" : "the exam question bank"}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                </li>
                            )
                        })}
                    </ol>

                    {!result ? (
                        <section className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur">
                            <p className="text-sm text-muted-foreground">
                                {answeredCount} of {quiz.questions.length} answered
                            </p>
                            <Button type="button" onClick={() => void handleSubmit()} disabled={!allAnswered || isSubmitting}>
                                {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
                                {isSubmitting ? "Submitting..." : "Submit answers"}
                            </Button>
                        </section>
                    ) : null}

                    {submitError ? (
                        <Alert variant="destructive">
                            <AlertTitle>Submission failed</AlertTitle>
                            <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                    ) : null}
                </>
            ) : null}
        </main>
    )
}
