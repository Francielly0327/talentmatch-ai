import { useEffect } from "react";
import { buildResumeBody, RESUME_CSS, type ResumeDocData } from "@/lib/resume-document";
import { cn } from "@/lib/utils";

let injected = false;

function useResumeStyles() {
  useEffect(() => {
    if (injected || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.id = "tm-resume-styles";
    style.textContent = RESUME_CSS;
    document.head.appendChild(style);
    injected = true;
  }, []);
}

/**
 * Preview do currículo em papel A4 — usa exatamente o mesmo HTML/CSS
 * do PDF exportado, garantindo que o que se vê é o que se baixa.
 */
export function ResumePreview({
  data,
  className,
  scale = 1,
}: {
  data: ResumeDocData;
  className?: string;
  scale?: number;
}) {
  useResumeStyles();
  const html = buildResumeBody(data);

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border bg-muted/40 p-3", className)}>
      <div className="mx-auto w-full max-w-[210mm] overflow-x-auto">
        <div
          className="tm-resume mx-auto origin-top rounded-md shadow-sm"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "16mm 15mm",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

/** Versão responsiva que encolhe a folha A4 para caber no contêiner. */
export function ResumePreviewResponsive({
  data,
  className,
}: {
  data: ResumeDocData;
  className?: string;
}) {
  useResumeStyles();
  const html = buildResumeBody(data);

  return (
    <div className={cn("rounded-xl border bg-muted/40 p-3", className)}>
      <div className="tm-a4-wrap">
        <div
          className="tm-resume tm-a4 rounded-md shadow-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <style>{`
        .tm-a4-wrap{container-type:inline-size;width:100%;overflow:hidden;}
        .tm-a4{width:210mm;min-height:297mm;padding:16mm 15mm;transform-origin:top left;}
        @container (max-width: 794px){ .tm-a4{transform:scale(calc(100cqw / 794));} }
        .tm-a4-wrap{height:auto;}
      `}</style>
    </div>
  );
}
