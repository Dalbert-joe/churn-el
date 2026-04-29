import { createFileRoute, Navigate } from "@tanstack/react-router";
import { isLoggedIn } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: () => <Navigate to={isLoggedIn() ? "/home" : "/login"} />,
});
