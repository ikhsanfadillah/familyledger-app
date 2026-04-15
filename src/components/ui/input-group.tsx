"use client";

import { ark } from "@ark-ui/solid/factory";
import { tv, type VariantProps, cn } from "tailwind-variants";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { mergeProps, splitProps, type ComponentProps } from "solid-js";

const inpuGroupVariants = tv({
  base: [
    "group/input-group",
    "relative",
    "w-full min-w-0",
    "flex items-center",
    "bg-background dark:bg-input/30",
    "rounded-lg border border-input shadow-xs/5",
    "transition-[color,box-shadow]",
    "has-[>textarea]:h-auto",
    "has-[>[data-align=inline-start]]:[&>input]:ps-2",
    "has-[>[data-align=inline-end]]:[&>input]:pe-2",
    "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
    "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",
    "outline-none focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/32",
    "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-[3px] has-[[data-slot][aria-invalid=true]]:ring-destructive/24",
    "dark:has-[[data-slot][aria-invalid=true]]:border-destructive-foreground dark:has-[[data-slot][aria-invalid=true]]:ring-destructive-foreground/40",
  ],
  variants: {
    size: {
      sm: ["h-7"],
      md: ["h-8"],
      lg: ["h-9"],
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface InputGroupProps
  extends
    ComponentProps<typeof ark.div>,
    VariantProps<typeof inpuGroupVariants> {}

export const InputGroup = (props: InputGroupProps) => {
  const [local, rest] = splitProps(mergeProps({ size: "md" as const }, props), [
    "size",
    "class",
  ]);

  return (
    <ark.div
      class={cn(inpuGroupVariants({ size: local.size }), local.class)}
      data-size={local.size}
      data-slot="input-group"
      role="group"
      {...rest}
    />
  );
};

const inputGroupAddonVariants = tv({
  base: [
    "h-auto",
    "flex items-center justify-center gap-2",
    "py-1.5",
    "select-none font-medium text-muted-foreground text-sm",
    "cursor-text",
    "group-data-[disabled=true]/input-group:opacity-64",
    "[&>kbd]:rounded-[calc(var(--radius)-5px)]",
    "[&_svg:not([class*='size-'])]:size-4",
  ],
  variants: {
    align: {
      "inline-start": [
        "order-first ps-3",
        "has-[>button]:ms-[-0.45rem]",
        "has-[>kbd]:ms-[-0.35rem]",
      ],
      "inline-end": [
        "order-last pe-3",
        "has-[>button]:me-[-0.45rem]",
        "has-[>kbd]:me-[-0.35rem]",
      ],
      "block-start": [
        "order-first w-full justify-start px-3 pt-3",
        "group-has-[>input]/input-group:pt-2.5",
        "[.border-b]:pb-3",
      ],
      "block-end": [
        "order-last w-full justify-start px-3 pb-3",
        "group-has-[>input]/input-group:pb-2.5",
        "[.border-t]:pt-3",
      ],
    },
  },
  defaultVariants: {
    align: "inline-start",
  },
});

interface InputGroupAddonProps
  extends
    ComponentProps<typeof ark.div>,
    VariantProps<typeof inputGroupAddonVariants> {}

export const InputGroupAddon = (props: InputGroupAddonProps) => {
  const [local, rest] = splitProps(mergeProps({ align: "inline-start" as const }, props), [
    "class",
    "align",
  ]);

  return (
    <ark.div
      class={cn(inputGroupAddonVariants({ align: local.align }), local.class)}
      data-align={local.align}
      data-slot="input-group-addon"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      role="group"
      {...rest}
    />
  );
};

const inputGroupButtonVariants = tv({
  base: ["flex items-center gap-2", "text-sm", "shadow-none"],
  variants: {
    size: {
      xs: [
        "h-6",
        "gap-1",
        "px-2",
        "rounded-[calc(var(--radius)-5px)]",
        "has-[>svg]:px-2",
        "[&_svg:not([class*='size-'])]:size-3.5",
      ],
      sm: ["h-8", "gap-1.5", "px-2.5", "rounded-md", "has-[>svg]:px-2.5"],
      "icon-xs": [
        "size-6",
        "rounded-[calc(var(--radius)-5px)]",
        "p-0",
        "has-[>svg]:p-0",
      ],
      "icon-sm": ["size-8", "p-0", "has-[>svg]:p-0"],
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

interface InputGroupButtonProps
  extends
    Omit<ComponentProps<typeof Button>, "size">,
    VariantProps<typeof inputGroupButtonVariants> {}

export const InputGroupButton = (props: InputGroupButtonProps) => {
  const [local, rest] = splitProps(
    mergeProps(
      {
        type: "button" as const,
        variant: "ghost" as const,
        size: "xs" as const,
      },
      props,
    ),
    ["class", "type", "variant", "size"],
  );

  return (
    <Button
      class={cn(inputGroupButtonVariants({ size: local.size }), local.class)}
      data-size={local.size}
      data-slot="input-group-button"
      type={local.type}
      variant={local.variant}
      {...rest}
    />
  );
};

export const InputGroupText = (props: ComponentProps<typeof ark.span>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ark.span
      class={cn(
        "flex items-center gap-2 text-muted-foreground text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        local.class,
      )}
      data-slot="input-group-text"
      {...rest}
    />
  );
};

export const InputGroupInput = (props: ComponentProps<typeof Input>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <Input
      class={cn(
        "flex-1",
        "bg-transparent",
        "rounded-none border-0 shadow-none",
        "focus-visible:ring-0",
        "disabled:bg-transparent aria-invalid:ring-0 data-invalid:ring-0",
        "dark:bg-transparent dark:disabled:bg-transparent",
        local.class,
      )}
      data-slot="input-group-control"
      {...rest}
    />
  );
};

export const InputGroupTextarea = (props: ComponentProps<typeof Textarea>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <Textarea
      class={cn(
        "flex-1",
        "py-3",
        "bg-transparent",
        "resize-none rounded-none border-0 shadow-none",
        "focus-visible:ring-0 dark:bg-transparent",
        local.class,
      )}
      data-slot="input-group-control"
      {...rest}
    />
  );
};
