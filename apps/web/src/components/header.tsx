import { cn } from "@mongo/ui/lib/utils";
import { NavLink } from "react-router";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/quiz", label: "Quiz" },
  ] as const;

  return (
    <header className="material-chrome z-40 flex flex-row items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
      <nav className="flex items-center gap-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                "type-headline rounded-lg px-3 py-1.5 transition-[color,background-color,transform] duration-150 ease-out-quint active:scale-[0.97]",
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  );
}
