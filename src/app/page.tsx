import { redirect } from "next/navigation";

export default function RootPage() {
  // Always redirect the root page to login
  redirect("/login");
}
