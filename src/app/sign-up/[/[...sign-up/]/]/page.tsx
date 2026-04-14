import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-slate-50">
      <SignUp appearance={{
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm",
          card: "shadow-xl border-0"
        }
      }} />
    </div>
  );
}
