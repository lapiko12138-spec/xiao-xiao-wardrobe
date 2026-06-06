import { Battery, ChevronLeft, Signal, Wifi } from "lucide-react";

type PhoneShellProps = {
  children: React.ReactNode;
  className?: string;
  mobile?: boolean;
  showStatusBar?: boolean;
};

export function PhoneShell({
  children,
  className = "",
  mobile = false,
  showStatusBar = true
}: PhoneShellProps) {
  return (
    <article
      className={[
        mobile
          ? "relative h-[100dvh] w-full overflow-hidden rounded-none bg-[#fbfaf4]"
          : "relative h-[982px] w-[454px] overflow-hidden rounded-[34px] bg-[#fbfaf4] shadow-phone",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_16%_5%,rgba(189,208,153,0.14),transparent_27%),radial-gradient(circle_at_86%_9%,rgba(244,232,207,0.48),transparent_30%)]",
        className
      ].join(" ")}
    >
      {showStatusBar ? <StatusBar /> : null}
      <div className={["relative z-10 h-full", showStatusBar ? "pt-[70px]" : "pt-0"].join(" ")}>{children}</div>
    </article>
  );
}

export function StatusBar() {
  return (
    <div className="absolute left-0 right-0 top-0 z-20 flex h-[58px] items-center justify-between px-[36px] text-[17px] font-semibold text-black">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={18} strokeWidth={3} />
        <Wifi size={18} strokeWidth={2.6} />
        <Battery size={22} strokeWidth={2.1} />
      </div>
    </div>
  );
}

export function ScreenHeader({
  title,
  left,
  right,
  center = false
}: {
  title: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <header className="flex h-[42px] items-center justify-between px-6">
      <div className="flex w-[96px] items-center justify-start">
        {left ?? <ChevronLeft size={24} strokeWidth={2} />}
      </div>
      <h1
        className={[
          "text-[22px] font-semibold tracking-normal text-ink",
          center ? "text-center" : ""
        ].join(" ")}
      >
        {title}
      </h1>
      <div className="flex w-[96px] items-center justify-end gap-3">{right}</div>
    </header>
  );
}
