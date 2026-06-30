import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-semibold">{siteConfig.name}</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Land your next role with AI-powered job search
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/register">Create free account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
