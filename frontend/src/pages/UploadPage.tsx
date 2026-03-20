import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Brain,
  TrendingUp,
  Lightbulb,
  File,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FilePlus,
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface ParsedInsight {
  text: string;
  type: "success" | "warning" | "info";
}

// ─── Constants ────────────────────────────────────────────────────────────────

// No extension whitelist — accept everything the browser can select.
// We only enforce a file-size cap.
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Display-only format catalogue shown in the "Supported Formats" grid
const FORMAT_GROUPS = [
  {
    group: "Spreadsheets",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    Icon: FileSpreadsheet,
    formats: [
      { ext: "XLSX", desc: "Excel workbook" },
      { ext: "XLS", desc: "Legacy Excel" },
      { ext: "CSV", desc: "Comma-separated" },
      { ext: "ODS", desc: "OpenDocument" },
    ],
  },
  {
    group: "Documents",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    Icon: FileText,
    formats: [
      { ext: "PDF", desc: "Bank statements" },
      { ext: "DOCX", desc: "Word document" },
      { ext: "DOC", desc: "Legacy Word" },
      { ext: "TXT", desc: "Plain text" },
    ],
  },
  {
    group: "Data",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
    Icon: FileCode,
    formats: [
      { ext: "JSON", desc: "JSON data" },
      { ext: "XML", desc: "XML data" },
      { ext: "TSV", desc: "Tab-separated" },
      { ext: "YAML", desc: "YAML config" },
    ],
  },
  {
    group: "Images",
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-600",
    Icon: FileImage,
    formats: [
      { ext: "PNG", desc: "Screenshot" },
      { ext: "JPG", desc: "Photo / scan" },
      { ext: "JPEG", desc: "Photo / scan" },
      { ext: "WEBP", desc: "Web image" },
    ],
  },
  {
    group: "Other",
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
    Icon: FilePlus,
    formats: [
      { ext: "ZIP", desc: "Archive bundle" },
      { ext: "RTF", desc: "Rich text" },
      { ext: "PPT", desc: "Presentation" },
      { ext: "PPTX", desc: "Presentation" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileEmoji(name: string): string {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "docx" || ext === "doc") return "📝";
  if (ext === "xlsx" || ext === "xls") return "📊";
  if (ext === "ods") return "📊";
  if (ext === "csv" || ext === "tsv") return "📋";
  if (ext === "txt" || ext === "rtf") return "📃";
  if (ext === "json" || ext === "xml") return "🗂️";
  if (ext === "yaml" || ext === "yml") return "🗂️";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"].includes(ext))
    return "🖼️";
  if (ext === "zip" || ext === "rar") return "🗜️";
  if (ext === "ppt" || ext === "pptx") return "📑";
  return "📁";
}

function getFileCategoryLabel(name: string): string {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (ext === "xlsx" || ext === "xls" || ext === "ods")
    return "Excel / Spreadsheet";
  if (ext === "csv" || ext === "tsv") return "CSV / Tabular Data";
  if (ext === "pdf") return "PDF Document";
  if (ext === "docx" || ext === "doc") return "Word Document";
  if (ext === "txt" || ext === "rtf") return "Text File";
  if (ext === "json") return "JSON Data";
  if (ext === "xml") return "XML Data";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext))
    return "Image";
  if (ext === "zip" || ext === "rar") return "Archive";
  if (ext === "ppt" || ext === "pptx") return "Presentation";
  return "File";
}

function extractInsights(data: unknown): ParsedInsight[] {
  const result: ParsedInsight[] = [];

  if (!data || typeof data !== "object") {
    return [
      {
        text:
          typeof data === "string" && data.trim()
            ? data.trim()
            : "Document processed. No structured insights were returned.",
        type: "info",
      },
    ];
  }

  const d = data as Record<string, unknown>;

  // Array of insights
  if (Array.isArray(d.insights)) {
    for (const item of d.insights) {
      if (typeof item === "string" && item.trim()) {
        const lower = item.toLowerCase();
        const type: ParsedInsight["type"] =
          lower.includes("warning") ||
          lower.includes("alert") ||
          lower.includes("risk")
            ? "warning"
            : lower.includes("good") ||
                lower.includes("great") ||
                lower.includes("excellent") ||
                lower.includes("success")
              ? "success"
              : "info";
        result.push({ text: item.trim(), type });
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const text =
          typeof obj.text === "string"
            ? obj.text
            : typeof obj.message === "string"
              ? obj.message
              : null;
        if (text) {
          result.push({
            text,
            type: (obj.type as ParsedInsight["type"]) ?? "info",
          });
        }
      }
    }
  }

  // Top-level analysis string
  if (typeof d.analysis === "string" && d.analysis.trim()) {
    result.push({ text: d.analysis.trim(), type: "info" });
  }

  // Top-level advice array
  if (Array.isArray(d.advice)) {
    for (const a of d.advice) {
      if (typeof a === "string" && a.trim()) {
        result.push({ text: a.trim(), type: "info" });
      }
    }
  }

  // Single message / result (only if nothing else found)
  if (result.length === 0) {
    const fallback =
      (typeof d.message === "string" ? d.message : null) ??
      (typeof d.result === "string" ? d.result : null) ??
      (typeof d.summary === "string" ? d.summary : null);
    if (fallback) {
      result.push({ text: fallback.trim(), type: "success" });
    }
  }

  // Summary object keys
  if (d.summary && typeof d.summary === "object" && result.length === 0) {
    const s = d.summary as Record<string, unknown>;
    const interesting = [
      "total_spent",
      "total_income",
      "savings_rate",
      "largest_category",
      "transaction_count",
    ];
    for (const k of interesting) {
      if (s[k] !== undefined) {
        result.push({
          text: `${k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}: ${s[k]}`,
          type: "info",
        });
      }
    }
  }

  if (result.length === 0) {
    result.push({
      text: "Document was processed successfully. No specific insights could be extracted from this file type.",
      type: "info",
    });
  }

  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InsightCard({
  insight,
  index,
}: {
  insight: ParsedInsight;
  index: number;
}) {
  const styles = {
    success: {
      card: "bg-green-50 border-green-200",
      icon: (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
      ),
    },
    warning: {
      card: "bg-yellow-50 border-yellow-200",
      icon: (
        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
      ),
    },
    info: {
      card: "bg-blue-50 border-blue-200",
      icon: (
        <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
      ),
    },
  } as const;

  const { card, icon } = styles[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-3 rounded-lg border ${card}`}
    >
      {icon}
      <p className="text-sm leading-relaxed">{insight.text}</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [insights, setInsights] = useState<ParsedInsight[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ── Validation ───────────────────────────────────────────────────────────

  const validateFile = (f: File): string | null => {
    if (f.size === 0) return "The selected file is empty (0 bytes).";
    if (f.size > MAX_SIZE_BYTES) {
      return `File is too large (${formatBytes(f.size)}). Maximum allowed size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const acceptFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      toast({
        title: "Cannot accept file",
        description: err,
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setStatus("idle");
    setInsights([]);
    setErrorMsg("");
    setProgress(0);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  };

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setInsights([]);
    setErrorMsg("");
    setProgress(0);

    // Simulate visual progress while waiting for the backend
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) {
          clearInterval(progressInterval);
          return p;
        }
        return p + Math.random() * 12;
      });
    }, 350);

    try {
      const data = await apiClient.uploadDocument(file);
      clearInterval(progressInterval);
      setProgress(100);

      const parsed = extractInsights(data);
      setInsights(parsed);
      setStatus("success");
      toast({ title: "✅ File analysed successfully" });
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setProgress(0);
      const msg =
        err instanceof Error
          ? err.message
          : "Upload failed. Please ensure the backend AI service is running.";
      setErrorMsg(msg);
      setStatus("error");
      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setInsights([]);
    setErrorMsg("");
    setProgress(0);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Upload Financial Documents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload <strong>any file type</strong> — Excel, PDF, CSV, Word, images,
          JSON, and more. Our AI will extract financial insights automatically.
        </p>
      </div>

      {/* ── Drop zone ───────────────────────────────────────────────────── */}
      <Card className="glass-card overflow-hidden">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !file && inputRef.current?.click()}
          className={[
            "relative flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-xl transition-all select-none",
            file
              ? "cursor-default"
              : "cursor-pointer hover:border-primary/60 hover:bg-muted/20",
            isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.01]"
              : "border-border",
          ].join(" ")}
        >
          {/* Hidden native file input — no accept filter = all types */}
          <input
            ref={inputRef}
            type="file"
            accept="*/*"
            onChange={onInputChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {file ? (
              /* ── File selected ───────────────────────────────────────── */
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                className="flex flex-col items-center gap-3 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-6xl leading-none">
                  {getFileEmoji(file.name)}
                </span>

                <div className="text-center">
                  <p className="font-semibold text-sm break-all leading-snug">
                    {file.name}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-primary font-medium">
                      {getFileCategoryLabel(file.name)}
                    </span>
                  </div>
                </div>

                {/* Progress bar — shown while uploading */}
                {status === "uploading" && (
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Change file button */}
                {status !== "uploading" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    Choose a different file
                  </button>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/60 hover:bg-muted transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            ) : (
              /* ── Empty drop zone ─────────────────────────────────────── */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 pointer-events-none"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>

                <div className="text-center">
                  <p className="font-semibold text-base">
                    Drag &amp; drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse your device
                  </p>
                </div>

                {/* Supported type pills */}
                <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
                  {[
                    "XLSX",
                    "XLS",
                    "PDF",
                    "CSV",
                    "DOCX",
                    "TXT",
                    "JSON",
                    "XML",
                    "PNG",
                    "JPG",
                    "ZIP",
                    "PPT",
                  ].map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60"
                    >
                      {f}
                    </span>
                  ))}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                    + more
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  All file types accepted · Max {MAX_SIZE_MB} MB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Action bar ──────────────────────────────────────────────── */}
        {file && status !== "uploading" && (
          <div className="px-6 pb-5 pt-3 flex gap-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 shadow-sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Analyse with AI
            </Button>
            <Button variant="outline" onClick={reset} type="button">
              <X className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          </div>
        )}

        {status === "uploading" && (
          <div className="px-6 pb-5 pt-2 flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700">
                Analysing your document…
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This may take a moment depending on file size
              </p>
            </div>
            <span className="text-sm font-semibold text-blue-600 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </Card>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {status === "success" && insights.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                AI Extracted Insights
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1 font-medium">
                  {insights.length}{" "}
                  {insights.length === 1 ? "insight" : "insights"}
                </span>
              </h3>

              <div className="space-y-2.5">
                {insights.map((ins, i) => (
                  <InsightCard key={i} insight={ins} index={i} />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="mt-5"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Another File
              </Button>
            </Card>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass-card p-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700">Upload Failed</p>
                  <p className="text-sm text-red-600 mt-1 leading-relaxed">
                    {errorMsg}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setStatus("idle");
                        setErrorMsg("");
                      }}
                    >
                      Try Again
                    </Button>
                    <Button size="sm" variant="ghost" onClick={reset}>
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Format catalogue ────────────────────────────────────────────── */}
      <Card className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          All Supported File Types
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {FORMAT_GROUPS.map(({ group, color, iconColor, Icon, formats }) => (
            <div key={group} className={`rounded-xl border p-3 ${color}`}>
              <div className="flex items-center gap-2 mb-2.5">
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <span className={`text-xs font-semibold ${iconColor}`}>
                  {group}
                </span>
              </div>
              <div className="space-y-1">
                {formats.map(({ ext, desc }) => (
                  <div key={ext} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      .{ext.toLowerCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight text-right max-w-[110px]">
                      {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/40">
          <File className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              All file types are accepted.
            </strong>{" "}
            Files are sent securely to the backend AI service for processing and
            are not stored permanently on the server. Maximum upload size is{" "}
            <strong className="text-foreground">{MAX_SIZE_MB} MB</strong> per
            file. For best results with financial data, use Excel (.xlsx), CSV,
            or PDF formats.
          </p>
        </div>
      </Card>
    </div>
  );
}
