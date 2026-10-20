import { type FormEvent, useCallback, useEffect, useState } from "react"
import { Settings2 } from "lucide-react"
import { toast } from "sonner"

import PageHeader from "@/components/PageHeader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/errors"
import { PROFILE_UPDATED_EVENT } from "@/lib/events"
import AuthService from "@/services/authService"
import type { User } from "@/types/type.ts"

const MAX_NAME_LENGTH = 100

export default function Settings() {
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const loadUser = useCallback(async () => {
        try {
            setIsLoading(true)
            setLoadError(null)
            const currentUser = await AuthService.getCurrentUser()
            setUser(currentUser)
            setDisplayName(currentUser.display_name ?? "")
        } catch (err) {
            setLoadError(getErrorMessage(err, "We couldn't load your account."))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadUser()
    }, [loadUser])

    const trimmedName = displayName.trim()
    const hasChanges = user !== null && trimmedName !== (user.display_name ?? "")

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!hasChanges || isSaving) {
            return
        }
        try {
            setIsSaving(true)
            const updated = await AuthService.updateProfile({ display_name: trimmedName || null })
            setUser(updated)
            setDisplayName(updated.display_name ?? "")
            window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT))
            toast.success("Profile updated")
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update profile"))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <main className="w-full space-y-6">
            <PageHeader
                icon={Settings2}
                title="Settings"
                description="Manage your profile."
            />

            {loadError ? (
                <Alert variant="destructive">
                    <AlertTitle>Account unavailable</AlertTitle>
                    <AlertDescription className="space-y-3">
                        <p>{loadError}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => void loadUser()}>
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Your display name is shown across StudyBuddy.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-9 w-full max-w-md" />
                        </div>
                    ) : null}

                    {!isLoading && user ? (
                        <form className="max-w-md space-y-4" onSubmit={handleSave}>
                            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
                                <dt className="text-muted-foreground">Email</dt>
                                <dd className="break-all">{user.email}</dd>
                                <dt className="text-muted-foreground">Role</dt>
                                <dd>
                                    <Badge variant="secondary" className="capitalize">{user.role ?? "student"}</Badge>
                                </dd>
                            </dl>

                            <label htmlFor="settings-display-name" className="block space-y-2 text-sm font-medium">
                                Display name
                                <Input
                                    id="settings-display-name"
                                    value={displayName}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    placeholder="How should we call you?"
                                    maxLength={MAX_NAME_LENGTH}
                                />
                            </label>

                            <Button type="submit" disabled={!hasChanges || isSaving}>
                                {isSaving ? <Spinner className="h-4 w-4" /> : null}
                                {isSaving ? "Saving..." : "Save changes"}
                            </Button>
                        </form>
                    ) : null}
                </CardContent>
            </Card>
        </main>
    )
}
