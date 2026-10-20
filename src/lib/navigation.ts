import type { ComponentType } from "react"
import { BookOpenCheck, FileQuestion, Layers3, LayoutDashboard, Library, MessageSquareText, Settings } from "lucide-react"

export type NavItem = {
    title: string
    href: string
    icon: ComponentType<{ className?: string }>
    description: string
}

export type NavGroup = {
    label: string
    items: NavItem[]
}

// Single source for page names, so the sidebar, top bar and dashboard never disagree
export const navGroups: NavGroup[] = [
    {
        label: "Study",
        items: [
            { title: "Overview", href: "/dashboard", icon: LayoutDashboard, description: "Your progress at a glance" },
            { title: "Study with AI", href: "/chat", icon: MessageSquareText, description: "Ask your AI tutor anything" },
            { title: "Flashcards", href: "/flashcards", icon: Layers3, description: "Generate cards to review key ideas" },
            { title: "Generate Quiz", href: "/generate-questions", icon: FileQuestion, description: "Create a practice quiz on any topic" },
            { title: "My Quizzes", href: "/my-quizzes", icon: BookOpenCheck, description: "Take quizzes and track scores" },
        ],
    },
    {
        label: "Library",
        items: [
            { title: "Knowledge Base", href: "/knowledge-base", icon: Library, description: "Upload notes the tutor can use" },
        ],
    },
    {
        label: "Account",
        items: [
            { title: "Settings", href: "/settings", icon: Settings, description: "Profile and preferences" },
        ],
    },
]

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items)

// Nested routes (e.g. /my-quizzes/:id) belong to their parent section
export const isNavItemActive = (item: NavItem, pathname: string): boolean =>
    pathname === item.href || pathname.startsWith(`${item.href}/`)

export const findNavItem = (pathname: string): NavItem | undefined =>
    navItems.find((item) => isNavItemActive(item, pathname))
