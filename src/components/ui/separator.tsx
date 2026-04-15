"use client";

import { ark } from "@ark-ui/solid/factory";
import { mergeProps, splitProps, type ComponentProps } from "solid-js";
import { cn } from "tailwind-variants";

interface SeparatorProps extends ComponentProps<typeof ark.div> {
  /**
   * The orientation of the separator.
   *
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

export const Separator = (props: SeparatorProps) => {
  // const { orientation = "horizontal", className, ...rest } = props;
  const [classProps] = splitProps(
    mergeProps(props, { orientation: "horizontal" }),
    ["class"],
  );

  return (
    <ark.div
      aria-orientation={props.orientation}
      class={cn(
        "shrink-0",
        "bg-input",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        classProps.class,
      )}
      data-orientation={props.orientation}
      data-slot="separator"
      role="separator"
      {...props}
    />
  );
};
