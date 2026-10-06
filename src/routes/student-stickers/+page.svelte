<svelte:head><title>Student Star Stickers — Greenhouse Church</title></svelte:head>

<div class="page-shell sticker-page">
  <div class="no-print">
    <h1>Student Star Stickers</h1>
    <p>Five awards in five themes: flowers, animals, sports, space, and ocean. Each award appears once in each theme, with no text on the stickers.</p>
    <div class="actions">
      <button class="btn" onclick={() => window.print()}>Print / Save as PDF</button>
    </div>
    <p>US Letter portrait · 100% scale · no headers or footers. Print on full-sheet sticker paper and cut around each white border. This sheet is for hand cutting.</p>
    <p>The Van Star is earned after dropoff; Memory Verse and Prayer reward respect, Tutoring rewards focus, and the OKAY Star rewards following the OKAY rules without three strikes.</p>
    <a href="/student-expectations/">View student expectations</a>
  </div>
  <div class="sheet-wrap">
    <main class="sheet" aria-label="Twenty-five student award stickers; theme columns are flowers, animals, sports, space, and ocean">
      {#each stars as star}
        {#each themes as theme}
          <img src={`/stickers/${theme}/${star.id}.png`} alt={`${star.label} star, ${theme} theme`} />
        {/each}
      {/each}
    </main>
  </div>
  <section class="downloads no-print" aria-label="Download individual stickers">
    <h2>Individual stickers</h2>
    <p>Columns on the sheet run left to right: flowers, animals, sports, space, ocean.</p>
    {#each themes as theme}
      <h3>{theme}</h3>
      <div class="actions">
        {#each stars as star}
          <a href={`/stickers/${theme}/${star.id}.png`} download>{star.label}</a>
        {/each}
      </div>
    {/each}
  </section>
</div>

<style>
  :global(:root) { --sheet-width: 8.5in; --sheet-height: 11in; --preview-scale: .7; }
  .sticker-page :global(.sheet) { padding: .35in; background: white; display: grid; grid-template-columns: repeat(5, 1.48in); grid-template-rows: repeat(5, 1.48in); gap: .3in .1in; align-content: center; justify-content: center; }
  .sheet img { width: 1.48in; height: 1.48in; object-fit: contain; }
  .downloads { margin-top: 2rem; }
  .downloads h3 { text-transform: capitalize; margin-top: 1.5rem; }
  .no-print h1 { margin-bottom: .75rem; }
  .no-print p { margin: .75rem 0; line-height: 1.5; }
  .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .75rem; margin: 1rem 0; }
  @media (max-width: 620px) { :global(:root) { --preview-scale: .42; } }
  @media print {
    @page { size: letter portrait; margin: 0; }
    .sheet img { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
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
