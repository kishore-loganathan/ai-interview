import { BrainIcon, LayoutDashboardIcon, HistoryIcon, UserIcon, PlayIcon, ShieldIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { toast } from "sonner"

interface NavBarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const NavBar = ({ collapsed = false, onToggle }: NavBarProps) => {
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        toast.success('Signed out successfully')
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
        <div 
            className={`h-full bg-[#0a0a0f] border-r border-gray-800 flex flex-col text-gray-300 transition-all duration-200 ${
                collapsed ? 'w-16' : 'w-56'
            }`}
        >
            {/* Logo + Toggle Section */}
            <div className={`flex items-center ${collapsed ? 'justify-center p-3' : 'justify-between p-4'} mb-2`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BrainIcon className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="font-bold text-white text-base">InterviewAI</div>
                            <div className="text-xs text-gray-500">Practice Mode</div>
                        </div>
                    )}
                </div>

                {!collapsed && onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"
                        title="Collapse sidebar"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Collapse toggle when collapsed */}
            {collapsed && onToggle && (
                <div className="flex justify-center pb-2">
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"
                        title="Expand sidebar"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Navigation */}
            <nav className={`flex flex-col flex-grow ${collapsed ? 'px-2' : 'px-3'} space-y-1`}>
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 text-sm ${
                                isActive
                                    ? "bg-indigo-600/20 text-indigo-400 font-medium"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                            }`
                        }
                        title={collapsed ? label : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                                {!collapsed && <span>{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className={`${collapsed ? 'px-2' : 'px-3'} pb-4 space-y-1 border-t border-gray-800 pt-4`}>
                {bottomItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 text-sm ${
                                isActive
                                    ? "bg-indigo-600/20 text-indigo-400 font-medium"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                            }`
                        }
                        title={collapsed ? label : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                                {!collapsed && <span>{label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}

                <button
                    onClick={handleLogout}
                    className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg w-full text-left text-sm text-gray-400 hover:bg-gray-800/50 hover:text-red-400 transition-all duration-200`}
                    title={collapsed ? "Sign Out" : undefined}
                >
                    <LogOutIcon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    )
}

export default NavBar