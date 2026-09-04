<script>
  import logo from "../../assets/logo.svg";
</script>
<svelte:head><title>Van Magnet — Greenhouse Church</title></svelte:head>
<div class="page-shell van-page"><div class="no-print"><button class="btn" onclick={() => window.print()}>Print / Save as PDF</button></div><div class="sheet-wrap"><div class="sheet"><img src={logo} alt="" /><h1>Pineridge Programs</h1><div class="programs">Tutoring • Kids Church • Youth</div><div class="footer">Sponsored by Greenhouse Church • greenhousechurch.org</div></div></div></div>
<style>
  :global(:root){--sheet-width:18in;--sheet-height:12in;--preview-scale:.4}.van-page :global(.sheet){background:var(--color-paper);border:.35in solid var(--color-primary);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:.5in;padding:.4in}.sheet img{width:4in;height:4in}.sheet h1{font-size:110pt;color:var(--color-primary-dark);letter-spacing:.01em;line-height:1}.programs{font-size:62pt;color:var(--color-ink);font-weight:700}.footer{font-size:34pt;color:var(--color-muted);font-weight:500}
</style>
