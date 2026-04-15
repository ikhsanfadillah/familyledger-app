import { ark } from "@ark-ui/solid/factory";
import {
  Field as ArkField,
  useFieldContext as useArkFieldContext,
} from "@ark-ui/solid/field";
import { Fieldset as ArkFieldset } from "@ark-ui/solid/fieldset";
import { cn, tv, type VariantProps } from "tailwind-variants";
import { Separator } from "./separator";
import { mergeProps, splitProps, type ComponentProps } from "solid-js";

export const useField = useArkFieldContext;

const fieldVariants = tv({
  base: [
    "group/field",
    "w-full",
    "flex gap-2",
    "data-invalid:text-destructive",
    "dark:data-invalid:text-destructive-foreground",
  ],
  variants: {
    orientation: {
      vertical: ["flex-col *:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center",
        "*:data-[slot=field-label]:flex-auto",
        "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
    },
    reverse: {
      true: [
        "data-[orientation=horizontal]:flex-row-reverse data-[orientation=vertical]:flex-col-reverse",
      ],
    },
  },
  defaultVariants: {
    orientation: "vertical",
    reverse: false,
  },
});

interface FieldProps
  extends
    ComponentProps<typeof ArkField.Root>,
    VariantProps<typeof fieldVariants> {}

export const Field = (props: FieldProps) => {
  const [local, rest] = splitProps(
    mergeProps({ orientation: "vertical" as const, reverse: false }, props),
    ["orientation", "reverse", "class"],
  );

  return (
    <ArkField.Root
      class={cn(
        fieldVariants({
          orientation: local.orientation,
          reverse: local.reverse,
        }),
        local.class,
      )}
      data-orientation={local.orientation}
      data-slot="field"
      {...rest}
    />
  );
};

export const FieldSet = (props: ComponentProps<typeof ArkFieldset.Root>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ArkFieldset.Root
      class={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        local.class,
      )}
      data-slot="field-set"
      {...rest}
    />
  );
};

interface FieldLegendProps extends ComponentProps<typeof ArkFieldset.Legend> {
  /**
   * The variant of the legend.
   */
  variant?: "legend" | "label";
}

export const FieldLegend = (props: FieldLegendProps) => {
  const [local, rest] = splitProps(
    mergeProps({ variant: "legend" as const }, props),
    ["variant", "class"],
  );

  return (
    <ArkFieldset.Legend
      class={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        local.class,
      )}
      data-slot="field-legend"
      data-variant={local.variant}
      {...rest}
    />
  );
};

export const FieldGroup = (props: ComponentProps<typeof ark.div>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ark.div
      class={cn(
        "group/field-group",
        "flex w-full flex-col gap-4",
        "data-[data-slot=checkbox-group]:gap-3",
        "*:data-[slot=field-group]:gap-4",
        local.class,
      )}
      data-slot="field-group"
      {...rest}
    />
  );
};

export const FieldContent = (props: ComponentProps<typeof ark.div>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ark.div
      class={cn(
        "group/field-content",
        "flex flex-1 flex-col gap-1.5",
        "leading-snug",
        local.class,
      )}
      data-slot="field-content"
      {...rest}
    />
  );
};

export const FieldLabel = (props: ComponentProps<typeof ArkField.Label>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ArkField.Label
      class={cn(
        "group/field-label peer/field-label",
        "font-medium text-sm leading-snug",
        "flex w-fit gap-1",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5",
        "group-data-disabled/field:opacity-64",
        "dark:has-data-[state=checked]:bg-primary/10",
        local.class,
      )}
      data-slot="field-label"
      {...rest}
    />
  );
};

export const FieldRequiredIndicator = (
  props: ComponentProps<typeof ark.span>,
) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <ArkField.RequiredIndicator
      aria-hidden
      class={cn(
        "select-none text-destructive text-sm",
        "dark:text-destructive-foreground",
        local.class,
      )}
      data-slot="field-required-indicator"
      {...rest}
    >
      {local.children ?? "*"}
    </ArkField.RequiredIndicator>
  );
};

export const FieldTitle = (props: ComponentProps<typeof ark.div>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ark.div
      class={cn(
        "w-fit",
        "flex items-center gap-2",
        "font-medium text-sm leading-snug",
        "group-data-[disabled=true]/field:opacity-64",
        local.class,
      )}
      data-slot="field-title"
      {...rest}
    />
  );
};

export const FieldDescription = (props: ComponentProps<typeof ark.p>) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ark.p
      class={cn(
        "font-normal text-muted-foreground text-sm leading-normal",
        "group-has-data-[orientation=horizontal]/field:",
        "nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",
        "in-[[data-slot=field]:has([data-slot=radio-group-item])]:ms-6 in-[[data-slot=field]:has([data-slot=radio-group-item])]:-mt-1.5!",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        local.class,
      )}
      data-slot="field-description"
      {...rest}
    />
  );
};

export const FieldSeparator = (props: ComponentProps<typeof ark.div>) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <ark.div
      class={cn(
        "relative",
        "h-5",
        "-my-2 group-data-[variant=outline]/field-group:-mb-2",
        "text-sm",
        local.class,
      )}
      data-content={!!local.children}
      data-slot="field-separator"
      {...rest}
    >
      <Separator class="absolute inset-0 top-1/2" />

      {!!local.children && (
        <span
          class={cn(
            "relative block",
            "w-fit",
            "mx-auto px-2",
            "bg-background",
            "text-muted-foreground text-sm",
          )}
        >
          {local.children}
        </span>
      )}
    </ark.div>
  );
};

export const FieldHelper = (
  props: ComponentProps<typeof ArkField.HelperText>,
) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ArkField.HelperText
      class={cn("text-muted-foreground text-sm", local.class)}
      data-slot="field-helper"
      {...rest}
    />
  );
};

export const FieldError = (
  props: ComponentProps<typeof ArkField.ErrorText>,
) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <ArkField.ErrorText
      class={cn(
        "font-normal text-destructive text-sm",
        "dark:text-destructive-foreground",
        local.class,
      )}
      data-slot="field-error"
      {...rest}
    />
  );
};
