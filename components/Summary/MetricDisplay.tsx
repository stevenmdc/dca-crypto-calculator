"use client";

interface MetricDisplayProps {
  label: string;
  value: string;
  subText?: string;
  variant?: "default" | "positive" | "negative";
}

export function MetricDisplay({
  label,
  value,
  subText,
  variant = "default",
}: MetricDisplayProps) {
  const variantClasses = {
    default: "text-white",
    positive: "text-green-400",
    negative: "text-red-400",
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm text-white">{label}</p>
        <p className={`text-lg font-semibold ${variantClasses[variant]}`}>
          {value}
        </p>
        {subText && <p className="text-xs text-white mt-1">{subText}</p>}
      </div>
    </div>
  );
}
