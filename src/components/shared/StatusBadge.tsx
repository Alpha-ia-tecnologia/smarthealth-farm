import { cn } from "@/lib/utils"
import { statusStyles, type StatusKey } from "@/lib/status"

interface Props {
  status: StatusKey
  label?: string
  className?: string
  dot?: boolean
}

export function StatusBadge({ status, label, className, dot = true }: Props) {
  const s = statusStyles[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        s.badge,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", s.dot)} />}
      {label ?? s.label}
    </span>
  )
}
