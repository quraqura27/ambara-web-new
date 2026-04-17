import { redirect } from "next/navigation";

export default function Home() {
  // Marketing landing page is at public/index.html
  // App Router page takes precedence over public/ files at root,
  // so we redirect to the explicit .html path
  redirect("/index.html");
}
