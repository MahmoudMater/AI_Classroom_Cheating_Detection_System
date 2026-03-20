"""Train YOLO for exam cheating object detection and report metrics.

This script trains on the merged dataset, saves best weights, and prints
overall and per-class validation performance.
"""

from __future__ import annotations

import argparse
import shutil
import time
from pathlib import Path

import pandas as pd
from ultralytics import YOLO


CLASS_NAMES = ["phone", "smartwatch", "unauthorized_notebook"]
MAP_WARN_THRESHOLD = 0.70


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for YOLO training."""
    parser = argparse.ArgumentParser(description="Train YOLO on merged classroom dataset.")
    parser.add_argument("--data", type=str, default="data_merged/data.yaml")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        choices=["yolov8n.pt", "yolov8s.pt", "yolov8m.pt"],
    )
    parser.add_argument("--device", type=str, default="cpu")
    parser.add_argument("--name", type=str, default="exam_yolo_v1")
    return parser.parse_args()


def run_training(args: argparse.Namespace) -> Path | None:
    """Run YOLO training and return path to best.pt if produced."""
    ai_service_dir = Path(__file__).resolve().parents[1]
    data_path = (ai_service_dir / args.data).resolve()

    model = YOLO(args.model)
    model.train(
        data=str(data_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        name=args.name,
        project="runs/detect",
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
        patience=20,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        warmup_epochs=3,
        cls=1.5,
        save=True,
        save_period=10,
        verbose=True,
    )

    best_pt = (ai_service_dir / "runs" / "detect" / args.name / "weights" / "best.pt").resolve()
    snapshots_path = (ai_service_dir / "snapshots" / "yolo_exam.pt").resolve()
    snapshots_path.parent.mkdir(parents=True, exist_ok=True)

    if best_pt.exists():
        shutil.copy2(best_pt, snapshots_path)
        print("✅ Best weights saved to snapshots/yolo_exam.pt")
        return best_pt

    print("❌ best.pt not found — check training output")
    return None


def _get_metric(row: pd.Series, candidates: list[str]) -> float:
    """Extract a metric value from possible CSV column names."""
    for name in candidates:
        if name in row.index:
            try:
                return float(row[name])
            except Exception:
                return 0.0
    return 0.0


def print_results(results_csv: Path, best_pt: Path, args: argparse.Namespace) -> None:
    """Print aggregate training results and per-class validation metrics."""
    ai_service_dir = Path(__file__).resolve().parents[1]
    data_path = (ai_service_dir / args.data).resolve()
    snapshots_path = (ai_service_dir / "snapshots" / "yolo_exam.pt").resolve()

    if not results_csv.exists():
        print(f"❌ results.csv not found: {results_csv}")
    else:
        df = pd.read_csv(results_csv)
        if df.empty:
            print(f"❌ results.csv is empty: {results_csv}")
        else:
            last = df.iloc[-1]
            epochs_completed = int(last["epoch"]) + 1 if "epoch" in last.index else len(df)
            precision = _get_metric(
                last,
                ["metrics/precision(B)", "metrics/precision", "precision"],
            )
            recall = _get_metric(
                last,
                ["metrics/recall(B)", "metrics/recall", "recall"],
            )
            map50 = _get_metric(
                last,
                ["metrics/mAP50(B)", "metrics/mAP50", "mAP50"],
            )
            map5095 = _get_metric(
                last,
                ["metrics/mAP50-95(B)", "metrics/mAP50-95", "mAP50-95"],
            )

            print("════════════════════════════════════")
            print("TRAINING RESULTS")
            print("════════════════════════════════════")
            print(f"Epochs completed : {epochs_completed}")
            print(f"Best mAP@0.5     : {map50:.3f}")
            print(f"Best mAP@0.5:0.95: {map5095:.3f}")
            print(f"Precision        : {precision:.3f}")
            print(f"Recall           : {recall:.3f}")
            print("════════════════════════════════════")

    if not best_pt.exists() and snapshots_path.exists():
        best_for_val = snapshots_path
    else:
        best_for_val = snapshots_path

    if not best_for_val.exists():
        print("❌ Cannot run per-class validation because snapshots/yolo_exam.pt is missing.")
        return

    model_trained = YOLO(str(best_for_val))
    val_results = model_trained.val(
        data=str(data_path),
        imgsz=args.imgsz,
        conf=0.75,
        iou=0.45,
        verbose=True,
    )

    maps = []
    try:
        maps = list(val_results.box.maps)
    except Exception:
        maps = []

    print("Per-class mAP@0.5:")
    for idx, class_name in enumerate(CLASS_NAMES):
        ap = float(maps[idx]) if idx < len(maps) else 0.0
        if class_name == "unauthorized_notebook":
            label = "unauthorized_notebook"
        else:
            label = class_name.ljust(19)
        print(f"  {label}: {ap:.3f}")
        if ap < MAP_WARN_THRESHOLD:
            print(f"⚠️  WARNING: '{class_name}' mAP@0.5 = {ap:.3f} < 0.70")
            print("    Recommendation: collect more training images for this class.")


def main() -> None:
    """Entry point for training, reporting, and final validation."""
    args = parse_args()
    start_ts = time.time()
    print(f"Training started: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_ts))}")

    ai_service_dir = Path(__file__).resolve().parents[1]
    results_csv = (ai_service_dir / "runs" / "detect" / args.name / "results.csv").resolve()
    best_pt_guess = (ai_service_dir / "runs" / "detect" / args.name / "weights" / "best.pt").resolve()

    try:
        best_pt = run_training(args)
        print_results(results_csv=results_csv, best_pt=best_pt_guess if best_pt is None else best_pt, args=args)
    except KeyboardInterrupt:
        print("Training interrupted. Saving...")
    except Exception as exc:
        print(f"❌ Training failed: {exc}")
        raise SystemExit(1)
    finally:
        elapsed_min = (time.time() - start_ts) / 60.0
        print(f"Total training time: {elapsed_min:.2f} minutes")


if __name__ == "__main__":
    main()

