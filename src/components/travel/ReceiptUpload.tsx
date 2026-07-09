import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReceiptUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const scan = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data;
    },
    onSuccess: (d) => { setResult(d); toast.success(`Parsed ${d.kind}`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Ticket className="size-4 text-primary" />
        Upload ticket / receipt
      </div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) scan.mutate(file.name);
        }}
        className={`block cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-xs transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border text-muted-foreground hover:bg-muted/50"
        }`}
      >
        {scan.isPending ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Drop a PDF / image, or click to select"}
        <input
          type="file"
          className="sr-only"
          accept="image/*,application/pdf"
          onChange={(e) => e.target.files?.[0] && scan.mutate(e.target.files[0].name)}
        />
      </label>

      {result && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
          <div className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">{result.kind}</div>
          <pre className="whitespace-pre-wrap break-words text-[11px]">{JSON.stringify(result, null, 2)}</pre>
          <Button variant="ghost" size="sm" className="mt-2 h-7 w-full text-xs" onClick={() => setResult(null)}>Clear</Button>
        </div>
      )}
    </div>
  );
}
