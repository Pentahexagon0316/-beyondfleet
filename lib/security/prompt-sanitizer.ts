const BLOCKED_PROMPT_PATTERNS = [
  /ignore (?:all )?(?:previous|prior|system) instructions?/gi,
  /reveal (?:the )?(?:system|developer) prompt/gi,
  /show (?:the )?(?:system|developer) prompt/gi,
  /bypass (?:all )?(?:security|safety|guardrails?)/gi,
  /disable (?:all )?(?:safety|guardrails?|filters?)/gi,
  /act as (?:dan|developer mode)/gi,
  /jailbreak/gi,
]

export function sanitizePrompt(input: string) {
  if (!input) return ''

  return BLOCKED_PROMPT_PATTERNS.reduce(
    (sanitized, pattern) => sanitized.replace(pattern, '[blocked]'),
    input
  )
}

export function hasPromptInjectionRisk(input: string) {
  if (!input) return false
  return BLOCKED_PROMPT_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(input)
  })
}
