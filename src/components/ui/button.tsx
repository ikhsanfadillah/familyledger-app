"use client";

import { ark } from "@ark-ui/solid/factory";
import { tv, type VariantProps, cn } from "tailwind-variants";
import { Spinner } from "./spinner";
import { mergeProps, splitProps, type ComponentProps } from "solid-js";

export const buttonVariants = tv({
  base: [
    "relative",
    "inline-flex shrink-0 items-center justify-center gap-2",
    "whitespace-nowrap font-medium text-sm",
    "rounded",
    "transition-all",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/32",
    "disabled:pointer-events-none disabled:bg-opacity-70",
    "data-disabled:pointer-events-none data-disabled:bg-opacity-70",
    "aria-disabled:pointer-events-none aria-disabled:bg-opacity-70",
    "data-[state=loading]:pointer-events-none",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/24",
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  variants: {
    variant: {
      default: [
        "bg-primary",
        "border border-transparent shadow-primary/24 shadow-sm",
        "text-primary-foreground",
        "hover:bg-primary/90",
        "focus-visible:border-background",
      ],
      outline: [
        "bg-transparent",
        "text-primary",
        "border border-input shadow-sm/5",
        "hover:bg-primary hover:text-primary-foreground",
        "dark:bg-input/32 dark:hover:bg-input/64",
        "focus-visible:border-primary",
      ],
      destructive: [
        "bg-destructive",
        "text-white",
        "border border-transparent shadow-destructive/24 shadow-sm",
        "hover:bg-destructive/90",
        "focus-visible:border-background focus-visible:ring-destructive-foreground/32",
      ],
      secondary: [
        "bg-secondary",
        "text-secondary-foreground",
        "border border-transparent",
        "focus-visible:border-primary",
        "hover:bg-secondary/80",
      ],
      ghost: [
        "hover:bg-accent hover:text-accent-foreground",
        "border border-transparent",
        "focus-visible:border-primary",
      ],
      link: [
        "text-primary",
        "underline-offset-4",
        "border border-transparent",
        "hover:underline",
        "focus-visible:border-primary",
      ],
    },
    size: {
      xs: ["h-6", "gap-1.5", "px-2", "rounded-sm", "[&_svg:not([class*='size-'])]:size-2.5"],
      sm: ["h-7", "px-2.5", "gap-1.5", "[&_svg:not([class*='size-'])]:size-3.5"],
      md: ["h-8", "px-3", "py-2"],
      lg: ["h-9", "px-3.5"],
      xl: ["h-10", "text-base", "px-4"],
      "icon-xs": "size-6 rounded-sm",
      "icon-sm": "size-7",
      "icon-md": "size-8",
      "icon-lg": "size-9",
      "icon-xl": "size-10 [&_svg:not([class*='size-'])]:size-5",
    },
    clickEffect: {
      true: "active:scale-[0.98]",
    },
    pill: {
      true: [
        "rounded-full",
        "has-[>svg]:data-[size=xs]:pe-3",
        "has-[>svg]:data-[size=sm]:pe-3.5",
        "has-[>svg]:data-[size=md]:pe-4",
        "has-[>svg]:data-[size=lg]:pe-4.5",
        "has-[>svg]:data-[size=xl]:pe-5",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    clickEffect: true,
    pill: false,
  },
});

export interface ButtonProps
  extends ComponentProps<typeof ark.button>, VariantProps<typeof buttonVariants> {
  /**
   * Apply a click effect to the button
   *
   * @default true
   */
  clickEffect?: boolean;
  /**
   * Show a loading indicator
   *
   * @default false
   */
  isLoading?: boolean;
}

export const Button = (props: ButtonProps) => {
  const [local, rest] = splitProps(
    mergeProps(
      {
        variant: "default" as const,
        size: "md" as const,
        clickEffect: true,
        pill: false,
        isLoading: false,
        type: "button" as const,
      },
      props,
    ),
    ["variant", "size", "clickEffect", "pill", "isLoading", "class", "children"],
  );

  return (
    <ark.button
      class={cn(
        buttonVariants({
          variant: local.variant,
          size: local.size,
          clickEffect: local.clickEffect,
          pill: local.pill,
        }),
        local.class,
      )}
      data-size={local.size}
      data-slot="button"
      data-state={local.isLoading ? "loading" : "idle"}
      data-variant={local.variant}
      {...rest}
      aria-busy={local.isLoading}
      aria-disabled={local.isLoading}
    >
      {local.isLoading ? (
        <>
          <span aria-hidden class="invisible">
            {local.children}
          </span>

          <span class="sr-only">{local.children}</span>

          <span class="absolute inset-0 flex items-center justify-center">
            <Spinner aria-hidden />
          </span>
        </>
      ) : (
        local.children
      )}
    </ark.button>
  );
};
