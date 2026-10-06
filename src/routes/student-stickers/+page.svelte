<script>
  let stickerSize = $state(0.75);
  const themes = ["flowers", "animals", "sports", "space", "ocean"];
  const stars = [
    { id: "van", label: "Van" },
    { id: "memory-verse", label: "Memory Verse" },
    { id: "prayer", label: "Prayer" },
    { id: "tutoring", label: "Tutoring" },
    { id: "okay", label: "OKAY rules" },
  ];
  const sheetWidth = 8.5;
  const sheetHeight = 11;
  const sheetPadding = 0.35;
  const cuttingGap = 0.1;
  const designs = stars.flatMap((star) =>
    themes.map((theme) => ({ star, theme })),
  );
  let columns = $derived(
    Math.floor((sheetWidth - 2 * sheetPadding + cuttingGap + 1e-9) / (stickerSize + cuttingGap)),
  );
  let rows = $derived(
    Math.floor((sheetHeight - 2 * sheetPadding + cuttingGap + 1e-9) / (stickerSize + cuttingGap)),
  );
  let stickerCount = $derived(columns * rows);
  let stickers = $derived(
    Array.from({ length: stickerCount }, (_, index) => designs[index % designs.length]),
  );
</script>

<svelte:head
  ><title>Student Star Stickers — Greenhouse Church</title></svelte:head
>

<div
  class="page-shell sticker-page"
  style={`--sheet-width: ${sheetWidth}in; --sheet-height: ${sheetHeight}in; --sheet-padding: ${sheetPadding}in; --cutting-gap: ${cuttingGap}in; --sticker-size: ${stickerSize}in; --sticker-columns: ${columns}; --sticker-rows: ${rows};`}
>
  <div class="no-print">
    <div class="size-control">
      <label for="sticker-size">Sticker size</label>
      <output for="sticker-size" aria-live="polite">{stickerSize.toFixed(2)} × {stickerSize.toFixed(2)} inches</output>
      <p class="sheet-count" aria-live="polite">{stickerCount} stickers per sheet · {columns} columns × {rows} rows</p>
      <input
        id="sticker-size"
        type="range"
        min="0.75"
        max="1.48"
        step="0.001"
        bind:value={stickerSize}
        aria-describedby="sticker-size-note"
        aria-valuetext={`${stickerSize.toFixed(2)} inches square`}
      />
      <div class="size-limits" aria-hidden="true"><span>0.75″</span><span>1.48″</span></div>
      <p id="sticker-size-note">Printed size includes the white margin around each star. Smaller sizes fit more stickers; the 25 designs repeat to fill the sheet.</p>
    </div>
    <div class="actions">
      <button class="btn" onclick={() => window.print()}
        >Print / Save as PDF</button
      >
    </div>
    <p>
      US Letter portrait · 100% scale · no headers or footers. Print on
      full-sheet sticker paper and cut around each white border.
    </p>
  </div>
  <div class="sheet-wrap">
    <main
      class="sheet"
      aria-label={`${stickerCount} student award stickers`}
    >
      {#each stickers as { star, theme }}
          <img
            src={`/stickers/${theme}/${star.id}.png?v=star-shapes-2`}
            alt={`${star.label} star, ${theme} theme`}
          />
      {/each}
    </main>
  </div>
</div>

<style>
  :global(:root) {
    --sheet-width: 8.5in;
    --sheet-height: 11in;
    --preview-scale: 0.7;
  }
  .sticker-page :global(.sheet) {
    padding: var(--sheet-padding);
    background: white;
    display: grid;
    grid-template-columns: repeat(var(--sticker-columns), var(--sticker-size));
    grid-template-rows: repeat(var(--sticker-rows), var(--sticker-size));
    gap: var(--cutting-gap);
    align-content: center;
    justify-content: center;
  }
  .sheet img {
    width: var(--sticker-size);
    height: var(--sticker-size);
    object-fit: contain;
    place-self: center;
  }
  .no-print p {
    margin: 0.75rem 0;
    line-height: 1.5;
  }
  .size-control {
    max-width: 26rem;
    margin: 0 auto;
  }
  .size-control label {
    display: block;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }
  .size-control output {
    display: block;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    margin-bottom: 0.5rem;
  }
  .size-control input {
    display: block;
    width: 100%;
    margin: 0;
    min-height: 2.75rem;
    accent-color: var(--color-primary);
    cursor: pointer;
  }
  .size-limits {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin: 1rem 0;
  }
  @media (max-width: 620px) {
    :global(:root) {
      --preview-scale: 0.42;
    }
  }
  @media print {
    @page {
      size: letter portrait;
      margin: 0;
    }
    .sheet img {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
</style>
