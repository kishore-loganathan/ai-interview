import { BrainIcon, LayoutDashboardIcon, HistoryIcon, UserIcon, PlayIcon, ShieldIcon, LogOutIcon } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"

const NavBar = () => {
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/signin')
    }

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
        { to: "/new-interview", label: "New Interview", icon: PlayIcon },
        { to: "/history", label: "History", icon: HistoryIcon },
        { to: "/profile", label: "Profile", icon: UserIcon },
    ]

    const bottomItems = [
        { to: "/admin", label: "Admin Panel", icon: ShieldIcon },
    ]

    return (
        <div className="w-40 h-full bg-sidebar border-r border-sidebar-border flex flex-col text-sidebar-primary-foreground">
            <div className="flex items-center h-16 border-b border-sidebar-border px-4">
                <BrainIcon className="size-6 mr-2" />
                <div>
                    <div className="font-bold text-lg">InterviewAI</div>
                    <div className="text-xs text-gray-400">Practice Mode</div>
                </div>
            </div>

            <nav className="flex flex-col flex-grow p-2">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md mb-1 transition-colors ${isActive
                                ? "border border-primary bg-primary-active-bg text-primary"
                                : "hover:bg-sidebar-hover"
                            }`
                        }
                    >
                        <Icon className="size-4 mr-2" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-2 border-t border-sidebar-border">
                {bottomItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md mb-1 transition-colors ${isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-hover"
                            }`
                        }
                    >
                        <Icon className="size-4 mr-2" />
                        {label}
                    </NavLink>
                ))}

                <button
                    onClick={handleLogout}
                    className="flex items-center p-2 rounded-md hover:bg-sidebar-hover w-full text-left text-red-400 hover:text-red-500"
                >
                    <LogOutIcon className="size-4 mr-2" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default NavBar