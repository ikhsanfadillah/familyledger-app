import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "tailwind-variants";

export const Spinner = (props: ComponentProps<"i">) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <i
      aria-label={props["aria-label"] ?? "Loading"}
      class={cn("i-lucide-loader-2 size-4 animate-spin", local.class)}
      data-slot="spinner"
      role="status"
      {...props}
    />
  );
};