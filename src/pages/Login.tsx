import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import AuthLayout from "@/components/AuthLayout"
import AuthService from "@/services/authService"
import { loginSchema, type LoginSchema } from "@/schemas/authSchemas"

export default function Login() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const hasToken = Boolean(localStorage.getItem("access_token"))

    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = form.handleSubmit(async (values: LoginSchema) => {
        try {
            await AuthService.login(values)
            navigate("/dashboard", { replace: true })
        } catch (error) {
            console.error(error)
        }
    })

    if (hasToken) {
        return <Navigate to="/dashboard" replace />
    }

    return (
        <AuthLayout>
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-2xl font-semibold">Welcome back</h1>
                    </CardTitle>
                    <CardDescription>Sign in to continue with StudyBuddy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="form-login" onSubmit={onSubmit} className="space-y-2">

                        <FieldGroup className="gap-4">
                            <Controller
                                name="email"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="form-login-email" isRequired>
                                            Email address
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="form-login-email"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="name@school.edu"
                                            autoComplete="email"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="form-login-password" isRequired>
                                            Password
                                        </FieldLabel>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                id="form-login-password"
                                                aria-invalid={fieldState.invalid}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            type={showPassword ? "text" : "password"}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </form>
                </CardContent>
                <CardFooter>
                    <Field orientation="vertical" className="flex justify-end gap-2">
                        <Button className="w-full" form="form-login" type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Spinner className="h-4 w-4" /> : null}
                            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link className="font-medium text-primary hover:underline" to="/register">
                                Create one
                            </Link>
                        </p>
                    </Field>
                </CardFooter>
            </Card>
        </AuthLayout>
    )
}
