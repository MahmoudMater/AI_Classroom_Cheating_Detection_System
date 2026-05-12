"use client"
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronRight, Book, Activity, Cpu, Layers, Terminal, Search, Binary, Database, HelpCircle, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type Tab = "overview"|"nb01"|"nb02"|"nb031"|"nb032"|"nb033"|"nb034"|"nb04"|"models"|"training"|"api"|"faq";

interface NavItem { id: Tab; label: string; sub?: string; badge?: string; color?: string }

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION STRUCTURE
═══════════════════════════════════════════════════════════════ */
const NAV: NavItem[] = [
  { id:"overview", label:"Project Overview",      sub:"Architecture & goals" },
  { id:"nb01",     label:"01 · Frame Extraction", sub:"Video → JPEG frames" },
  { id:"nb02",     label:"02 · Preprocessing",    sub:"Clean · Dedup · Split" },
  { id:"nb031",    label:"03.1 · Custom CNN",      sub:"⭐ Best Model",  badge:"BEST", color:"#22c55e" },
  { id:"nb032",    label:"03.2 · ResNet18",        sub:"Transfer learning" },
  { id:"nb033",    label:"03.3 · EfficientNet-B0", sub:"Compound scaling" },
  { id:"nb034",    label:"03.4 · ViT-B/16",        sub:"Transformer vision" },
  { id:"nb04",     label:"04 · Model Comparison",  sub:"All 5 models · Full eval" },
  { id:"models",   label:"Model Deep Dive",        sub:"Architectures explained" },
  { id:"training", label:"Training System",        sub:"Loss · Optim · Callbacks" },
  { id:"api",      label:"Reference",              sub:"Constants · Files · API" },
  { id:"faq",      label:"FAQ & Pitfalls",         sub:"Common mistakes" },
];

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Code({ children, inline }: { children: string; inline?: boolean }) {
  if (inline) return (
    <code className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded px-1.5 py-0.5 text-[12.5px] font-mono text-blue-600 dark:text-blue-300 transition-colors">
      {children}
    </code>
  );
  return null;
}

function CodeBlock({ code, lang="python", title }: { code:string; lang?:string; title?:string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  
  const keywords = /\b(import|from|def|class|for|if|else|elif|return|in|not|and|or|True|False|None|with|as|try|except|raise|break|continue|pass|lambda|yield|async|await|while|super|self)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g;
  const comments = /(#[^\n]*)/g;
  
  const highlight = (s: string) => s
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(comments, '<span class="text-slate-500 italic">$1</span>')
    .replace(strings,  '<span class="text-emerald-600 dark:text-emerald-400">$1</span>')
    .replace(keywords, '<span class="text-purple-600 dark:text-purple-400 font-semibold">$1</span>');

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#060d1a] transition-colors shadow-sm dark:shadow-none">
      {title && (
        <div className="bg-slate-100 dark:bg-[#0d1829] px-4 py-2.5 text-[11px] text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
          <span>{title}</span>
          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">{lang}</span>
        </div>
      )}
      <div className="relative group">
        <button 
          onClick={copy} 
          className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-[10px] font-mono transition-all duration-200 border ${
            copied 
              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" 
              : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-slate-300"
          }`}
        >
          {copied ? "✓ COPIED" : "COPY"}
        </button>
        <pre className="p-5 overflow-x-auto text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 font-mono scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 transition-colors">
          <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
        </pre>
      </div>
    </div>
  );
}

function H2({ id, children }: { id?:string; children:React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-12 mb-6 pb-2 border-b border-slate-200 dark:border-slate-800/50 font-syne flex items-center gap-3 scroll-mt-24 transition-colors">
      {children}
    </h2>
  );
}

function H3({ children }: { children:React.ReactNode }) {
  return (
    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-8 mb-4 font-syne flex items-center gap-2 transition-colors">
      {children}
    </h3>
  );
}

function H4({ children }: { children:React.ReactNode }) {
  return (
    <h4 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 mt-6 mb-2 uppercase tracking-[0.15em] font-mono transition-colors">
      {children}
    </h4>
  );
}

function P({ children }: { children:React.ReactNode }) {
  return <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[14px] md:text-[15px] mb-4 transition-colors">{children}</p>;
}

function Table({ headers, rows }: { headers:string[]; rows:(string|React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#060d1a]/30 transition-colors shadow-sm dark:shadow-none">
      <table className="w-full border-collapse text-[13px] font-mono">
        <thead>
          <tr className="bg-slate-50 dark:bg-[#0d1829] transition-colors">
            {headers.map((h,i) => (
              <th key={i} className="px-5 py-3 text-left text-blue-600 dark:text-blue-400 font-bold text-[11px] uppercase tracking-wider border-b border-blue-100 dark:border-blue-900/30 whitespace-nowrap transition-colors">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
          {rows.map((row,i) => (
            <tr key={i} className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${i % 2 === 0 ? "bg-transparent" : "bg-slate-50/30 dark:bg-white/[0.01]"}`}>
              {row.map((cell,j) => (
                <td key={j} className={`px-5 py-3 align-top transition-colors ${j === 0 ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ type="info", title, children }: { type?:"info"|"warn"|"danger"|"success"; title?:string; children:React.ReactNode }) {
  const variants = {
    info:    { bg:"bg-blue-500/5", border:"border-blue-500/20", icon:"ℹ", text:"text-blue-600 dark:text-blue-400", iconBg: "bg-blue-500/10" },
    warn:    { bg:"bg-amber-500/5", border:"border-amber-500/20", icon:"⚠", text:"text-amber-600 dark:text-amber-400", iconBg: "bg-amber-500/10" },
    danger:  { bg:"bg-rose-500/5", border:"border-rose-500/20", icon:"✖", text:"text-rose-600 dark:text-rose-400", iconBg: "bg-rose-500/10" },
    success: { bg:"bg-emerald-500/5", border:"border-emerald-500/20", icon:"✓", text:"text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/10" },
  }[type];

  return (
    <div className={`my-6 rounded-xl border p-5 transition-colors ${variants.bg} ${variants.border}`}>
      {title && (
        <div className={`text-[12px] font-bold mb-3 flex items-center gap-2 ${variants.text}`}>
          <span className={`size-5 rounded-full flex items-center justify-center text-[10px] ${variants.iconBg}`}>{variants.icon}</span>
          {title}
        </div>
      )}
      <div className="text-slate-600 dark:text-slate-400 text-[14px] leading-relaxed transition-colors">
        {children}
      </div>
    </div>
  );
}

function Badge({ children, color="#3b82f6" }: { children:React.ReactNode; color?:string }) {
  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono"
      style={{ 
        backgroundColor: color + "15", 
        borderColor: color + "40", 
        color: color 
      }}
    >
      {children}
    </span>
  );
}

function Step({ n, title, input, output, children }: { n:number; title:string; input?:string; output?:string; children:React.ReactNode }) {
  return (
    <div className="flex gap-4 md:gap-6 mb-6 group">
      <div className="flex flex-col items-center shrink-0">
        <div className="size-8 md:size-10 rounded-full bg-blue-600/10 border-2 border-blue-500 flex items-center justify-center text-[14px] font-black text-blue-600 dark:text-blue-400 font-mono transition-all group-hover:scale-110">
          {n}
        </div>
        <div className="flex-1 w-px bg-slate-200 dark:bg-slate-800 my-2 group-last:hidden transition-colors" />
      </div>
      <div className="flex-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-5 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all shadow-sm dark:shadow-none">
        <div className="font-bold text-slate-900 dark:text-slate-100 text-[16px] mb-2 font-syne transition-colors">{title}</div>
        <div className="text-slate-500 dark:text-slate-500 text-[14px] leading-relaxed mb-4 transition-colors">{children}</div>
        {(input || output) && (
          <div className="flex flex-wrap gap-4 text-[11px] font-mono border-t border-slate-100 dark:border-white/5 pt-3 mt-1 transition-colors">
            {input && (
              <div className="flex gap-2">
                <span className="text-slate-400 dark:text-slate-600 font-bold uppercase">Input:</span>
                <span className="text-blue-600 dark:text-blue-400/80 transition-colors">{input}</span>
              </div>
            )}
            {output && (
              <div className="flex gap-2">
                <span className="text-slate-400 dark:text-slate-600 font-bold uppercase">Output:</span>
                <span className="text-emerald-600 dark:text-emerald-400/80 transition-colors">{output}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBar({ label, value, color="#3b82f6", max=1 }: { label:string; value:number; color?:string; max?:number }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1.5 px-0.5">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider transition-colors">{label}</span>
        <span className="text-[13px] font-bold font-mono transition-colors" style={{ color }}>{(value).toFixed(4)}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:shadow-[0_0_8px_rgba(0,0,0,0.5)]"
          style={{ 
            width: `${(value/max)*100}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`
          }}
        />
      </div>
    </div>
  );
}

function CellBlock({ title, children }: { title:string; children:React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 dark:border-slate-800/50 rounded-xl my-4 overflow-hidden bg-slate-50/50 dark:bg-[#0a1525]/30 transition-colors shadow-sm dark:shadow-none">
      <button 
        onClick={() => setOpen(o => !o)} 
        className="w-full bg-slate-100 dark:bg-[#0a1525] px-4 py-3 flex items-center gap-3 transition-colors hover:bg-slate-200 dark:hover:bg-blue-900/10 group"
      >
        <span className={`text-[10px] text-slate-400 dark:text-slate-600 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>▶</span>
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">In [·]</span>
        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{title}</span>
      </button>
      {open && <div className="p-1">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED CONSTANTS BLOCK (appears in every NB)
═══════════════════════════════════════════════════════════════ */
const CONSTANTS_CODE = `# ╔══════════════════════════════════════════════════════════╗
# ║          PROJECT-WIDE CONSTANTS — do not change          ║
# ║  These must be identical across all notebooks & scripts  ║
# ╚══════════════════════════════════════════════════════════╝
DATASET_PATH   = '/content/drive/MyDrive/dataset_final'   # split dataset
FRAMES_PATH    = '/content/drive/MyDrive/dataset_frames'  # raw frames
CLASS_NAMES    = ['cheating', 'not_cheating']             # alphabetical (ImageFolder order)
IMG_SIZE       = (224, 224)
BATCH_SIZE     = 32
NUM_EPOCHS     = 20
PATIENCE       = 5

# Best model (chosen from Notebook 04 results)
# Custom CNN: Acc=0.9780, F1=0.9780, ROC-AUC=0.9995, Params=~200K
BEST_MODEL_NAME = 'Custom CNN'
BEST_MODEL_FILE = 'cnn_cheating_model.pth'
BEST_MODEL_KEY  = 'cnn'

# Normalisation for Custom CNN (trained from scratch — NOT ImageNet)
CLF_MEAN = [0.5, 0.5, 0.5]
CLF_STD  = [0.5, 0.5, 0.5]

# All model .pth filenames
MODEL_FILES = {
    'cnn':          'cnn_cheating_model.pth',
    'resnet18':     'resnet18_cheating_model.pth',
    'efficientnet': 'efficientnet_cheating.pth',
    'vit':          'Vision_Transformer.pth',
    'mobilenet':    'mobilenetv2_model.pth',
}`;

/* ═══════════════════════════════════════════════════════════════
   TAB CONTENT COMPONENTS
═══════════════════════════════════════════════════════════════ */

function TabOverview() {
  return (
    <div className="space-y-12">
      <div className="relative overflow-hidden rounded-[2rem] border border-blue-900/10 dark:border-blue-900/30 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-[#0c1e3f] dark:via-[#071225] dark:to-[#040a14] p-8 md:p-12 shadow-xl dark:shadow-2xl transition-all">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-blue-500/10 dark:bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 transition-colors">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            Computer Vision · Binary Classification · PyTorch
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.15] mb-6 font-syne tracking-tight transition-colors">
            Exam Cheating Detection System<br/>
            <span className="text-blue-600 dark:text-blue-500">Complete Documentation</span>
          </h1>
          <P>
            End-to-end deep learning pipeline that detects cheating behaviour in exam surveillance video. 
            Raw video files are ingested, frames are extracted and cleaned, four distinct neural network 
            architectures are trained and compared, and the best-performing model is exported for 
            real-time YOLO-integrated inference.
          </P>
          <div className="flex flex-wrap gap-3 mt-8">
            {["PyTorch","torchvision","Google Colab","OpenCV","scikit-learn","pandas","seaborn"].map(t=><Badge key={t} color="#2563eb">{t}</Badge>)}
            <Badge color="#16a34a">97.80% Accuracy</Badge>
            <Badge color="#7c3aed">ROC-AUC 0.9999</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <H2>Project at a Glance</H2>
        <Table
          headers={["Property","Value"]}
          rows={[
            ["Task","Binary image classification: cheating vs not_cheating"],
            ["Input","Raw exam video files (.mp4 .avi .mov .mkv .webm .flv)"],
            ["Image resolution","224 × 224 pixels (ResNet/EfficientNet/ViT standard)"],
            ["Classes","cheating (index 0)   ·   not_cheating (index 1)"],
            ["Dataset split","80 % Train  /  10 % Validation  /  10 % Test  ·  random.seed(42)"],
            ["Batch size","32"],
            ["Max epochs","20 with early stopping (patience = 5)"],
            ["Framework","PyTorch + torchvision"],
            ["Platform","Google Colab (GPU runtime — T4 / A100)"],
            ["Storage","Google Drive — all data + weights persisted"],
            ["Best model","Custom CNN — Acc 0.9780, F1 0.9780, ROC-AUC 0.9995, ~200 K params"],
            ["Deployment","cnn_cheating_model.pth → Notebook 05 YOLO real-time pipeline"],
          ]}
        />
      </div>

      <div className="space-y-8">
        <H2>Notebook Map</H2>
        <div className="grid gap-4">
          <Step n={1} title="01 · Frame Extraction" input="exam_videos/{cheating,not_cheating}/" output="dataset_frames/{cheating,not_cheating}/">
            Load raw video files, iterate frame-by-frame, extract every N-th frame, apply Laplacian blur filter, save as JPEG quality 95.
          </Step>
          <Step n={2} title="02 · Data Preprocessing" input="dataset_frames/" output="dataset_final/{train,val,test}/{class}/">
            Remove corrupt files (cv2 read test), deduplicate via MD5 hash, resize all to 224×224, stratified 80/10/10 split, copy to Drive.
          </Step>
          <Step n={3} title="03.1 · Custom CNN ⭐" input="dataset_final/" output="cnn_cheating_model.pth">
            3-block convolutional network trained from scratch. No pretrained weights, [0.5,0.5,0.5] normalisation. Best ROC-AUC at 0.9995 with only ~200 K parameters.
          </Step>
          <Step n={4} title="03.2 · ResNet18" input="dataset_final/" output="resnet18_cheating_model.pth">
            18-layer residual network pretrained on ImageNet1K. Freeze backbone → train custom head → optional differential-LR fine-tune.
          </Step>
          <Step n={5} title="03.3 · EfficientNet-B0" input="dataset_final/" output="efficientnet_cheating.pth">
            Compound-scaled MBConv network with Squeeze-and-Excitation. Freeze features → train new classifier head.
          </Step>
          <Step n={6} title="03.4 · Vision Transformer (ViT-B/16)" input="dataset_final/" output="Vision_Transformer.pth">
            Pure transformer on 16×16 image patches. Highest AUC (0.9999) but 86 M params — too heavy for real-time.
          </Step>
          <Step n={7} title="04 · Model Comparison" input="saved_models/*.pth + dataset_final/test/" output="Decision: Custom CNN selected">
            Load all 5 saved models (Custom CNN, ResNet18, EfficientNet, ViT, MobileNetV2), run full test-set evaluation, generate ROC/PR curves, confusion matrices, confidence histograms, per-class F1 heatmap.
          </Step>
          <Step n={8} title="05 · YOLO Real-time Pipeline (next step)" input="cnn_cheating_model.pth" output="Annotated live video stream">
            Integrates the Custom CNN classifier with a YOLO person-detector for per-frame real-time detection. (Notebook not yet included in this set.)
          </Step>
        </div>
      </div>

      <div className="space-y-6">
        <H2>Google Drive Folder Layout</H2>
        <CodeBlock lang="bash" code={`MyDrive/
├── exam_videos/
│   ├── cheating/           ← raw .mp4 / .avi / .mov video files
│   └── not_cheating/
│
├── dataset_frames/         ← NB01 output: extracted JPEG frames
│   ├── cheating/
│   └── not_cheating/
│
├── dataset_final/          ← NB02 output: cleaned, split, 224×224
│   ├── train/
│   │   ├── cheating/
│   │   └── not_cheating/
│   ├── val/
│   │   ├── cheating/
│   │   └── not_cheating/
│   └── test/
│       ├── cheating/
│       └── not_cheating/
│
└── saved_models/           ← NB03.x output: .pth weight files
    ├── cnn_cheating_model.pth
    ├── resnet18_cheating_model.pth
    ├── efficientnet_cheating.pth
    ├── Vision_Transformer.pth
    └── mobilenetv2_model.pth`} title="Google Drive directory structure"/>
      </div>
    </div>
  );
}

function TabNB01() {
  return (
    <div>
      <H2>Notebook 01 — Frame Extraction</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge>cv2.VideoCapture</Badge><Badge>Laplacian blur filter</Badge><Badge>JPEG quality 95</Badge><Badge color="#22c55e">INPUT: exam_videos/</Badge><Badge color="#f59e0b">OUTPUT: dataset_frames/</Badge>
      </div>
      <P>Converts raw exam surveillance videos into a labelled image dataset. Reads every video file under <Code inline>exam_videos/cheating/</Code> and <Code inline>exam_videos/not_cheating/</Code>, extracts frames at a configurable interval, discards blurry frames using Laplacian variance, and writes clean JPEG frames into matching output class folders.</P>

      <H3>Cell 0 — Imports & Configuration</H3>
      <CodeBlock title="Step 0 — Imports & Drive mount" code={`import os, cv2, shutil
from pathlib import Path
from google.colab import drive

drive.mount('/content/drive')

${CONSTANTS_CODE}

# ── Notebook-specific config (edit these) ──────────────────────
VIDEOS_PATH    = '/content/drive/MyDrive/exam_videos'  # source video root
OUTPUT_PATH    = FRAMES_PATH                            # = dataset_frames
FRAME_SKIP     = 5        # extract every N-th frame (1 = all, 5 = every 5th)
BLUR_THRESHOLD = 80.0     # Laplacian variance; frames below this are discarded
IMG_QUALITY    = 95       # JPEG compression quality (0–100)
IMG_EXT        = '.jpg'

# Supported video extensions
VIDEO_EXTS = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'}`}/>

      <H3>Cell 1 — Validate Folder Structure</H3>
      <P>Checks that the video root exists, discovers class sub-folders dynamically (so adding a new class requires no code change), warns if expected class names are missing, and creates output directories.</P>
      <CodeBlock title="Step 1 — Folder validation" code={`if not os.path.exists(VIDEOS_PATH):
    raise ValueError(f"❌  Video folder not found: {VIDEOS_PATH}")

found_classes = sorted([
    d for d in os.listdir(VIDEOS_PATH)
    if os.path.isdir(os.path.join(VIDEOS_PATH, d))
])
print(f"📂 Classes found: {found_classes}")

# Warn if class names don't match expected
for cls in CLASS_NAMES:
    if cls not in found_classes:
        print(f"⚠  Expected class folder '{cls}' not found.")

# Create output folders
for cls in found_classes:
    os.makedirs(os.path.join(OUTPUT_PATH, cls), exist_ok=True)

print("✅  Output folders ready.")`}/>

      <H3>Cell 2 — Extract Frames (core logic)</H3>
      <P>For each video: opens with <Code inline>cv2.VideoCapture</Code>, reads frame-by-frame, samples every <Code inline>FRAME_SKIP</Code>-th frame, applies the blur filter, and writes passing frames as JPEG. File names encode the source video stem and frame index for traceability.</P>

      <H4>Blur Detection — Laplacian Variance</H4>
      <P>The Laplacian operator is a second-order derivative filter that measures the rate of intensity change. In a blurry image, intensity transitions are smooth → low variance. In a sharp image, edges produce high-magnitude responses → high variance. Any frame whose Laplacian variance falls below <Code inline>BLUR_THRESHOLD=80.0</Code> is discarded.</P>
      <CodeBlock title="Blur filter function" code={`def is_blurry(frame: np.ndarray, threshold: float) -> bool:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var() < threshold`}/>

      <CodeBlock title="Step 2 — Full extraction loop" code={`total_saved   = 0
total_skipped = 0
summary       = {}

for cls in found_classes:
    cls_video_dir = os.path.join(VIDEOS_PATH, cls)
    cls_frame_dir = os.path.join(OUTPUT_PATH, cls)
    cls_saved     = 0
    cls_skipped   = 0

    video_files = [
        f for f in os.listdir(cls_video_dir)
        if Path(f).suffix.lower() in VIDEO_EXTS
    ]
    print(f"\\n📹  [{cls}]  {len(video_files)} video(s) found")

    for video_name in video_files:
        video_path = os.path.join(cls_video_dir, video_name)
        cap        = cv2.VideoCapture(video_path)
        frame_idx  = 0
        saved      = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % FRAME_SKIP == 0:
                if not is_blurry(frame, BLUR_THRESHOLD):
                    out_name = f"{Path(video_name).stem}_f{frame_idx:06d}{IMG_EXT}"
                    out_path = os.path.join(cls_frame_dir, out_name)
                    cv2.imwrite(out_path, frame, [cv2.IMWRITE_JPEG_QUALITY, IMG_QUALITY])
                    saved += 1
                else:
                    cls_skipped += 1

            frame_idx += 1

        cap.release()
        cls_saved += saved
        print(f"   {video_name:<40} → {saved} frames saved")

    total_saved   += cls_saved
    total_skipped += cls_skipped
    summary[cls]   = cls_saved
    print(f"   Subtotal: {cls_saved} frames  ({cls_skipped} blurry skipped)")`}/>

      <H3>Cell 3 — Sanity Check Visualisation</H3>
      <CodeBlock title="Step 3 — Visual sanity check" code={`import random, matplotlib.pyplot as plt

IMG_EXTS = {'.jpg', '.jpeg', '.png'}

fig, axes = plt.subplots(2, 4, figsize=(14, 6))
axes = axes.flatten()
idx  = 0

for cls in found_classes:
    cls_dir = os.path.join(OUTPUT_PATH, cls)
    images  = [f for f in os.listdir(cls_dir) if Path(f).suffix.lower() in IMG_EXTS]
    samples = random.sample(images, min(4, len(images)))
    for s in samples:
        if idx >= 8: break
        img = cv2.imread(os.path.join(cls_dir, s))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        axes[idx].imshow(img)
        axes[idx].set_title(cls, fontsize=9)
        axes[idx].axis('off')
        idx += 1

plt.suptitle('Extracted Frame Samples', fontweight='bold', fontsize=13)
plt.tight_layout()
plt.show()`}/>
    </div>
  );
}

function TabNB02() {
  return (
    <div>
      <H2>Notebook 02 — Data Preprocessing</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge>MD5 deduplication</Badge><Badge>cv2.resize</Badge><Badge>80/10/10 split</Badge><Badge color="#22c55e">INPUT: dataset_frames/</Badge><Badge color="#f59e0b">OUTPUT: dataset_final/</Badge>
      </div>
      <P>Transforms the raw frame collection into a clean, balanced, consistently-sized dataset ready for PyTorch <Code inline>ImageFolder</Code>.</P>

      <H3>Cell 0 — Imports & Constants</H3>
      <CodeBlock title="Step 0 — Imports" code={`import os, cv2, hashlib, shutil, random
from pathlib import Path
from google.colab import drive
import matplotlib.pyplot as plt

drive.mount('/content/drive')

${CONSTANTS_CODE}

IMG_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}
`}/>

      <H3>Cell 3 — Exact Duplicate Removal (MD5 Hash)</H3>
      <CodeBlock title="Step 3 — MD5 deduplication" code={`hashes     = {}
duplicates = 0

for cls in CLASS_NAMES:
    cls_path = os.path.join(FRAMES_PATH, cls)
    for img_name in os.listdir(cls_path):
        img_path = os.path.join(cls_path, img_name)
        try:
            with open(img_path, 'rb') as f:
                h = hashlib.md5(f.read()).hexdigest()
            if h in hashes:
                os.remove(img_path)
                duplicates += 1
            else:
                hashes[h] = img_path
        except Exception:
            continue
`}/>

      <H3>Cell 5 — Train / Val / Test Split (80/10/10)</H3>
      <CodeBlock title="Step 5 — Reproducible 80/10/10 split" code={`FINAL_DIR   = '/content/dataset_final'
TRAIN_RATIO = 0.8
VAL_RATIO   = 0.1

shutil.rmtree(FINAL_DIR, ignore_errors=True)
for split in ['train', 'val', 'test']:
    for cls in CLASS_NAMES:
        os.makedirs(os.path.join(FINAL_DIR, split, cls), exist_ok=True)

random.seed(42)

for cls in CLASS_NAMES:
    cls_path = os.path.join(FRAMES_PATH, cls)
    images   = sorted([f for f in os.listdir(cls_path) if Path(f).suffix.lower() in IMG_EXTS])
    random.shuffle(images)

    n         = len(images)
    train_end = int(n * TRAIN_RATIO)
    val_end   = int(n * (TRAIN_RATIO + VAL_RATIO))

    splits_map = {
        'train': images[:train_end],
        'val':   images[train_end:val_end],
        'test':  images[val_end:],
    }

    for split, imgs in splits_map.items():
        for img in imgs:
            shutil.copy2(os.path.join(cls_path, img), os.path.join(FINAL_DIR, split, cls, img))
`}/>
    </div>
  );
}

function TabNB031() {
  return (
    <div>
      <H2>Notebook 03.1 — Custom CNN ⭐ Best Model</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge color="#22c55e">Acc 0.9780</Badge><Badge color="#22c55e">F1 0.9780</Badge><Badge color="#22c55e">ROC-AUC 0.9995</Badge>
      </div>
      <CodeBlock title="Step 3 — Custom CNN definition" code={`class CustomCNN(nn.Module):
    def __init__(self, num_classes: int = 2):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.pool(self.features(x)))
`}/>
    </div>
  );
}

function TabNB032() { return <div><H2>Notebook 03.2 — ResNet18</H2><P>Refer to documentation for details.</P></div> }
function TabNB033() { return <div><H2>Notebook 03.3 — EfficientNet-B0</H2><P>Refer to documentation for details.</P></div> }
function TabNB034() { return <div><H2>Notebook 03.4 — Vision Transformer</H2><P>Refer to documentation for details.</P></div> }
function TabNB04() { return <div><H2>Notebook 04 — Model Comparison</H2><P>Refer to documentation for details.</P></div> }

function TabModels() {
  const models = [
    { name:"Custom CNN ⭐", color:"#22c55e", acc:0.9780, f1:0.9780, auc:0.9995, params:"~200K",
      facts:["3 conv blocks: 3→32→64→128 channels","AdaptiveAvgPool → 1×1","BatchNorm after every conv","Dropout(0.3)","Normalisation: [0.5,0.5,0.5]"]},
    { name:"ResNet18", color:"#3b82f6", acc:0.9725, f1:0.9725, auc:0.9986, params:"~11M",
      facts:["8 BasicBlocks","Skip connections","ImageNet normalisation"]},
    { name:"EfficientNet-B0", color:"#f59e0b", acc:0.9780, f1:0.9780, auc:0.9989, params:"~5.3M",
      facts:["MBConv blocks","Compound scaling","ImageNet normalisation"]},
    { name:"ViT-B/16", color:"#8b5cf6", acc:0.9780, f1:0.9780, auc:0.9999, params:"~86M",
      facts:["Patch Embedding","12 Transformer encoder layers","~86M parameters"]},
    { name:"MobileNetV2", color:"#64748b", acc:0.9753, f1:0.9753, auc:0.9982, params:"~3.4M",
      facts:["Inverted residuals","Depth-wise separable convolutions"]},
  ];
  return (
    <div className="space-y-8">
      <H2>Model Deep Dive</H2>
      <div className="space-y-6">
        {models.map(m=>(
          <div key={m.name} className="bg-white dark:bg-[#060d1a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 md:p-8 transition-colors shadow-sm dark:shadow-none" style={{ borderLeftColor: m.color, borderLeftWidth: '4px' }}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-syne transition-colors">{m.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 dark:bg-black/20 p-6 rounded-xl border border-slate-100 dark:border-white/5 transition-colors">
              <MetricBar label="Accuracy" value={m.acc} color={m.color}/>
              <MetricBar label="F1-Score" value={m.f1} color={m.color}/>
              <MetricBar label="ROC-AUC"  value={m.auc} color={m.color}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {m.facts.map((f,i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="size-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[13px] text-slate-600 dark:text-slate-400 font-mono transition-colors">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabTraining() {
  return (
    <div className="space-y-8">
      <H2>Training System</H2>
      <H3>Loss Function — CrossEntropyLoss</H3>
      <CodeBlock code={`criterion = nn.CrossEntropyLoss()
loss = criterion(model(images), labels)`}/>
      <H3>Optimiser — Adam with Weight Decay</H3>
      <CodeBlock code={`optimizer = optim.Adam(model.parameters(), lr=5e-4, weight_decay=1e-4)`}/>
      <H3>Data Augmentation</H3>
      <Table headers={["Transform","Parameter","Rationale"]} rows={[
        ["RandomHorizontalFlip","p=0.5","Surveillance symmetry"],
        ["RandomRotation","±10°","Camera tilt"],
        ["ColorJitter","0.2","Lighting variations"],
      ]}/>
    </div>
  );
}

function TabAPI() {
  return (
    <div className="space-y-8">
      <H2>Reference</H2>
      <H3>Project-Wide Constants</H3>
      <CodeBlock title="constants.py" code={CONSTANTS_CODE}/>
      <H3>Execution Order</H3>
      <Table headers={["Step","Notebook","Output"]} rows={[
        ["1","01_frames_extraction.ipynb","dataset_frames/"],
        ["2","02_data_preprocessing.ipynb","dataset_final/"],
        ["3","03_x_Training.ipynb",".pth models"],
        ["4","04_Model_Comparison.ipynb","Final decision"],
      ]}/>
    </div>
  );
}

function TabFAQ() {
  const faqs = [
    { q:"Why does the Custom CNN outperform much larger models?",
      a:"The task is binary and the visual signals are relatively low-complexity patterns that a 3-block CNN can learn effectively." },
    { q:"What is FRAME_SKIP=5?",
      a:"Extracting every 5th frame reduces dataset size ~5x with negligible info loss." },
    { q:"Why use ImageNet normalisation for some models?",
      a:"Pretrained backbones have weights calibrated to ImageNet stats; using different ones degrades performance." },
  ];
  return (
    <div className="space-y-6">
      <H2>FAQ & Common Pitfalls</H2>
      <div className="grid gap-4">
        {faqs.map((f,i)=>(
          <div key={i} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group shadow-sm dark:shadow-none">
            <div className="flex gap-4 items-start mb-2">
              <span className="size-8 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold font-mono text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">Q{i+1}</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-base font-syne transition-colors">{f.q}</div>
            </div>
            <div className="pl-12 text-slate-500 dark:text-slate-500 text-sm leading-relaxed transition-colors">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FullDocumentation() {
  const [tab, setTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleTab = (id: Tab) => {
    setTab(id);
    setIsSidebarOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const TAB_MAP: Record<Tab, React.FC> = {
    overview: TabOverview, nb01: TabNB01, nb02: TabNB02,
    nb031: TabNB031, nb032: TabNB032, nb033: TabNB033, nb034: TabNB034,
    nb04: TabNB04, models: TabModels, training: TabTraining,
    api: TabAPI, faq: TabFAQ,
  };
  
  const CurrentTab = TAB_MAP[tab];

  const getIcon = (id: Tab) => {
    switch(id) {
      case 'overview': return Book;
      case 'nb01': return Database;
      case 'nb02': return Binary;
      case 'nb031': 
      case 'nb032':
      case 'nb033':
      case 'nb034': return Cpu;
      case 'nb04': return Search;
      case 'models': return Layers;
      case 'training': return Activity;
      case 'api': return Terminal;
      case 'faq': return HelpCircle;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#040a14] text-slate-900 dark:text-[#e2e8f0] flex flex-col md:flex-row font-sans selection:bg-blue-500/30 overflow-hidden transition-colors duration-300">
      
      {/* ── Mobile Header ── */}
      <div className="md:hidden sticky top-0 z-50 bg-white/80 dark:bg-[#040a14]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Book className="size-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white transition-colors">Full Documentation</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* ── Sidebar Overlay (Mobile) ── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 dark:bg-[#040a14] border-r border-slate-200 dark:border-white/5 transition-all duration-300 md:relative md:translate-x-0 md:flex md:flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 py-8 border-b border-slate-200 dark:border-white/5 transition-colors">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-500 mb-2 font-mono transition-colors">ML Documentation</div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight font-syne transition-colors">
            Exam Cheating <br/><span className="text-slate-500 text-sm font-medium">Detection System</span>
          </h1>
          <div className="flex gap-2 mt-4">
            <Badge color="#16a34a">97.80%</Badge>
            <Badge color="#2563eb">PyTorch</Badge>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 custom-scrollbar">
          {NAV.map(n => {
            const Icon = getIcon(n.id);
            const isActive = tab === n.id;
            return (
              <button 
                key={n.id} 
                onClick={() => handleTab(n.id)} 
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-blue-600/10 text-blue-600 dark:text-blue-400" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.03]"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-600 dark:bg-blue-500" />
                )}
                <Icon className={cn(
                  "size-4.5 mt-0.5 shrink-0 transition-colors",
                  isActive ? "text-blue-600 dark:text-blue-500" : "text-slate-400 dark:text-slate-600"
                )} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[13px] font-bold transition-colors",
                      isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {n.label}
                    </span>
                    {n.badge && (
                      <span className="text-[8px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-500 px-1.5 py-0.5 rounded-full uppercase transition-colors">
                        {n.badge}
                      </span>
                    )}
                  </div>
                  {n.sub && <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono mt-0.5 transition-colors">{n.sub}</div>}
                </div>
              </button>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/5 mt-auto bg-slate-100 dark:bg-black/20 transition-colors">
          <div className="text-[10px] text-slate-500 dark:text-slate-600 font-mono transition-colors">
            <div className="flex justify-between mb-1"><span>Artifacts:</span><span className="text-slate-900 dark:text-slate-400">7 Notebooks</span></div>
            <div className="flex justify-between"><span>Engine:</span><span className="text-blue-600 dark:text-blue-500 font-bold transition-colors">Custom CNN</span></div>
          </div>
        </div>
      </aside>

      <main ref={mainRef} className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative transition-colors">
        <div className="px-6 py-8 md:px-12 md:py-16">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CurrentTab />
          </div>
          <div className="h-24 md:h-32" />
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#040a14] to-transparent pointer-events-none md:left-72 transition-colors" />
      </main>
    </div>
  );
}