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
  Sparkles,
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
    color: "bg-success/10 border-success/20",
    iconColor: "text-success",
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
    color: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-500",
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
    color: "bg-purple-500/10 border-purple-500/20",
    iconColor: "text-purple-500",
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
    color: "bg-orange-500/10 border-orange-500/20",
    iconColor: "text-orange-500",
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
    color: "bg-muted border-border/50",
    iconColor: "text-muted-foreground",
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
      card: "bg-success/10 border-success/20",
      icon: (
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
      ),
    },
    warning: {
      card: "bg-warning/10 border-warning/20",
      icon: (
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
      ),
    },
    info: {
      card: "bg-primary/10 border-primary/20",
      icon: (
        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
      ),
    },
  } as const;

  const { card, icon } = styles[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, y: 5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", bounce: 0.3 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${card} shadow-sm group hover:shadow-md transition-shadow`}
    >
      <div className="mt-0.5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-foreground opacity-90">
        {insight.text.replace(/\*\*/g, '')}
      </div>
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
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              AI Document Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Extract intelligent insights from any financial document
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ── Left Column: Upload Zone ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card shadow-lg border-border/50 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`} />
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => !file && inputRef.current?.click()}
              className={[
                "relative flex flex-col items-center justify-center gap-4 p-12 lg:p-16 border-2 border-dashed rounded-xl transition-all select-none m-6 bg-card/50 backdrop-blur-sm z-10",
                file
                  ? "cursor-default border-border"
                  : "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border",
              ].join(" ")}
            >
              {/* Hidden native file input */}
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
                    className="flex flex-col items-center gap-4 w-full max-w-md relative z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                     <div className="relative">
                       <span className="text-7xl leading-none drop-shadow-md relative z-10 block hover:scale-105 transition-transform duration-300">
                         {getFileEmoji(file.name)}
                       </span>
                     </div>
                    
                    <div className="text-center w-full">
                      <p className="font-bold text-base truncate px-4 leading-snug">
                        {file.name}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1.5">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {formatBytes(file.size)}
                        </span>
                        <span className="text-xs text-primary font-bold tracking-wide uppercase">
                          {getFileCategoryLabel(file.name)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar — shown while uploading */}
                    {status === "uploading" && (
                      <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden mt-4">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full relative"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: "easeOut", duration: 0.3 }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_1s_infinite_linear]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                        </motion.div>
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
                        className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors mt-2"
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
                      className="absolute top-0 right-[-1rem] md:right-0 p-2 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors group shadow-sm"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4 text-muted-foreground group-hover:text-current" />
                    </button>
                  </motion.div>
                ) : (
                  /* ── Empty drop zone ─────────────────────────────────────── */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-5 pointer-events-none z-20"
                  >
                    <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center relative group">
                      <div className="absolute inset-0 bg-primary opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-opacity" />
                      <Upload className="h-10 w-10 text-primary relative z-10 group-hover:-translate-y-1 transition-transform" />
                    </div>

                    <div className="text-center">
                      <p className="font-bold text-lg text-foreground">
                        Drag & drop a document here
                      </p>
                      <p className="text-sm font-medium text-muted-foreground mt-1">
                        or click to browse your device
                      </p>
                    </div>

                    {/* Supported type pills */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-sm mt-2">
                      {[
                        "CSV",
                        "PDF",
                        "XLSX",
                        "JSON",
                        "PNG",
                      ].map((f) => (
                        <span
                          key={f}
                          className="text-[11px] font-bold px-3 py-1 rounded-full bg-card shadow-sm text-muted-foreground border border-border/50"
                        >
                          {f}
                        </span>
                      ))}
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/20">
                        + more
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80 mt-2 bg-muted/40 px-3 py-1.5 rounded-full">
                      <File className="h-3.5 w-3.5" /> Max size {MAX_SIZE_MB} MB
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Action bar ──────────────────────────────────────────────── */}
            <div className="px-6 py-5 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between z-20 relative">
              <div className="w-full sm:w-auto flex-1">
                {status === "uploading" && (
                  <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <div>
                       <p className="text-sm font-bold text-primary">Cognifin is Analysing...</p>
                       <p className="text-[10px] uppercase font-bold tracking-wider text-primary/70">{Math.round(progress)}% Complete</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                {file && status !== "uploading" && (
                  <>
                    <Button variant="outline" onClick={reset} type="button" className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex-1 sm:flex-none px-6"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyse Document
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* ── Results ─────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {(status === "success" && insights.length > 0) || status === "error" ?  (
               <motion.div
                 key="status-area"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="pt-2"
               >
                 {status === "success" && insights.length > 0 && (
                   <Card className="glass-card shadow-lg border-primary/20 overflow-hidden">
                     <div className="bg-primary/5 px-6 py-4 border-b border-border/50 flex items-center justify-between">
                       <h3 className="font-bold flex items-center gap-2 text-foreground">
                         <TrendingUp className="h-5 w-5 text-primary" />
                         Intelligence Report
                       </h3>
                       <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 shadow-sm">
                         {insights.length} {insights.length === 1 ? "Insight" : "Insights"} Found
                       </span>
                     </div>
     
                     <div className="p-6 space-y-4">
                       {insights.map((ins, i) => (
                         <InsightCard key={i} insight={ins} index={i} />
                       ))}
                     </div>
                   </Card>
                 )}
     
                 {status === "error" && (
                   <Card className="glass-card p-6 border-destructive/30 bg-destructive/5 shadow-sm">
                     <div className="flex items-start gap-4">
                       <div className="p-2 bg-destructive/10 rounded-xl">
                         <AlertTriangle className="h-6 w-6 text-destructive" />
                       </div>
                       <div className="flex-1">
                         <p className="text-base font-bold text-destructive">Analysis Failed</p>
                         <p className="text-sm font-medium text-destructive/80 mt-1 leading-relaxed">
                           {errorMsg}
                         </p>
                         <div className="flex gap-3 mt-4">
                           <Button
                             size="sm"
                             variant="outline"
                             className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                             onClick={() => {
                               setStatus("idle");
                               setErrorMsg("");
                             }}
                           >
                             Retry Upload
                           </Button>
                           <Button size="sm" variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground">
                             Clear Session
                           </Button>
                         </div>
                       </div>
                     </div>
                   </Card>
                 )}
               </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* ── Right Column: Info ────────────────────────────────────────── */}
        <div className="space-y-6">
           {/* Privacy Info */}
          <Card className="glass-card p-5 border-success/20 bg-success/5 shadow-sm">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-1.5 rounded-lg bg-success/20 text-success">
                 <CheckCircle2 className="h-5 w-5" />
               </div>
               <h3 className="text-sm font-bold text-success-foreground">Secure & Private</h3>
             </div>
             <p className="text-xs font-medium text-muted-foreground leading-relaxed">
               All processed documents are <strong>transiently held in memory</strong>. Cognifin does not permanently store your uploads, ensuring bank-grade privacy.
             </p>
          </Card>

          {/* Format Catalogue */}
          <Card className="glass-card p-5 border-border/50 shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-primary" />
              Supported Formats
            </h3>

            <div className="space-y-3">
              {FORMAT_GROUPS.map(({ group, color, iconColor, Icon, formats }) => (
                <div key={group} className={`rounded-xl border p-3 ${color} bg-card/50`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${iconColor}`}>
                      {group}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formats.map(({ ext, desc }) => (
                      <div key={ext} className="flex items-center px-1.5 py-0.5 rounded shadow-sm bg-background border border-border/50 group relative cursor-help">
                        <span className="text-[10px] font-bold text-foreground">
                          {ext}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
                          {desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-5 text-center">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 border-t border-border/50 pt-4 px-8 w-full justify-center">
                <Brain className="h-3 w-3" /> Cognifin ML Engine
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
