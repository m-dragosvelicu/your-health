import Link from "next/link";

import { LabsList } from "@/app/_components/labs-list";
import { rscCaller } from "~/trpc/server";

export default async function LabsPage() {
  const labs = await rscCaller.lab.list();

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Labs</h1>
          <p className="text-sm text-muted-foreground">
            View your imported lab sessions and their key details.
          </p>
        </div>
        <Link
          href="/dashboard/labs/import"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Import lab report
        </Link>
      </div>

      <LabsList labs={labs} />
    </section>
  );
}
