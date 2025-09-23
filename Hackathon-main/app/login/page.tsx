import Link from "next/link"
import { PageCard } from "@/components/page-card"
import { SpecialLayout } from "@/components/special-layout"
import { Button } from "@/components/ui/button"

export default function LoginLandingPage() {
  return (
    <SpecialLayout>
      <PageCard 
        title="Login"
        description="Select your role to continue"
        className="border-border/20 shadow-2xl backdrop-blur-sm bg-card/95 dark:bg-card/90"
        headerClassName="text-center"
      >
        <div className="grid gap-3">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base sm:text-lg font-semibold w-full">
            <Link href="/login/admin">Admin</Link>
          </Button>
          <Button asChild variant="outline" className="py-3 text-base sm:text-lg w-full">
            <Link href="/login/student">Student / Resident</Link>
          </Button>
          <Button asChild variant="outline" className="py-3 text-base sm:text-lg w-full">
            <Link href="/login/faculty">Faculty / Coordinator</Link>
          </Button>
          <Button asChild variant="outline" className="py-3 text-lg">
            <Link href="/login/vendor">E‑waste Vendor</Link>
          </Button>
          <div className="text-center mt-4 pt-4 border-t border-border/20">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </PageCard>
    </SpecialLayout>
  )
}