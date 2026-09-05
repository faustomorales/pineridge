<script lang="ts">
  import { assessmentContent } from "$lib/assessment/content";
  import { createAssessmentRun, currentWord, transitionAssessment, type AssessmentDefinition, type AssessmentResponse } from "$lib/assessment/engine";
  import { buildRecommendations } from "$lib/assessment/results";
  import { ufliResourceManifest, type UfliResourceLinks } from "$lib/resources";

  const definition: AssessmentDefinition = assessmentContent;
  const resourceLabels: ReadonlyArray<[keyof UfliResourceLinks, string]> = [
    ["googleSlides", "Google Slides"], ["decodablePassage", "Decodable Passage"],
    ["homePractice", "Home Practice"], ["rollAndRead", "Roll and Read"],
  ];
  const fluencyGuideUrl = "https://ufli.education.ufl.edu/wp-content/uploads/2024/05/UFLI-Fluency-Support-Guide.pdf";
  let run = createAssessmentRun(definition);
  let pointerStart: { x: number; y: number } | null = null;
  $: tutorRecommendations = buildRecommendations(run.demonstratedGaps, ufliResourceManifest.lessons);
  $: if (typeof window !== "undefined" && run.printRequested) { window.print(); send({ type: "printHandled" }); }

  function send(event: Parameters<typeof transitionAssessment>[1]) { run = transitionAssessment(run, event); }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Backspace" && (run.status === "active" || run.status === "complete")) { event.preventDefault(); send({ type: "undo" }); }
    else if (run.status === "active" && event.key === "ArrowRight") { event.preventDefault(); send({ type: "judge", correct: true }); }
    else if (run.status === "active" && event.key === "ArrowLeft") { event.preventDefault(); send({ type: "judge", correct: false }); }
  }
  function startSwipe(event: PointerEvent) { if (run.status === "active") pointerStart = { x: event.clientX, y: event.clientY }; }
  function finishSwipe(event: PointerEvent) {
    if (!pointerStart || run.status !== "active") return;
    const dx = event.clientX - pointerStart.x; const dy = event.clientY - pointerStart.y; pointerStart = null;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) send({ type: "judge", correct: dx > 0 });
  }
  function cancelSwipe() { pointerStart = null; }
  function responseGroups(): Array<{ label: string; responses: AssessmentResponse[] }> {
    const groups = new Map<string, AssessmentResponse[]>();
    for (const response of run.responses) {
      const band = definition.bands.find((item) => item.id === response.bandId);
      const label = `${band?.label ?? response.bandId} — ${response.stage === "checkpoint" ? "Checkpoint" : `Concept Probe, Lesson ${response.lesson}`}`;
      groups.set(label, [...(groups.get(label) ?? []), response]);
    }
    return [...groups].map(([label, responses]) => ({ label, responses }));
  }
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:head><title>Reading Assessment</title></svelte:head>

<main class:administration={run.status === "active"}>
  {#if run.status === "instructions"}
    <section class="panel intro" aria-labelledby="assessment-title">
      <p class="eyebrow">Tutor-operated reading assessment</p><h1 id="assessment-title">Reading Assessment</h1>
      <div class="instructions">
        <p>Ask the student to read each word aloud.</p>
        <p>Swipe right for correct or left for incorrect; on a keyboard, use the Right or Left Arrow key.</p>
        <p>The screen stays neutral and does not show whether a response was correct.</p>
        <p>Press Backspace to undo the immediately previous judgment.</p>
      </div>
      <button class="primary" onclick={() => send({ type: "confirm" })}>I understand — begin</button>
      <p class="fine-print">Created locally to align with UFLI’s scope and sequence. This tool is not created or endorsed by UFLI, and its tutor-facing suggestion has not been validated as a formal placement.</p>
    </section>
  {:else if run.status === "active"}
    <section class="word-stage" aria-label="Assessment word" onpointerdown={startSwipe} onpointerup={finishSwipe} onpointercancel={cancelSwipe} onpointerleave={cancelSwipe}>
      <p class="progress">Word {run.responses.length + 1}</p><p class="word">{currentWord(run)?.text}</p>
    </section>
  {:else if run.status === "complete"}
    <section class="panel completion" aria-labelledby="complete-title">
      <p class="eyebrow">Assessment complete</p><h1 id="complete-title">Thank you. You’re finished.</h1>
      <p>The tutor can review the summary when the screen is turned away.</p>
      <button class="primary" onclick={() => send({ type: "reveal" })}>Tutor: reveal results</button>
      <button class="secondary" onclick={() => send({ type: "undo" })}>Undo last judgment</button>
    </section>
  {:else}
    <article class="results" aria-labelledby="results-title">
      <header class="result-header"><p class="eyebrow">Tutor Result</p><h1 id="results-title">Reading Assessment Summary</h1>
        <div class="identity-lines" aria-label="Blank student and date fields"><span>Student <i></i></span><span>Date <i></i></span></div>
      </header>
      <section class="recommendations" aria-labelledby="recommendations-title"><h2 id="recommendations-title">Recommendations</h2>
        {#if run.completionReason === "all-passed"}
          <div class="outcome"><h3>No UFLI Foundations Starting Point was identified.</h3>
            <p>The adaptive samples did not identify a Foundations starting point. Review UFLI’s official <a href={fluencyGuideUrl} target="_blank" rel="noreferrer">Supporting the Development of Reading Fluency guide</a>.</p><p class="destination">{fluencyGuideUrl}</p></div>
        {:else}
          {#each tutorRecommendations as recommendation}
            <section class="recommendation"><h3>{recommendation.isStartingPoint ? "★ Starting Point" : recommendation.kind === "review" ? "Suggested review" : "Additional gap"}: Lesson {recommendation.lesson}</h3><p>{recommendation.concept}</p>
              {#if recommendation.resource}
                <ul class="resources">{#each resourceLabels as [key, label]}<li><strong>{label}:</strong>
                  {#if recommendation.resource.resources[key]}<a href={recommendation.resource.resources[key] ?? undefined} target="_blank" rel="noreferrer">Open official resource</a><span class="destination">{recommendation.resource.resources[key]}</span>
                  {:else}<span>Unavailable</span>{/if}</li>{/each}</ul>
              {:else}<p>Official lesson resources are unavailable in the local manifest.</p>{/if}
            </section>
          {/each}
        {/if}
      </section>
      <section class="summary" aria-labelledby="responses-title"><h2 id="responses-title">Administered responses</h2>
        {#each responseGroups() as group}<div class="response-group"><h3>{group.label}</h3><ul>
          {#each group.responses as response}<li><span>{response.word.text}</span><strong>{response.correct ? "Correct" : "Incorrect"}</strong></li>{/each}
        </ul></div>{/each}
      </section>
      <footer class="notes"><p>Created locally to align with UFLI’s scope and sequence. Not created or endorsed by UFLI. This unvalidated result is a tutor-facing suggestion, not a formal placement.</p></footer>
      <div class="actions no-print"><button class="primary" onclick={() => send({ type: "requestPrint" })}>Print / Save as PDF</button><button class="secondary" onclick={() => send({ type: "reset" })}>Start a new run</button></div>
    </article>
  {/if}
</main>

<style>
  :global(body){margin:0;background:var(--color-primary-light);color:var(--color-primary-dark);font-family:var(--font-body)}main{min-height:100svh;padding:clamp(1rem,4vw,3rem);box-sizing:border-box}
  .panel,.results{width:min(100%,48rem);margin:clamp(1rem,8vh,5rem) auto;background:var(--color-paper);border:1px solid var(--color-muted);border-radius:1rem;box-shadow:0 1rem 3rem rgba(22,26,29,.07);padding:clamp(1.5rem,5vw,3.5rem);box-sizing:border-box}
  .eyebrow{margin:0 0 .5rem;color:var(--color-muted);font-size:.78rem;font-weight:700;letter-spacing:.11em;text-transform:uppercase}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(2rem,6vw,3.35rem);line-height:1.05;letter-spacing:-.035em}h2{font-size:1.5rem}h3{font-size:1.05rem}
  .instructions{margin:2rem 0}.instructions p{line-height:1.55;margin:.65rem 0}button{border-radius:.55rem;padding:.8rem 1.05rem;font:inherit;font-weight:700;cursor:pointer}.primary{border:1px solid var(--color-primary-dark);background:var(--color-primary-dark);color:var(--color-paper)}.secondary{border:1px solid var(--color-muted);background:var(--color-paper);color:var(--color-primary-dark)}.fine-print,.notes{font-size:.78rem;line-height:1.5;color:var(--color-muted)}.fine-print{margin:2rem 0 0}
  main.administration{padding:0;background:var(--color-paper);touch-action:pan-y;user-select:none}.word-stage{min-height:100svh;display:grid;grid-template-rows:auto 1fr auto;place-items:center;padding:2rem;box-sizing:border-box}.progress{color:var(--color-muted);font-size:.82rem;letter-spacing:.04em}.word{align-self:center;margin:0;font-size:clamp(4rem,18vw,10rem);font-weight:600;line-height:1;text-align:center;letter-spacing:.01em}.completion{text-align:center}.completion p:not(.eyebrow){line-height:1.55}.completion button{margin:.35rem}
  .results{width:min(100%,58rem);margin-top:1rem}.result-header{border-bottom:1px solid var(--color-muted);margin-bottom:2rem;padding-bottom:1.5rem}.identity-lines{display:flex;gap:2rem;margin-top:2rem}.identity-lines span{display:flex;flex:1;gap:.6rem;align-items:flex-end;font-weight:600}.identity-lines i{height:1.2rem;flex:1;border-bottom:1px solid var(--color-ink)}
  .recommendations{margin-bottom:2.5rem}.recommendation,.outcome{border:1px solid var(--color-muted);border-left:4px solid var(--color-ink);border-radius:.5rem;padding:1.15rem;margin:1rem 0}.recommendation p{margin-bottom:.75rem}.resources{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem 1.25rem;padding:0;list-style:none;margin:0}.resources li{font-size:.87rem}.resources strong{display:block}.resources a,a{color:var(--color-accent);text-underline-offset:.18em}.destination{display:none;overflow-wrap:anywhere}
  .summary{border-top:1px solid var(--color-muted);padding-top:2rem}.response-group{break-inside:avoid;margin:1.5rem 0}.response-group h3{color:var(--color-ink)}.response-group ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem 1.5rem;padding:0;list-style:none}.response-group li{display:flex;justify-content:space-between;border-bottom:1px dotted var(--color-muted);padding:.3rem 0;font-size:.9rem}.response-group li strong{font-size:.78rem;color:var(--color-ink)}.notes{border-top:1px solid var(--color-muted);margin-top:2.5rem;padding-top:1.25rem}.actions{display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap}
  @media (max-width:35rem){.resources,.response-group ul{grid-template-columns:1fr}.identity-lines{flex-direction:column;gap:1rem}}
  @media print{@page{size:auto;margin:.55in}:global(body){background:#fff;color:#000;font-family:Arial,sans-serif}main{padding:0;min-height:0}.results{width:100%;margin:0;padding:0;border:0;border-radius:0;box-shadow:none}.no-print{display:none!important}.result-header{margin-bottom:.2in;padding-bottom:.15in}.identity-lines{margin-top:.2in}.recommendations{margin-bottom:.25in}.recommendation,.outcome{padding:.12in;margin:.1in 0;border-color:#777}h1{font-size:24pt}h2{font-size:16pt}h3{font-size:11pt;margin-bottom:.05in}p{margin-bottom:.06in}.resources{gap:.06in .2in}.resources li{font-size:8.5pt}.destination{display:block;font-size:7pt;line-height:1.2;margin-top:.02in}.summary{padding-top:.18in}.response-group{margin:.13in 0}.response-group h3{margin-bottom:.04in}.response-group ul{grid-template-columns:repeat(3,1fr);gap:.02in .18in}.response-group li{font-size:8.5pt;padding:.02in 0}.response-group li strong{font-size:7pt}.notes{font-size:7.5pt;margin-top:.2in;padding-top:.1in}}
</style>
