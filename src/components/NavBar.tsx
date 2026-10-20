import {Menu} from "lucide-react"
import {useLocation} from "react-router-dom";

import {ModeToggle} from "@/components/ModeToggle.tsx"
import {Button} from "@/components/ui/button"
import type {ReactNode} from "react";
import {useSidebar} from "@/components/ui/sidebar.tsx";
import {findNavItem} from "@/lib/navigation";

type NavbarProps = {
    leftSlot?: ReactNode
}

export default function Navbar({ leftSlot }: NavbarProps) {
    const { toggleSidebar } = useSidebar()
    const location = useLocation()
    const current = findNavItem(location.pathname)

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-md transition-colors duration-300 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="size-10 md:hidden" aria-label="Open navigation">
                    <Menu className="size-5" />
                </Button>
                {leftSlot}
                {/* Location label, not a heading: each page owns its own h1 */}
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="hidden text-muted-foreground sm:inline">StudyBuddy</span>
                    {current ? (
                        <>
                            <span className="hidden text-muted-foreground/60 sm:inline" aria-hidden="true">/</span>
                            <span className="truncate font-medium" aria-current="page">{current.title}</span>
                        </>
                    ) : null}
                </nav>
            </div>

            <div className="flex items-center gap-2">
                <ModeToggle />
            </div>
        </header>
    )
}
