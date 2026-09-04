<script>
  import logo from "../../assets/logo.svg";
</script>

<svelte:head><title>Greenhouse Church — Programs Handout</title></svelte:head>
<div class="page-shell handout-page">
  <div class="no-print"><button class="btn" onclick={() => window.print()}>Print / Save as PDF</button></div>
  <div class="sheet-wrap"><div class="sheet">
    <div class="header"><img src={logo} alt="" /><div><h1>Fall Programs for Kids &amp; Youth</h1><p>Sponsored by Greenhouse Church • All programs are free of charge</p></div></div>
    <div class="programs">
      <div class="program"><h2>Tutoring</h2><div class="sub">Homework help and coaching for reading and math</div><div class="facts"><div><span class="label">Ages</span>Grades K–5</div><div><span class="label">Day</span>Mondays</div><div><span class="label">Time</span>6:00 – 7:45 PM</div><div><span class="label">Starts</span>August 17</div><div><span class="label">Location</span>2925 NW 29th Ave</div></div><div class="flags"><span class="contact">☎ Tess Bottenhorn, 904-401-0728</span><span>📄 Permission slip required</span><span>🚐 Transportation from Pineridge provided</span></div></div>
      <div class="program"><h2>Kids Church</h2><div class="sub">Prayer, teaching, and play</div><div class="facts"><div><span class="label">Ages</span>Grades K–5</div><div><span class="label">Day</span>Wednesdays</div><div><span class="label">Time</span>5:00 – 6:00 PM</div><div><span class="label">Starts</span>August 19</div><div><span class="label">Location</span>Pineridge Park</div></div><div class="flags"><span class="contact">☎ Cassidy Klein, 850-509-8283</span></div></div>
      <div class="program"><h2>Greenhouse Youth</h2><div class="sub">Worship, prayer, and community</div><div class="facts"><div><span class="label">Ages</span>Grades 6–12</div><div><span class="label">Day</span>Wednesdays</div><div><span class="label">Time</span>6:00 – 9:00 PM</div><div><span class="label">Starts</span>August 19</div><div><span class="label">Location</span>11200 NW 39th Ave</div></div><div class="flags"><span class="contact">☎ Fausto Morales, 305-394-2645</span><span>📄 Permission slip required</span><span>🚐 Transportation from Pineridge provided</span><span>🍽 Food provided</span></div></div>
    </div>
    <div class="footer">greenhousechurch.org &nbsp;·&nbsp; Please call or text the contact for each program with any questions.</div>
  </div></div>
</div>

<style>
  :global(:root){--sheet-width:8.5in;--sheet-height:11in;--preview-scale:.8}.handout-page :global(.sheet){padding:.55in .6in;display:flex;flex-direction:column}.header{display:flex;align-items:center;gap:.3in;border-bottom:3px solid var(--color-primary);padding-bottom:.3in}.header img{width:.82in;height:.82in;flex-shrink:0}.header h1{font-size:26pt;color:var(--color-primary-dark);line-height:1.15}.header p{color:var(--color-muted);font-size:11pt;margin-top:.05in}.programs{display:flex;flex-direction:column;gap:.28in;margin-top:.35in;flex-grow:1}.program{border:1.5px solid var(--color-primary-light);border-left:6px solid var(--color-accent);border-radius:8px;padding:.24in .3in}.program h2{font-size:15pt;color:var(--color-primary-dark)}.sub{font-size:10pt;color:var(--color-accent);font-weight:600;text-transform:uppercase;letter-spacing:.03em;margin-top:.02in}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:.06in .3in;margin-top:.14in;font-size:10.5pt}.label{display:block;font-size:8pt;color:var(--color-muted);text-transform:uppercase;letter-spacing:.03em}.flags{margin-top:.1in;display:grid;grid-template-columns:repeat(3,max-content);justify-content:space-between;gap:.06in .3in;font-size:9.5pt;font-weight:600;color:var(--color-primary-dark)}.contact{grid-column:1/-1}.footer{margin-top:.3in;padding-top:.2in;border-top:1px solid var(--color-primary-light);text-align:center;font-size:9.5pt;color:var(--color-muted)}
</style>
