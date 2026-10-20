import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar"
import { GraduationCap, LogOut } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react";
import AuthService from "@/services/authService";
import { isNavItemActive, navGroups } from "@/lib/navigation";
import { PROFILE_UPDATED_EVENT } from "@/lib/events";
import type { User } from "@/types/type.ts";

const getInitials = (user: User | null): string => {
    const source = user?.display_name?.trim() || user?.email || "?"
    const parts = source.split(/[\s@._-]+/).filter(Boolean)
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase()
}

export function AppSidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        let active = true
        const loadUser = () => {
            AuthService.getCurrentUser()
                .then((currentUser) => active && setUser(currentUser))
                .catch(() => active && setUser(null))
        }

        loadUser()
        window.addEventListener(PROFILE_UPDATED_EVENT, loadUser)
        return () => {
            active = false
            window.removeEventListener(PROFILE_UPDATED_EVENT, loadUser)
        }
    }, [])

    const handleLogout = async () => {
        try {
            await AuthService.logout()
        } catch {
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
        }

        navigate("/login", { replace: true })
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-3">
                <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" aria-hidden="true">
                        <GraduationCap className="size-5" />
                    </div>
                    <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="text-base font-semibold tracking-tight">StudyBuddy</span>
                        <span className="text-xs text-sidebar-foreground/70">AI study companion</span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive = isNavItemActive(item, location.pathname)
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-9">
                                                <Link to={item.href} aria-current={isActive ? "page" : undefined}>
                                                    <item.icon className="size-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="gap-1 border-t border-sidebar-border">
                {user ? (
                    <Link
                        to="/settings"
                        className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                        title="Account settings"
                    >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground" aria-hidden="true">
                            {getInitials(user)}
                        </div>
                        <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
                            <p className="truncate text-sm font-medium">{user.display_name || "Student"}</p>
                            <p className="truncate text-xs text-sidebar-foreground/70">{user.email}</p>
                        </div>
                    </Link>
                ) : null}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Log out" className="text-sidebar-foreground/80">
                            <LogOut className="size-4" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
