// Root index redirect — sends visitors to the sign-in page.
// Authentication is enforced at the page level during implementation;
// this redirect ensures the root URL is not a blank page.

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/signin");
}
