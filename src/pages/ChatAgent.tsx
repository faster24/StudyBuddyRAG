import type { AxiosError } from "axios"
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react"
import { Bot, Check, Copy, FileText, MessageSquareText, Send, Sparkles, Trash2, User, X } from "lucide-react"
import { toast } from "sonner"

import Markdown from "@/components/Markdown"
import PageHeader from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import ChatService from "@/services/chatService"
import type { ChatMessageCreateRequest, ChatMessageResponse, ChatSource } from "@/types/type.ts"

const initialSessionTitle = "Study with AI"
const initialMessageLimit = 50
const sessionStorageKeyPrefix = "chat_session_id"
const maxMessageLength = 8000
const slowReplySeconds = 10

const suggestedPrompts = [
    "Summarise the key points of my uploaded notes",
    "Explain this concept step by step, like I'm new to it:",
    "Quiz me with 3 questions on",
    "What are common exam mistakes for",
]

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    const tokenParts = token.split(".")
    if (tokenParts.length < 2) {
        return null
    }

    try {
        const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
        const decoded = atob(padded)
        return JSON.parse(decoded) as Record<string, unknown>
    } catch {
        return null
    }
}

const getSessionStorageKey = (): string => {
    const token = localStorage.getItem("access_token")

    if (!token) {
        return `${sessionStorageKeyPrefix}:anonymous`
    }

    const payload = decodeJwtPayload(token)
    const userScope =
        (typeof payload?.sub === "string" && payload.sub) ||
        (typeof payload?.user_id === "string" && payload.user_id) ||
        (typeof payload?.email === "string" && payload.email) ||
        token

    return `${sessionStorageKeyPrefix}:${userScope}`
}

const isNotFoundError = (error: unknown): boolean => {
    const status = (error as AxiosError | undefined)?.response?.status
    return status === 404
}

const formatTime = (value: string): string =>
    new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })

const describeSource = (source: ChatSource): string =>
    source.subject === "Your notes"
        ? `Your notes · ${source.topic_path.join(", ")}`
        : [source.subject, ...source.topic_path.filter((part) => part !== source.subject)].join(" › ")

type ChatError = { message: string; kind: "load" | "send" }

function Avatar({ role }: { role: ChatMessageResponse["role"] }) {
    const isUser = role === "user"
    return (
        <div
            className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isUser ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
            )}
            aria-hidden="true"
        >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch {
            toast.error("Couldn't copy to clipboard")
        }
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={() => void handleCopy()}
            aria-label="Copy answer"
        >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
        </Button>
    )
}

function MessageBubble({ message }: { message: ChatMessageResponse }) {
    const isUser = message.role === "user"
    const sources = message.sources ?? []

    return (
        <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
            <Avatar role={message.role} />
            <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-1", isUser && "items-end")}>
                <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{isUser ? "You" : "StudyBuddy"}</span>
                    {" · "}
                    {formatTime(message.created_at)}
                </p>
                <div
                    className={cn(
                        "rounded-2xl px-4 py-3 text-sm shadow-sm",
                        isUser
                            ? "rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm border border-border/60 bg-card text-card-foreground",
                    )}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    ) : (
                        <Markdown>{message.content}</Markdown>
                    )}
                </div>

                {!isUser ? (
                    <div className="flex w-full flex-wrap items-start gap-2">
                        <CopyButton text={message.content} />
                        {sources.length > 0 ? (
                            <details className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/70 px-2 py-1">
                                <summary className="cursor-pointer py-0.5 text-xs font-medium text-muted-foreground">
                                    Sources ({sources.length})
                                </summary>
                                <ul className="mt-1 space-y-2 pb-1 text-xs text-muted-foreground">
                                    {sources.map((source, index) => (
                                        <li key={`${message.id}-source-${index}`} className="flex gap-2">
                                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="font-medium text-foreground">{describeSource(source)}</p>
                                                <p className="break-words">{source.content}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function ThinkingBubble({ elapsedSeconds }: { elapsedSeconds: number }) {
    return (
        <div className="flex gap-3" role="status" aria-live="polite">
            <Avatar role="assistant" />
            <div className="flex flex-col gap-1">
                <p className="text-xs font-medium">StudyBuddy</p>
                <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 shadow-sm">
                    <span className="flex gap-1" aria-hidden="true">
                        {[0, 150, 300].map((delay) => (
                            <span
                                key={delay}
                                className="h-2 w-2 animate-bounce rounded-full bg-primary/70"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        StudyBuddy is thinking{elapsedSeconds > 0 ? ` · ${elapsedSeconds}s` : "…"}
                    </span>
                </div>
                {elapsedSeconds >= slowReplySeconds ? (
                    <p className="text-xs text-muted-foreground">
                        Still working — detailed answers can take up to a minute.
                    </p>
                ) : null}
            </div>
        </div>
    )
}

export default function ChatAgent() {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessageResponse[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [isBootstrapping, setIsBootstrapping] = useState(true)
    const [chatError, setChatError] = useState<ChatError | null>(null)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const sendInFlightRef = useRef(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const composerRef = useRef<HTMLTextAreaElement>(null)

    const createAndPersistSession = useCallback(async () => {
        const session = await ChatService.createSession({ title: initialSessionTitle })
        const sessionStorageKey = getSessionStorageKey()
        localStorage.setItem(sessionStorageKey, session.id)
        setActiveSessionId(session.id)
        return session.id
    }, [])

    const recoverSessionFrom404 = useCallback(async () => {
        const sessionStorageKey = getSessionStorageKey()
        localStorage.removeItem(sessionStorageKey)
        localStorage.removeItem(sessionStorageKeyPrefix)
        setActiveSessionId(null)
        setMessages([])
        return createAndPersistSession()
    }, [createAndPersistSession])

    const bootstrapConversation = useCallback(async () => {
        try {
            setIsBootstrapping(true)
            setChatError(null)
            const sessionStorageKey = getSessionStorageKey()
            const storedSessionId = localStorage.getItem(sessionStorageKey)

            if (!storedSessionId) {
                setActiveSessionId(null)
                setMessages([])
                return
            }

            setActiveSessionId(storedSessionId)

            try {
                const messageResponse = await ChatService.listSessionMessages(storedSessionId, {
                    limit: initialMessageLimit,
                })
                setMessages(messageResponse.messages)
            } catch (error) {
                if (isNotFoundError(error)) {
                    const newSessionId = await recoverSessionFrom404()

                    try {
                        const retryMessageResponse = await ChatService.listSessionMessages(newSessionId, {
                            limit: initialMessageLimit,
                        })
                        setMessages(retryMessageResponse.messages)
                    } catch {
                        setMessages([])
                        setChatError({ kind: "load", message: "Your chat is ready, but we couldn't load previous messages." })
                    }

                    return
                }

                setMessages([])
                setChatError({ kind: "load", message: "Your chat is ready, but we couldn't load previous messages." })
            }
        } catch {
            setActiveSessionId(null)
            setMessages([])
            setChatError({ kind: "load", message: "We couldn't start your chat right now. Please retry." })
        } finally {
            setIsBootstrapping(false)
        }
    }, [recoverSessionFrom404])

    useEffect(() => {
        void bootstrapConversation()
    }, [bootstrapConversation])

    // Count seconds while waiting so long replies don't look stuck
    useEffect(() => {
        if (!isSending) {
            return
        }
        const startedAt = Date.now()
        const timer = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
        }, 1000)
        return () => window.clearInterval(timer)
    }, [isSending])

    // Keep the newest message (or the thinking bubble) in view
    useEffect(() => {
        const scrollArea = scrollAreaRef.current
        if (scrollArea) {
            scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" })
        }
    }, [messages, isSending])

    const handleSend = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedInput = inputValue.trim()
        if (!trimmedInput || isSending || isBootstrapping || isClearing || sendInFlightRef.current) {
            return
        }

        // Show the student's message right away; the server only returns the assistant reply
        const pendingMessage: ChatMessageResponse = {
            id: `pending-${Date.now()}`,
            session_id: activeSessionId ?? "",
            role: "user",
            content: trimmedInput,
            sources: null,
            created_at: new Date().toISOString(),
        }
        const showPendingMessage = () =>
            setMessages((currentMessages) => [...currentMessages, pendingMessage])

        try {
            sendInFlightRef.current = true
            setElapsedSeconds(0)
            setIsSending(true)
            setChatError(null)
            showPendingMessage()
            setInputValue("")

            let sessionId = activeSessionId
            if (!sessionId) {
                sessionId = await createAndPersistSession()
            }
            if (!sessionId) {
                throw new Error("Session is unavailable")
            }

            const payload: ChatMessageCreateRequest = { content: trimmedInput }
            let nextMessage: ChatMessageResponse

            try {
                nextMessage = await ChatService.sendSessionMessage(sessionId, payload)
            } catch (error) {
                if (!isNotFoundError(error)) {
                    throw error
                }

                const recoveredSessionId = await recoverSessionFrom404()
                // Recovery clears the message list, so put the pending message back
                showPendingMessage()
                nextMessage = await ChatService.sendSessionMessage(recoveredSessionId, payload)
            }

            setMessages((currentMessages) => {
                if (currentMessages.some((message) => message.id === nextMessage.id)) {
                    return currentMessages
                }
                return [...currentMessages, nextMessage]
            })
        } catch (error) {
            setMessages((currentMessages) => currentMessages.filter((message) => message.id !== pendingMessage.id))
            // Keep anything typed while waiting; otherwise restore the failed message
            setInputValue((current) => current || trimmedInput)
            setChatError({ kind: "send", message: getErrorMessage(error, "Message failed to send. Please try again.") })
        } finally {
            sendInFlightRef.current = false
            setIsSending(false)
        }
    }

    const handleClearChat = async () => {
        if (messages.length === 0 || isSending || isClearing) {
            return
        }
        if (!window.confirm("Clear this conversation? StudyBuddy will also forget it.")) {
            return
        }

        try {
            setIsClearing(true)
            if (activeSessionId) {
                try {
                    await ChatService.deleteSession(activeSessionId)
                } catch (error) {
                    // Already gone on the server is fine; anything else should be reported
                    if (!isNotFoundError(error)) {
                        throw error
                    }
                }
            }
            localStorage.removeItem(getSessionStorageKey())
            setActiveSessionId(null)
            setMessages([])
            setChatError(null)
            toast.success("Chat cleared")
            composerRef.current?.focus()
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't clear the chat. Please try again."))
        } finally {
            setIsClearing(false)
        }
    }

    const handleSuggestion = (prompt: string) => {
        setInputValue(prompt.endsWith(":") || prompt.endsWith(" on") || prompt.endsWith(" for") ? `${prompt} ` : prompt)
        composerRef.current?.focus()
    }

    const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey) {
            return
        }

        event.preventDefault()

        if (!inputValue.trim() || isBootstrapping || isSending || isClearing || sendInFlightRef.current) {
            return
        }

        event.currentTarget.form?.requestSubmit()
    }

    const canSend = Boolean(inputValue.trim()) && !isBootstrapping && !isSending && !isClearing
    const showEmptyState = messages.length === 0 && !isSending

    return (
        <main className="flex h-[calc(100dvh-7rem)] min-h-[480px] w-full flex-col gap-4 md:h-[calc(100dvh-8rem)]">
            <PageHeader
                icon={MessageSquareText}
                title="Study with AI"
                description="Ask about your notes or any topic. Answers use your Knowledge Base and the exam question bank."
                actions={
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleClearChat()}
                        disabled={messages.length === 0 || isSending || isClearing || isBootstrapping}
                    >
                        {isClearing ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        Clear chat
                    </Button>
                }
            />

            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <CardHeader className="border-b py-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4 text-primary" />
                        StudyBuddy tutor
                    </CardTitle>
                </CardHeader>

                <div ref={scrollAreaRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
                    {isBootstrapping ? (
                        <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Spinner className="h-4 w-4" />
                            Loading your conversation…
                        </div>
                    ) : null}

                    {!isBootstrapping && showEmptyState ? (
                        <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-5 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-medium">What would you like to study?</p>
                                <p className="text-sm text-muted-foreground">
                                    Ask a question, or start from one of these:
                                </p>
                            </div>
                            <div className="grid w-full gap-2 sm:grid-cols-2">
                                {suggestedPrompts.map((prompt) => (
                                    <Button
                                        key={prompt}
                                        type="button"
                                        variant="outline"
                                        className="h-auto whitespace-normal py-2 text-left text-sm font-normal"
                                        onClick={() => handleSuggestion(prompt)}
                                    >
                                        {prompt}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}

                    {isSending ? <ThinkingBubble elapsedSeconds={elapsedSeconds} /> : null}
                </div>

                <CardContent className="border-t p-3 md:p-4">
                    {chatError ? (
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            <p>{chatError.message}</p>
                            {chatError.kind === "load" ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        void bootstrapConversation()
                                    }}
                                    disabled={isBootstrapping || isSending}
                                >
                                    {isBootstrapping ? "Retrying..." : "Retry"}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setChatError(null)}
                                    aria-label="Dismiss error"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ) : null}

                    <form className="flex items-end gap-2" onSubmit={handleSend}>
                        <Textarea
                            ref={composerRef}
                            placeholder="Ask StudyBuddy anything about your topic…"
                            className="max-h-48 min-h-[44px] resize-none [field-sizing:content]"
                            rows={1}
                            value={inputValue}
                            maxLength={maxMessageLength}
                            onChange={(event) => setInputValue(event.target.value)}
                            onKeyDown={handleComposerKeyDown}
                            disabled={isBootstrapping || isClearing}
                            aria-label="Message"
                        />
                        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!canSend} aria-label="Send message">
                            {isSending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Enter to send · Shift+Enter for a new line
                        {inputValue.length > maxMessageLength * 0.9 ? ` · ${inputValue.length}/${maxMessageLength}` : ""}
                    </p>
                </CardContent>
            </Card>
        </main>
    )
}
