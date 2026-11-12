---
title: Filter Editor
description: Make Erazure's loot filter your own. Pick a version, change looks, sounds and items, preview drops as the game draws them, and save it straight into your game. Your changes carry over to every Erazure update.
hide:
  - navigation
  - toc
---

<style>
  /* this page only: the editor uses the window's whole width (its sidebar, the area and the preview side by side) */
  .md-grid { max-width: none; }
  .md-content__inner { margin-bottom: 0; padding-bottom: 0; }
  .md-content__inner > h1 { margin-bottom: .6rem; }
  /* Material's "Back to top" button: under the editor's bar, which stays at the top too (the editor sets --fe-bar;
     Material's script puts the header's height in the button's own style, hence !important) */
  .md-top { top: calc(2.4rem + var(--fe-bar, 0px) + .6rem) !important; }
</style>

# Filter Editor

Make Erazure your own: this page keeps your changes, and each save builds Erazure's newest version with them into a
filter file of your own, which the launcher loads as a Local Filter. A local filter doesn't update by itself, so come
back and save again when Erazure updates (your changes carry over). With no changes, keep the launcher's Erazure: it
updates by itself.

<!-- the editor (website/hooks.py puts it here, from Erazure-Filter-Editor.html) -->
<div id="edit-map-here"></div>
