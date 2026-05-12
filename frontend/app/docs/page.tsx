"use client"

import { CodeBlock } from "@/components/CodeBlock"
import { InfoTable, SectionTitle, SubTitle, Tag } from "@/components/DocComponents"
import { DocumentationLayout } from "@/components/DocumentationLayout"
import { ModelSection } from "@/components/ModelSection"
import { MODEL_COMPARISON, MODELS } from "@/lib/doc-data"

export default function DocsPage() {
  return (
    <DocumentationLayout>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-[32px] border border-blue-900/10 dark:border-blue-900/30 bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-[#0f2040] dark:via-[#0d1b3e] dark:to-[#0a1228] p-8 md:p-16 mb-12 shadow-sm dark:shadow-none transition-all">
        <div className="absolute -top-20 -right-20 size-64 md:size-96 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 transition-colors">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            Computer Vision · Binary Classification
          </div>
          <h1 className="text-3xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6 font-syne tracking-tighter transition-colors">
            Exam Cheating <br />
            <span className="text-blue-600 dark:text-blue-500">Detection System</span>
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 transition-colors">
            A complete deep learning pipeline for automated detection of cheating
            behaviour in exam videos. The system extracts frames, preprocesses data,
            trains and compares four distinct architectures, and selects the optimal
            model for real-time inference.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Custom CNN", "ResNet18", "EfficientNet-B0", "ViT-B/16"].map((m) => (
              <Tag key={m} color="#2563eb">{m}</Tag>
            ))}
            <Tag color="#16a34a">97.80% Accuracy</Tag>
            <Tag color="#7c3aed">ROC-AUC 0.9999</Tag>
          </div>
        </div>
      </div>

      

      {/* 1. Project Overview */}
      <SectionTitle id="overview">◈ Project Overview</SectionTitle>
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base transition-colors">
          This project implements a full end-to-end machine learning pipeline to detect exam cheating
          behaviour from video footage. It follows a structured notebook-based workflow, spanning raw
          video ingestion, intelligent frame extraction with blur filtering, dataset cleaning and
          splitting, multi-model training with transfer learning, comparative evaluation, and
          deployment-ready model export.
        </p>

        <InfoTable rows={[
          ["Task", "Binary image classification: cheating vs not_cheating"],
          ["Input", "Raw exam video files (MP4, AVI, MOV, MKV, WEBM, FLV)"],
          ["Output", "Saved .pth model weights + real-time inference pipeline"],
          ["Image size", "224 × 224 pixels (standard for ImageNet-compatible models)"],
          ["Dataset split", "80% Train / 10% Val / 10% Test (random seed=42)"],
          ["Framework", "PyTorch + torchvision"],
          ["Platform", "Google Colab (GPU runtime recommended)"],
          ["Storage", "Google Drive — dataset_frames/, dataset_final/, saved_models/"],
          ["Classes", "cheating (index 0)   not_cheating (index 1)"],
          ["Batch size", "32"],
          ["Max epochs", "20 with early stopping (patience=5)"],
          ["Best model", "Custom CNN — Acc=0.9780, F1=0.9780, ROC-AUC=0.9995, Params=~200K"],
        ]} />

        <div className="bg-blue-600/5 border border-blue-600/10 dark:border-blue-600/20 rounded-2xl p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-500 font-bold text-xs transition-colors">!</div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest transition-colors">Why Custom CNN?</h4>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed italic transition-colors">
            Despite having only ~200K parameters (430× lighter than ViT-B/16), the Custom CNN
            achieved the highest ROC-AUC (0.9995) and matched the top accuracy (0.9780) of much heavier
            models. Its minimal footprint makes it the clear choice for real-time YOLO-integrated
            inference pipelines where latency and memory are critical constraints.
          </p>
        </div>
      </div>

      {/* 2. Pipeline */}
      <SectionTitle id="pipeline">⬡ End-to-End Pipeline</SectionTitle>
      <div className="space-y-4">
        {[
          {
            nb: "01", title: "Frame Extraction", icon: "🎬",
            desc: "Extract frames from labelled exam videos. Skip every N frames, filter blurry frames using Laplacian variance, and save as JPEG.",
            input: "exam_videos/",
            output: "dataset_frames/",
          },
          {
            nb: "02", title: "Data Preprocessing", icon: "🧹",
            desc: "Remove corrupted images, deduplicate via MD5 hash, resize all to 224×224, split into train/val/test, and visualise class balance.",
            input: "dataset_frames/",
            output: "dataset_final/",
          },
          {
            nb: "03", title: "Model Training", icon: "⚙️",
            desc: "Train four distinct architectures (Custom CNN, ResNet18, EfficientNet-B0, ViT-B/16) with augmentation, early stopping, and LR scheduling.",
            input: "dataset_final/",
            output: "saved_models/*.pth",
          },
          {
            nb: "04", title: "Model Comparison", icon: "📊",
            desc: "Load all saved models, run inference on the held-out test set, compute Accuracy / F1 / ROC-AUC / PR-AUC, render confusion matrices and ROC curves.",
            input: "saved_models/",
            output: "Decision: Custom CNN",
          },
          {
            nb: "05*", title: "YOLO Deployment", icon: "🚀",
            desc: "Integrate Custom CNN classifier with a YOLO object detector for per-frame real-time cheating detection on live or recorded streams.",
            input: "cnn_model.pth",
            output: "Live Stream",
            next: true
          },
        ].map((step, i) => (
          <div key={i} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-sm dark:shadow-none">
            <div className="size-12 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-600 dark:text-blue-500 font-bold text-lg shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{step.icon}</span>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 font-syne uppercase tracking-tight transition-colors">NB {step.nb} — {step.title}</h4>
                {step.next && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase transition-colors">Next Step</span>}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed mb-4 transition-colors">{step.desc}</p>
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 font-mono text-[11px] md:text-xs">
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400 dark:text-slate-600 font-bold uppercase">Input:</span>
                  <code className="text-blue-600 dark:text-blue-400 transition-colors">{step.input}</code>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400 dark:text-slate-600 font-bold uppercase">Output:</span>
                  <code className="text-green-600 dark:text-green-400 transition-colors">{step.output}</code>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. NB01 - Frame Extraction */}
      <SectionTitle id="nb01">◉ Notebook 01 — Frame Extraction</SectionTitle>
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base transition-colors">
          Responsible for ingesting raw exam videos and converting them into labelled image datasets.
          The notebook validates folder structure, iterates all video files per class, extracts frames
          at a configurable interval, applies a Laplacian blur filter, and saves clean frames as JPEG.
        </p>

        <SubTitle>Configuration Parameters</SubTitle>
        <InfoTable rows={[
          ["FRAME_SKIP", "5 — extract every 5th frame (configurable)"],
          ["BLUR_THRESHOLD", "80.0 — Laplacian variance; frames below this are discarded as blurry"],
          ["IMG_QUALITY", "95 — JPEG compression quality (0–100)"],
          ["VIDEO_EXTS", ".mp4, .avi, .mov, .mkv, .webm, .flv"],
          ["IMG_EXT", ".jpg"],
          ["VIDEOS_PATH", "/content/drive/MyDrive/exam_videos"],
          ["OUTPUT_PATH", "/content/drive/MyDrive/dataset_frames"],
        ]} />

        <div className="space-y-4">
          <SubTitle>Blur Detection — Laplacian Variance</SubTitle>
          <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed mb-4 transition-colors">
            The blur filter converts each frame to greyscale, computes the Laplacian second-derivative
            operator, and measures its variance. Low variance indicates a uniform, blurry image; frames
            below the threshold are skipped.
          </p>
          <CodeBlock code={`def is_blurry(frame, threshold):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var() < threshold

# Usage inside extraction loop:
if not is_blurry(frame, BLUR_THRESHOLD):
    cv2.imwrite(out_path, frame, [cv2.IMWRITE_JPEG_QUALITY, IMG_QUALITY])
    saved += 1`} />
        </div>
      </div>

      {/* 4. Model Sections */}
      <div className="mt-20">
        <SectionTitle id="nb03_cnn">◉ Notebook 03.1 — Custom CNN</SectionTitle>
        <ModelSection model={MODELS.cnn} />

        <SectionTitle id="nb03_resnet">◉ Notebook 03.2 — ResNet18</SectionTitle>
        <ModelSection model={MODELS.resnet18} />

        <SectionTitle id="nb03_eff">◉ Notebook 03.3 — EfficientNet-B0</SectionTitle>
        <ModelSection model={MODELS.efficientnet} />

        <SectionTitle id="nb03_vit">◉ Notebook 03.4 — ViT-B/16</SectionTitle>
        <ModelSection model={MODELS.vit} />
      </div>

      {/* 5. Comparison Table */}
      <SectionTitle id="nb04">◉ Notebook 04 — Model Comparison</SectionTitle>
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base transition-colors">
          Loads all saved model files from Google Drive, rebuilds each architecture,
          runs full inference on the held-out test set, and produces a comprehensive comparative report.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none transition-all">
          <table className="w-full text-left font-mono text-[11px] md:text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-colors">
                {["Rank", "Model", "Accuracy", "F1-Score", "ROC-AUC", "Params", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4 font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {MODEL_COMPARISON.map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-blue-500/5" : "hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"}>
                  <td className="px-6 py-4 font-bold" style={{ color: row.color }}>{row.rank}</td>
                  <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold transition-colors">{row.name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 transition-colors">{row.acc}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 transition-colors">{row.f1}</td>
                  <td className="px-6 py-4 font-bold transition-colors" style={{ color: row.aucColor }}>{row.auc}</td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 transition-colors">{row.params}</td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2 py-1 rounded-full text-[10px] font-bold uppercase border transition-all"
                      style={{ 
                        color: row.color, 
                        borderColor: `${row.color}33`,
                        background: `${row.color}11`
                      }}
                    >
                      {row.deploy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-green-500/5 border border-green-500/10 dark:border-green-500/20 rounded-2xl p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-500 font-bold text-xs transition-colors">⭐</div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest transition-colors">Final Verdict</h4>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed italic transition-colors">
            <strong className="text-green-600 dark:text-green-400 transition-colors">Custom CNN</strong> is the deployment model.
            It achieves the best ROC-AUC (0.9995), ties for top accuracy (0.9780), and uses only
            ~200K parameters — making it 430× lighter than ViT-B/16. For real-time inference,
            it is the optimal choice.
          </p>
        </div>
      </div>

      {/* 6. Training Strategy */}
      <SectionTitle id="training">◈ Training Strategy</SectionTitle>
      <div className="space-y-8">
        <div>
          <SubTitle>Data Augmentation Pipeline</SubTitle>
          <CodeBlock code={`train_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD),
])`} />
        </div>

        <div>
          <SubTitle>Early Stopping Protocol</SubTitle>
          <CodeBlock code={`best_val_acc, best_wts, patience_count = 0.0, copy.deepcopy(model.state_dict()), 0

for epoch in range(NUM_EPOCHS):
    # training + validation
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        best_wts = copy.deepcopy(model.state_dict())
        patience_count = 0
    else:
        patience_count += 1
        if patience_count >= PATIENCE:
            break

model.load_state_dict(best_wts)`} />
        </div>
      </div>

      {/* 7. Constants */}
      <SectionTitle id="constants">◈ Project-Wide Constants</SectionTitle>
      <div className="bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 p-2 transition-colors">
        <CodeBlock code={`DATASET_PATH   = '/content/drive/MyDrive/dataset_final'
FRAMES_PATH    = '/content/drive/MyDrive/dataset_frames'
CLASS_NAMES    = ['cheating', 'not_cheating']
IMG_SIZE       = (224, 224)
BATCH_SIZE     = 32
NUM_EPOCHS     = 20
PATIENCE       = 5

# Custom CNN normalisation (trained from scratch)
CLF_MEAN = [0.5, 0.5, 0.5]
CLF_STD  = [0.5, 0.5, 0.5]`} />
      </div>

      {/* Footer */}
      <footer className="mt-24 pt-12 border-t border-slate-200 dark:border-white/10 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h5 className="text-slate-800 dark:text-slate-100 font-bold mb-2 transition-colors">Integrity Engine ML Docs</h5>
            <p className="text-xs text-slate-400 dark:text-slate-600 font-mono transition-colors">
              7 Integrated Notebooks · PyTorch Framework · v1.0.0
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Tag color="#16a34a">97.80% Accuracy</Tag>
            <Tag color="#2563eb">Custom CNN</Tag>
            <Tag color="#7c3aed">AUC 0.9999</Tag>
          </div>
        </div>
        <div className="text-center mt-12 text-[10px] text-slate-400 dark:text-slate-700 uppercase tracking-[0.4em] font-mono transition-colors">
          End of Technical Specification
        </div>
      </footer>
    </DocumentationLayout>
  )
}
