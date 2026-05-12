"use client"
import { useState, useEffect, useRef } from "react";

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
    <code style={{
      background:"#1e293b", border:"1px solid #334155",
      borderRadius:4, padding:"1px 6px", fontSize:12.5,
      fontFamily:"'JetBrains Mono','Fira Code',monospace", color:"#7dd3fc",
    }}>{children}</code>
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
    .replace(comments, '<span style="color:#64748b;font-style:italic">$1</span>')
    .replace(strings,  '<span style="color:#86efac">$1</span>')
    .replace(keywords, '<span style="color:#c084fc;font-weight:600">$1</span>');
  return (
    <div style={{margin:"1rem 0",borderRadius:10,overflow:"hidden",border:"1px solid #1e293b"}}>
      {title&&<div style={{background:"#0d1829",padding:"6px 14px",fontSize:11,color:"#475569",fontFamily:"monospace",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{title}</span>
        <span style={{background:"#1e293b",padding:"1px 8px",borderRadius:3,fontSize:10,color:"#64748b"}}>{lang}</span>
      </div>}
      <div style={{position:"relative"}}>
        <button onClick={copy} style={{position:"absolute",top:8,right:10,zIndex:2,background:copied?"#22c55e22":"#ffffff0a",border:`1px solid ${copied?"#22c55e55":"#ffffff18"}`,color:copied?"#22c55e":"#475569",fontSize:11,padding:"2px 10px",borderRadius:4,cursor:"pointer",fontFamily:"monospace",transition:"all .2s"}}>
          {copied?"✓ copied":"copy"}
        </button>
        <pre style={{background:"#060d1a",padding:"1.2rem 1.4rem",overflowX:"auto",fontSize:12.5,lineHeight:1.75,color:"#e2e8f0",margin:0,fontFamily:"'JetBrains Mono','Fira Code',monospace"}}>
          <code dangerouslySetInnerHTML={{__html:highlight(code)}}/>
        </pre>
      </div>
    </div>
  );
}

function H2({ id, children }: { id?:string; children:React.ReactNode }) {
  return (
    <h2 id={id} style={{fontSize:22,fontWeight:800,color:"#f8fafc",margin:"2.5rem 0 1rem",paddingBottom:"0.5rem",borderBottom:"1px solid #1e293b",fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",gap:10,scrollMarginTop:80}}>
      {children}
    </h2>
  );
}
function H3({ children }: { children:React.ReactNode }) {
  return <h3 style={{fontSize:16,fontWeight:700,color:"#cbd5e1",margin:"1.8rem 0 0.7rem",fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",gap:8}}>{children}</h3>;
}
function H4({ children }: { children:React.ReactNode }) {
  return <h4 style={{fontSize:13,fontWeight:700,color:"#94a3b8",margin:"1.2rem 0 0.4rem",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"monospace"}}>{children}</h4>;
}
function P({ children }: { children:React.ReactNode }) {
  return <p style={{color:"#94a3b8",lineHeight:1.8,fontSize:14,margin:"0 0 0.9rem"}}>{children}</p>;
}

function Table({ headers, rows }: { headers:string[]; rows:(string|React.ReactNode)[][] }) {
  return (
    <div style={{overflowX:"auto",margin:"1rem 0",borderRadius:8,border:"1px solid #1e293b"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:"monospace"}}>
        <thead>
          <tr style={{background:"#0d1829"}}>
            {headers.map((h,i)=><th key={i} style={{padding:"8px 14px",textAlign:"left",color:"#3b82f6",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:"1px solid #1e3a5f",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{borderBottom:"1px solid #0f172a",background:i%2===0?"transparent":"#060d1a"}}>
              {row.map((cell,j)=><td key={j} style={{padding:"7px 14px",color:j===0?"#e2e8f0":"#94a3b8",verticalAlign:"top"}}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ type="info", title, children }: { type?:"info"|"warn"|"danger"|"success"; title?:string; children:React.ReactNode }) {
  const styles = {
    info:    { bg:"#0f2040", border:"#1e3a5f", icon:"ℹ", color:"#60a5fa" },
    warn:    { bg:"#1c1207", border:"#78350f", icon:"⚠", color:"#f59e0b" },
    danger:  { bg:"#1a0808", border:"#7f1d1d", icon:"✖", color:"#f87171" },
    success: { bg:"#071a0f", border:"#14532d", icon:"✓", color:"#4ade80" },
  }[type];
  return (
    <div style={{background:styles.bg,border:`1px solid ${styles.border}`,borderRadius:10,padding:"0.9rem 1.2rem",margin:"1rem 0"}}>
      {title&&<div style={{fontSize:12,fontWeight:700,color:styles.color,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
        <span>{styles.icon}</span>{title}
      </div>}
      <div style={{color:"#94a3b8",fontSize:13,lineHeight:1.7}}>{children}</div>
    </div>
  );
}

function Badge({ children, color="#3b82f6" }: { children:React.ReactNode; color?:string }) {
  return <span style={{display:"inline-block",background:color+"22",border:`1px solid ${color}55`,color,fontSize:11,fontWeight:600,padding:"1px 9px",borderRadius:20,letterSpacing:"0.04em",fontFamily:"monospace"}}>{children}</span>;
}

function Step({ n, title, input, output, children }: { n:number; title:string; input?:string; output?:string; children:React.ReactNode }) {
  return (
    <div style={{display:"flex",gap:16,marginBottom:"1.2rem"}}>
      <div style={{width:32,height:32,minWidth:32,borderRadius:"50%",background:"#1e3a5f",border:"2px solid #3b82f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#60a5fa",marginTop:2,fontFamily:"monospace"}}>{n}</div>
      <div style={{flex:1,background:"#060d1a",border:"1px solid #1e293b",borderRadius:10,padding:"0.9rem 1.2rem"}}>
        <div style={{fontWeight:700,color:"#e2e8f0",fontSize:15,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>{title}</div>
        <div style={{color:"#64748b",fontSize:13,lineHeight:1.7,marginBottom:input||output?8:0}}>{children}</div>
        {(input||output)&&<div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,fontFamily:"monospace",marginTop:4}}>
          {input&&<span><span style={{color:"#475569"}}>INPUT: </span><span style={{color:"#7dd3fc"}}>{input}</span></span>}
          {output&&<span><span style={{color:"#475569"}}>OUTPUT: </span><span style={{color:"#86efac"}}>{output}</span></span>}
        </div>}
      </div>
    </div>
  );
}

function MetricBar({ label, value, color="#3b82f6", max=1 }: { label:string; value:number; color?:string; max?:number }) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:12,color:"#64748b",fontFamily:"monospace"}}>{label}</span>
        <span style={{fontSize:13,color,fontWeight:700,fontFamily:"monospace"}}>{value.toFixed(4)}</span>
      </div>
      <div style={{height:5,background:"#1e293b",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(value/max)*100}%`,background:`linear-gradient(90deg,${color}77,${color})`,borderRadius:3,transition:"width 0.8s ease"}}/>
      </div>
    </div>
  );
}

function CellBlock({ title, children }: { title:string; children:React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{border:"1px solid #1e293b",borderRadius:10,margin:"0.8rem 0",overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"#0a1525",border:"none",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:12,color:"#334155",transition:"transform .2s",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
        <span style={{fontFamily:"monospace",fontSize:12,color:"#64748b"}}>In [·]</span>
        <span style={{fontSize:13,color:"#94a3b8",fontWeight:500}}>{title}</span>
      </button>
      {open&&<div>{children}</div>}
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
    <div>
      <div style={{background:"linear-gradient(135deg,#0c1e3f,#071225)",border:"1px solid #1e3a5f",borderRadius:14,padding:"2rem",marginBottom:"2rem",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:240,height:240,background:"radial-gradient(circle,#3b82f620,transparent 70%)",borderRadius:"50%"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",color:"#3b82f6",textTransform:"uppercase",marginBottom:10,fontFamily:"'Syne',sans-serif"}}>Computer Vision · Binary Classification · PyTorch</div>
          <h1 style={{fontSize:30,fontWeight:900,color:"#f8fafc",margin:"0 0 0.7rem",fontFamily:"'Syne',sans-serif",lineHeight:1.2}}>
            Exam Cheating Detection System<br/>
            <span style={{color:"#3b82f6"}}>Complete Documentation</span>
          </h1>
          <P>End-to-end deep learning pipeline that detects cheating behaviour in exam surveillance video. Raw video files are ingested, frames are extracted and cleaned, four distinct neural network architectures are trained and compared, and the best-performing model is exported for real-time YOLO-integrated inference.</P>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
            {["PyTorch","torchvision","Google Colab","OpenCV","scikit-learn","pandas","seaborn"].map(t=><Badge key={t}>{t}</Badge>)}
            <Badge color="#22c55e">97.80% Accuracy</Badge>
            <Badge color="#a78bfa">ROC-AUC 0.9999</Badge>
          </div>
        </div>
      </div>

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

      <H2>Notebook Map</H2>
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
  );
}

/* ─── NB01 ─────────────────────────────────────────────────── */
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
    """
    Returns True if the frame is too blurry to be useful.
    
    Algorithm:
      1. Convert BGR frame to greyscale
      2. Apply Laplacian (second-order derivative) operator
      3. Compute variance of the result
      4. Low variance  → smooth image → blurry
      5. High variance → sharp edges  → acceptable
    
    threshold=80.0 is a practical default; lower it if important
    frames with smooth backgrounds (e.g. white paper) are being
    discarded incorrectly.
    """
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
                break                            # end of video

            if frame_idx % FRAME_SKIP == 0:      # only every N-th frame
                if not is_blurry(frame, BLUR_THRESHOLD):
                    # name encodes video stem + 6-digit zero-padded frame index
                    out_name = f"{Path(video_name).stem}_f{frame_idx:06d}{IMG_EXT}"
                    out_path = os.path.join(cls_frame_dir, out_name)
                    cv2.imwrite(out_path, frame, [cv2.IMWRITE_JPEG_QUALITY, IMG_QUALITY])
                    saved += 1
                else:
                    cls_skipped += 1             # blurry — discard

            frame_idx += 1

        cap.release()
        cls_saved += saved
        print(f"   {video_name:<40} → {saved} frames saved")

    total_saved   += cls_saved
    total_skipped += cls_skipped
    summary[cls]   = cls_saved
    print(f"   Subtotal: {cls_saved} frames  ({cls_skipped} blurry skipped)")`}/>

      <H3>Cell 3 — Sanity Check Visualisation</H3>
      <P>Samples 4 random frames per class and displays them in a 2×4 matplotlib grid. This is a quick visual check that frames are correctly labelled, sharp, and representative.</P>
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
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)   # BGR → RGB for matplotlib
        axes[idx].imshow(img)
        axes[idx].set_title(cls, fontsize=9)
        axes[idx].axis('off')
        idx += 1

plt.suptitle('Extracted Frame Samples', fontweight='bold', fontsize=13)
plt.tight_layout()
plt.show()
print("✅  Frame extraction complete. Proceed to Notebook 02.")`}/>

      <H3>Key Design Decisions</H3>
      <Table headers={["Decision","Rationale"]} rows={[
        ["FRAME_SKIP = 5","Consecutive video frames are nearly identical — skipping 4/5 frames reduces dataset size ~5× with negligible information loss. Set to 1 for slower-action video."],
        ["BLUR_THRESHOLD = 80.0","Empirically calibrated. Too high → discard useful frames with smooth backgrounds. Too low → blurry frames pollute training."],
        ["IMG_QUALITY = 95","High-quality JPEG preserves detail without the full size of PNG. Sufficient for 224×224 training."],
        ["Frame name format","video_stem + _f{idx:06d}.jpg ensures uniqueness, traceability, and lexicographic sort order."],
        ["cv2.VideoCapture","OpenCV is the standard; handles all common formats. Make sure the Colab runtime has OpenCV installed."],
      ]}/>
    </div>
  );
}

/* ─── NB02 ─────────────────────────────────────────────────── */
function TabNB02() {
  return (
    <div>
      <H2>Notebook 02 — Data Preprocessing</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge>MD5 deduplication</Badge><Badge>cv2.resize</Badge><Badge>80/10/10 split</Badge><Badge color="#22c55e">INPUT: dataset_frames/</Badge><Badge color="#f59e0b">OUTPUT: dataset_final/</Badge>
      </div>
      <P>Transforms the raw frame collection into a clean, balanced, consistently-sized dataset ready for PyTorch <Code inline>ImageFolder</Code>. Runs six sequential steps: overview statistics → corruption removal → exact deduplication → uniform resizing → reproducible split → Drive export with balance visualisation.</P>

      <H3>Cell 0 — Imports & Constants</H3>
      <CodeBlock title="Step 0 — Imports, Drive mount, constants" code={`import os, cv2, hashlib, shutil, random
from pathlib import Path
from google.colab import drive
import matplotlib.pyplot as plt

drive.mount('/content/drive')

${CONSTANTS_CODE}

IMG_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}

# Auto-detect classes from disk (handles any number of classes)
CLASS_NAMES_FOUND = sorted([
    d for d in os.listdir(FRAMES_PATH)
    if os.path.isdir(os.path.join(FRAMES_PATH, d))
])
print(f"📂 Classes found: {CLASS_NAMES_FOUND}")`}/>

      <H3>Cell 1 — Dataset Overview</H3>
      <P>Prints a per-class image count before any cleaning. Establishes the baseline for tracking how many images each subsequent step removes.</P>
      <CodeBlock title="Step 1 — Dataset overview" code={`print("\\n📊 Dataset Overview:\\n")
total = 0
for cls in CLASS_NAMES_FOUND:
    cls_path = os.path.join(FRAMES_PATH, cls)
    images   = [f for f in os.listdir(cls_path) if Path(f).suffix.lower() in IMG_EXTS]
    print(f"  📁 {cls:<18} → {len(images):>5} images")
    total += len(images)
print(f"\\n  {'TOTAL':<18} → {total:>5} images")`}/>

      <H3>Cell 2 — Remove Corrupted Images</H3>
      <P>Attempts to read each file with <Code inline>cv2.imread()</Code>. OpenCV returns <Code inline>None</Code> for unreadable files (truncated JPEG, wrong extension, zero-byte file). Any <Code inline>None</Code> result or raised exception triggers immediate deletion. Corrupted images would cause <Code inline>DataLoader</Code> crashes during training.</P>
      <CodeBlock title="Step 2 — Corruption removal" code={`removed = 0
for cls in CLASS_NAMES_FOUND:
    cls_path = os.path.join(FRAMES_PATH, cls)
    for img_name in os.listdir(cls_path):
        img_path = os.path.join(cls_path, img_name)
        try:
            img = cv2.imread(img_path)
            if img is None:           # unreadable by OpenCV
                os.remove(img_path)
                removed += 1
        except Exception:
            os.remove(img_path)       # any exception → delete
            removed += 1
print(f"🧹  Removed corrupted images: {removed}")`}/>

      <H3>Cell 3 — Exact Duplicate Removal (MD5 Hash)</H3>
      <P>Reads each file as raw bytes, computes its MD5 hash, and stores hash→path in a dictionary. If a hash already exists, the file is a pixel-perfect duplicate and is deleted. This catches frames extracted from overlapping video segments. Note: cross-class deduplication is intentionally avoided (the same frame could legitimately appear in both classes in adversarial datasets).</P>
      <Callout type="info" title="Why MD5 and not perceptual hash?">
        MD5 detects exact byte-level duplicates — identical JPEG files. Perceptual hashing (pHash) would detect near-duplicates but is slower and may incorrectly remove frames with subtle but meaningful differences (e.g. a person's head slightly moved). For this pipeline, exact deduplication is sufficient.
      </Callout>
      <CodeBlock title="Step 3 — MD5 deduplication" code={`hashes     = {}   # hash_hex → first_file_path
duplicates = 0

for cls in CLASS_NAMES_FOUND:
    cls_path = os.path.join(FRAMES_PATH, cls)
    for img_name in os.listdir(cls_path):
        img_path = os.path.join(cls_path, img_name)
        try:
            with open(img_path, 'rb') as f:
                h = hashlib.md5(f.read()).hexdigest()
            if h in hashes:
                os.remove(img_path)   # exact duplicate → discard
                duplicates += 1
            else:
                hashes[h] = img_path  # first occurrence → keep
        except Exception:
            continue

print(f"🗑️   Removed duplicate images: {duplicates}")`}/>

      <H3>Cell 4 — Resize to 224×224</H3>
      <P>All images are resized in-place to exactly 224×224 pixels using <Code inline>cv2.resize()</Code> with default bilinear interpolation. This is required because all four model architectures expect this input size. Resizing before splitting saves disk space and speeds up training DataLoader workers.</P>
      <Callout type="warn" title="In-place modification">
        This step overwrites the original files in <Code inline>dataset_frames/</Code>. If you need to preserve originals, copy the folder first before running this notebook.
      </Callout>
      <CodeBlock title="Step 4 — Resize in-place to 224×224" code={`resized = 0
for cls in CLASS_NAMES_FOUND:
    cls_path = os.path.join(FRAMES_PATH, cls)
    for img_name in os.listdir(cls_path):
        if Path(img_name).suffix.lower() not in IMG_EXTS:
            continue
        img_path = os.path.join(cls_path, img_name)
        try:
            img = cv2.imread(img_path)
            if img is None:
                continue
            img = cv2.resize(img, IMG_SIZE)          # (224, 224)
            cv2.imwrite(img_path, img)               # overwrite original
            resized += 1
        except Exception:
            continue

print(f"🖼️   Resized {resized} images to {IMG_SIZE[0]}×{IMG_SIZE[1]}")`}/>

      <H3>Cell 5 — Train / Val / Test Split (80/10/10)</H3>
      <P>Per class, the image list is sorted (deterministic order before shuffle), then shuffled with <Code inline>random.seed(42)</Code> for reproducibility. Slice boundaries are computed as integer proportions. Files are copied (not moved) to <Code inline>/content/dataset_final/split/class/</Code> using <Code inline>shutil.copy2</Code> which preserves metadata.</P>
      <CodeBlock title="Step 5 — Reproducible 80/10/10 split" code={`FINAL_DIR   = '/content/dataset_final'
TRAIN_RATIO = 0.8
VAL_RATIO   = 0.1
# TEST_RATIO = 0.1  (implicit: remainder)

shutil.rmtree(FINAL_DIR, ignore_errors=True)
for split in ['train', 'val', 'test']:
    for cls in CLASS_NAMES_FOUND:
        os.makedirs(os.path.join(FINAL_DIR, split, cls), exist_ok=True)

random.seed(42)   # ← reproducible: same split every run

for cls in CLASS_NAMES_FOUND:
    cls_path = os.path.join(FRAMES_PATH, cls)
    images   = sorted([                              # deterministic base order
        f for f in os.listdir(cls_path)
        if Path(f).suffix.lower() in IMG_EXTS
    ])
    random.shuffle(images)                           # then shuffle

    n         = len(images)
    train_end = int(n * TRAIN_RATIO)                 # 0 → train_end
    val_end   = int(n * (TRAIN_RATIO + VAL_RATIO))   # train_end → val_end
    # test    = val_end → n

    splits_map = {
        'train': images[:train_end],
        'val':   images[train_end:val_end],
        'test':  images[val_end:],
    }

    for split, imgs in splits_map.items():
        for img in imgs:
            src = os.path.join(cls_path, img)
            dst = os.path.join(FINAL_DIR, split, cls, img)
            shutil.copy2(src, dst)          # copy2 preserves file metadata

    print(f"\\n  📂 {cls}")
    print(f"     Train : {len(splits_map['train'])}")
    print(f"     Val   : {len(splits_map['val'])}")
    print(f"     Test  : {len(splits_map['test'])}")`}/>

      <H3>Cell 6 — Class Balance Plot & Drive Export</H3>
      <CodeBlock title="Step 6 — Visualise splits & save to Drive" code={`splits = ['train', 'val', 'test']
fig, axes = plt.subplots(1, 3, figsize=(13, 4))

for ax, split in zip(axes, splits):
    counts = [len(os.listdir(os.path.join(FINAL_DIR, split, cls)))
              for cls in CLASS_NAMES_FOUND]
    bars = ax.bar(CLASS_NAMES_FOUND, counts, color=['#E74C3C', '#2ECC71'])
    for bar, c in zip(bars, counts):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                str(c), ha='center', fontweight='bold')
    ax.set_title(split.capitalize())
    ax.set_ylabel('Images')
    ax.set_ylim(0, max(counts) * 1.2)

plt.suptitle('Class Distribution per Split', fontweight='bold')
plt.tight_layout()
plt.show()

# Copy local /content/dataset_final → Google Drive (persistent)
DRIVE_SAVE = DATASET_PATH
shutil.rmtree(DRIVE_SAVE, ignore_errors=True)
shutil.copytree(FINAL_DIR, DRIVE_SAVE)
print(f"💾  Dataset saved to Drive: {DRIVE_SAVE}")`}/>
    </div>
  );
}

/* ─── NB03.1 Custom CNN ─────────────────────────────────────── */
function TabNB031() {
  return (
    <div>
      <H2>Notebook 03.1 — Custom CNN ⭐ Best Model</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge color="#22c55e">Acc 0.9780</Badge><Badge color="#22c55e">F1 0.9780</Badge><Badge color="#22c55e">ROC-AUC 0.9995</Badge><Badge color="#22c55e">~200K params</Badge><Badge color="#22c55e">SELECTED FOR DEPLOYMENT</Badge>
      </div>

      <Callout type="success" title="Why this model was chosen">
        Despite having only ~200 K parameters (430× lighter than ViT-B/16, 55× lighter than ResNet18), the Custom CNN achieves the highest ROC-AUC (0.9995) and ties for top accuracy (0.9780). For real-time YOLO-integrated inference where each frame must be classified in milliseconds, it is the only viable option.
      </Callout>

      <H3>Cell 0 — Imports & Constants</H3>
      <CodeBlock title="Step 0 — Imports" code={`import os, copy
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from PIL import Image
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import confusion_matrix, classification_report
from tqdm import tqdm
from google.colab import drive, files

drive.mount('/content/drive')
# [shared project constants block here — see Reference tab]`}/>

      <H3>Cell 1 — Data Loaders</H3>
      <P>Because the Custom CNN is trained from scratch, ImageNet statistics are inappropriate. The normalisation uses <Code inline>[0.5,0.5,0.5]</Code> mean and std which maps pixel values from [0,1] to [-1,1] — a simple symmetric range that works well for from-scratch training.</P>
      <CodeBlock title="Step 1 — Transforms & DataLoaders" code={`MEAN = [0.5, 0.5, 0.5]
STD  = [0.5, 0.5, 0.5]

# Training: add augmentation to improve generalisation
train_tf = transforms.Compose([
    transforms.Resize(IMG_SIZE),                                # 224×224
    transforms.RandomHorizontalFlip(),                          # p=0.5
    transforms.RandomRotation(10),                              # ±10°
    transforms.ColorJitter(brightness=0.2, contrast=0.2,
                           saturation=0.1),                     # colour jitter
    transforms.ToTensor(),                                      # [0,255] → [0,1]
    transforms.Normalize(mean=MEAN, std=STD),                   # → [-1,1]
])

# Evaluation: no augmentation — only normalise
eval_tf = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])

train_data = datasets.ImageFolder(f"{DATASET_PATH}/train", transform=train_tf)
val_data   = datasets.ImageFolder(f"{DATASET_PATH}/val",   transform=eval_tf)
test_data  = datasets.ImageFolder(f"{DATASET_PATH}/test",  transform=eval_tf)

# num_workers=2 + pin_memory=True → faster GPU data transfer
train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True,
                          num_workers=2, pin_memory=True)
val_loader   = DataLoader(val_data,   batch_size=BATCH_SIZE, shuffle=False,
                          num_workers=2, pin_memory=True)
test_loader  = DataLoader(test_data,  batch_size=BATCH_SIZE, shuffle=False,
                          num_workers=2, pin_memory=True)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device : {device}")
print(f"Train  : {len(train_data)}  Val: {len(val_data)}  Test: {len(test_data)}")
print(f"Classes: {train_data.classes}")   # ['cheating', 'not_cheating']

# Utility: undo normalisation for visualisation
def unnorm(t, mean, std):
    t = t.clone()
    for c, m, s in zip(range(3), mean, std):
        t[c] = t[c] * s + m
    return t.clamp(0, 1)`}/>

      <H3>Cell 2 — Class Distribution & Sample Grid</H3>
      <CodeBlock title="Step 2 — Visualise class distribution + sample images" code={`# Class distribution bar chart
counts = [len(os.listdir(f"{DATASET_PATH}/train/{c}")) for c in CLASS_NAMES]
plt.figure(figsize=(6, 4))
bars = plt.bar(CLASS_NAMES, counts, color=["#E74C3C", "#2ECC71"])
for bar, c in zip(bars, counts):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 3,
             str(c), ha="center", fontweight="bold")
plt.title("Class Distribution — Training Set")
plt.ylabel("Images")
plt.tight_layout()
plt.show()

# 8-image sample grid (2 rows × 4 cols) from first training batch
imgs, lbls = next(iter(train_loader))
plt.figure(figsize=(12, 5))
for i in range(8):
    plt.subplot(2, 4, i+1)
    plt.imshow(unnorm(imgs[i], MEAN, STD).permute(1, 2, 0))
    plt.title(CLASS_NAMES[lbls[i]], fontsize=9)
    plt.axis("off")
plt.suptitle("Training Samples", fontweight="bold")
plt.tight_layout()
plt.show()`}/>

      <H3>Cell 3 — Model Architecture</H3>
      <CodeBlock title="Step 3 — Custom CNN definition" code={`class CustomCNN(nn.Module):
    """
    3-block convolutional network for binary cheating classification.
    
    Architecture summary:
      Input:  [B, 3, 224, 224]
      Block 1: Conv(3→32)  + BN + ReLU + MaxPool  → [B, 32,  112, 112]
      Block 2: Conv(32→64) + BN + ReLU + MaxPool  → [B, 64,   56,  56]
      Block 3: Conv(64→128)+ BN + ReLU + MaxPool  → [B, 128,  28,  28]
      Pool:   AdaptiveAvgPool(1×1)                 → [B, 128,   1,   1]
      Flatten                                      → [B, 128]
      FC:     128→64 + BN + ReLU + Dropout(0.3)   → [B, 64]
      Output: 64→2 (logits)                        → [B, 2]
    
    Total parameters: ~200,000  (lightest model in the comparison)
    ROC-AUC:          0.9995    (best in the comparison)
    """
    def __init__(self, num_classes: int = 2):
        super().__init__()
        self.features = nn.Sequential(
            # ── Block 1 ──────────────────────────────────────────
            nn.Conv2d(3, 32, kernel_size=3, padding=1),   # same-padding
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                           # 224→112

            # ── Block 2 ──────────────────────────────────────────
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                           # 112→56

            # ── Block 3 ──────────────────────────────────────────
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),                           # 56→28
        )
        self.pool = nn.AdaptiveAvgPool2d((1, 1))          # 28→1  (any input size)

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),                              # regularisation
            nn.Linear(64, num_classes),                   # raw logits
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.pool(self.features(x)))

MODEL_NAME = "Custom CNN"
MODEL_SAVE = BEST_MODEL_FILE   # 'cnn_cheating_model.pth'

model = CustomCNN().to(device)
total = sum(p.numel() for p in model.parameters())
print(f"✅ Custom CNN | Params: {total:,}")
print(model)`}/>

      <H3>Cell 4 — Loss, Optimiser & Scheduler</H3>
      <CodeBlock title="Step 4 — Training setup" code={`criterion = nn.CrossEntropyLoss()
# Adam with L2 weight decay (1e-4) for regularisation
optimizer = optim.Adam(model.parameters(), lr=5e-4, weight_decay=1e-4)
# ReduceLROnPlateau: halve LR when val_acc plateaus for 2 epochs
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", factor=0.5, patience=2
)`}/>

      <H3>Cell 5 — Training Loop</H3>
      <CodeBlock title="Step 5 — Full training loop with early stopping" code={`train_losses, val_losses, train_accs, val_accs = [], [], [], []
best_val_acc   = 0.0
best_wts       = copy.deepcopy(model.state_dict())
patience_count = 0

for epoch in range(NUM_EPOCHS):
    # ── Train phase ────────────────────────────────────────────
    model.train()
    rl = rc = rt = 0
    for imgs, lbls in tqdm(train_loader,
                           desc=f"Epoch {epoch+1}/{NUM_EPOCHS} [Train]",
                           leave=False):
        imgs, lbls = imgs.to(device), lbls.to(device)
        optimizer.zero_grad()
        out  = model(imgs)
        loss = criterion(out, lbls)
        loss.backward()
        optimizer.step()
        rl += loss.item()
        _, p = torch.max(out, 1)
        rc  += (p == lbls).sum().item()
        rt  += lbls.size(0)
    tl, ta = rl / len(train_loader), rc / rt

    # ── Validation phase ────────────────────────────────────────
    model.eval()
    vl = vc = vt = 0
    with torch.no_grad():
        for imgs, lbls in val_loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            out  = model(imgs)
            loss = criterion(out, lbls)
            vl  += loss.item()
            _, p = torch.max(out, 1)
            vc  += (p == lbls).sum().item()
            vt  += lbls.size(0)
    vla, va = vl / len(val_loader), vc / vt

    train_losses.append(tl); val_losses.append(vla)
    train_accs.append(ta);   val_accs.append(va)
    scheduler.step(va)       # ← ReduceLROnPlateau watches val accuracy

    # ── Early stopping ──────────────────────────────────────────
    if va > best_val_acc:
        best_val_acc   = va
        best_wts       = copy.deepcopy(model.state_dict())
        patience_count = 0
        status         = "✅ best"
    else:
        patience_count += 1
        status          = f"⚠ ({patience_count}/{PATIENCE})"

    print(f"Epoch {epoch+1:>2}/{NUM_EPOCHS} | "
          f"Train loss {tl:.4f} acc {ta:.4f} | "
          f"Val loss {vla:.4f} acc {va:.4f} | {status}")

    if patience_count >= PATIENCE:
        print("🛑 Early stopping.")
        break

model.load_state_dict(best_wts)   # restore best weights
print(f"\\n🏆 Best val acc: {best_val_acc:.4f}")`}/>

      <H3>Cell 6 — Loss / Accuracy Curves</H3>
      <CodeBlock title="Step 6 — Training curves" code={`epochs_r = range(1, len(train_losses) + 1)
fig, ax  = plt.subplots(1, 2, figsize=(13, 5))

ax[0].plot(epochs_r, train_losses, "o-", label="Train")
ax[0].plot(epochs_r, val_losses,   "s-", label="Val")
ax[0].set_title(f"{MODEL_NAME} — Loss")
ax[0].set_xlabel("Epoch"); ax[0].legend(); ax[0].grid(alpha=0.3)

ax[1].plot(epochs_r, train_accs, "o-", label="Train")
ax[1].plot(epochs_r, val_accs,   "s-", label="Val")
ax[1].set_title(f"{MODEL_NAME} — Accuracy")
ax[1].set_xlabel("Epoch"); ax[1].set_ylim(0, 1)
ax[1].legend(); ax[1].grid(alpha=0.3)

plt.tight_layout(); plt.show()
gap = abs(train_accs[-1] - val_accs[-1])
print(f"Train Acc: {train_accs[-1]:.4f} | Val Acc: {val_accs[-1]:.4f} | Gap: {gap:.4f}")`}/>

      <H3>Cell 7 — Test Set Evaluation</H3>
      <CodeBlock title="Step 7 — Full evaluation on held-out test set" code={`def run_eval(model, loader):
    """Returns (predictions, true_labels, softmax_probs)."""
    model.eval()
    ap, al, ab = [], [], []
    with torch.no_grad():
        for imgs, lbls in loader:
            out  = model(imgs.to(device))
            prob = F.softmax(out, dim=1)
            _, p = torch.max(out, 1)
            ap.extend(p.cpu().numpy())
            al.extend(lbls.numpy())
            ab.extend(prob.cpu().numpy())
    return np.array(ap), np.array(al), np.array(ab)

tp, tl, tb = run_eval(model, test_loader)
print("="*55)
print(f"  Test Accuracy: {(tp==tl).mean():.4f}")
print("="*55)
print(classification_report(tl, tp, target_names=CLASS_NAMES))

# Confusion matrix heatmap
cm = confusion_matrix(tl, tp)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES)
plt.title(f"{MODEL_NAME} — Confusion Matrix")
plt.xlabel("Predicted"); plt.ylabel("True")
plt.tight_layout(); plt.show()

# Confidence distribution histogram
confs = tb.max(axis=1)
plt.figure(figsize=(7, 4))
plt.hist(confs, bins=20, edgecolor="white")
plt.axvline(confs.mean(), color="red", linestyle="--",
            label=f"Mean={confs.mean():.3f}")
plt.title("Confidence Distribution — Test Set")
plt.xlabel("Confidence"); plt.legend()
plt.tight_layout(); plt.show()`}/>

      <H3>Cell 8 — Wrong Prediction Inspector</H3>
      <CodeBlock title="Step 8 — Visualise misclassified examples" code={`wi, wp, wt = [], [], []
model.eval()
with torch.no_grad():
    for imgs, lbls in test_loader:
        out = model(imgs.to(device))
        _, preds = torch.max(out, 1)
        for i in range(len(lbls)):
            if preds[i].cpu() != lbls[i]:
                wi.append(imgs[i])
                wp.append(preds[i].cpu().item())
                wt.append(lbls[i].item())

print(f"Wrong predictions: {len(wi)}/{len(test_data)}")
if wi:
    n = min(12, len(wi))
    plt.figure(figsize=(13, 8))
    for i in range(n):
        plt.subplot(3, 4, i+1)
        plt.imshow(unnorm(wi[i], MEAN, STD).permute(1, 2, 0).clamp(0, 1))
        plt.axis("off")
        plt.title(f"T:{CLASS_NAMES[wt[i]]}\\nP:{CLASS_NAMES[wp[i]]}",
                  color="red", fontsize=8)
    plt.suptitle(f"{MODEL_NAME} — Wrong Predictions", fontweight="bold")
    plt.tight_layout(); plt.show()`}/>

      <H3>Cell 9 — Per-Split Accuracy Summary</H3>
      <CodeBlock title="Step 9 — Train/Val/Test accuracy bar chart" code={`def split_acc(loader):
    model.eval(); c = t = 0
    with torch.no_grad():
        for imgs, lbls in loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            _, p = torch.max(model(imgs), 1)
            c += (p == lbls).sum().item()
            t += lbls.size(0)
    return c / t

tr_a = split_acc(train_loader)
vl_a = split_acc(val_loader)
te_a = split_acc(test_loader)

plt.figure(figsize=(6, 4))
bars = plt.bar(["Train","Val","Test"], [tr_a,vl_a,te_a],
               color=["#3498DB","#2ECC71","#E74C3C"])
for bar, v in zip(bars, [tr_a,vl_a,te_a]):
    plt.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.005,
             f"{v:.4f}", ha="center", fontweight="bold")
plt.ylim(0, 1.05)
plt.title(f"{MODEL_NAME} — Final Accuracy")
plt.tight_layout(); plt.show()`}/>

      <H3>Cell 10 — Predict External Image</H3>
      <CodeBlock title="Step 10 — Upload & classify any image" code={`ext_tf = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD)
])

def predict_external():
    uploaded = files.upload()                    # Colab file picker
    for fn in uploaded:
        img = Image.open(fn).convert("RGB")
        t   = ext_tf(img).unsqueeze(0).to(device)
        model.eval()
        with torch.no_grad():
            probs = F.softmax(model(t), dim=1).cpu().numpy()[0]
        pred = probs.argmax()
        fig, ax = plt.subplots(1, 2, figsize=(10, 4))
        ax[0].imshow(img); ax[0].axis("off"); ax[0].set_title("Input")
        b = ax[1].bar(CLASS_NAMES, probs, color=["#E74C3C","#2ECC71"])
        ax[1].set_ylim(0, 1)
        for bar, p in zip(b, probs):
            ax[1].text(bar.get_x()+bar.get_width()/2, p+0.02,
                       f"{p:.2f}", ha="center", fontweight="bold")
        ax[1].set_title(f"Prediction: {CLASS_NAMES[pred]} ({probs[pred]:.2%})")
        plt.tight_layout(); plt.show()

predict_external()`}/>

      <H3>Cell 11 — Save Model</H3>
      <CodeBlock title="Step 11 — Save .pth to local + Drive" code={`torch.save(model.state_dict(), MODEL_SAVE)
print(f"💾 Saved → {MODEL_SAVE}")
files.download(MODEL_SAVE)              # download to local machine

# Also persist to Drive for Notebook 04/05
import shutil
drive_models = "/content/drive/MyDrive/saved_models"
os.makedirs(drive_models, exist_ok=True)
shutil.copy(MODEL_SAVE, os.path.join(drive_models, MODEL_SAVE))
print(f"💾 Also saved to Drive: {drive_models}/{MODEL_SAVE}")`}/>
    </div>
  );
}

/* ─── NB03.2 ResNet18 ───────────────────────────────────────── */
function TabNB032() {
  return (
    <div>
      <H2>Notebook 03.2 — ResNet18</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge color="#3b82f6">Acc 0.9725</Badge><Badge color="#3b82f6">F1 0.9725</Badge><Badge color="#3b82f6">ROC-AUC 0.9986</Badge><Badge color="#3b82f6">~11M params</Badge><Badge>Transfer learning</Badge>
      </div>
      <P>Fine-tunes a ResNet18 pretrained on ImageNet1K. Phase 1 freezes the entire backbone and trains only the replacement classification head. Phase 2 (optional) unfreezes all layers with differential learning rates — much lower for the backbone to avoid destroying pretrained features.</P>

      <H3>Background — Residual Networks</H3>
      <P>Introduced by He et al. (2016) "Deep Residual Learning for Image Recognition". The key innovation is the skip (shortcut) connection that adds the input of a block directly to its output: <Code inline>out = F(x) + x</Code>. This identity path provides a gradient highway that solves the vanishing gradient problem in very deep networks. ResNet18 uses 8 BasicBlocks (2 conv layers each) in 4 stages, giving 17 conv layers + 1 FC = 18 layers.</P>

      <H3>Normalisation Note</H3>
      <Callout type="warn" title="Must use ImageNet statistics">
        The pretrained backbone has weights calibrated to ImageNet normalisation. Using [0.5,0.5,0.5] would mismatch the expected input distribution and degrade transfer learning effectiveness. Always use <Code inline>mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]</Code> for ImageNet-pretrained models.
      </Callout>

      <H3>Model Setup</H3>
      <CodeBlock title="ResNet18 — model construction" code={`from torchvision.models import resnet18, ResNet18_Weights

MODEL_NAME = "ResNet18"
MODEL_SAVE = MODEL_FILES["resnet18"]   # 'resnet18_cheating_model.pth'

model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)

# Phase 1: Freeze ALL backbone parameters
for p in model.parameters():
    p.requires_grad = False

# Replace final FC layer (originally 512→1000 ImageNet classes)
# Custom head: 512→128→2 with dropout for regularisation
model.fc = nn.Sequential(
    nn.Linear(model.fc.in_features, 128),   # in_features = 512
    nn.ReLU(inplace=True),
    nn.Dropout(0.5),
    nn.Linear(128, 2)
)
# Note: model.fc parameters default to requires_grad=True

model = model.to(device)
total     = sum(p.numel() for p in model.parameters())
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"✅ ResNet18 | Total: {total:,} | Trainable (head only): {trainable:,}")`}/>

      <H3>Phase 1 Training</H3>
      <P>Same training loop as Custom CNN (see 03.1). Optimiser uses <Code inline>lr=5e-4</Code>; since backbone is frozen, only the head weights update.</P>

      <H3>Phase 2 — Optional Full Fine-tuning</H3>
      <P>After Phase 1 converges, unfreeze all parameters and continue training with differential learning rates. The head learns at 1e-3 (aggressive updates still needed) while the backbone learns at 1e-5 (very conservative — just nudge, don't destroy ImageNet features).</P>
      <CodeBlock title="Phase 2 — Differential-LR fine-tuning" code={`print("\\n🔓 Unfreezing backbone for fine-tuning...")
for p in model.parameters():
    p.requires_grad = True          # unfreeze everything

optimizer = optim.Adam([
    # Head: high LR — still needs to adapt
    {"params": model.fc.parameters(),
     "lr": 1e-3},
    # Backbone: very low LR — just fine-tune, don't destroy ImageNet features
    {"params": [p for n, p in model.named_parameters() if "fc" not in n],
     "lr": 1e-5},
], weight_decay=1e-4)

scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", factor=0.5, patience=2
)
# Re-run the training loop cell for additional fine-tuning epochs`}/>
    </div>
  );
}

/* ─── NB03.3 EfficientNet ───────────────────────────────────── */
function TabNB033() {
  return (
    <div>
      <H2>Notebook 03.3 — EfficientNet-B0</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge color="#f59e0b">Acc 0.9780</Badge><Badge color="#f59e0b">F1 0.9780</Badge><Badge color="#f59e0b">ROC-AUC 0.9989</Badge><Badge color="#f59e0b">~5.3M params</Badge><Badge>Compound scaling</Badge>
      </div>
      <P>Fine-tunes EfficientNet-B0, the baseline in Google Brain's compound-scaling model family. Freezes the feature extractor and replaces the classifier with a custom head. Ties Custom CNN in accuracy while using ImageNet pretraining for richer features.</P>

      <H3>Background — EfficientNet Compound Scaling</H3>
      <P>Tan & Le (2019) "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks" showed that uniformly scaling network depth, width, and resolution using a single compound coefficient φ achieves better accuracy-efficiency trade-offs than scaling any one dimension alone. EfficientNet-B0 is the baseline (φ=0). B1–B7 scale proportionally. The building block is Mobile Inverted Bottleneck Convolution (MBConv) with a Squeeze-and-Excitation module.</P>
      <P>The SE module applies global average pooling to get a channel descriptor, passes it through two FC layers with sigmoid gating, and multiplies the result with the feature map — selectively emphasising informative channels and suppressing noise.</P>

      <H3>Model Setup</H3>
      <CodeBlock title="EfficientNet-B0 — model construction" code={`from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

MODEL_NAME = "EfficientNet-B0"
MODEL_SAVE = MODEL_FILES["efficientnet"]   # 'efficientnet_cheating.pth'

model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)

# Freeze the feature extractor (MBConv blocks)
for p in model.features.parameters():
    p.requires_grad = False

# Replace classifier (original: Dropout + Linear(1280→1000))
# model.classifier[1].in_features = 1280
model.classifier = nn.Sequential(
    nn.Linear(model.classifier[1].in_features, 256),   # 1280→256
    nn.ReLU(inplace=True),
    nn.Dropout(0.4),
    nn.Linear(256, 2)
)

model = model.to(device)
total     = sum(p.numel() for p in model.parameters())
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"✅ EfficientNet-B0 | Total: {total:,} | Trainable: {trainable:,}")

# Phase 1 optimiser — only classifier
optimizer = optim.Adam(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", factor=0.5, patience=2
)`}/>

      <H3>Phase 2 — Optional Fine-tuning</H3>
      <CodeBlock title="Phase 2 — Unfreeze features with differential LR" code={`# Unfreeze all
for p in model.parameters():
    p.requires_grad = True

optimizer = optim.Adam([
    {"params": model.classifier.parameters(), "lr": 1e-3},
    {"params": model.features.parameters(),   "lr": 1e-5},
], weight_decay=1e-4)

scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", factor=0.5, patience=2
)`}/>
    </div>
  );
}

/* ─── NB03.4 ViT ────────────────────────────────────────────── */
function TabNB034() {
  return (
    <div>
      <H2>Notebook 03.4 — Vision Transformer (ViT-B/16)</H2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:"1.2rem"}}>
        <Badge color="#8b5cf6">Acc 0.9780</Badge><Badge color="#8b5cf6">F1 0.9780</Badge><Badge color="#a78bfa">ROC-AUC 0.9999 ← highest</Badge><Badge color="#8b5cf6">~86M params</Badge><Badge color="#f87171">Too heavy for real-time</Badge>
      </div>
      <P>Fine-tunes ViT-B/16 pretrained on ImageNet1K. Achieves the highest AUC (0.9999) of any model tested, but at 86M parameters it is 430× heavier than the Custom CNN — unsuitable for real-time deployment.</P>

      <H3>Background — Vision Transformer</H3>
      <P>Dosovitskiy et al. (2020) "An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale" applied the NLP Transformer architecture directly to sequences of image patches with minimal modification. This bypasses the inductive biases of convolutions (translation equivariance, locality) and allows the model to learn global relationships from the very first layer — explaining the high AUC in capturing subtle, context-dependent cheating cues (e.g. hand position relative to answer sheet across the whole frame).</P>

      <H3>Architecture Walkthrough</H3>
      <Table headers={["Stage","Detail"]} rows={[
        ["Patch Embedding","224×224 image → 196 patches of 16×16 pixels. Each patch flattened to 768-dim vector via linear projection."],
        ["[CLS] Token","Learnable vector prepended to the 196 patch tokens → 197-token sequence. Final [CLS] representation used for classification."],
        ["Positional Embedding","Learnable 1D positional embeddings (197×768) added to patch tokens so the model knows spatial order."],
        ["Encoder (×12)","Each of 12 identical transformer encoder layers: LayerNorm → Multi-Head Self-Attention → Residual add → LayerNorm → MLP → Residual add."],
        ["MHSA","12 attention heads × 64 dim/head = 768. Each head computes Q,K,V from patch tokens; attention scores are softmax(QKᵀ/√d). All heads concatenated, projected."],
        ["MLP Block","Two-layer MLP: Linear(768→3072) + GELU + Dropout + Linear(3072→768)."],
        ["Classification Head","[CLS] token output (768-dim) → custom head: Linear(768→256) + ReLU + Dropout(0.4) + Linear(256→2)."],
      ]}/>

      <H3>Model Setup</H3>
      <CodeBlock title="ViT-B/16 — model construction" code={`from torchvision.models import vit_b_16, ViT_B_16_Weights

MODEL_NAME = "ViT-B/16"
MODEL_SAVE = MODEL_FILES["vit"]    # 'Vision_Transformer.pth'

model = vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)

# Phase 1: Freeze entire encoder
for p in model.parameters():
    p.requires_grad = False

# Replace classification head
head_in = model.heads.head.in_features   # = 768
model.heads = nn.Sequential(
    nn.Linear(head_in, 256),
    nn.ReLU(inplace=True),
    nn.Dropout(0.4),
    nn.Linear(256, 2)
)

model = model.to(device)
total     = sum(p.numel() for p in model.parameters())
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"✅ ViT-B/16 | Total: {total:,} | Trainable: {trainable:,}")

# Phase 1 optimiser — only the head
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.heads.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", factor=0.5, patience=2
)`}/>

      <H3>Phase 2 — Partial Unfreeze (last 4 encoder blocks)</H3>
      <P>Only the final 4 of 12 transformer encoder blocks are unfrozen. These blocks encode the highest-level semantic features. Unfreezing all 12 blocks risks catastrophic forgetting and is computationally expensive.</P>
      <CodeBlock title="Phase 2 — Unfreeze last 4 encoder blocks" code={`# Unfreeze only transformer blocks 8–11 (last 4 of 12)
for i, block in enumerate(model.encoder.layers):
    if i >= len(model.encoder.layers) - 4:  # indices 8,9,10,11
        for p in block.parameters():
            p.requires_grad = True

optimizer = optim.Adam([
    # Head: standard LR
    {"params": model.heads.parameters(), "lr": 1e-3},
    # Last 4 blocks: extremely conservative LR
    {"params": [p for p in model.encoder.parameters() if p.requires_grad],
     "lr": 5e-6},
], weight_decay=1e-4)

scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="max", factor=0.5, patience=2
)`}/>
    </div>
  );
}

/* ─── NB04 ──────────────────────────────────────────────────── */
function TabNB04() {
  return (
    <div>
      <H2>Notebook 04 — Model Comparison</H2>
      <P>Loads all five saved <Code inline>.pth</Code> files from Google Drive, rebuilds architectures without pretrained weights, runs full inference on the held-out test set using the correct normalisation for each model, and produces a comprehensive comparative report.</P>

      <H3>Models Compared</H3>
      <Table headers={["Model","File","Params","Norm","Result"]} rows={[
        ["Custom CNN ⭐",  "cnn_cheating_model.pth",      "~200K",  "custom [0.5]",    "SELECTED"],
        ["ResNet18",       "resnet18_cheating_model.pth", "~11M",   "ImageNet",        "—"],
        ["EfficientNet-B0","efficientnet_cheating.pth",   "~5.3M",  "ImageNet",        "—"],
        ["ViT-B/16",       "Vision_Transformer.pth",      "~86M",   "ImageNet",        "—"],
        ["MobileNetV2",    "mobilenetv2_model.pth",       "~3.4M",  "ImageNet",        "—"],
      ]}/>

      <H3>Cell 0 — Setup: All 5 Architecture Builders</H3>
      <CodeBlock title="Step 0 — All model builders + dual test loaders" code={`import torch, torch.nn as nn, torch.nn.functional as F
import numpy as np, os, matplotlib.pyplot as plt, seaborn as sns, pandas as pd
from torchvision import datasets, transforms, models
from torchvision.models import (
    resnet18, ResNet18_Weights,
    efficientnet_b0, EfficientNet_B0_Weights,
    vit_b_16, ViT_B_16_Weights,
    mobilenet_v2, MobileNet_V2_Weights
)
from torch.utils.data import DataLoader
from sklearn.metrics import (confusion_matrix, classification_report,
    roc_curve, auc, precision_recall_curve,
    f1_score, precision_score, recall_score)

# ── Architecture builders (weights=None — we'll load .pth) ───────────
class CustomCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3,32,3,padding=1), nn.BatchNorm2d(32),  nn.ReLU(inplace=True), nn.MaxPool2d(2,2),
            nn.Conv2d(32,64,3,padding=1),nn.BatchNorm2d(64),  nn.ReLU(inplace=True), nn.MaxPool2d(2,2),
            nn.Conv2d(64,128,3,padding=1),nn.BatchNorm2d(128),nn.ReLU(inplace=True), nn.MaxPool2d(2,2),
        )
        self.pool = nn.AdaptiveAvgPool2d((1,1))
        self.classifier = nn.Sequential(
            nn.Flatten(), nn.Linear(128,64), nn.BatchNorm1d(64),
            nn.ReLU(inplace=True), nn.Dropout(0.3), nn.Linear(64,2)
        )
    def forward(self, x): return self.classifier(self.pool(self.features(x)))

def build_cnn():
    return CustomCNN()

def build_resnet():
    m = resnet18(weights=None)
    m.fc = nn.Sequential(nn.Linear(m.fc.in_features,128), nn.ReLU(inplace=True),
                         nn.Dropout(0.5), nn.Linear(128,2))
    return m

def build_effnet():
    m = efficientnet_b0(weights=None)
    m.classifier = nn.Sequential(
        nn.Linear(m.classifier[1].in_features, 256),
        nn.ReLU(inplace=True), nn.Dropout(0.4), nn.Linear(256,2)
    )
    return m

def build_vit():
    m = vit_b_16(weights=None)
    m.heads = nn.Sequential(
        nn.Linear(m.heads.head.in_features, 256),
        nn.ReLU(inplace=True), nn.Dropout(0.4), nn.Linear(256,2)
    )
    return m

def build_mobile():
    m = mobilenet_v2(weights=None)
    m.classifier = nn.Sequential(
        nn.Dropout(0.3), nn.Linear(m.classifier[1].in_features, 128),
        nn.ReLU(inplace=True), nn.Dropout(0.3), nn.Linear(128,2)
    )
    return m

# ── Two test loaders — different normalisation per model family ───────
imagenet_tf = transforms.Compose([
    transforms.Resize(IMG_SIZE), transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406], [0.229,0.224,0.225])
])
custom_tf = transforms.Compose([
    transforms.Resize(IMG_SIZE), transforms.ToTensor(),
    transforms.Normalize([0.5,0.5,0.5], [0.5,0.5,0.5])
])

test_imagenet = DataLoader(datasets.ImageFolder(f"{DATASET_PATH}/test",
    transform=imagenet_tf), batch_size=32, shuffle=False, num_workers=2)
test_custom   = DataLoader(datasets.ImageFolder(f"{DATASET_PATH}/test",
    transform=custom_tf),   batch_size=32, shuffle=False, num_workers=2)

# ── Config table ──────────────────────────────────────────────────────
MODEL_CONFIGS = [
    {"name":"Custom CNN",      "file":MODEL_FILES["cnn"],          "build":build_cnn,
     "loader":test_custom,   "params":"~200K", "norm":"custom"},
    {"name":"ResNet18",        "file":MODEL_FILES["resnet18"],     "build":build_resnet,
     "loader":test_imagenet, "params":"~11M",  "norm":"imagenet"},
    {"name":"EfficientNet-B0", "file":MODEL_FILES["efficientnet"], "build":build_effnet,
     "loader":test_imagenet, "params":"~5.3M", "norm":"imagenet"},
    {"name":"ViT-B/16",        "file":MODEL_FILES["vit"],          "build":build_vit,
     "loader":test_imagenet, "params":"~86M",  "norm":"imagenet"},
    {"name":"MobileNetV2",     "file":MODEL_FILES["mobilenet"],    "build":build_mobile,
     "loader":test_imagenet, "params":"~3.4M", "norm":"imagenet"},
]`}/>

      <H3>Cell 1 — Load Weights & Run Inference</H3>
      <CodeBlock title="Step 1 — Load all .pth files and infer on test set" code={`DRIVE_MODELS = '/content/drive/MyDrive/saved_models'

# Load
loaded = {}
for cfg in MODEL_CONFIGS:
    path = os.path.join(DRIVE_MODELS, cfg["file"])
    if not os.path.exists(path):
        print(f"⚠  Not found: {path}"); continue
    m = cfg["build"]().to(device)
    m.load_state_dict(torch.load(path, map_location=device))
    m.eval()
    loaded[cfg["name"]] = m
    print(f"✅  {cfg['name']}")

# Infer
results = {}
for cfg in MODEL_CONFIGS:
    name = cfg["name"]
    if name not in loaded: continue
    ap, al, ab = [], [], []
    with torch.no_grad():
        for imgs, lbls in cfg["loader"]:
            out  = loaded[name](imgs.to(device))
            prob = F.softmax(out, dim=1)
            _, p = torch.max(out, 1)
            ap.extend(p.cpu().numpy())
            al.extend(lbls.numpy())
            ab.extend(prob.cpu().numpy())
    results[name] = {
        "preds":  np.array(ap),
        "labels": np.array(al),
        "probs":  np.array(ab)
    }
    acc = (results[name]["preds"] == results[name]["labels"]).mean()
    print(f"{name:<22} Test acc: {acc:.4f}")`}/>

      <H3>Cell 2 — Summary Table</H3>
      <CodeBlock title="Step 2 — Build comparison DataFrame" code={`pm = {cfg["name"]: cfg["params"] for cfg in MODEL_CONFIGS}
rows = []
for name, r in results.items():
    fpr, tpr, _ = roc_curve(r["labels"], r["probs"][:,0], pos_label=0)
    rows.append({
        "Model":     name,
        "Accuracy":  f"{(r['preds']==r['labels']).mean():.4f}",
        "Precision": f"{precision_score(r['labels'],r['preds'],average='macro',zero_division=0):.4f}",
        "Recall":    f"{recall_score(r['labels'],r['preds'],average='macro',zero_division=0):.4f}",
        "F1-Score":  f"{f1_score(r['labels'],r['preds'],average='macro',zero_division=0):.4f}",
        "ROC-AUC":   f"{auc(fpr,tpr):.4f}",
        "Params":    pm.get(name, "—"),
    })

df = pd.DataFrame(rows).sort_values("F1-Score", ascending=False).reset_index(drop=True)
df.index += 1
print(df.to_string())`}/>

      <H3>Cell 3–6 — Visualisations Generated</H3>
      <Table headers={["Visualisation","Purpose"]} rows={[
        ["Confusion matrices (5×)","Per-model TP/FP/FN/TN breakdown. Seaborn heatmap, Blues colourmap."],
        ["ROC curves (all models overlay)","FPR vs TPR with AUC in legend. Colour-coded by model. Random-chance diagonal."],
        ["Precision-Recall curves","Precision vs Recall — more informative than ROC for imbalanced classes."],
        ["Test accuracy bar chart","Side-by-side comparison, value labels on each bar."],
        ["Confidence distributions (5×)","Histogram of max softmax prob per model. Mean marked with red dashed line."],
        ["Per-class F1 heatmap","Models (rows) × classes (columns). YlGn colourmap."],
      ]}/>

      <H3>Final Verdict Output</H3>
      <CodeBlock title="Step 7 — Final verdict printout" code={`print("\\n" + "="*60)
print("  FINAL VERDICT")
print("="*60)
print(f"  Rank 1 (Best overall): {df.iloc[0]['Model']}")
print(f"    Accuracy : {df.iloc[0]['Accuracy']}")
print(f"    F1-Score : {df.iloc[0]['F1-Score']}")
print(f"    ROC-AUC  : {df.iloc[0]['ROC-AUC']}")
print(f"    Params   : {df.iloc[0]['Params']}")
print()
print(f"  ✅ Custom CNN chosen for Notebook 05 (YOLO pipeline)")
print(f"     — Lightest model, highest ROC-AUC (0.9995), ~200K params")
print(f"     — Ideal for real-time inference with minimal latency")
print("="*60)`}/>
    </div>
  );
}

/* ─── Models Deep Dive ──────────────────────────────────────── */
function TabModels() {
  const models = [
    { name:"Custom CNN ⭐", color:"#22c55e", acc:0.9780, f1:0.9780, auc:0.9995, params:"~200K",
      facts:["3 conv blocks: 3→32→64→128 channels","3×3 kernels with same-padding throughout","MaxPool2d halves spatial dims after each block: 224→112→56→28","AdaptiveAvgPool → 1×1: resolution-agnostic","BatchNorm after every conv and FC layer","Dropout(0.3) before output","Normalisation: [0.5,0.5,0.5] (trained from scratch)","No pretrained weights","~200K total parameters"]},
    { name:"ResNet18", color:"#3b82f6", acc:0.9725, f1:0.9725, auc:0.9986, params:"~11M",
      facts:["8 BasicBlocks (2 conv each) across 4 stages","Skip connections: out = F(x) + x","Stages: 64ch(×2), 128ch(×2), 256ch(×2), 512ch(×2)","Final GlobalAvgPool → 512-dim feature vector","Custom head: 512→128→2 with Dropout(0.5)","Two-phase: freeze backbone → differential-LR fine-tune","ImageNet normalisation required","~11M total parameters"]},
    { name:"EfficientNet-B0", color:"#f59e0b", acc:0.9780, f1:0.9780, auc:0.9989, params:"~5.3M",
      facts:["MBConv blocks with depth-wise separable convolutions","Squeeze-and-Excitation (SE) channel attention modules","Compound scaling: depth × width × resolution","1280-dim pooled feature vector before classifier","Custom head: 1280→256→2 with Dropout(0.4)","Optimizer: Adam on classifier only (Phase 1, lr=1e-3)","Phase 2: features lr=1e-5, classifier lr=1e-3","ImageNet normalisation required","~5.3M total parameters"]},
    { name:"ViT-B/16", color:"#8b5cf6", acc:0.9780, f1:0.9780, auc:0.9999, params:"~86M",
      facts:["224×224 → 196 patches of 16×16 pixels","Linear projection: 768-dim patch embeddings","[CLS] token prepended → 197-token sequence","Learnable 1D positional embeddings (197×768)","12 Transformer encoder layers","12 attention heads, 64 dim/head","MLP expansion: 768→3072→768 with GELU","Custom head: 768→256→2 with Dropout(0.4)","Phase 2: unfreeze last 4 encoder blocks (lr=5e-6)","~86M total parameters — heaviest model"]},
    { name:"MobileNetV2", color:"#64748b", acc:0.9753, f1:0.9753, auc:0.9982, params:"~3.4M",
      facts:["Inverted residual blocks with linear bottlenecks","Depth-wise separable convolutions throughout","ReLU6 activations (bounded, mobile-friendly)","1280-dim final feature map before pooling","Custom head: Dropout(0.3)→128→ReLU→Dropout(0.3)→2","ImageNet normalisation required","~3.4M parameters — 2nd lightest after Custom CNN"]},
  ];
  return (
    <div>
      <H2>Model Deep Dive</H2>
      <P>Full specification table for all five models trained and compared in this project.</P>
      <H3>Results Comparison</H3>
      <Table
        headers={["Model","Accuracy","F1","ROC-AUC","Params","Norm","Deploy"]}
        rows={[
          ["Custom CNN ⭐","0.9780","0.9780","0.9995","~200K","custom","✅ selected"],
          ["EfficientNet-B0","0.9780","0.9780","0.9989","~5.3M","imagenet","—"],
          ["ViT-B/16","0.9780","0.9780","0.9999 ★","~86M","imagenet","⚠ too heavy"],
          ["MobileNetV2","0.9753","0.9753","0.9982","~3.4M","imagenet","—"],
          ["ResNet18","0.9725","0.9725","0.9986","~11M","imagenet","—"],
        ]}
      />
      {models.map(m=>(
        <div key={m.name} style={{background:"#060d1a",border:`1px solid ${m.color}33`,borderRadius:12,padding:"1.4rem",marginBottom:"1.2rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1rem",flexWrap:"wrap"}}>
            <h3 style={{fontSize:18,fontWeight:700,color:"#f1f5f9",margin:0,fontFamily:"'Syne',sans-serif"}}>{m.name}</h3>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Badge color={m.color}>Acc {m.acc}</Badge>
              <Badge color={m.color}>F1 {m.f1}</Badge>
              <Badge color={m.color}>AUC {m.auc}</Badge>
              <Badge color={m.color}>{m.params}</Badge>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem 2rem",marginBottom:"1rem"}}>
            <MetricBar label="Accuracy" value={m.acc} color={m.color}/>
            <MetricBar label="F1-Score" value={m.f1} color={m.color}/>
            <MetricBar label="ROC-AUC"  value={m.auc} color={m.color}/>
          </div>
          <ul style={{paddingLeft:"1.2rem",margin:0,columns:2,columnGap:"2rem"}}>
            {m.facts.map((f,i)=><li key={i} style={{color:"#64748b",fontSize:12.5,lineHeight:1.9,fontFamily:"monospace"}}>{f}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── Training System ───────────────────────────────────────── */
function TabTraining() {
  return (
    <div>
      <H2>Training System</H2>

      <H3>Loss Function — CrossEntropyLoss</H3>
      <P>All models use <Code inline>nn.CrossEntropyLoss()</Code> which internally applies LogSoftmax then NLLLoss. For K classes and N samples it computes the negative log-likelihood of the true class. It does not require a separate softmax output from the model — the model returns raw logits.</P>
      <CodeBlock code={`# CrossEntropyLoss = LogSoftmax + NLLLoss
# Expects: output shape [N, C] (logits), target shape [N] (class indices)
criterion = nn.CrossEntropyLoss()
loss = criterion(model(images), labels)   # labels: LongTensor of class indices`}/>

      <H3>Optimiser — Adam with Weight Decay</H3>
      <P>Adam (Adaptive Moment Estimation) maintains per-parameter exponential moving averages of both gradients (m₁) and squared gradients (m₂), corrects bias in early steps, and divides the gradient by √m₂ + ε to adaptively scale each parameter's learning rate. Weight decay adds an L2 penalty to discourage large weights.</P>
      <CodeBlock code={`# Custom CNN / ResNet18
optimizer = optim.Adam(model.parameters(), lr=5e-4, weight_decay=1e-4)

# EfficientNet Phase 1 (only classifier)
optimizer = optim.Adam(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)

# ViT Phase 1 (only heads)
optimizer = optim.Adam(model.heads.parameters(), lr=1e-3, weight_decay=1e-4)

# Differential LR (Phase 2 — pretrained models)
optimizer = optim.Adam([
    {"params": head_params,     "lr": 1e-3},   # high LR for new head
    {"params": backbone_params, "lr": 1e-5},   # very low LR for backbone
], weight_decay=1e-4)`}/>

      <H3>LR Scheduler — ReduceLROnPlateau</H3>
      <P>Monitors a metric (here: validation accuracy, <Code inline>mode="max"</Code>). After <Code inline>patience=2</Code> epochs without improvement, multiplies the current LR by <Code inline>factor=0.5</Code>. This allows the model to take large steps early in training and fine-tune as it approaches convergence.</P>
      <CodeBlock code={`scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode     = "max",   # metric is accuracy (higher = better)
    factor   = 0.5,     # new_lr = current_lr * 0.5
    patience = 2        # wait 2 epochs before reducing
)

# Called once per epoch, after validation:
scheduler.step(val_accuracy)`}/>

      <H3>Early Stopping</H3>
      <P>Prevents overfitting by stopping training when the model stops improving on the validation set. Best weights are saved in CPU RAM via <Code inline>copy.deepcopy</Code> and restored at the end, so the saved model corresponds to the best validation epoch — not the final epoch.</P>
      <CodeBlock code={`best_val_acc   = 0.0
best_wts       = copy.deepcopy(model.state_dict())
patience_count = 0

# Inside epoch loop:
if val_accuracy > best_val_acc:
    best_val_acc   = val_accuracy
    best_wts       = copy.deepcopy(model.state_dict())  # snapshot best weights
    patience_count = 0
else:
    patience_count += 1
    if patience_count >= PATIENCE:   # PATIENCE = 5
        print("🛑 Early stopping.")
        break

# After loop ends (early stop or max epochs reached):
model.load_state_dict(best_wts)   # ← restore best, not last`}/>

      <H3>Data Augmentation</H3>
      <P>Applied only to the training set. The val and test loaders use a simpler eval transform (resize + normalise only). Each augmentation is chosen to simulate realistic variation in exam surveillance footage.</P>
      <Table headers={["Transform","Parameter","Rationale"]} rows={[
        ["RandomHorizontalFlip","p=0.5","Cameras may be mirrored; cheating is symmetric."],
        ["RandomRotation","±10°","Slight camera tilt or video encoding rotation."],
        ["ColorJitter brightness","±20%","Variable room lighting."],
        ["ColorJitter contrast","±20%","Camera auto-exposure variations."],
        ["ColorJitter saturation","±10%","Minor saturation shift from different camera models."],
        ["Resize","224×224","Model input size — all architectures require this."],
        ["ToTensor","—","Converts PIL Image [0,255] → FloatTensor [0,1]."],
        ["Normalize (custom)","[0.5]/[0.5]","Centres pixel range at 0, scales to [-1,1]. Used for from-scratch Custom CNN."],
        ["Normalize (imagenet)","[0.485,0.456,0.406]/[0.229,0.224,0.225]","ImageNet channel statistics. Required for pretrained ResNet/EfficientNet/ViT."],
      ]}/>

      <H3>Evaluation Function</H3>
      <CodeBlock code={`def run_eval(model, loader):
    """
    Returns:
        preds  (N,)   — argmax class predictions
        labels (N,)   — true class indices
        probs  (N, C) — softmax probability vectors
    """
    model.eval()
    all_preds, all_labels, all_probs = [], [], []

    with torch.no_grad():
        for imgs, lbls in loader:
            out  = model(imgs.to(device))
            prob = F.softmax(out, dim=1)           # convert logits to probs
            _, p = torch.max(out, 1)               # argmax class
            all_preds.extend(p.cpu().numpy())
            all_labels.extend(lbls.numpy())
            all_probs.extend(prob.cpu().numpy())

    return np.array(all_preds), np.array(all_labels), np.array(all_probs)

# Usage:
preds, labels, probs = run_eval(model, test_loader)

# Metrics:
from sklearn.metrics import roc_curve, auc, classification_report
fpr, tpr, _ = roc_curve(labels, probs[:, 0], pos_label=0)
print(f"ROC-AUC: {auc(fpr, tpr):.4f}")
print(classification_report(labels, preds, target_names=CLASS_NAMES))`}/>

      <H3>Model Saving & Loading</H3>
      <CodeBlock code={`# ── Save (training notebooks) ────────────────────────────────
torch.save(model.state_dict(), 'cnn_cheating_model.pth')

# ── Load (comparison notebook / inference) ────────────────────
model = CustomCNN()                                # build architecture first
model.load_state_dict(
    torch.load('cnn_cheating_model.pth', map_location=device)
)
model.eval()                                       # always set eval mode

# ── Single-image inference ────────────────────────────────────
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])  # Custom CNN
])
img   = Image.open("frame.jpg").convert("RGB")
t     = transform(img).unsqueeze(0).to(device)    # [1, 3, 224, 224]
with torch.no_grad():
    probs = F.softmax(model(t), dim=1).cpu().numpy()[0]
pred  = probs.argmax()
print(f"Prediction: {CLASS_NAMES[pred]} ({probs[pred]:.2%})")`}/>
    </div>
  );
}

/* ─── Reference ─────────────────────────────────────────────── */
function TabAPI() {
  return (
    <div>
      <H2>Reference</H2>

      <H3>Project-Wide Constants</H3>
      <P>Defined in every notebook. Must be identical across all files — they are the single source of truth.</P>
      <CodeBlock title="constants.py (equivalent)" code={CONSTANTS_CODE}/>

      <H3>All Constants Explained</H3>
      <Table headers={["Constant","Type","Value","Purpose"]} rows={[
        ["DATASET_PATH","str","/content/drive/MyDrive/dataset_final","Root of the cleaned, split dataset. Used by all training notebooks."],
        ["FRAMES_PATH","str","/content/drive/MyDrive/dataset_frames","Root of raw extracted frames. Used by NB01 and NB02."],
        ["CLASS_NAMES","list[str]","['cheating','not_cheating']","Class labels in alphabetical order — matches torchvision ImageFolder auto-detection."],
        ["IMG_SIZE","tuple","(224, 224)","Input resolution for all models. Standard for ResNet/EfficientNet/ViT."],
        ["BATCH_SIZE","int","32","Mini-batch size for DataLoaders. Fits comfortably in Colab T4 GPU memory."],
        ["NUM_EPOCHS","int","20","Maximum training epochs. Early stopping typically triggers before this."],
        ["PATIENCE","int","5","Early stopping patience — epochs without val accuracy improvement before halting."],
        ["BEST_MODEL_NAME","str","'Custom CNN'","Human-readable name of the selected deployment model."],
        ["BEST_MODEL_FILE","str","'cnn_cheating_model.pth'","Filename of the selected deployment model weights."],
        ["BEST_MODEL_KEY","str","'cnn'","Dict key for MODEL_FILES lookup."],
        ["CLF_MEAN","list","[0.5, 0.5, 0.5]","Normalisation mean for Custom CNN inference in YOLO pipeline."],
        ["CLF_STD","list","[0.5, 0.5, 0.5]","Normalisation std for Custom CNN inference in YOLO pipeline."],
        ["MODEL_FILES","dict","5 keys → .pth filenames","Maps model key to saved weight filename. Used by NB04 loader."],
      ]}/>

      <H3>Normalisation Reference</H3>
      <Callout type="danger" title="Critical: wrong normalisation = wrong predictions">
        Each model was trained with a specific normalisation scheme. Using the wrong stats at inference time will produce incorrect predictions without any error message.
      </Callout>
      <Table headers={["Model","Mean","Std","Why"]} rows={[
        ["Custom CNN","[0.5, 0.5, 0.5]","[0.5, 0.5, 0.5]","Trained from scratch — symmetric [-1,1] range, no ImageNet dependency."],
        ["ResNet18","[0.485, 0.456, 0.406]","[0.229, 0.224, 0.225]","Pretrained on ImageNet — must match training distribution."],
        ["EfficientNet-B0","[0.485, 0.456, 0.406]","[0.229, 0.224, 0.225]","Pretrained on ImageNet."],
        ["ViT-B/16","[0.485, 0.456, 0.406]","[0.229, 0.224, 0.225]","Pretrained on ImageNet."],
        ["MobileNetV2","[0.485, 0.456, 0.406]","[0.229, 0.224, 0.225]","Pretrained on ImageNet."],
      ]}/>

      <H3>File Outputs Reference</H3>
      <Table headers={["File","Produced by","Used by","Contents"]} rows={[
        ["cnn_cheating_model.pth","NB 03.1","NB 04, NB 05","Custom CNN state_dict — all layer weights and biases."],
        ["resnet18_cheating_model.pth","NB 03.2","NB 04","ResNet18 fine-tuned state_dict."],
        ["efficientnet_cheating.pth","NB 03.3","NB 04","EfficientNet-B0 fine-tuned state_dict."],
        ["Vision_Transformer.pth","NB 03.4","NB 04","ViT-B/16 fine-tuned state_dict."],
        ["mobilenetv2_model.pth","NB 03.x*","NB 04","MobileNetV2 fine-tuned state_dict."],
        ["dataset_frames/","NB 01","NB 02","Raw JPEG frames, organised by class."],
        ["dataset_final/","NB 02","NB 03.x, NB 04","Cleaned, resized, split dataset in ImageFolder structure."],
      ]}/>

      <H3>Python Dependencies</H3>
      <CodeBlock lang="bash" title="pip install (Colab already has most of these)" code={`# All pre-installed in Google Colab:
torch>=2.0
torchvision>=0.15
opencv-python-headless   # cv2
Pillow                   # PIL
scikit-learn             # sklearn.metrics
matplotlib
seaborn
pandas
numpy
tqdm

# Already present in Colab environment:
# google-colab (drive, files)
# hashlib, shutil, random, os, copy, pathlib — standard library`}/>

      <H3>Execution Order</H3>
      <Table headers={["Step","Notebook","Prerequisite","Output"]} rows={[
        ["1","01_frames_extraction.ipynb","exam_videos/ folder on Drive","dataset_frames/"],
        ["2","02_data_preprocessing.ipynb","dataset_frames/","dataset_final/"],
        ["3a","03_1__customCNN.ipynb","dataset_final/","cnn_cheating_model.pth"],
        ["3b","03_2__ResNet18.ipynb","dataset_final/","resnet18_cheating_model.pth"],
        ["3c","03_3__EfficientNet_B0.ipynb","dataset_final/","efficientnet_cheating.pth"],
        ["3d","03_4__Vision_Transformer__ViT_.ipynb","dataset_final/","Vision_Transformer.pth"],
        ["3e","(MobileNetV2 — not shown)*","dataset_final/","mobilenetv2_model.pth"],
        ["4","04__Model_Comparison.ipynb","All .pth files + dataset_final/","Model decision"],
        ["5","05__YOLO_Pipeline.ipynb*","cnn_cheating_model.pth","Real-time inference"],
      ]}/>
    </div>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────── */
function TabFAQ() {
  const faqs = [
    { q:"Why does the Custom CNN outperform much larger models?",
      a:"The task is binary and the visual signals (hands on phone, glancing sideways, writing in wrong area) are relatively low-complexity patterns that a 3-block CNN can learn effectively. Larger models (ViT, ResNet) bring in ImageNet feature priors that may not be relevant and risk overfitting on this specific domain. The CNN is perfectly sized for the task." },
    { q:"Why use [0.5,0.5,0.5] normalisation for the Custom CNN?",
      a:"The model is trained from scratch so ImageNet statistics are irrelevant. [0.5,0.5,0.5] maps pixel values from [0,1] to [-1,1], giving a symmetric zero-centred range that is numerically convenient for gradient flow and compatible with any image regardless of content. It is the standard choice for from-scratch training." },
    { q:"What is FRAME_SKIP=5 and when should I change it?",
      a:"Consecutive video frames are nearly identical (video is 24-30 fps, motion is slow). Extracting every 5th frame gives approximately 5-6 fps equivalent — sufficient for capturing all cheating poses. Set it lower (2-3) for very fast-paced video or if your dataset is small. Set it higher (10+) to aggressively reduce dataset size." },
    { q:"Why does NB02 resize images in-place (overwriting dataset_frames)?",
      a:"Disk space on Google Colab and Drive is limited. Storing two copies (original + resized) doubles usage. Since the split in Step 5 copies files to dataset_final/, the originals in dataset_frames/ are only needed for dataset assembly. If you want to keep originals, copy dataset_frames/ to a backup before running NB02." },
    { q:"Why is random.seed(42) set in the split but not in training?",
      a:"The split must be identical every time NB02 is re-run to ensure train/val/test sets never change (reproducibility guarantee). Training randomness (weight initialisation, data shuffling) is intentionally not seeded so different runs can be compared and averaged." },
    { q:"Why is ViT-B/16 excluded from deployment despite the highest AUC (0.9999)?",
      a:"At 86M parameters and with the quadratic attention complexity of transformers, ViT is unsuitable for real-time per-frame inference in the YOLO pipeline. The AUC difference (0.9999 vs 0.9995) is negligible in practice. Custom CNN processes frames orders of magnitude faster with comparable accuracy." },
    { q:"What does ROC-AUC measure and why is it more important than accuracy here?",
      a:"ROC-AUC measures the probability that the model ranks a positive (cheating) sample higher than a negative one, across all decision thresholds. It is threshold-independent and unaffected by class imbalance. For a security system, you can tune the threshold post-training to control the false-positive rate — ROC-AUC tells you how much headroom you have." },
    { q:"The NB04 evaluation uses two different test DataLoaders — why?",
      a:"The Custom CNN was trained with [0.5] normalisation; all other models were trained with ImageNet normalisation. Using the wrong stats would corrupt predictions without any error. NB04 maintains test_custom (for CNN) and test_imagenet (for all pretrained models) and routes each model to its correct loader via MODEL_CONFIGS." },
    { q:"Why use copy.deepcopy for best weights instead of torch.save?",
      a:"torch.save writes to disk, which is slow and requires a file path. copy.deepcopy creates an in-memory snapshot of the state_dict — essentially free in terms of latency. Since the final model is saved to disk anyway at the end of training, in-memory snapshots during training are the right trade-off." },
    { q:"How should I extend this to more than 2 classes?",
      a:"Change CLASS_NAMES and the num_classes argument in model constructors (the final Linear layer output dimension). The rest of the pipeline (DataLoader, training loop, evaluation) is already multi-class compatible — CrossEntropyLoss, classification_report, and confusion_matrix all support K>2 classes." },
    { q:"Why does BLUR_THRESHOLD filter on Laplacian variance, not other metrics?",
      a:"Laplacian variance is a fast, single-pass, parameter-free blur metric. Alternatives like gradient magnitude, FFT high-frequency content, or BRISQUE require more computation and tuning. For frame-level filtering at scale, Laplacian variance offers the best speed/reliability trade-off." },
    { q:"MobileNetV2 appears in NB04 but there is no NB03.x for it — why?",
      a:"MobileNetV2 was trained in an unlisted notebook or as part of a later addition. Its .pth file (mobilenetv2_model.pth) is referenced in MODEL_FILES and MODEL_CONFIGS, and its builder (build_mobile) is defined in NB04. The training notebook follows the same pattern as 03.2–03.4." },
  ];
  return (
    <div>
      <H2>FAQ & Common Pitfalls</H2>
      {faqs.map((f,i)=>(
        <div key={i} style={{background:"#060d1a",border:"1px solid #1e293b",borderRadius:10,padding:"1.1rem 1.4rem",marginBottom:10}}>
          <div style={{fontWeight:700,color:"#cbd5e1",fontSize:14,marginBottom:6,display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{color:"#3b82f6",fontFamily:"monospace",minWidth:24}}>Q{i+1}</span>
            <span>{f.q}</span>
          </div>
          <div style={{color:"#64748b",fontSize:13,lineHeight:1.75,paddingLeft:32}}>{f.a}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function FullDocumentation() {
  const [tab, setTab] = useState<Tab>("overview");
  const mainRef = useRef<HTMLDivElement>(null);

  const handleTab = (id: Tab) => {
    setTab(id);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const TAB_MAP: Record<Tab, React.FC> = {
    overview: TabOverview, nb01: TabNB01, nb02: TabNB02,
    nb031: TabNB031, nb032: TabNB032, nb033: TabNB033, nb034: TabNB034,
    nb04: TabNB04, models: TabModels, training: TabTraining,
    api: TabAPI, faq: TabFAQ,
  };
  const CurrentTab = TAB_MAP[tab];

  return (
    <div style={{minHeight:"100vh",background:"#040a14",color:"#e2e8f0",display:"flex",fontFamily:"'Inter','DM Sans',system-ui,sans-serif"}}>

      {/* ── Sidebar ── */}
      <aside style={{borderRight:"1px solid #0f1f35",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflow:"hidden",flexShrink:0}}>
        {/* Logo */}
        <div style={{padding:"1.4rem 1.2rem 1.2rem",borderBottom:"1px solid #0f1f35"}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.2em",color:"#1d4ed8",textTransform:"uppercase",marginBottom:6,fontFamily:"'Syne',sans-serif"}}>ML Documentation</div>
          <div style={{fontSize:13,fontWeight:800,color:"#f8fafc",lineHeight:1.4,fontFamily:"'Syne',sans-serif"}}>Exam Cheating<br/>Detection System</div>
          <div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap"}}>
            <Badge color="#22c55e">97.80%</Badge>
            <Badge color="#3b82f6">PyTorch</Badge>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,overflowY:"auto",padding:"0.6rem 0"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>handleTab(n.id)} style={{display:"block",width:"100%",textAlign:"left",padding:"6px 1.2rem",background:tab===n.id?"#0d1f3c":"transparent",border:"none",borderLeft:`3px solid ${tab===n.id?(n.color||"#3b82f6"):"transparent"}`,cursor:"pointer",transition:"all .15s"}}>
              <div style={{fontSize:13,color:tab===n.id?(n.color||"#93c5fd"):"#4b5563",fontWeight:tab===n.id?700:400,fontFamily:"'Syne',sans-serif",display:"flex",alignItems:"center",gap:6}}>
                {n.label}
                {n.badge&&<span style={{fontSize:9,fontWeight:800,background:"#22c55e22",border:"1px solid #22c55e55",color:"#22c55e",padding:"1px 5px",borderRadius:10,letterSpacing:"0.06em"}}>{n.badge}</span>}
              </div>
              {n.sub&&<div style={{fontSize:11,color:"#374151",marginTop:1,fontFamily:"monospace"}}>{n.sub}</div>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{padding:"1rem 1.2rem",borderTop:"1px solid #0f1f35",fontSize:10,color:"#1f2937",fontFamily:"monospace",lineHeight:1.8}}>
          7 Notebooks · 5 Models<br/>
          PyTorch · Google Colab<br/>
          Best: Custom CNN ⭐
        </div>
      </aside>

      {/* ── Main ── */}
      <main ref={mainRef} style={{flex:1,padding:"2rem 2.5rem",overflowY:"auto"}}>
        <CurrentTab/>
        {/* Bottom padding */}
        <div style={{height:80}}/>
      </main>
    </div>
  );
}