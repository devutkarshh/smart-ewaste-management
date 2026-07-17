import Link from "next/link"
import { PageCard } from "@/components/page-card"
import { SpecialLayout } from "@/components/special-layout"
import { Button } from "@/components/ui/button"

export default function SignupLandingPage() {
  return (
    <SpecialLayout>
      <PageCard 
        title="Sign Up"
        description="Create your account - Select your role to continue"
        className="border-border/20 shadow-2xl backdrop-blur-sm bg-card/95 dark:bg-card/90"
        headerClassName="text-center"
      >
        <div className="grid gap-3">
          <Button asChild variant="outline" className="py-3 text-base sm:text-lg w-full">
            <Link href="/signup/student">Student / Resident</Link>
          </Button>
          <Button asChild variant="outline" className="py-3 text-base sm:text-lg w-full">
            <Link href="/signup/faculty">Faculty / Coordinator</Link>
          </Button>
          <Button asChild variant="outline" className="py-3 text-base sm:text-lg w-full">
            <Link href="/signup/vendor">E‑waste Vendor</Link>
          </Button>
          <div className="text-center mt-4 pt-4 border-t border-border/20">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </PageCard>
    </SpecialLayout>
  )
}
