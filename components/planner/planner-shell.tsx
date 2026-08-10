import Link from "next/link";
import { PlannerLogo } from "./planner-logo";

type PlannerShellProps = {
  activeView: "month" | "week";
  monthHref: string;
  weekHref: string;
  children: React.ReactNode;
};

export function PlannerShell({ activeView, monthHref, weekHref, children }: PlannerShellProps) {
  return (
    <main className={`planner-page planner-page--${activeView}`}>
      <section className={`planner-sheet planner-sheet--${activeView}`} aria-label="Michelle's Daily Planner">
        <header className="planner-topbar">
          <Link className="planner-brand" href={monthHref} aria-label="Michelle's Daily Planner home">
            <PlannerLogo />
            <span className="planner-brand-text">Michelle&apos;s Daily Planner</span>
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
        <div className={`planner-content planner-content--${activeView}`}>{children}</div>
      </section>
    </main>
  );
}
