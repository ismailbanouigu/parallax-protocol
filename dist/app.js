const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const connect = $("#polliConnect");
const appKey = window.PARALLAX_PROTOCOL_CONFIG?.appKey || "";

const INCIDENTS = [
  {
    id: "HELIOS DRIFT / 07",
    answer: "CHANNEL C",
    choices: ["CHANNEL A", "CHANNEL B", "CHANNEL C"],
    cipher: "Raw telemetry: a hot ion wake; pulse gaps of 5, 8, 13 seconds; sender repeats PRIORITY SEVEN. You do not have the rescue registry.",
    echo: "Rescue registry: Channel A serves tidal sources. Channel B serves synthetic clocks with equal pulse gaps. Channel C serves solar craft using a Fibonacci cadence. You cannot see raw telemetry.",
    demo: [
      ["The gaps are 5, 8, 13—each interval is the sum of the two before it. The source also radiates a hot ion wake.", "That cadence is decisive: the registry assigns Fibonacci solar craft to Channel C. Is the heat reading strong enough to rule out a tidal reflection?"],
      ["Yes. The spectrum is ionized and rising, not a cool reflected band. Channel A is inconsistent with both the heat and cadence.", "Then A fails on source type and B fails on equal spacing. Our shared hypothesis is Channel C."],
      ["Evidence summary: solar ion wake, Fibonacci gaps, priority seven. I support Channel C with high confidence.", "Registry summary: only Channel C accepts solar Fibonacci callers. Converged: Channel C."]
    ]
  },
  {
    id: "GLASS TIDE / 22",
    answer: "CHANNEL A",
    choices: ["CHANNEL A", "CHANNEL B", "CHANNEL C"],
    cipher: "Raw telemetry: cool saline scatter; reflected pings every 9 seconds; the source drifts with a lunar tide. You do not have the rescue registry.",
    echo: "Rescue registry: Channel A accepts tidal callers with cool reflected pings. Channel B requires an exact synthetic carrier. Channel C requires a hot ion trail. You cannot see raw telemetry.",
    demo: [
      ["The signal is cool, saline and moving with a lunar tide. Its nine-second pings look reflected rather than generated.", "The registry routes tidal callers with reflected pings to Channel A. Can you exclude a synthetic carrier hiding in the reflection?"],
      ["I can. The carrier phase wanders with the water; a synthetic clock would remain exact. The drift is physical.", "That removes B, while the cool spectrum removes C. Channel A is the sole match."],
      ["Summary: tidal drift, saline scatter, reflected pings. I support Channel A.", "Registry cross-check complete. Channel A accepts every observed condition."]
    ]
  },
  {
    id: "MUTE ORBIT / 41",
    answer: "CHANNEL B",
    choices: ["CHANNEL A", "CHANNEL B", "CHANNEL C"],
    cipher: "Raw telemetry: no heat bloom, no tidal drift; a perfectly equal 4-second carrier repeats with machine precision. You do not have the rescue registry.",
    echo: "Rescue registry: Channel A is reserved for tidal reflections. Channel B accepts synthetic clocks with equal cadence. Channel C requires a hot solar wake. You cannot see raw telemetry.",
    demo: [
      ["The carrier repeats every four seconds without measurable drift. There is neither heat bloom nor tidal movement.", "Equal machine cadence maps to Channel B. Before we converge, is the timing precision beyond a natural oscillator?"],
      ["Yes—phase error remains below the instrument floor across every repeat. It is intentionally clocked.", "Then A lacks tidal evidence and C lacks heat. Channel B fits the synthetic clock rule."],
      ["Final evidence: exact four-second cadence, zero natural drift, no heat. Channel B.", "Registry confirms Channel B as the only valid synthetic route."]
    ]
  }
];

let state = freshState();
function freshState() { return { incident: null, exchange: 0, nudge: "evidence", transcript: [], busy: false, demo: false, finished: false }; }
if (/^pk_[A-Za-z0-9_-]+$/.test(appKey)) connect.setAttribute("app-key", appKey);
function clean(value, fallback, limit = 420) { return String(value ?? fallback).replace(/[<>]/g, "").trim().slice(0, limit); }
function clamp(value, min, max, fallback) { const number = Number(value); return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback; }
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); window.setTimeout(() => el.classList.remove("show"), 3400); }
function timecode() { return `0${state.exchange}:${String(state.transcript.length * 7).padStart(2, "0")}`; }
function transcriptText() { return state.transcript.length ? state.transcript.map((entry) => `${entry.agent}: ${entry.message}`).join("\n") : "No public exchange yet."; }
function parseReply(raw) { const start = raw.indexOf("{"); const end = raw.lastIndexOf("}"); if (start < 0 || end <= start) throw new Error("An agent returned an unreadable transmission."); const data = JSON.parse(raw.slice(start, end + 1)); return { message: clean(data.message, "Signal received, but the reasoning was lost."), hypothesis: clean(data.hypothesis, "UNRESOLVED", 30).toUpperCase(), confidence: clamp(data.confidence, 0, 100, 50) }; }

async function askAgent(side, incoming = "") {
  const isCipher = side === "CIPHER";
  const privateEvidence = isCipher ? state.incident.cipher : state.incident.echo;
  const model = isCipher ? $("#modelA").value : $("#modelB").value;
  const other = isCipher ? "ECHO" : "CIPHER";
  const system = `You are ${side}, one of two radio-analysis agents in PARALLAX PROTOCOL. You are not an assistant. You and ${other} must identify the correct rescue channel, but you each have different private evidence. Never invent evidence or claim to see the other agent's private card. Make your reasoning legible to the other agent. The operator directive is ${state.nudge.toUpperCase()}. Reply in at most two concise sentences. Return ONLY JSON: {"message":"what you say publicly","hypothesis":"CHANNEL A, CHANNEL B, CHANNEL C, or UNRESOLVED","confidence":0-100}.`;
  const user = `Your private evidence:\n${privateEvidence}\n\nShared transcript:\n${transcriptText()}\n\nLatest message from ${other}: ${incoming || "None yet."}\n\nExchange ${state.exchange + 1} of 3. Follow the operator directive and advance the joint investigation.`;
  const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${connect.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, reasoning_effort: "low", temperature: 0.45, max_tokens: 420, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `${side} relay failed (${response.status})`);
  return parseReply(payload?.choices?.[0]?.message?.content || "");
}

function addMessage(agent, reply) {
  state.transcript.push({ agent, message: reply.message, hypothesis: reply.hypothesis, confidence: reply.confidence });
  const item = document.createElement("li"); item.className = agent === "CIPHER" ? "from-a" : "from-b";
  const meta = document.createElement("span"); meta.textContent = `${timecode()} / ${agent}`;
  const message = document.createElement("p"); message.textContent = reply.message;
  const tag = document.createElement("small"); tag.textContent = `${reply.hypothesis} · ${Math.round(reply.confidence)}%`;
  item.append(meta, message, tag); $("#transcript").append(item); item.scrollIntoView({ block: "nearest", behavior: "smooth" });
  const suffix = agent === "CIPHER" ? "A" : "B"; $(`#confidence${suffix}`).textContent = `${Math.round(reply.confidence)}%`; $(`#meter${suffix}`).style.width = `${reply.confidence}%`;
}
function setBusy(value) { state.busy = value; $("#nextExchange").disabled = value || !state.incident || state.finished; $("#startLive").disabled = value || !!state.incident; $("#startDemo").disabled = value || !!state.incident; $("#linkState").textContent = value ? "AGENTS THINKING" : state.finished ? "DECISION READY" : state.incident ? "RELAY OPEN" : "LINK DORMANT"; $("#nextExchange").firstChild.textContent = value ? "TRANSMITTING... " : "TRANSMIT NEXT EXCHANGE "; }
function chooseIncident() { return INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)]; }
function openCase({ demo = false } = {}) { state = freshState(); state.incident = chooseIncident(); state.demo = demo; $("#caseId").textContent = `CASE / ${state.incident.id}`; $("#roundsLeft").textContent = "3"; $("#turnLabel").textContent = demo ? "DEMO CHANNEL" : "LIVE CHANNEL"; $("#transcript").innerHTML = ""; $("#decision").hidden = true; $("#confidenceA").textContent = "—"; $("#confidenceB").textContent = "—"; $("#meterA").style.width = "0%"; $("#meterB").style.width = "0%"; setBusy(false); toast(demo ? "Demo case opened — zero Pollen used." : "Live case opened. Transmit the first exchange when ready."); }
function showDecision() { state.finished = true; $("#decision").hidden = false; $("#channelChoices").innerHTML = ""; state.incident.choices.forEach((choice) => { const button = document.createElement("button"); button.type = "button"; button.textContent = choice; button.addEventListener("click", () => decide(choice)); $("#channelChoices").append(button); }); $("#outcome").textContent = "Both views are on the record. The final choice is yours."; $("#decision").scrollIntoView({ behavior: "smooth", block: "center" }); setBusy(false); }
function decide(choice) { const correct = choice === state.incident.answer; $("#outcome").textContent = correct ? `${choice} confirmed. The two private views resolve into one safe route.` : `${choice} rejected. The shared evidence points to ${state.incident.answer}.`; $$("#channelChoices button").forEach((button) => { button.disabled = true; if (button.textContent === state.incident.answer) button.classList.add("correct"); }); toast(correct ? "Rescue channel locked. Shared truth recovered." : `Signal lost. Correct route: ${state.incident.answer}.`); }

async function advance(event) {
  if (!event.isTrusted || state.busy || state.finished || !state.incident) return;
  if (!state.demo && !connect.apiKey) { toast("Connect your Pollinations wallet before a live exchange."); return; }
  setBusy(true);
  try {
    let replyA, replyB;
    if (state.demo) {
      const pair = state.incident.demo[state.exchange];
      replyA = { message: pair[0], hypothesis: state.exchange ? state.incident.answer : "UNRESOLVED", confidence: 54 + state.exchange * 19 };
      replyB = { message: pair[1], hypothesis: state.exchange ? state.incident.answer : "UNRESOLVED", confidence: 61 + state.exchange * 17 };
    } else {
      replyA = await askAgent("CIPHER");
      addMessage("CIPHER", replyA);
      replyB = await askAgent("ECHO", replyA.message);
      addMessage("ECHO", replyB);
      state.exchange += 1; $("#roundsLeft").textContent = String(Math.max(0, 3 - state.exchange)); $("#turnLabel").textContent = `EXCHANGE ${state.exchange} COMPLETE`; if (state.exchange >= 3) showDecision(); else setBusy(false); return;
    }
    addMessage("CIPHER", replyA); addMessage("ECHO", replyB); state.exchange += 1; $("#roundsLeft").textContent = String(Math.max(0, 3 - state.exchange)); $("#turnLabel").textContent = `EXCHANGE ${state.exchange} COMPLETE`; if (state.exchange >= 3) showDecision(); else setBusy(false);
  } catch (error) { toast(clean(error.message, "The relay went silent. Try again.")); setBusy(false); }
}
function reset() { state = freshState(); $("#caseId").textContent = "CASE / NOT OPEN"; $("#linkState").textContent = "LINK DORMANT"; $("#roundsLeft").textContent = "3"; $("#turnLabel").textContent = "AWAITING CASE"; $("#transcript").innerHTML = '<li class="empty"><span>00:00</span><p>No case is open. Start a live relay or watch the zero-Pollen demo.</p></li>'; $("#decision").hidden = true; $("#confidenceA").textContent = "—"; $("#confidenceB").textContent = "—"; $("#meterA").style.width = "0%"; $("#meterB").style.width = "0%"; setBusy(false); toast("Relay reset. Private evidence erased."); }

$$('.directive-button').forEach((button) => button.addEventListener("click", () => { state.nudge = button.dataset.nudge; $$('.directive-button').forEach((item) => item.classList.toggle("active", item === button)); }));
$("#startLive").addEventListener("click", (event) => { if (!event.isTrusted) return; if (!connect.apiKey) { toast("Connect your Pollinations wallet to open a live case."); return; } openCase(); });
$("#startDemo").addEventListener("click", () => openCase({ demo: true }));
$("#heroDemo").addEventListener("click", () => { $("#relay").scrollIntoView({ behavior: "smooth" }); openCase({ demo: true }); });
$("#nextExchange").addEventListener("click", advance);
$("#resetGame").addEventListener("click", reset);
