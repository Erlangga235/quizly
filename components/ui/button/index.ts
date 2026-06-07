import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  // Base styles — token-driven radius, motion, focus ring, press micro-interaction
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "shrink-0 outline-none",
    // Token-driven motion: base duration + spring easing for press feedback
    "transition-all duration-[var(--motion-base)] ease-[var(--ease-spring)]",
    // Spring press scale (Requirement 11.1)
    "active:scale-[0.98]",
    // WCAG visible focus ring using the green anchor token (Requirement 10.2)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50",
    // SVG icon sizing
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    // Invalid state
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  ],
  {
    variants: {
      variant: {
        // Near-black brand gradient + green-edge shadow glow + accent border ring
        // Distinguishes the primary action on the dark base via shadow-brand + border, not fill contrast
        default: [
          "[background:var(--gradient-brand)]",
          "text-primary-foreground",
          "border border-accent/40",
          "shadow-brand",
          "hover:brightness-110 hover:shadow-brand",
        ],
        // Bordered outline — border-input base, accent hover surface
        outline: [
          "border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground",
          "shadow-sm",
        ],
        // Low-emphasis surface
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
        ],
        // Transparent — accent hover surface
        ghost: [
          "bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
        ],
        // Text link
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "shadow-none",
        ],
        // Destructive / delete actions
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
          "shadow-sm",
          "focus-visible:ring-destructive/40",
        ],
      },
      size: {
        // default and lg use h-12 to meet WCAG 44px minimum touch target (Requirement 10.2)
        "default": "h-12 px-5 py-2 has-[>svg]:px-4",
        "sm":      "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        "lg":      "h-12 rounded-md px-7 has-[>svg]:px-5",
        "icon":    "size-12",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
