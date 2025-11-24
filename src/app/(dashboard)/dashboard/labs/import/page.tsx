import LabsImportPanel from "@/app/_components/labs-import-panel";

export default function LabsImportPage() {
  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import labs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your lab report PDF from any provider. Our AI will extract the values, show a preview,
          and you can confirm before saving to your dashboard.
        </p>
      </div>

      <LabsImportPanel />
    </section>
  );
}

