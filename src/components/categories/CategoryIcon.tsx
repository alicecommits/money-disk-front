const SIZE_CLASSES = {
  sm: "h-5 w-5 text-xs",
  md: "h-8 w-8 text-base",
  lg: "h-10 w-10 text-xl",
} as const;

type Size = keyof typeof SIZE_CLASSES;

interface CategoryIconProps {
  icon?: string | null | undefined;
  size?: Size;
  className?: string;
}

/** Renders a category's emoji icon, or a grey placeholder circle when unset. */
export function CategoryIcon({ icon, size = "sm", className = "" }: CategoryIconProps) {
  if (icon) {
    return (
      <span
        className={`inline-flex flex-none items-center justify-center leading-none ${SIZE_CLASSES[size]} ${className}`}
        aria-hidden="true"
      >
        {icon}
      </span>
    );
  }
  return (
    <span
      className={
        `inline-flex flex-none items-center justify-center rounded-full border border-dashed ` +
        `border-border-default text-text-tertiary leading-none ${SIZE_CLASSES[size]} ${className}`
      }
      aria-hidden="true"
    >
      ?
    </span>
  );
}

interface CategoryLabelProps {
  icon?: string | null | undefined;
  name: string;
  className?: string;
}

/** Icon + category name, spaced for inline use in tables, legends, and badges. */
export function CategoryLabel({ icon, name, className = "" }: CategoryLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CategoryIcon icon={icon} size="sm" />
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Plain-text "icon name" label for contexts that can't render JSX (native <option>, chart Tooltip name slot). */
export function categoryOptionLabel(icon: string | null | undefined, name: string): string {
  return `${icon ?? "?"} ${name}`;
}
