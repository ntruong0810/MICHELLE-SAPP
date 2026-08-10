import Image from "next/image";

type PlannerDecorationsProps = {
  view: "month" | "week";
};

export function PlannerDecorations({ view }: PlannerDecorationsProps) {
  if (view === "month") {
    return (
      <div className="planner-decorations" aria-hidden="true">
        <Image
          className="planner-decoration planner-decoration--month-top"
          src="/branding/pic1.png"
          alt=""
          width={412}
          height={378}
          sizes="84px"
        />
        <Image
          className="planner-decoration planner-decoration--month-edge"
          src="/branding/pic4.png"
          alt=""
          width={404}
          height={368}
          sizes="88px"
        />
        <Image
          className="planner-decoration planner-decoration--month-bottom"
          src="/branding/pic5.png"
          alt=""
          width={410}
          height={366}
          sizes="78px"
        />
      </div>
    );
  }

  return (
    <div className="planner-decorations" aria-hidden="true">
      <Image
        className="planner-decoration planner-decoration--week-top"
        src="/branding/pic2.png"
        alt=""
        width={388}
        height={366}
        sizes="76px"
      />
      <Image
        className="planner-decoration planner-decoration--week-bottom"
        src="/branding/pic3.png"
        alt=""
        width={402}
        height={362}
        sizes="82px"
      />
    </div>
  );
}
