

## Plan: Make Evolution Shards Page Fit Content Size

**Problem:** The modal uses `fixed inset-0` which stretches the background across the entire screen, leaving large empty purple/dark space next to the compact 240px-wide content.

**Solution:** Change the modal from a full-screen takeover to a centered, content-fitted panel with a backdrop behind it.

### Changes to `src/components/game/EvolutionShardsModal.tsx`:

1. **Wrap in a backdrop + centered container** — Replace the single `fixed inset-0` full-screen div with:
   - An outer backdrop div (`fixed inset-0 bg-black/70`) for the dark overlay
   - An inner content panel that auto-sizes to fit its content using `max-w-[260px] max-h-[90vh]` with the purple gradient background, positioned at the left or center of the screen

2. **Content panel styling** — Apply `rounded-lg`, `border`, and the gradient background only to the inner panel, so the empty space shows the backdrop instead of colored empty space

3. **Maintain scrollability** — Keep the `overflow-y-auto` on the card grid area within the now-smaller panel so cards still scroll if they exceed the panel height

This way the purple gradient only covers the actual content area, and no arrow keys are needed since the panel fits naturally within the viewport.

