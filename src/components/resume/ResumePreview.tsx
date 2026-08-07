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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(1123);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const sheet = el.firstElementChild as HTMLElement | null;
    const apply = () => {
      const s = Math.min(1, el.clientWidth / 794);
      setScale(s);
      if (sheet) setHeight(sheet.offsetHeight * s);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    if (sheet) ro.observe(sheet);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div className={cn("rounded-xl border bg-muted/40 p-3", className)}>
      <div ref={wrapRef} style={{ width: "100%", height, overflow: "hidden" }}>
        <div
          className="tm-resume rounded-md shadow-sm"
          style={{
            width: "794px",
            minHeight: "1123px",
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

