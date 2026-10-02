# Filter source: edit these files

The 8 `.filter` files in the repo root are **generated** from this folder. Don't edit them directly.

- Files are joined in filename order (`010-…`, `020-…`, …) to make `Erazure-Main.filter`; the other 7 filters differ only in which toggle block in `030-toggles.filter` is active.
- Order matters: rules run top to bottom across the whole joined filter.
- To add a section, pick a number between its neighbours (e.g. `115-new-topic.filter`).
- After editing, double-click `build.bat` in the repo root (or run `python tools/build.py`), then commit this folder and the 8 root filters together.
