import io
import uuid
from pathlib import Path

from PIL import Image

from app.config import get_settings

settings = get_settings()


def get_asset_path(asset_id: uuid.UUID, asset_type: str, extension: str, project_id: uuid.UUID | None = None) -> str:
    """Generate organized storage path for an asset."""
    base = Path(settings.storage_base_path)
    type_dir = "images" if asset_type == "image" else "videos"
    sub_dir = str(project_id) if project_id else "unassigned"
    path = base / type_dir / sub_dir / f"{asset_id}.{extension}"
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


def get_thumbnail_path(asset_id: uuid.UUID, project_id: uuid.UUID | None = None) -> str:
    """Generate thumbnail path for an asset."""
    base = Path(settings.storage_base_path)
    sub_dir = str(project_id) if project_id else "unassigned"
    path = base / "thumbnails" / sub_dir / f"{asset_id}.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


def get_extension_from_url(url: str, asset_type: str) -> str:
    """Infer file extension from URL or asset type."""
    url_path = url.split("?")[0].lower()
    for ext in ["mp4", "webm", "mov", "png", "jpg", "jpeg", "webp"]:
        if url_path.endswith(f".{ext}"):
            return ext
    return "mp4" if asset_type == "video" else "png"


def generate_thumbnail(source_path: str, thumbnail_path: str, size: tuple[int, int] = (640, 360)) -> str | None:
    """
    Generate a thumbnail from an image or video file.
    - Image: resize with Pillow
    - Video: extract first frame with FFmpeg
    """
    source = Path(source_path)

    # --- Image thumbnail ---
    if source.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
        try:
            with Image.open(source_path) as img:
                img.thumbnail(size, Image.LANCZOS)
                img.convert("RGB").save(thumbnail_path, "JPEG", quality=85)
            return thumbnail_path
        except Exception:
            return None

    # --- Video thumbnail via FFmpeg ---
    if source.suffix.lower() in {".mp4", ".webm", ".mov", ".avi"}:
        try:
            import subprocess
            result = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", source_path,
                    "-ss", "00:00:01",       # capture at 1 second
                    "-vframes", "1",
                    "-vf", f"scale={size[0]}:{size[1]}:force_original_aspect_ratio=decrease",
                    thumbnail_path,
                ],
                capture_output=True,
                timeout=30,
            )
            if Path(thumbnail_path).exists():
                return thumbnail_path
        except FileNotFoundError:
            # FFmpeg not installed — skip thumbnail silently
            pass
        except Exception:
            pass

    return None



def get_file_size(path: str) -> int | None:
    """Return file size in bytes."""
    try:
        return Path(path).stat().st_size
    except Exception:
        return None


def ensure_storage_dirs() -> None:
    """Ensure all storage subdirectories exist."""
    base = Path(settings.storage_base_path)
    for sub in ("images", "videos", "thumbnails", "temp"):
        (base / sub).mkdir(parents=True, exist_ok=True)
