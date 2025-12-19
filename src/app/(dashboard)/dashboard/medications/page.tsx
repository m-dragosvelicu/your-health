import MedicationTracker from "@/app/_components/medication-tracker";

export default function MedicationsPage() {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Medications
        </h1>
        <p className="text-sm text-muted-foreground">
          Simple medication list and daily logging, focused on desktop
          use.
        </p>
      </div>

      <MedicationTracker />
    </section>
  );
}

