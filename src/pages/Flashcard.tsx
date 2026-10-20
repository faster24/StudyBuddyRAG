import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Layers3 } from "lucide-react";

import Markdown from "@/components/Markdown";
import PageHeader from "@/components/PageHeader";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/errors";
import AuthService from "@/services/authService";
import FlashcardService from "@/services/flashcardService";
import type { Flashcard as FlashcardItem } from "@/types/type.ts";

const initialFormState = {
    genre: "",
    topic: "",
    goal: "",
    mode: "adaptive",
};

export default function FlashcardPage() {
    const [userId, setUserId] = useState("");
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [userLoadError, setUserLoadError] = useState<string | null>(null);

    const [genre, setGenre] = useState(initialFormState.genre);
    const [topic, setTopic] = useState(initialFormState.topic);
    const [goal, setGoal] = useState(initialFormState.goal);
    const [mode, setMode] = useState(initialFormState.mode);

    const [cards, setCards] = useState<FlashcardItem[]>([]);
    const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);

    const loadCurrentUser = useCallback(async () => {
        try {
            setIsUserLoading(true);
            setUserLoadError(null);
            const user = await AuthService.getCurrentUser();
            setUserId(user.uid);
        } catch {
            setUserLoadError("We couldn't load your account. Refresh and try again.");
        } finally {
            setIsUserLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCurrentUser();
    }, [loadCurrentUser]);

    const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!genre.trim() || !userId || isUserLoading) {
            return;
        }

        try {
            setIsGenerating(true);
            setGenerateError(null);
            setCards([]);

            const trimmedTopic = topic.trim();
            const trimmedGoal = goal.trim();
            const trimmedMode = mode.trim();
            const response = await FlashcardService.generate({
                user_id: userId,
                genre: genre.trim(),
                ...(trimmedTopic ? { topic: trimmedTopic } : {}),
                ...(trimmedGoal ? { goal: trimmedGoal } : {}),
                ...(trimmedMode ? { mode: trimmedMode } : {}),
            });
            setCards(response.cards);
            setRevealedCardIds(new Set());
        } catch (error) {
            setCards([]);
            setRevealedCardIds(new Set());
            setGenerateError(getErrorMessage(error, "Flashcard generation failed. Please try again."));
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleReveal = (cardId: string) => {
        setRevealedCardIds((current) => {
            const next = new Set(current);
            if (next.has(cardId)) {
                next.delete(cardId);
            } else {
                next.add(cardId);
            }
            return next;
        });
    };

    const isSubmitDisabled = isGenerating || isUserLoading || Boolean(userLoadError) || !genre.trim();

    return (
        <main className="w-full space-y-6">
            <PageHeader
                icon={Layers3}
                title="Flashcards"
                description="Generate study cards from your notes and the question bank, then test yourself."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Generate flashcards</CardTitle>
                    <CardDescription>
                        Genre is required. Topic and goal are optional prompts for better results.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleGenerate}>
                        <section className="grid gap-4 md:grid-cols-2">
                            <label htmlFor="flashcard-genre" className="space-y-2 text-sm font-medium">
                                Genre
                                <Input
                                    id="flashcard-genre"
                                    value={genre}
                                    onChange={(event) => setGenre(event.target.value)}
                                    placeholder="e.g. Physics"
                                    required
                                    data-testid="flashcard-genre-input"
                                />
                            </label>
                            <label htmlFor="flashcard-mode" className="space-y-2 text-sm font-medium">
                                Mode
                                <Input
                                    id="flashcard-mode"
                                    value={mode}
                                    onChange={(event) => setMode(event.target.value)}
                                    placeholder="adaptive"
                                    list="flashcard-mode-options"
                                    data-testid="flashcard-mode-input"
                                />
                            </label>
                        </section>
                        <datalist id="flashcard-mode-options">
                            <option value="adaptive" />
                            <option value="quick" />
                            <option value="deep" />
                            <option value="exam" />
                        </datalist>

                        <section className="grid gap-4 md:grid-cols-2">
                            <label htmlFor="flashcard-topic" className="space-y-2 text-sm font-medium">
                                Topic (optional)
                                <Input
                                    id="flashcard-topic"
                                    value={topic}
                                    onChange={(event) => setTopic(event.target.value)}
                                    placeholder="e.g. Newtonian Mechanics"
                                    data-testid="flashcard-topic-input"
                                />
                            </label>
                            <label htmlFor="flashcard-goal" className="space-y-2 text-sm font-medium">
                                Goal (optional)
                                <Input
                                    id="flashcard-goal"
                                    value={goal}
                                    onChange={(event) => setGoal(event.target.value)}
                                    placeholder="e.g. Prepare for chapter test"
                                    data-testid="flashcard-goal-input"
                                />
                            </label>
                        </section>

                        <Button type="submit" disabled={isSubmitDisabled} data-testid="flashcard-generate-btn">
                            {isGenerating ? <Spinner className="h-4 w-4" /> : <Layers3 className="h-4 w-4" />}
                            {isGenerating ? "Generating..." : "Generate Flashcards"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {userLoadError ? (
                <Alert variant="destructive">
                    <AlertTitle>Account unavailable</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>{userLoadError}</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                void loadCurrentUser();
                            }}
                            disabled={isUserLoading}
                        >
                            {isUserLoading ? "Retrying..." : "Retry"}
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : null}

            {generateError ? (
                <Alert variant="destructive">
                    <AlertTitle>Generation failed</AlertTitle>
                    <AlertDescription>{generateError}</AlertDescription>
                </Alert>
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle>Generated cards</CardTitle>
                    <CardDescription>
                        {cards.length === 0 ? "No cards yet. Generate a set to start reviewing." : `${cards.length} cards generated.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {cards.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Your generated flashcards will appear here.</p>
                    ) : (
                        <ul className="space-y-4" data-testid="flashcard-results-list">
                            {cards.map((card) => (
                                <li key={card.card_id} className="rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/40 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                                    <section className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Flashcard Prompt
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={revealedCardIds.has(card.card_id) ? "secondary" : "default"}
                                                onClick={() => {
                                                    toggleReveal(card.card_id);
                                                }}
                                            >
                                                {revealedCardIds.has(card.card_id) ? "Hide answer" : "Reveal answer"}
                                            </Button>
                                        </div>

                                        <div className="rounded-xl border border-border/70 bg-card/90 p-4">
                                            <Markdown className="text-base font-medium md:text-lg">{card.question}</Markdown>
                                        </div>

                                        {card.concept_tags.length > 0 ? (
                                            <section className="flex flex-wrap gap-2">
                                                {card.concept_tags.map((tag) => (
                                                    <Badge key={`${card.card_id}-${tag}`} variant="secondary" className="rounded-full">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </section>
                                        ) : null}

                                        {revealedCardIds.has(card.card_id) ? (
                                            <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in-50 duration-200">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Answer</p>
                                                    <Markdown className="text-sm font-medium">{card.answer}</Markdown>
                                                </div>

                                                {card.explanation ? (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Explanation</p>
                                                        <Markdown className="text-sm text-muted-foreground">{card.explanation}</Markdown>
                                                    </div>
                                                ) : null}

                                                {card.citations.length > 0 ? (
                                                    <details className="rounded-md border border-border/60 bg-background/70 p-3">
                                                        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                            Sources ({card.citations.length})
                                                        </summary>
                                                        <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                                                            {card.citations.map((citation, index) => (
                                                                <li key={`${card.card_id}-${citation.chunk_id}-${index}`} className="space-y-0.5">
                                                                    <p className="font-medium text-foreground">
                                                                        {citation.doc_id ? "Your uploaded notes" : "Exam question bank"}
                                                                    </p>
                                                                    {citation.quote ? <p className="break-words italic">&ldquo;{citation.quote}&rdquo;</p> : null}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                ) : null}
                                            </section>
                                        ) : (
                                            <p className="text-sm italic text-muted-foreground">
                                                Think first, then reveal the answer when you&apos;re ready.
                                            </p>
                                        )}
                                    </section>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
