type PlaceholderProps = {
  label?: string;
  className?: string;
  tone?: "cream" | "green" | "blue" | "tan" | "gray" | "rose" | "dark";
  imageUrl?: string;
  fit?: "cover" | "contain";
};

const toneMap: Record<NonNullable<PlaceholderProps["tone"]>, string> = {
  cream: "from-[#faf7ee] via-[#ede4d2] to-[#d7c5a8]",
  green: "from-[#eef5e5] via-[#cddbb6] to-[#9fb278]",
  blue: "from-[#edf3f6] via-[#cad9e1] to-[#8fa5b1]",
  tan: "from-[#f4eadb] via-[#d7c2a3] to-[#a98c66]",
  gray: "from-[#f4f4f1] via-[#d8d8d2] to-[#a9aaa2]",
  rose: "from-[#f7ece7] via-[#e4c9bf] to-[#c18f80]",
  dark: "from-[#3f4439] via-[#22261f] to-[#080907]"
};

export function ImagePlaceholder({
  label,
  className = "",
  tone = "cream",
  imageUrl,
  fit = "cover"
}: PlaceholderProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[10px] bg-gradient-to-br",
        toneMap[tone],
        className
      ].join(" ")}
      aria-label={label ? `${label}占位图` : "占位图"}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label || "图片"}
          className={[
            "absolute inset-0 h-full w-full",
            fit === "contain" ? "object-contain" : "object-cover"
          ].join(" ")}
        />
      ) : (
        <>
          <div className="absolute inset-x-[18%] bottom-[11%] h-[62%] rounded-t-full bg-white/42 blur-[1px]" />
          <div className="absolute left-[20%] right-[20%] top-[13%] h-[10%] rounded-full bg-white/35" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.54),transparent_42%,rgba(120,137,92,0.11))]" />
        </>
      )}
      {label ? (
        <span className="absolute bottom-2 left-2 right-2 truncate text-center text-[10px] font-medium text-[#6f725f]/75">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function AvatarPlaceholder({
  className = "",
  tone = "green",
  imageUrl
}: {
  className?: string;
  tone?: PlaceholderProps["tone"];
  imageUrl?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-full bg-gradient-to-br",
        toneMap[tone || "green"],
        className
      ].join(" ")}
      aria-label="头像占位图"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="头像" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute left-1/2 top-[18%] h-[28%] w-[28%] -translate-x-1/2 rounded-full bg-[#f9eee6]" />
          <div className="absolute bottom-0 left-1/2 h-[48%] w-[62%] -translate-x-1/2 rounded-t-full bg-[#eff3df]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35),transparent_55%)]" />
        </>
      )}
    </div>
  );
}
