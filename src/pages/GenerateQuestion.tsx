import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileQuestion } from "lucide-react"

import PageHeader from "@/components/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/errors"
import QuizService from "@/services/quizService"
import type { QuizDifficulty } from "@/types/type.ts"

const difficulties: { value: QuizDifficulty; label: string; hint: string }[] = [
    { value: "easy", label: "Easy", hint: "Key facts and definitions" },
    { value: "medium", label: "Medium", hint: "Understanding and application" },
    { value: "hard", label: "Hard", hint: "Multi-step reasoning" },
]

const MIN_QUESTIONS = 1
const MAX_QUESTIONS = 20

function GenerateQuestion() {
    const navigate = useNavigate()
    const [topic, setTopic] = useState("")
    const [subject, setSubject] = useState("")
    const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium")
    const [numQuestions, setNumQuestions] = useState(5)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isCountValid = Number.isInteger(numQuestions) && numQuestions >= MIN_QUESTIONS && numQuestions <= MAX_QUESTIONS
    const isSubmitDisabled = isGenerating || !topic.trim() || !isCountValid

    const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isSubmitDisabled) {
            return
        }

        try {
            setIsGenerating(true)
            setError(null)
            const trimmedSubject = subject.trim()
            const quiz = await QuizService.generate({
                topic: topic.trim(),
                difficulty,
                num_questions: numQuestions,
                ...(trimmedSubject ? { subject: trimmedSubject } : {}),
            })
            navigate(`/my-quizzes/${quiz.id}`)
        } catch (err) {
            setError(getErrorMessage(err, "Quiz generation failed. Please try again."))
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <main className="w-full space-y-6">
            <PageHeader
                icon={FileQuestion}
                title="Generate Quiz"
                description="Create a multiple-choice quiz from your uploaded materials and the exam question bank."
            />

            <Card>
                <CardHeader>
                    <CardTitle>New quiz</CardTitle>
                    <CardDescription>
                        Topic is required. Questions are grounded in your Knowledge Base documents when they match.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={handleGenerate}>
                        <section className="grid gap-4 md:grid-cols-2">
                            <label htmlFor="quiz-topic" className="space-y-2 text-sm font-medium">
                                Topic
                                <Input
                                    id="quiz-topic"
                                    value={topic}
                                    onChange={(event) => setTopic(event.target.value)}
                                    placeholder="e.g. Acids and bases"
                                    maxLength={200}
                                    required
                                />
                            </label>
                            <label htmlFor="quiz-subject" className="space-y-2 text-sm font-medium">
                                Subject (optional)
                                <Input
                                    id="quiz-subject"
                                    value={subject}
                                    onChange={(event) => setSubject(event.target.value)}
                                    placeholder="e.g. Chemistry"
                                    maxLength={100}
                                />
                            </label>
                        </section>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">Difficulty</legend>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {difficulties.map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant={difficulty === option.value ? "default" : "outline"}
                                        className="h-auto flex-col items-start gap-0.5 py-2 text-left"
                                        aria-pressed={difficulty === option.value}
                                        onClick={() => setDifficulty(option.value)}
                                    >
                                        <span>{option.label}</span>
                                        <span className="text-xs font-normal opacity-80">{option.hint}</span>
                                    </Button>
                                ))}
                            </div>
                        </fieldset>

                        <label htmlFor="quiz-count" className="block max-w-xs space-y-2 text-sm font-medium">
                            Number of questions
                            <Input
                                id="quiz-count"
                                type="number"
                                min={MIN_QUESTIONS}
                                max={MAX_QUESTIONS}
                                value={Number.isNaN(numQuestions) ? "" : numQuestions}
                                onChange={(event) => setNumQuestions(event.target.valueAsNumber)}
                            />
                            {!isCountValid ? (
                                <span className="block text-xs font-normal text-destructive">
                                    Choose between {MIN_QUESTIONS} and {MAX_QUESTIONS} questions.
                                </span>
                            ) : null}
                        </label>

                        <Button type="submit" disabled={isSubmitDisabled}>
                            {isGenerating ? <Spinner className="h-4 w-4" /> : <FileQuestion className="h-4 w-4" />}
                            {isGenerating ? "Generating quiz..." : "Generate quiz"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error ? (
                <Alert variant="destructive">
                    <AlertTitle>Generation failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}
        </main>
    )
}

export default GenerateQuestion
