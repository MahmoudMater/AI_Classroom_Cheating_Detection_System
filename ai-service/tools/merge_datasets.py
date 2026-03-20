"""Merge five YOLO datasets into one 3-class dataset with pooled resplitting.

The script pools images by class group, ignores original Roboflow split boundaries,
resplits by 80/10/10 using a fixed seed, remaps labels to final class indices,
caps negatives per split at 3x annotated count, and writes a merged `data.yaml`.
"""

from __future__ import annotations

import argparse
import os
import random
import shutil
from collections import defaultdict
from pathlib import Path

import yaml


FINAL_NAMES: list[str] = ["phone", "smartwatch", "unauthorized_notebook"]
IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png"}

CLASS_GROUPS: dict[str, dict[str, object]] = {
    "phone": {
        "dst_class_idx": 0,
        "prefix": "ph_",
        "datasets": [
            {"folder": "mobile Phone.v5i.yolov8", "src_class_idx": 0, "splits": ["train", "valid"]},
        ],
    },
    "smartwatch": {
        "dst_class_idx": 1,
        "prefix": "sw_",
        "datasets": [
            {"folder": "Smartwatch Dataset.v1i.yolov8", "src_class_idx": 0, "splits": ["train", "valid", "test"]},
            {"folder": "smartwatch.v1i.yolov8", "src_class_idx": 0, "splits": ["train", "valid"]},
            {"folder": "Smart watch.v2i.yolov8", "src_class_idx": 0, "splits": ["train", "valid", "test"]},
        ],
    },
    "notebook": {
        "dst_class_idx": 2,
        "prefix": "nb_",
        "datasets": [
            {"folder": "notebook.v2i.yolov8", "src_class_idx": 0, "splits": ["train", "valid", "test"]},
        ],
    },
}


def parse_args() -> argparse.Namespace:
    """Parse CLI args for dataset merge."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", required=True, type=Path)
    parser.add_argument("--output_dir", required=True, type=Path)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def validate_datasets(data_dir: Path) -> None:
    """Validate all five dataset folders and required train image/label dirs."""
    missing: list[str] = []

    for group_name, group in CLASS_GROUPS.items():
        for ds in group["datasets"]:  # type: ignore[index]
            folder = str(ds["folder"])
            ds_dir = data_dir / folder
            train_images = ds_dir / "train" / "images"
            train_labels = ds_dir / "train" / "labels"

            print(f"[validate] {group_name} / {folder} folder: {'FOUND' if ds_dir.exists() else 'MISSING'}")
            print(f"[validate] {group_name} / {folder} train/images: {'FOUND' if train_images.exists() else 'MISSING'}")
            print(f"[validate] {group_name} / {folder} train/labels: {'FOUND' if train_labels.exists() else 'MISSING'}")

            if not ds_dir.exists() or not train_images.exists() or not train_labels.exists():
                missing.append(folder)

    if missing:
        raise FileNotFoundError(f"Missing required dataset paths: {missing}")


def remap_label_file(src_path: Path, src_class_idx: int, dst_class_idx: int) -> list[str]:
    """Remap one label file from source class index to destination class index."""
    out: list[str] = []
    try:
        lines = src_path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception as exc:
        print(f"WARNING: failed reading label file {src_path}: {exc}")
        return out

    for line in lines:
        raw = line.strip()
        if not raw:
            continue
        parts = raw.split()

        if len(parts) == 5:
            records = [parts]
        elif len(parts) > 5 and len(parts) % 5 == 0:
            records = [parts[i : i + 5] for i in range(0, len(parts), 5)]
        else:
            print(f"WARNING: invalid label line in {src_path.name}: {raw}")
            continue

        for rec in records:
            try:
                cls_idx = int(float(rec[0]))
            except Exception:
                continue
            if cls_idx != src_class_idx:
                continue
            out.append(f"{dst_class_idx} {rec[1]} {rec[2]} {rec[3]} {rec[4]}")

    return out


def pool_images(dataset_dirs: list[Path], splits: list[str]) -> list[Path]:
    """Collect image paths from all provided dataset dirs and splits."""
    pooled: list[Path] = []
    for ds_dir in dataset_dirs:
        for split in splits:
            images_dir = ds_dir / split / "images"
            if not images_dir.exists():
                continue
            for image_path in images_dir.iterdir():
                if image_path.is_file() and image_path.suffix.lower() in IMAGE_EXTENSIONS:
                    pooled.append(image_path)
    return sorted(pooled, key=lambda p: str(p))


def resplit(pool: list[Path], seed: int) -> tuple[list[Path], list[Path], list[Path]]:
    """Shuffle deterministically and split into train/valid/test with 80/10/10."""
    random.seed(seed)
    items = list(pool)
    random.shuffle(items)
    n = len(items)
    train_end = int(n * 0.80)
    valid_end = int(n * 0.90)
    return items[:train_end], items[train_end:valid_end], items[valid_end:]


def _find_label_for_image(image_path: Path) -> Path:
    """Return sibling label path for an image path."""
    labels_dir = image_path.parent.parent / "labels"
    return labels_dir / f"{image_path.stem}.txt"


def copy_class_split(
    image_pool: list[Path],
    dataset_dirs: list[Path],
    src_class_idx: int,
    dst_class_idx: int,
    prefix: str,
    output_dir: Path,
    split_name: str,
    seed: int,
) -> tuple[int, int]:
    """Copy one class split to merged output with per-split negative capping."""
    # Keep only images belonging to the provided dataset dirs.
    allowed_roots = [p.resolve() for p in dataset_dirs]
    selected: list[Path] = []
    for image_path in image_pool:
        resolved = image_path.resolve()
        if any(os.path.commonpath([str(resolved), str(root)]) == str(root) for root in allowed_roots):
            selected.append(image_path)

    annotated_items: list[tuple[Path, list[str]]] = []
    negative_items: list[tuple[Path, list[str]]] = []

    for image_path in selected:
        label_path = _find_label_for_image(image_path)
        remapped = remap_label_file(label_path, src_class_idx, dst_class_idx) if label_path.exists() else []
        if remapped:
            annotated_items.append((image_path, remapped))
        else:
            negative_items.append((image_path, []))

    annotated_count = len(annotated_items)
    negatives = list(negative_items)
    max_neg = annotated_count * 3
    if len(negatives) > max_neg:
        original = len(negatives)
        random.seed(seed)
        negatives = random.sample(negatives, max_neg)
        class_name = FINAL_NAMES[dst_class_idx]
        print(f"[{class_name}][{split_name}] negatives capped: {original} -> {max_neg}")

    dst_img_dir = output_dir / split_name / "images"
    dst_lbl_dir = output_dir / split_name / "labels"
    dst_img_dir.mkdir(parents=True, exist_ok=True)
    dst_lbl_dir.mkdir(parents=True, exist_ok=True)

    final_items = annotated_items + negatives
    kept = 0
    for i, (image_path, remapped) in enumerate(final_items):
        out_img = dst_img_dir / f"{prefix}{i:06d}{image_path.suffix.lower()}"
        out_lbl = dst_lbl_dir / f"{prefix}{i:06d}.txt"
        try:
            shutil.copy2(image_path, out_img)
            if remapped:
                out_lbl.write_text("\n".join(remapped) + "\n", encoding="utf-8")
            else:
                out_lbl.write_text("", encoding="utf-8")
            kept += 1
        except Exception as exc:
            print(f"WARNING: failed copy/write for {image_path}: {exc}")
            continue

    # If copy errors happened, reconcile counts with actual kept files.
    if kept != len(final_items):
        effective_negatives = max(0, kept - annotated_count)
        return min(annotated_count, kept), effective_negatives

    return annotated_count, len(negatives)


def write_data_yaml(output_dir: Path) -> None:
    """Write merged YOLO data.yaml."""
    payload = {
        "path": str(output_dir.resolve()),
        "train": "train/images",
        "val": "valid/images",
        "test": "test/images",
        "nc": 3,
        "names": FINAL_NAMES,
    }
    (output_dir / "data.yaml").write_text(yaml.safe_dump(payload, sort_keys=False), encoding="utf-8")


def main() -> None:
    """Run the full merge flow and print summary."""
    args = parse_args()
    data_dir: Path = args.data_dir
    output_dir: Path = args.output_dir
    seed: int = args.seed

    validate_datasets(data_dir)

    for split in ("train", "valid", "test"):
        (output_dir / split / "images").mkdir(parents=True, exist_ok=True)
        (output_dir / split / "labels").mkdir(parents=True, exist_ok=True)

    stats: dict[str, dict[str, dict[str, int]]] = defaultdict(dict)
    pools_by_class: dict[str, tuple[list[Path], list[Path], list[Path]]] = {}
    roots_by_class: dict[str, list[Path]] = {}

    # Pooling and split logs in requested format.
    print("Pooling phone (1 dataset)...")
    phone_roots = [data_dir / "mobile Phone.v5i.yolov8"]
    phone_pool = pool_images(phone_roots, ["train", "valid", "test"])
    phone_train, phone_valid, phone_test = resplit(phone_pool, seed)
    print(f"  Pool size: {len(phone_pool)} images")
    print(f"  Split: train={len(phone_train)} valid={len(phone_valid)} test={len(phone_test)}")
    print("")
    pools_by_class["phone"] = (phone_train, phone_valid, phone_test)
    roots_by_class["phone"] = phone_roots

    print("Pooling smartwatch (3 datasets)...")
    smartwatch_roots = [
        data_dir / "Smartwatch Dataset.v1i.yolov8",
        data_dir / "smartwatch.v1i.yolov8",
        data_dir / "Smart watch.v2i.yolov8",
    ]
    smartwatch_pool = pool_images(smartwatch_roots, ["train", "valid", "test"])
    sw_train, sw_valid, sw_test = resplit(smartwatch_pool, seed)
    print(f"  Pool size: {len(smartwatch_pool)} images")
    print(f"  Split: train={len(sw_train)} valid={len(sw_valid)} test={len(sw_test)}")
    print("")
    pools_by_class["smartwatch"] = (sw_train, sw_valid, sw_test)
    roots_by_class["smartwatch"] = smartwatch_roots

    print("Pooling notebook (1 dataset)...")
    notebook_roots = [data_dir / "notebook.v2i.yolov8"]
    notebook_pool = pool_images(notebook_roots, ["train", "valid", "test"])
    nb_train, nb_valid, nb_test = resplit(notebook_pool, seed)
    print(f"  Pool size: {len(notebook_pool)} images")
    print(f"  Split: train={len(nb_train)} valid={len(nb_valid)} test={len(nb_test)}")

    pools_by_class["notebook"] = (nb_train, nb_valid, nb_test)
    roots_by_class["notebook"] = notebook_roots

    # Copy by class/split.
    for class_name in ("phone", "smartwatch", "notebook"):
        dst_class_idx = int(CLASS_GROUPS[class_name]["dst_class_idx"])  # type: ignore[index]
        prefix = str(CLASS_GROUPS[class_name]["prefix"])  # type: ignore[index]
        src_class_idx = 0
        train_pool, valid_pool, test_pool = pools_by_class[class_name]
        dataset_dirs = roots_by_class[class_name]

        ann_train, neg_train = copy_class_split(
            image_pool=train_pool,
            dataset_dirs=dataset_dirs,
            src_class_idx=src_class_idx,
            dst_class_idx=dst_class_idx,
            prefix=prefix,
            output_dir=output_dir,
            split_name="train",
            seed=seed,
        )
        ann_valid, neg_valid = copy_class_split(
            image_pool=valid_pool,
            dataset_dirs=dataset_dirs,
            src_class_idx=src_class_idx,
            dst_class_idx=dst_class_idx,
            prefix=prefix,
            output_dir=output_dir,
            split_name="valid",
            seed=seed,
        )
        ann_test, neg_test = copy_class_split(
            image_pool=test_pool,
            dataset_dirs=dataset_dirs,
            src_class_idx=src_class_idx,
            dst_class_idx=dst_class_idx,
            prefix=prefix,
            output_dir=output_dir,
            split_name="test",
            seed=seed,
        )

        stats[class_name] = {
            "train": {"annotated": ann_train, "negatives": neg_train, "total": ann_train + neg_train},
            "valid": {"annotated": ann_valid, "negatives": neg_valid, "total": ann_valid + neg_valid},
            "test": {"annotated": ann_test, "negatives": neg_test, "total": ann_test + neg_test},
        }

    write_data_yaml(output_dir)

    print("════════════════════════════════════════════════════════")
    print("MERGE COMPLETE")
    print("════════════════════════════════════════════════════════")
    print("                     TRAIN    VALID    TEST    TOTAL")

    ordered = [("phone", "Phone", 0), ("smartwatch", "Smartwatch", 1), ("notebook", "Notebook", 2)]
    total_train = total_valid = total_test = 0

    for key, label, cls_idx in ordered:
        tr = stats[key]["train"]["total"]
        va = stats[key]["valid"]["total"]
        te = stats[key]["test"]["total"]
        tt = tr + va + te
        a_tr = stats[key]["train"]["annotated"]
        a_va = stats[key]["valid"]["annotated"]
        a_te = stats[key]["test"]["annotated"]
        n_tr = stats[key]["train"]["negatives"]
        n_va = stats[key]["valid"]["negatives"]
        n_te = stats[key]["test"]["negatives"]
        a_tt = a_tr + a_va + a_te
        n_tt = n_tr + n_va + n_te

        total_train += tr
        total_valid += va
        total_test += te

        print(f"{label:<12} (cls {cls_idx}) {tr:6d} {va:8d} {te:7d} {tt:8d}")
        print(f"  annotated         {a_tr:6d} {a_va:8d} {a_te:7d} {a_tt:8d}")
        print(f"  negatives         {n_tr:6d} {n_va:8d} {n_te:7d} {n_tt:8d}")
        print("")

    total_all = total_train + total_valid + total_test
    print("────────────────────────────────────────────────────")
    print(f"TOTAL               {total_train:6d} {total_valid:8d} {total_test:7d} {total_all:8d}")
    print("════════════════════════════════════════════════════════")
    print(f"Output    : {output_dir.resolve()}")
    print("data.yaml : written")
    print("Ratio     : 80/10/10")
    print(f"Seed      : {seed}")
    print("════════════════════════════════════════════════════════")


if __name__ == "__main__":
    main()

