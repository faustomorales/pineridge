<script lang="ts">
  import { assessmentContent } from "$lib/assessment/content";
  import { createAssessmentRun, currentWord, transitionAssessment, type AssessmentDefinition, type AssessmentResponse } from "$lib/assessment/engine";
  import { buildEvidenceSummary, type Recommendation } from "$lib/assessment/results";
  import { ufliResourceManifest, type UfliResourceLinks } from "$lib/resources";

  const definition: AssessmentDefinition = assessmentContent;
  const resourceLabels: ReadonlyArray<[keyof UfliResourceLinks, string]> = [
    ["googleSlides", "Google Slides"], ["decodablePassage", "Decodable Passage"],
    ["homePractice", "Home Practice"], ["rollAndRead", "Roll and Read"],
  ];
  const fluencyGuideUrl = "https://ufli.education.ufl.edu/wp-content/uploads/2024/05/UFLI-Fluency-Support-Guide.pdf";
  const priorPlacementOptions = ["1", "35", "41", "53", "62", "68", "76", "83", "88", "94", "99", "119"];
  let run = createAssessmentRun(definition);
  let priorPlacementLesson = "";
  let pointerStart: { x: number; y: number } | null = null;
  let copyStatus = "";
  let showReasoning = false;
  $: tutorResult = buildEvidenceSummary(run.responses, run.demonstratedGaps, definition.bands, ufliResourceManifest.lessons);
  $: tutorResultItems = resultItems(tutorResult.demonstrated, tutorResult.firstGap);
  $: reasoningSteps = groupResponses(run.responses);
  $: if (typeof window !== "undefined" && run.printRequested) { window.print(); send({ type: "printHandled" }); }

  function send(event: Parameters<typeof transitionAssessment>[1]) {
    if (event.type === "reset") { showReasoning = false; priorPlacementLesson = ""; }
    const next = transitionAssessment(run, event);
    run = next.status === "complete"
      ? transitionAssessment(next, { type: "reveal" })
      : next;
  }
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
  async function copySequence() {
    const entries = run.responses.map((response) => `${response.word.text}-${response.correct ? "c" : "i"}`);
    if (run.priorPlacementLesson) entries.unshift(`prior-${run.priorPlacementLesson}`);
    const recommendationLesson = tutorResult.demonstrated?.lesson ?? tutorResult.firstGap?.lesson ?? "none";
    entries.push(`rec-${recommendationLesson}`);
    if (tutorResult.firstGap && tutorResult.firstGap.lesson !== recommendationLesson) {
      entries.push(`gap-${tutorResult.firstGap.lesson}`);
    }
    const sequence = entries.join(",");
    try {
      await navigator.clipboard.writeText(sequence);
      copyStatus = "Sequence copied";
    } catch {
      copyStatus = "Could not copy sequence";
    }
  }
  function resultItems(demonstrated: Recommendation | null, firstGap: Recommendation | null) {
    if (demonstrated && firstGap?.lesson === demonstrated.lesson) {
      return [{ label: "Most advanced demonstrated · First observed gap", recommendation: demonstrated }];
    }
    return [
      demonstrated && { label: "Most advanced demonstrated", recommendation: demonstrated },
      firstGap && { label: "First observed gap", recommendation: firstGap },
    ].filter((item): item is { label: string; recommendation: Recommendation } => Boolean(item));
  }
  function groupResponses(responses: readonly AssessmentResponse[]) {
    return responses.reduce<Array<{
      id: string;
      stage: AssessmentResponse["stage"];
      lesson?: string;
      concept?: string;
      bandLabel: string;
      responses: AssessmentResponse[];
    }>>((groups, response) => {
      const previous = groups.at(-1);
      if (previous?.id === response.groupId) {
        previous.responses.push(response);
        return groups;
      }
      groups.push({
        id: response.groupId,
        stage: response.stage,
        lesson: response.lesson,
        concept: response.concept,
        bandLabel: definition.bands.find((band) => band.id === response.bandId)?.label ?? response.bandId,
        responses: [response],
      });
      return groups;
    }, []);
  }
  function stepOutcome(step: (typeof reasoningSteps)[number]) {
    const correct = step.responses.filter((response) => response.correct).length;
    const incorrect = step.responses.length - correct;
    if (step.stage === "checkpoint") {
      return correct >= 4
        ? "Checkpoint passed; the search jumped ahead."
        : "Checkpoint showed difficulty; the search returned to the mastery neighborhood.";
    }
    return correct >= 2
      ? "Probe passed; this moved the demonstrated frontier forward."
      : incorrect >= 2
        ? "Probe showed a gap; the search narrowed toward the frontier."
        : "Probe supplied partial evidence.";
  }
  function stepLessons(step: (typeof reasoningSteps)[number]) {
    return [...new Set(step.responses.flatMap((response) => response.word.evidenceFor))]
      .sort((left, right) => Number.parseFloat(left) - Number.parseFloat(right))
      .join(", ");
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
      <label class="placement-field" for="prior-placement"><span>Most recent UFLI placement <small>Optional</small></span>
        <select id="prior-placement" bind:value={priorPlacementLesson}><option value="">Start from the beginning</option>{#each priorPlacementOptions as lesson}<option value={lesson}>Lesson {lesson}</option>{/each}</select>
        <small>This only chooses where probing begins; the student’s responses determine the recommendation.</small>
      </label>
      <button class="primary" onclick={() => send({ type: "confirm", priorPlacementLesson: priorPlacementLesson || undefined })}>I understand — begin</button>
      <p class="fine-print">Created locally to align with UFLI’s scope and sequence. This tool is not created or endorsed by UFLI, and its tutor-facing suggestion has not been validated as a formal placement.</p>
    </section>
  {:else if run.status === "active"}
    <section class="word-stage" aria-label="Assessment word" onpointerdown={startSwipe} onpointerup={finishSwipe} onpointercancel={cancelSwipe} onpointerleave={cancelSwipe}>
      <p class="progress">Word {run.responses.length + 1}</p><p class="word">{currentWord(run)?.text}</p>
    </section>
  {:else}
    <article class="results" aria-labelledby="results-title">
      <header class="result-header"><p class="eyebrow">Tutor Result</p><h1 id="results-title">Reading Assessment Result</h1></header>
      <section class="recommendations" aria-labelledby="recommendations-title"><h2 id="recommendations-title">Recommendations</h2>
        {#if run.completionReason === "all-passed"}
          <div class="outcome"><h3>No UFLI Foundations Starting Point was identified.</h3>
            <p>The adaptive samples did not identify a Foundations starting point. Review UFLI’s official <a href={fluencyGuideUrl} target="_blank" rel="noreferrer">Supporting the Development of Reading Fluency guide</a>.</p><p class="destination">{fluencyGuideUrl}</p></div>
        {:else if tutorResultItems.length === 0}
          <div class="outcome"><h3>Lesson 1</h3><p>No positive lesson evidence was recorded.</p></div>
        {:else}
          {#each tutorResultItems as item}
            <section class="recommendation"><p class="result-label">{item.label}</p><h3>Lesson {item.recommendation.lesson}</h3><p>{item.recommendation.concept}</p>
              {#if item.recommendation.resource}
                <div class="resources" aria-label={`Official resources for Lesson ${item.recommendation.lesson}`}>
                  {#each resourceLabels as [key, label]}
                    {#if item.recommendation.resource.resources[key]}<a class="resource-chip" href={item.recommendation.resource.resources[key] ?? undefined} target="_blank" rel="noreferrer">{label}</a><span class="destination">{label}: {item.recommendation.resource.resources[key]}</span>
                    {:else}<span class="resource-chip unavailable" aria-label={`${label} unavailable`} aria-disabled="true" title="Unavailable for this lesson">{label}</span>{/if}
                  {/each}
                  <a class="resource-chip toolbox" href={item.recommendation.resource.sourceUrl} target="_blank" rel="noreferrer">View in UFLI Toolbox</a><span class="destination">UFLI Toolbox: {item.recommendation.resource.sourceUrl}</span>
                </div>
              {:else}<p>Official lesson resources are unavailable in the local manifest.</p>{/if}
            </section>
          {/each}
        {/if}
      </section>
      {#if showReasoning}
        <section id="recommendation-path" class="reasoning no-print" aria-labelledby="reasoning-title">
          <div class="reasoning-heading"><div><p class="eyebrow">Assessment path</p><h2 id="reasoning-title">How the recommendations were reached</h2></div><p>{run.priorPlacementLesson ? `Probing began near Lesson ${run.priorPlacementLesson} based on the optional prior placement. ` : ""}Each stop shows the words the tutor marked and how that evidence changed the adaptive search.</p></div>
          <ol class="reasoning-path">
            {#each reasoningSteps as step, index}
              <li class="reasoning-step">
                <div class="step-marker" aria-hidden="true">{index + 1}</div>
                <div class="step-card">
                  <p class="step-type">{step.stage === "checkpoint" ? `Broad checkpoint · Lesson evidence ${stepLessons(step)}` : `Focused probe · Lesson ${step.lesson}`}</p>
                  <h3>{step.stage === "checkpoint" ? step.bandLabel : step.concept}</h3>
                  <div class="word-evidence" aria-label="Tutor judgments">
                    {#each step.responses as response}<span class:correct={response.correct} class:incorrect={!response.correct}>{response.word.text}<small>{response.correct ? "correct" : "incorrect"}</small></span>{/each}
                  </div>
                  <p class="step-outcome">{stepOutcome(step)}</p>
                </div>
              </li>
            {/each}
            <li class="reasoning-step result-step">
              <div class="step-marker" aria-hidden="true">✓</div>
              <div class="step-card"><p class="step-type">Resulting bracket</p>
                {#if tutorResult.demonstrated}<h3>Demonstrated through Lesson {tutorResult.demonstrated.lesson}</h3>{/if}
                {#if tutorResult.firstGap}<p>First nearby observed gap: Lesson {tutorResult.firstGap.lesson}</p>{:else}<p>No nearby lesson gap was observed.</p>{/if}
              </div>
            </li>
          </ol>
        </section>
      {/if}
      <footer class="notes"><p>Created locally to align with UFLI’s scope and sequence. Not created or endorsed by UFLI. This unvalidated result is a tutor-facing suggestion, not a formal placement.</p></footer>
      <div class="actions no-print"><button class="secondary" aria-expanded={showReasoning} aria-controls="recommendation-path" onclick={() => showReasoning = !showReasoning}>{showReasoning ? "Hide reasoning" : "Show reasoning"}</button><button class="primary" onclick={copySequence}>Copy test sequence</button><button class="secondary" onclick={() => send({ type: "requestPrint" })}>Print / Save as PDF</button><button class="secondary" onclick={() => send({ type: "reset" })}>Start a new run</button></div>
      {#if copyStatus}<p class="copy-status" aria-live="polite">{copyStatus}</p>{/if}
    </article>
  {/if}
</main>

<style>
  :global(body){margin:0;background:var(--color-primary-light);color:var(--color-primary-dark);font-family:var(--font-body)}main{min-height:100svh;padding:clamp(1rem,4vw,3rem);box-sizing:border-box}
  .panel,.results{width:min(100%,48rem);margin:clamp(1rem,8vh,5rem) auto;background:var(--color-paper);border:1px solid var(--color-muted);border-radius:1rem;box-shadow:0 1rem 3rem rgba(22,26,29,.07);padding:clamp(1.5rem,5vw,3.5rem);box-sizing:border-box}
  .eyebrow{margin:0 0 .5rem;color:var(--color-muted);font-size:.78rem;font-weight:700;letter-spacing:.11em;text-transform:uppercase}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(2rem,6vw,3.35rem);line-height:1.05;letter-spacing:-.035em}h2{font-size:1.5rem}h3{font-size:1.05rem}
  .instructions{margin:2rem 0}.instructions p{line-height:1.55;margin:.65rem 0}.placement-field{display:grid;gap:.45rem;margin:0 0 1.25rem;max-width:24rem;font-weight:750}.placement-field>span{display:flex;align-items:baseline;gap:.5rem}.placement-field small{color:var(--color-muted);font-size:.72rem;font-weight:500;line-height:1.4}.placement-field select{width:100%;border:1px solid var(--color-muted);border-radius:.55rem;background:var(--color-paper);color:var(--color-primary-dark);padding:.75rem;font:inherit}button{border-radius:.55rem;padding:.8rem 1.05rem;font:inherit;font-weight:700;cursor:pointer}.primary{border:1px solid var(--color-primary-dark);background:var(--color-primary-dark);color:var(--color-paper)}.secondary{border:1px solid var(--color-muted);background:var(--color-paper);color:var(--color-primary-dark)}.fine-print,.notes{font-size:.78rem;line-height:1.5;color:var(--color-muted)}.fine-print{margin:2rem 0 0}
  main.administration{padding:0;background:var(--color-paper);touch-action:pan-y;user-select:none}.word-stage{min-height:100svh;display:grid;grid-template-rows:auto 1fr auto;place-items:center;padding:2rem;box-sizing:border-box}.progress{color:var(--color-muted);font-size:.82rem;letter-spacing:.04em}.word{align-self:center;margin:0;font-size:clamp(4rem,18vw,10rem);font-weight:600;line-height:1;text-align:center;letter-spacing:.01em}
  .results{width:min(100%,58rem);margin-top:1rem}.result-header{border-bottom:1px solid var(--color-muted);margin-bottom:2rem;padding-bottom:1.5rem}
  .recommendations{margin-bottom:2.5rem}.recommendation,.outcome{border:1px solid var(--color-muted);border-left:4px solid var(--color-ink);border-radius:.5rem;padding:1.15rem;margin:1rem 0}.recommendation p{margin-bottom:.75rem}.result-label{color:var(--color-muted);font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.resources{display:flex;align-items:center;flex-wrap:wrap;gap:.55rem;margin-top:.9rem}.resource-chip{display:inline-flex;align-items:center;min-height:2rem;box-sizing:border-box;border:1px solid var(--color-muted);border-radius:99rem;padding:.35rem .75rem;background:var(--color-paper);font-size:.78rem;font-weight:750;line-height:1.15;color:var(--color-accent);text-decoration:none}.resource-chip[href]:hover{border-color:var(--color-accent);text-decoration:underline}.resource-chip.unavailable{background:var(--color-primary-light);border-color:transparent;color:var(--color-muted);opacity:.62}.resource-chip.toolbox{border-color:var(--color-accent)}a{color:var(--color-accent);text-underline-offset:.18em}.destination{display:none;overflow-wrap:anywhere}
  .reasoning{border-top:1px solid var(--color-muted);padding-top:2rem;margin-top:2.5rem}.results .reasoning.no-print{max-width:none;margin-right:0;margin-left:0;text-align:left}.reasoning-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(14rem,22rem);gap:2rem;align-items:start}.reasoning-heading h2{margin-bottom:0}.reasoning-heading>p{font-size:.88rem;line-height:1.5;color:var(--color-muted)}.reasoning-path{list-style:none;margin:1.75rem 0 0;padding:0}.reasoning-step{display:grid;grid-template-columns:2.25rem minmax(0,1fr);gap:.85rem;position:relative;padding-bottom:1rem}.reasoning-step:not(:last-child)::before{content:"";position:absolute;left:1.1rem;top:2.1rem;bottom:-.1rem;width:2px;background:var(--color-muted)}.step-marker{position:relative;z-index:1;width:2.25rem;height:2.25rem;border-radius:50%;display:grid;place-items:center;background:var(--color-primary-dark);color:var(--color-paper);font-size:.78rem;font-weight:800}.step-card{border:1px solid var(--color-muted);border-radius:.65rem;padding:1rem;background:color-mix(in srgb,var(--color-paper) 92%,var(--color-primary-light))}.step-card h3{margin-bottom:.75rem}.step-type{margin-bottom:.3rem;color:var(--color-muted);font-size:.72rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.word-evidence{display:flex;flex-wrap:wrap;gap:.5rem}.word-evidence span{display:inline-grid;grid-template-columns:auto auto;align-items:baseline;gap:.4rem;border-radius:99rem;padding:.35rem .65rem;font-weight:750}.word-evidence small{font-size:.62rem;font-weight:650}.word-evidence .correct{background:#dcebdd;color:#244c2c}.word-evidence .incorrect{background:#f1dfda;color:#713729}.step-outcome{margin:.8rem 0 0;font-size:.84rem;line-height:1.4;color:var(--color-muted)}.result-step .step-marker{background:var(--color-accent)}.result-step .step-card{border-color:var(--color-accent)}.result-step .step-card p:last-child{margin-bottom:0}
  .notes{border-top:1px solid var(--color-muted);margin-top:2.5rem;padding-top:1.25rem}.results .actions.no-print{display:flex;justify-content:flex-start;gap:.75rem;max-width:none;margin:1.5rem 0 0;padding:0;text-align:left;flex-wrap:wrap}.actions button{margin:0}.copy-status{font-size:.85rem;margin-top:.75rem}
  @media (max-width:35rem){.reasoning-heading{grid-template-columns:1fr}.reasoning-heading{gap:.25rem}.actions{flex-direction:column;align-items:flex-start}.actions button{width:auto}}
  @media print{@page{size:auto;margin:.55in}:global(body){background:#fff;color:#000;font-family:Arial,sans-serif}main{padding:0;min-height:0}.results{width:100%;margin:0;padding:0;border:0;border-radius:0;box-shadow:none}.no-print{display:none!important}.result-header{margin-bottom:.2in;padding-bottom:.15in}.recommendations{margin-bottom:.25in}.recommendation,.outcome{padding:.12in;margin:.1in 0;border-color:#777}h1{font-size:24pt}h2{font-size:16pt}h3{font-size:11pt;margin-bottom:.05in}p{margin-bottom:.06in}.resources{gap:.06in}.resource-chip{font-size:8.5pt;min-height:0;padding:.04in .08in}.destination{display:block;font-size:7pt;line-height:1.2;margin-top:.02in}.notes{font-size:7.5pt;margin-top:.2in;padding-top:.1in}}
</style>
