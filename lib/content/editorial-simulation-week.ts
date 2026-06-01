export interface EditorialSimulationBrief {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  date: string
  cadence: string
  title: string
  summary: string
  category: string
  tags: string[]
  market_sentiment: 'neutral' | 'bullish' | 'bearish'
  is_premium: boolean
  is_published: boolean
  is_featured: boolean
  scheduled_for: string
  what_happened: string
  why_it_matters: string
  second_order_effects: string
  risk_conditions: string
  reflection_prompt: string
  related_lesson_ids: string[]
  predictions: string[]
  key_events: Array<{ date: string; title: string; impact: 'low' | 'medium' | 'high' }>
  editor_notes: string
  full_content: string
}

function buildFullContent(brief: Omit<EditorialSimulationBrief, 'full_content'>) {
  return [
    `## What changed\n\n${brief.what_happened}`,
    `## Why it may matter\n\n${brief.why_it_matters}`,
    `## What could change next\n\n${brief.second_order_effects}`,
    `## What remains unclear\n\n${brief.risk_conditions}`,
    `## Question to carry forward\n\n${brief.reflection_prompt}`,
  ].join('\n\n')
}

const simulationBriefInputs: Array<Omit<EditorialSimulationBrief, 'full_content'>> = [
  {
    day: 'Monday',
    date: '2026-05-11',
    cadence: 'Macro Reset',
    title: 'The Week Opens With a Liquidity Breadth Test',
    summary: 'The useful question for the week is whether risk appetite is broadening, or only leaning on a narrow set of familiar winners.',
    category: 'macro',
    tags: ['liquidity', 'breadth', 'macro-reset'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-11T07:00:00+10:00',
    what_happened: 'The week begins with a familiar tension: risk appetite looks more stable than the underlying evidence. A few high-confidence themes can carry attention, while breadth, funding conditions, and policy expectations may be less settled. The first read should focus on whether participation is widening or whether confidence is concentrated in narrow leadership.',
    why_it_matters: 'Macro judgment weakens when a narrow signal is treated as a broad regime change. If liquidity is improving across more areas, the week can support a calmer risk posture. If only a few themes are carrying the surface, the better question is what condition would make confidence fade.',
    second_order_effects: 'A broadening tape would make related lessons on liquidity, dollar conditions, and second-order reactions more useful. A narrow tape would increase the value of patience: watch positioning, funding stress, and whether defensive behavior returns when the first positive narrative meets data.',
    risk_conditions: 'The main risk is mistaking stability for confirmation. The view weakens if breadth fails to improve, the dollar tightens financial conditions, or policy data pushes rate expectations against risk assets. A quiet start to the week should not be read as a durable answer.',
    reflection_prompt: 'What evidence would suggest that risk appetite is broadening rather than only concentrated?',
    related_lesson_ids: ['macro-foundations-liquidity', 'risk-thinking-second-order'],
    predictions: ['Watch breadth before direction', 'Compare dollar conditions with risk appetite', 'Revisit whether leadership is narrow by midweek'],
    key_events: [
      { date: 'Monday', title: 'Set the weekly macro question before reading daily noise', impact: 'medium' },
      { date: 'Midweek', title: 'Check whether liquidity signals confirm or contradict early risk appetite', impact: 'medium' },
    ],
    editor_notes: 'Opening brief should feel like a reset. Avoid dense data. Establish one weekly question that later briefs can revisit.',
  },
  {
    day: 'Tuesday',
    date: '2026-05-12',
    cadence: 'Rates / Liquidity',
    title: 'Rates Matter Most When Liquidity Looks Comfortable',
    summary: 'When liquidity feels supportive, rates become the quiet test of whether confidence is durable or just temporarily easier.',
    category: 'macro',
    tags: ['rates', 'liquidity', 'bonds'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-12T07:00:00+10:00',
    what_happened: 'The second day of the week narrows the question from broad risk appetite to the rate path behind it. A stable liquidity backdrop can make markets feel calmer, but the real test is whether rate expectations support that calm or quietly tighten the conditions underneath it.',
    why_it_matters: 'Rates translate future expectations into present discipline. If yields move against the liquidity story, duration-sensitive assets and long-horizon narratives can become fragile. If rates remain contained, the market has more room to treat the Monday reset as a real improvement rather than a short pause.',
    second_order_effects: 'The second-order effect is not only asset price movement. It is behavior. Investors may become more willing to extend duration, fund AI infrastructure stories, or hold risk if rate pressure stays contained. If rates rise, the same narratives require stronger evidence.',
    risk_conditions: 'This view weakens if the market treats lower volatility as proof that rates no longer matter. It also weakens if bond signals are ignored because equity leadership feels comfortable. The safer habit is to read liquidity and rates together, not as separate stories.',
    reflection_prompt: 'What rate signal would make Monday\'s liquidity read less reliable?',
    related_lesson_ids: ['macro-foundations-rates', 'macro-foundations-bonds'],
    predictions: ['Separate rate moves from risk appetite', 'Watch duration-sensitive narratives', 'Check whether calm survives policy data'],
    key_events: [
      { date: 'Tuesday', title: 'Compare rate expectations with liquidity confidence', impact: 'medium' },
      { date: 'Thursday', title: 'Revisit whether bond signals support or weaken the week view', impact: 'medium' },
    ],
    editor_notes: 'Use Tuesday to tighten the weekly thesis. Keep rates concrete and avoid turning this into a bond market lecture.',
  },
  {
    day: 'Wednesday',
    date: '2026-05-13',
    cadence: 'AI Economy',
    title: 'AI Capex Needs Macro Conditions, Not Just Conviction',
    summary: 'AI infrastructure remains a long-term story, but the week asks whether financing conditions support the pace of that story.',
    category: 'ai-economy',
    tags: ['ai-compute', 'capex', 'infrastructure'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-13T07:00:00+10:00',
    what_happened: 'Midweek shifts from macro conditions to the AI economy. The useful question is not whether AI demand exists. It is whether compute, power, data center spending, and financing conditions can keep moving together without forcing a harder capital discipline conversation.',
    why_it_matters: 'AI can support growth expectations while still being sensitive to rates and liquidity. A strong technology story does not remove macro constraints. It makes those constraints more important, because high investment expectations need patient capital and credible future cash flows.',
    second_order_effects: 'If financing remains supportive, AI infrastructure can reinforce the broader risk appetite discussed earlier in the week. If financing tightens, the story may rotate from expansion to efficiency: fewer broad winners, more scrutiny of margins, power access, and useful deployment.',
    risk_conditions: 'The view weakens if AI capex is treated as self-validating. Watch for rising funding costs, weaker guidance, power bottlenecks, or signs that automation claims are moving faster than adoption. The risk is not that AI disappears; it is that expectations outrun evidence.',
    reflection_prompt: 'Which AI infrastructure assumption needs more evidence before it becomes part of your long-term view?',
    related_lesson_ids: ['ai-economy-compute', 'ai-economy-data'],
    predictions: ['Connect AI capex to rates', 'Watch infrastructure bottlenecks', 'Separate adoption evidence from narrative strength'],
    key_events: [
      { date: 'Wednesday', title: 'Read AI demand through financing and infrastructure constraints', impact: 'medium' },
      { date: 'Friday', title: 'Revisit whether AI themes changed the weekly macro question', impact: 'low' },
    ],
    editor_notes: 'This should feel like a bridge between macro and AI, not a technology feature article.',
  },
  {
    day: 'Thursday',
    date: '2026-05-14',
    cadence: 'Risk Thinking',
    title: 'The Better Question Is What Would Make the View Wrong',
    summary: 'By Thursday, the week has enough structure to test its assumptions instead of collecting more signals.',
    category: 'risk-thinking',
    tags: ['probability', 'bias', 'risk-management'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-14T07:00:00+10:00',
    what_happened: 'The week has now built three linked ideas: liquidity breadth, rate pressure, and AI capex sensitivity. Thursday is the point to stop adding new branches and ask which assumption would make the chain feel less reliable. The useful work is to name that condition before the week ends.',
    why_it_matters: 'Judgment improves when a view has a clear failure point. Without that, every new signal can be bent to fit the original story. A calm risk process asks what would reduce confidence, what would require waiting, and what evidence would change the next action.',
    second_order_effects: 'If users can name the failure condition, Friday reflection becomes sharper. Lessons on probability, bias, and risk management become practical rather than abstract. The dashboard can then surface continuity without turning the week into analytics.',
    risk_conditions: 'The risk is overconfidence created by coherence. A week can feel intellectually clean while still being wrong. Watch for confirmation bias, recency bias, and the temptation to treat a calm narrative as a stronger narrative.',
    reflection_prompt: 'What single condition would make this week\'s macro view less reliable?',
    related_lesson_ids: ['risk-thinking-probability', 'risk-thinking-bias'],
    predictions: ['Name one condition to hold lightly', 'Reduce new inputs before weekly review', 'Check whether the view became too coherent'],
    key_events: [
      { date: 'Thursday', title: 'Turn the week thesis into a testable assumption', impact: 'high' },
      { date: 'Friday', title: 'Use the assumption as the basis for weekly reflection', impact: 'medium' },
    ],
    editor_notes: 'This is the week pivot. It should slow the reader down and reduce the desire for more information.',
  },
  {
    day: 'Friday',
    date: '2026-05-15',
    cadence: 'Weekly Reflection',
    title: 'What Changed in the Way You Read the Week?',
    summary: 'The weekly close should not add more noise. It should identify what changed in the reader\'s judgment process.',
    category: 'reflection',
    tags: ['weekly-review', 'reflection', 'assumptions'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-15T07:00:00+10:00',
    what_happened: 'The week moved from a macro reset to rates, AI infrastructure, and risk conditions. Friday does not need a new thesis. It needs a review of how those pieces changed the reader\'s view of the week: what became clearer, what remained uncertain, and what should be carried into the weekend.',
    why_it_matters: 'A learning platform earns trust when it helps users remember the right question, not just consume the next brief. Weekly reflection turns daily reading into durable judgment. It also prevents the product from becoming a content stream.',
    second_order_effects: 'If the reflection is specific, next week can begin with continuity rather than repetition. The dashboard can surface one assumption to revisit. Related lessons can feel timely because they connect to a question the reader already formed.',
    risk_conditions: 'The risk is making reflection feel like homework. If the prompt is too broad, it creates pressure. If it is too narrow, it becomes stiff. Friday should ask for one honest adjustment in thinking, not a complete self-analysis.',
    reflection_prompt: 'What did you become less certain about this week?',
    related_lesson_ids: ['risk-thinking-second-order', 'risk-thinking-risk-management'],
    predictions: ['Carry one assumption into the weekend', 'Avoid adding new themes late in the week', 'Use Monday as a continuity check'],
    key_events: [
      { date: 'Friday', title: 'Close the week with one changed assumption', impact: 'medium' },
      { date: 'Weekend', title: 'Review whether the assumption still deserves attention', impact: 'low' },
    ],
    editor_notes: 'Keep this brief lighter than the others. The emotional goal is closure, not analysis.',
  },
  {
    day: 'Saturday',
    date: '2026-05-16',
    cadence: 'Review & Assumptions Revisit',
    title: 'Revisit the Assumption Before Adding a New One',
    summary: 'The weekend review should help the reader revisit one assumption from the week without turning rest into analysis.',
    category: 'reflection',
    tags: ['assumption-revisit', 'weekend-review', 'continuity'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-16T09:00:00+10:00',
    what_happened: 'Saturday shifts the pace. The most useful action is not to read more. It is to revisit one assumption from the week: liquidity breadth, rate pressure, AI financing, or the condition named on Thursday.',
    why_it_matters: 'Assumptions become valuable only when they are revisited. A saved thought that is never checked becomes decoration. A revisited assumption becomes a record of how judgment changes over time.',
    second_order_effects: 'A good revisit can reduce cognitive load for the next week. The reader starts Monday with a cleaner question: keep watching, retire the assumption, or update it with a more precise condition. This makes continuity feel useful rather than busy.',
    risk_conditions: 'The weekend risk is over-processing. The revisit should not become a full report. If the reader cannot name why an assumption matters, it should be retired or rewritten. Clarity is the goal, not a longer note.',
    reflection_prompt: 'Which assumption from this week should you keep, rewrite, or retire?',
    related_lesson_ids: ['risk-thinking-probability', 'risk-thinking-bias'],
    predictions: ['Review one assumption only', 'Retire vague claims', 'Prepare one cleaner question for Monday'],
    key_events: [
      { date: 'Saturday', title: 'Review one saved assumption from the week', impact: 'low' },
      { date: 'Sunday', title: 'Carry forward only the assumption that remains useful', impact: 'low' },
    ],
    editor_notes: 'This should feel restorative. Keep the copy quiet and avoid productivity language.',
  },
  {
    day: 'Sunday',
    date: '2026-05-17',
    cadence: 'Review & Assumptions Revisit',
    title: 'Carry Forward One Question, Not a Full Dashboard',
    summary: 'The week should end with one question worth carrying forward, so Monday begins with continuity instead of more input.',
    category: 'reflection',
    tags: ['carry-forward', 'continuity', 'weekly-ritual'],
    market_sentiment: 'neutral',
    is_premium: false,
    is_published: false,
    is_featured: false,
    scheduled_for: '2026-05-17T09:00:00+10:00',
    what_happened: 'Sunday closes the simulation week by reducing the system to one carry-forward question. The week moved through liquidity, rates, AI infrastructure, and risk discipline. The final step is to choose what deserves attention tomorrow, not what deserves more content today.',
    why_it_matters: 'A daily intelligence product becomes sustainable when each week ends with less noise than it began. The user should feel prepared, not filled. One clear question creates continuity without pressure.',
    second_order_effects: 'If Sunday works, Monday can begin with a natural return loop. The Daily Brief can reference the carry-forward question, the learning path can support it, and the reflection layer can track whether the user\'s thinking changed.',
    risk_conditions: 'The risk is making continuity too explicit or too system-like. The user should not feel monitored. The carry-forward should feel like a personal note: simple, revisitable, and easy to ignore if it no longer matters.',
    reflection_prompt: 'What one question would make tomorrow\'s brief easier to read?',
    related_lesson_ids: ['macro-foundations-dollar', 'risk-thinking-second-order'],
    predictions: ['Carry one question into Monday', 'Keep continuity subtle', 'Avoid turning review into a task list'],
    key_events: [
      { date: 'Sunday', title: 'Choose one carry-forward question', impact: 'low' },
      { date: 'Monday', title: 'Use the question to start the next macro reset', impact: 'medium' },
    ],
    editor_notes: 'End with calm continuity. The reader should feel lighter, not obligated.',
  },
]

export const EDITORIAL_SIMULATION_WEEK: EditorialSimulationBrief[] = simulationBriefInputs.map((brief) => ({
  ...brief,
  full_content: buildFullContent(brief),
}))
