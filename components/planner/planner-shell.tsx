import Link from "next/link";

type PlannerShellProps = {
  activeView: "month" | "week";
  monthHref: string;
  weekHref: string;
  children: React.ReactNode;
};

export function PlannerShell({ activeView, monthHref, weekHref, children }: PlannerShellProps) {
  return (
    <main className="planner-page">
      <section className="planner-sheet" aria-label="Little Day Planner">
        <header className="planner-topbar">
          <Link className="planner-brand" href={monthHref}>
            <span className="planner-brand-mark" aria-hidden="true" />
            Little Day Planner
          </Link>
          <nav className="planner-view-switch" aria-label="Planner views">
            <Link className="planner-view-link" href={monthHref} aria-current={activeView === "month" ? "page" : undefined}>
              Month
            </Link>
            <span aria-hidden="true">·</span>
            <Link className="planner-view-link" href={weekHref} aria-current={activeView === "week" ? "page" : undefined}>
              Week
            </Link>
          </nav>
        </header>
        <div className="planner-content">{children}</div>
      </section>
    </main>
  );
}
