<script>
  const themes = ["flowers", "animals", "sports", "space", "ocean"];
  const stars = [
    { id: "van", label: "Van" },
    { id: "memory-verse", label: "Memory Verse" },
    { id: "prayer", label: "Prayer" },
    { id: "tutoring", label: "Tutoring" },
    { id: "okay", label: "OKAY rules" },
  ];
</script>

<svelte:head
  ><title>Student Star Stickers — Greenhouse Church</title></svelte:head
>

<div class="page-shell sticker-page">
  <div class="no-print">
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
      aria-label="Twenty-five student award stickers; theme columns are flowers, animals, sports, space, and ocean"
    >
      {#each stars as star}
        {#each themes as theme}
          <img
            src={`/stickers/${theme}/${star.id}.png?v=star-shapes-2`}
            alt={`${star.label} star, ${theme} theme`}
          />
        {/each}
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
    padding: 0.35in;
    background: white;
    display: grid;
    grid-template-columns: repeat(5, 1.48in);
    grid-template-rows: repeat(5, 1.48in);
    gap: 0.3in 0.1in;
    align-content: center;
    justify-content: center;
  }
  .sheet img {
    width: 1.258in;
    height: 1.258in;
    object-fit: contain;
    place-self: center;
  }
  .no-print p {
    margin: 0.75rem 0;
    line-height: 1.5;
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
