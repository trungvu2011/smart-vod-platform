import { NavLink } from "react-router-dom";
import { Home, Compass, PlaySquare, Clock, ThumbsUp, User, Settings, HelpCircle, LogOut, Video } from "lucide-react";
import { cn } from "../lib/utils";

const mainLinks = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Compass, label: "Explore", to: "/explore" },
  { icon: PlaySquare, label: "Subscriptions", to: "/subscriptions" },
];

const libraryLinks = [
  { icon: Clock, label: "History", to: "/history" },
  { icon: PlaySquare, label: "Your Videos", to: "/studio" },
  { icon: Clock, label: "Watch Later", to: "/watch-later" },
  { icon: ThumbsUp, label: "Liked Videos", to: "/liked" },
];

const settingsLinks = [
  { icon: Settings, label: "Settings", to: "/settings" },
  { icon: HelpCircle, label: "Help", to: "/help" },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 transform overflow-y-auto bg-bg-dark border-r border-surface-dark transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-surface-dark text-primary"
                    : "text-text-secondary hover:bg-surface-dark hover:text-text-primary"
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="h-px w-full bg-surface-dark" />

        <div className="flex flex-col gap-1">
          <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Library
          </h3>
          {libraryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-surface-dark text-primary"
                    : "text-text-secondary hover:bg-surface-dark hover:text-text-primary"
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="h-px w-full bg-surface-dark" />

        <div className="flex flex-col gap-1">
          <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Subscriptions
          </h3>
          {/* Mock Subscriptions */}
          {[1, 2, 3, 4].map((i) => (
            <NavLink
              key={i}
              to={`/channel/user${i}`}
              className="flex items-center gap-4 rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-dark hover:text-text-primary"
            >
              <div className="h-6 w-6 rounded-full bg-surface-dark overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="avatar" className="h-full w-full object-cover" />
              </div>
              <span className="truncate">Channel {i}</span>
            </NavLink>
          ))}
        </div>

        <div className="h-px w-full bg-surface-dark" />

        <div className="flex flex-col gap-1">
          {settingsLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-surface-dark text-primary"
                    : "text-text-secondary hover:bg-surface-dark hover:text-text-primary"
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
