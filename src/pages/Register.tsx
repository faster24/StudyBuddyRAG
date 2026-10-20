import {Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {Link, Navigate, useNavigate} from "react-router-dom"
import {useState} from "react"
import {Eye, EyeOff} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Spinner} from "@/components/ui/spinner"
import {registerSchema, type RegisterSchema} from "@/schemas/authSchemas"
import AuthLayout from "@/components/AuthLayout"
import AuthService from "@/services/authService"
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field"

export default function Register() {
    const navigate = useNavigate()
    const hasToken = Boolean(localStorage.getItem("access_token"))
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const form = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            display_name: "",
            email: "",
            password: "",
            confirm_password: "",
        },
    })

    const onSubmit = form.handleSubmit(async (values: RegisterSchema) => {
        try {
            await AuthService.register({
                email: values.email,
                password: values.password,
                display_name: values.display_name,
            })
            navigate("/dashboard", {replace: true})
        } catch (error) {
            console.error(error)
        }
    })

    if (hasToken) {
        return <Navigate to="/dashboard" replace/>
    }

    return (
        <AuthLayout>
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-2xl font-semibold">Create your account</h1>
                    </CardTitle>
                    <CardDescription>Set up StudyBuddy in a minute.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="form-register" onSubmit={onSubmit} className="space-y-2">
                        <FieldGroup className="gap-4">
                            <Controller
                                name="display_name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="form-register-display_name" isRequired>
                                            Full name
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="form-register-display_name"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="Jane Doe"
                                            autoComplete="name"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="email"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="form-register-email" isRequired>
                                            Email address
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="form-register-email"
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
                                        <FieldLabel htmlFor="form-register-password" isRequired>
                                            Password
                                        </FieldLabel>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                id="form-register-password"
                                                aria-invalid={fieldState.invalid}
                                            placeholder="Create a password"
                                            autoComplete="new-password"
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

                            <Controller
                                name="confirm_password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="form-register-confirm_password" isRequired>
                                            Confirm password
                                        </FieldLabel>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                id="form-register-confirm_password"
                                                aria-invalid={fieldState.invalid}
                                            placeholder="Re-enter your password"
                                            autoComplete="false"
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        <Button className="w-full" form="form-register" type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Spinner className="h-4 w-4"/> : null}
                            {form.formState.isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link className="font-medium text-primary hover:underline" to="/login">
                                Sign in
                            </Link>
                        </p>
                    </Field>
                </CardFooter>
            </Card>
        </AuthLayout>
    )
}
