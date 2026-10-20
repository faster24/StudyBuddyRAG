import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
    title: string
    description?: ReactNode
    icon?: ComponentType<{ className?: string }>
    actions?: ReactNode
    className?: string
}

// One heading structure for every page: icon tile, h1, supporting text, optional actions
export default function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
            <div className="flex min-w-0 items-start gap-3">
                {Icon ? (
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                        <Icon className="size-5" />
                    </div>
                ) : null}
                <div className="min-w-0 space-y-1">
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                </div>
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
    )
}
