# Course Project Rubric — Self-Assessment
**AI Classroom Cheating Detection System | Helwan National University**

> **How to read this document:** Each criterion is scored honestly against the rubric's four levels (Excellent / Good / Fair / Poor). For every claim, the exact notebook cell or file that proves it is cited. Where there are **gaps or risks**, they are flagged explicitly with ⚠️ so you can fix them before the discussion.

---

## Criterion 1 — Problem Understanding & Task Framing
**Weight: 15%** | **Assessed Level: ✅ Excellent**

### What "Excellent" requires
> *Clearly understands the problem, data modalities, constraints, and challenge design; defines a strong modeling plan.*

### Evidence from your project

| Requirement | Where it appears | Status |
|-------------|-----------------|--------|
| Problem is clearly defined | Notebook 01 header: "Extract frames from raw exam videos and organise them into class folders" — binary classification task, 2 classes: `cheating` / `not_cheating` | ✅ |
| Data modality is identified | Video frames (JPEG images, 224×224) extracted from exam surveillance footage | ✅ |
| Constraints are acknowledged | Real-time inference constraint → drives selection of lightest model; noted in `02_data_preprocessing.ipynb` constants block: *"Custom CNN: Lightest AND best ROC-AUC → perfect for real-time inference"* | ✅ |
| Challenge design | Multi-stage pipeline: frame extraction → deduplication → resize → split (NB01–02) → train 5 models (NB03.x) → compare (NB04) → deploy in YOLO pipeline | ✅ |
| Strong modeling plan | Clearly laid out across notebooks 01–04, each with a goal table at the top | ✅ |

### What to strengthen before the discussion
- ⚠️ **Add an explicit problem statement paragraph** at the start of NB01 that names the real-world stakes (exam integrity, scalability, false-positive cost) — the rubric says "understands the problem", not just implements it. Two sentences are enough.
- ⚠️ **Mention class imbalance awareness** — even if your dataset is balanced, state it explicitly and show the bar chart from NB02 Step 6 as proof.

---

## Criterion 2 — Model Selection & Architectural Justification
**Weight: 20%** | **Assessed Level: ✅ Excellent (with one gap to fix)**

### What "Excellent" requires
> *Chooses models appropriately and justifies use of CNNs, RNNs, pretrained models, Transformers, ViTs, or generative models with strong reasoning.*

### Evidence from your project

#### Models selected and their justifications

| Model | Type | Justification in notebooks | Status |
|-------|------|---------------------------|--------|
| **Custom CNN** | CNN from scratch | 3-block conv architecture designed for the task; no ImageNet bias; ~200K params → real-time capable; `[0.5,0.5,0.5]` normalization because trained from scratch | ✅ |
| **ResNet18** | Pretrained CNN | Transfer learning baseline; ImageNet weights; freeze backbone → train head → differential LR fine-tune (`lr_head=1e-3, lr_backbone=1e-5`); head: Linear(512→128)→ReLU→Dropout(0.5)→Linear(128→2) | ✅ |
| **EfficientNet-B0** | Pretrained CNN (compound scaling) | Freeze features → train classifier; head: Linear(→256)→ReLU→Dropout(0.4)→Linear(256→2); differential LR phase 2 | ✅ |
| **ViT-B/16** | Vision Transformer | Freeze encoder → train head; optional unfreeze last 4 blocks; demonstrates attention-based spatial reasoning vs convolution | ✅ |
| **MobileNetV2** | Lightweight pretrained CNN | Mobile-optimized architecture; relevant comparison for edge deployment | ✅ |

#### Architectural decisions are justified
- Custom CNN uses **BatchNorm2d** after every conv layer → training stability
- Custom CNN uses **AdaptiveAvgPool2d(1,1)** → spatial invariance regardless of feature map size
- **Dropout(0.3)** in CNN head → explicit regularization choice
- Transfer learning models use **frozen backbones in Phase 1** → avoids catastrophic forgetting on small dataset
- **Differential learning rates** in Phase 2 fine-tuning (ViT: `head lr=1e-3`, `encoder lr=5e-6`) → correct and sophisticated

#### Final selection justification (NB02 constants block)
```
# Custom CNN: Acc=0.9780, F1=0.9780, ROC-AUC=0.9995, Params=~200K
# Lightest AND best ROC-AUC → perfect for real-time inference
```

### What to strengthen before the discussion
- ⚠️ **The biggest gap:** None of the notebooks contain a written paragraph explaining *why these five model families were chosen* for this specific problem. The code is correct, but the rubric says "justifies" — you need 3–4 sentences per model at the top of each notebook explaining: (a) what the model's inductive bias is, (b) why that bias suits this visual classification task, (c) what trade-off it represents. Example for ViT: *"ViT-B/16 treats the image as a sequence of 16×16 patches and learns global attention patterns, which may capture holistic cheating postures better than local convolutions — but at 86M parameters it is impractical for real-time inference."*
- ⚠️ **No RNN or generative model** is included. The rubric lists these explicitly. You should briefly acknowledge in NB04 or a README why they were excluded: *"RNNs/LSTMs were considered for temporal modeling of behavior sequences, but the frame-independent CNN approach proved sufficient and avoids the complexity of sequence-to-sequence alignment in a surveillance context."* This turns an absence into a justified design decision.

---

## Criterion 3 — Implementation Quality & Technical Correctness
**Weight: 15%** | **Assessed Level: ✅ Excellent**

### Evidence from your project

| Technical requirement | Implementation | Notebook | Status |
|----------------------|---------------|----------|--------|
| Proper preprocessing | Corruption removal (cv2.imread==None), MD5 deduplication, 224×224 resize, stratified split | NB02 | ✅ |
| Training pipeline | Full epoch loop with train/val phases, loss + accuracy tracking, best-weight checkpointing | NB03.x Cell 6 | ✅ |
| Loss function | CrossEntropyLoss — correct for 2-class softmax | All NB03.x | ✅ |
| Optimizer | Adam with weight_decay=1e-4 — correct, includes L2 regularization | All NB03.x | ✅ |
| LR scheduler | ReduceLROnPlateau(mode="max", factor=0.5, patience=2) — correct, monitors val accuracy | All NB03.x | ✅ |
| Early stopping | patience=5, best weights restored on improvement | All NB03.x Cell 6 | ✅ |
| Data augmentation | RandomHorizontalFlip, RandomRotation(10°), ColorJitter — appropriate for surveillance frames | All NB03.x | ✅ |
| Correct normalization | CNN: [0.5,0.5,0.5] (from scratch); pretrained models: ImageNet stats — critical distinction | NB03.1 vs NB03.2/3/4 | ✅ |
| Evaluation metrics | Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Confusion Matrix | NB04 | ✅ |
| Reproducible split | random.seed(42) in NB02 | NB02 Step 5 | ✅ |
| Two-phase fine-tuning | Freeze → train head → unfreeze with differential LR | NB03.2/3/4 Cell 7 | ✅ |

### What to strengthen
- ⚠️ **No class weighting in loss function.** If your dataset has any imbalance, this should be addressed with `CrossEntropyLoss(weight=...)`. Even if balanced, state it explicitly.
- ⚠️ **No test-time augmentation** — minor, but worth mentioning as a known limitation.

---

## Criterion 4 — Use of Deep Learning Concepts
**Weight: 15%** | **Assessed Level: ✅ Excellent**

### What "Excellent" requires
> *Demonstrates strong understanding of convolution, sequence modeling, attention, transfer learning, embeddings, or generation.*

### Evidence from your project

| Concept | Where demonstrated |
|---------|-------------------|
| **Convolution** | Custom CNN: 3 conv blocks with kernel=3, padding=1; explicit filter size progression 32→64→128 | NB03.1 |
| **Batch Normalization** | Applied after every conv layer in Custom CNN; correct placement before activation | NB03.1 |
| **Pooling & spatial reduction** | MaxPool2d(2,2) for downsampling; AdaptiveAvgPool2d(1,1) for global feature aggregation | NB03.1 |
| **Transfer learning** | ImageNet pretrained weights; freeze/unfreeze strategy; domain adaptation | NB03.2/3/4 |
| **Attention (Transformer)** | ViT-B/16: patch embeddings, multi-head self-attention; partial encoder unfreeze (last 4 blocks) | NB03.4 |
| **Regularization** | Dropout(0.3–0.5), weight decay, early stopping | All NB03.x |
| **Differential learning rates** | Head vs backbone LR separation in Phase 2 | NB03.2/3/4 Cell 7 |
| **Pose estimation (keypoints)** | YOLOv8n-pose: 17-keypoint skeleton; nose/ear/shoulder geometry for head direction | proctoring.py |
| **Object detection + tracking** | YOLOv8n with `persist=True` tracking IDs across frames | proctoring.py |

### What to strengthen
- ⚠️ **Explicitly explain the attention mechanism** in NB03.4's markdown. The code uses ViT, but does the notebook *explain* how patch embeddings work and why attention over spatial patches differs from convolution? Add one markdown cell that does this — it's the difference between "shows good conceptual understanding" and "demonstrates strong understanding".
- ⚠️ **No sequence modeling (RNN/LSTM/GRU)** is used. For the discussion, be ready to explain why: the problem is per-frame classification, not sequence prediction, so CNNs are sufficient. You can also mention that temporal patterns ARE captured — just at the pipeline level through `PersonState.direction_counter` rather than in the model itself.

---

## Criterion 5 — Experimentation & Comparative Analysis
**Weight: 15%** | **Assessed Level: ✅ Excellent**

### What "Excellent" requires
> *Systematic experiments comparing multiple architectures or strategies; includes ablation or model comparison and learns from results.*

### Evidence from your project

| Requirement | Evidence | Status |
|-------------|----------|--------|
| Multiple architectures compared | 5 models: Custom CNN, ResNet18, EfficientNet-B0, ViT-B/16, MobileNetV2 | ✅ |
| Systematic evaluation | All models evaluated on the **same held-out test set (182 images)** with the same metrics | NB04 | ✅ |
| Multiple metrics | Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Confusion Matrix, Confidence Distribution | NB04 | ✅ |
| ROC curves plotted | All 5 models on one plot with AUC values | NB04 Cell 5 | ✅ |
| Confusion matrices | Per-model confusion matrix heatmaps | NB04 Cell 4 | ✅ |
| Learns from results | Custom CNN selected based on param efficiency + ROC-AUC trade-off | NB02 constants + NB04 | ✅ |
| Training strategies compared | Scratch vs transfer, frozen vs differential LR, different dropout rates | NB03.x | ✅ |

### Results summary (from NB04)

| Model | Accuracy | F1 | ROC-AUC | Params | Selection |
|-------|----------|-------|---------|--------|-----------|
| Custom CNN | 97.80% | 97.80% | 99.95% | ~200K | **✅ Winner** |
| EfficientNet-B0 | 97.80% | 97.80% | 99.89% | ~5.3M | |
| ViT-B/16 | 97.80% | 97.80% | 99.99% | ~86M | |
| MobileNetV2 | 97.80% | 97.80% | 99.43% | ~3.4M | |
| ResNet18 | 97.25% | 97.25% | 99.86% | ~11M | |

### What to strengthen
- ⚠️ **No ablation study** is present. The rubric specifically mentions "ablation". To satisfy this, add one of: (a) Custom CNN without BatchNorm vs with BN, (b) CNN with/without Dropout, (c) different frame skip values (3 vs 5 vs 10) and their effect on data quantity. Even a brief note is sufficient — it demonstrates you understand what ablation means.
- ⚠️ **The "learns from results" narrative needs to be written out**, not just implied by the constant `BEST_MODEL_KEY = 'cnn'`. Add a 3-sentence conclusion cell in NB04: *"Custom CNN achieves identical accuracy to models 25–430× larger. The ROC-AUC of 99.95% is second only to ViT (99.99%) but with 430× fewer parameters. For real-time inference in a surveillance context, Custom CNN is the clear choice."*

---

## Criterion 6 — Innovation & Intellectual Contribution
**Weight: 10%** | **Assessed Level: ✅ Good → potentially Excellent**

### What "Excellent" requires
> *Shows original thinking, thoughtful extensions, creative modeling, or insightful problem reformulation.*

### Evidence of originality

| Innovation | Description | Status |
|------------|-------------|--------|
| End-to-end production system | Not just a notebook — a full FastAPI + WebSocket + Next.js deployment of the model | ✅ Strong |
| Custom CNN designed for the task | Not a pretrained model — designed from scratch with the real-time constraint in mind | ✅ |
| Three-track decision fusion | Combining CNN classification + pose direction timing + object proximity into one verdict — this is original system design | ✅ Strong |
| `DIRECTION_PATIENCE` heuristic | The 4-frame patience counter prevents false positives from momentary head movements — a real engineering insight | ✅ |
| Per-person state machine | `PersonState` with independent timers per YOLO tracking ID — handles multi-person exams | ✅ |
| Normalization choice | Using `[0.5,0.5,0.5]` for scratch-trained CNN instead of ImageNet stats — shows understanding | ✅ |
| Custom CNN trained from scratch | All other models use transfer learning; the CNN is a genuine comparison point | ✅ |

### What to strengthen
- ⚠️ **Write this down.** The innovation exists in the code but the rubric looks for "shows original thinking" — meaning the notebook or README should articulate what's novel. Add a short "Design Decisions" markdown section explaining why three-track fusion was used instead of just the CNN, and what the tradeoff is.
- ⚠️ **Consider framing the decision engine as a contribution.** Most academic projects stop at training a classifier. Your system adds temporal reasoning (direction patience), spatial reasoning (object proximity), and multi-person identity tracking on top. That's original and should be explicitly described.

---

## Criterion 7 — Interpretation, Error Analysis & Reflection
**Weight: 5%** | **Assessed Level: ⚠️ Fair → needs work**

### What "Excellent" requires
> *Carefully analyzes failures, limitations, and model behavior; shows technical reflection.*

### Current state
This is the **weakest criterion** in your project. The notebooks evaluate model performance (confusion matrices, ROC curves) but do not contain explicit analysis of *why* models fail or *what types of errors* they make.

### What you need to add (before discussion)

**In NB04, add a markdown cell addressing:**

1. **Failure mode analysis** — Looking at your confusion matrix, which class does the model confuse more? If it misclassifies `cheating` as `not_cheating`, that's a false negative — more dangerous in a proctoring context than the reverse. Name this explicitly.

2. **Model behavior differences** — Why does ViT have the highest ROC-AUC (99.99%) but the same F1 as Custom CNN? What does this mean practically? (Answer: ViT has better probability calibration across all thresholds, but the 0.5 decision boundary gives the same binary accuracy — worth explaining.)

3. **Dataset limitations** — The data comes from exam videos. Are lighting conditions varied? Are all cheating behaviors represented (phone under desk, notes on paper, looking at neighbor)? This is important to state.

4. **Generalization risk** — All models were trained and tested on the same video source distribution. Performance may degrade on unseen exam environments.

5. **The ResNet18 gap** — ResNet18 is 0.55% lower accuracy than the others. Why? It's the oldest architecture with the least efficient feature extraction per parameter. Mention this.

### Template for the reflection cell to add
```markdown
## 🔍 Error Analysis & Limitations

**Most common failure mode:** Based on the confusion matrix, the model most frequently
confuses [X] as [Y]. In a proctoring context, false negatives (missed cheating events)
are more harmful than false positives, since they undermine exam integrity.

**Why ViT has higher AUC but equal accuracy:** ViT's ROC-AUC of 0.9999 indicates better
probability calibration across all decision thresholds. At threshold=0.5, however, all
models converge to the same binary decision boundary, explaining the identical 97.80% accuracy.

**Dataset distribution risk:** All data was extracted from [N] videos. If test-set videos
came from the same sessions as training videos, temporal leakage may inflate metrics.
The MD5 deduplication in NB02 mitigates exact frame duplication but not near-duplicates.

**Limitations:**
- Limited behavioral variety in training data (only [X] cheating behaviors represented)
- Single lighting condition / camera angle
- No temporal modeling — each frame is classified independently
```

---

## Criterion 8 — Reproducibility, Notebook Quality & Communication
**Weight: 5%** | **Assessed Level: ✅ Excellent**

### Evidence

| Requirement | Evidence | Status |
|-------------|----------|--------|
| Clean, clear notebooks | Consistent structure across all 5 model notebooks; step headers in every notebook | ✅ |
| Reproducible | `random.seed(42)` in NB02 split; all hyperparameters in one constants block shared across all notebooks | ✅ |
| Professionally presented | Step tables at top of each notebook, emoji headers for visual navigation, clear cell comments | ✅ |
| Easy to follow | Notebooks are numbered 01→02→03.x→04 with explicit input/output arrows in headers | ✅ |
| Constants centralized | All `DATASET_PATH`, `IMG_SIZE`, `BATCH_SIZE`, `NUM_EPOCHS`, `MODEL_FILES` defined once in NB02 and replicated across notebooks | ✅ |

### What to strengthen
- ⚠️ **Add `requirements.txt` or a `pip install` cell** at the top of each notebook so someone cloning the repo can reproduce it without guessing library versions.
- ⚠️ **Document actual dataset size** — how many total videos, how many total frames before and after deduplication. These numbers should appear in NB01 or NB02 output.

---

## Overall Assessment Summary

| Criterion | Weight | Current Level | Risk |
|-----------|--------|--------------|------|
| Problem Understanding & Task Framing | 15% | ✅ Excellent | Low — add 2 sentences |
| Model Selection & Architectural Justification | 20% | ✅ Excellent | Medium — written justification missing |
| Implementation Quality & Technical Correctness | 15% | ✅ Excellent | Low |
| Use of Deep Learning Concepts | 15% | ✅ Excellent | Low — explain ViT attention in markdown |
| Experimentation & Comparative Analysis | 15% | ✅ Excellent | Medium — add ablation note |
| Innovation & Intellectual Contribution | 10% | ✅ Good | Medium — articulate the 3-track fusion |
| Interpretation, Error Analysis & Reflection | 5% | ⚠️ Fair | **High — this section is missing** |
| Reproducibility, Notebook Quality | 5% | ✅ Excellent | Low |

---

## Priority Fix List (ordered by impact)

### 🔴 Must fix before discussion

1. **Add error analysis cell to NB04** — failure mode, false negative vs false positive cost, ResNet18 gap, ViT AUC vs accuracy paradox. (Criterion 7 — currently Fair, needs to reach Excellent)

2. **Add written justification per model in NB03.x headers** — 3–4 sentences per model explaining *why this architecture was chosen* for this problem. (Criterion 2 — currently implied, needs to be stated)

### 🟡 Should add for full Excellent score

3. **Add ablation study note to NB04** — even one: CNN with/without BatchNorm, or frame skip 3 vs 5. (Criterion 5)

4. **Explain the 3-track decision engine** in a markdown cell as an original contribution. (Criterion 6)

5. **Add explicit problem statement** in NB01 with real-world stakes. (Criterion 1)

6. **Add RNN/generative model exclusion rationale** — one sentence is enough. (Criterion 4)

### 🟢 Nice to have

7. Add `requirements.txt` / install cell
8. Document dataset size numbers (total videos, frames before/after dedup)
9. Mention class balance explicitly with reference to the bar chart
