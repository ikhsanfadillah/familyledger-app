import { createFileRoute, Outlet } from "@tanstack/solid-router";

export const Route = createFileRoute("/(public)")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
