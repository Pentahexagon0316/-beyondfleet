import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const allowedEnvFiles = new Set(['.env.example', '.env.local.example'])
const forbiddenPathPrefixes = [
  '.next/',
  '.vercel/',
  'node_modules/',
  'coverage/',
  'dist/',
  'build/',
]

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)

const failures = []

for (const file of trackedFiles) {
  const baseName = file.split('/').at(-1) || file

  if (baseName.startsWith('.env') && !allowedEnvFiles.has(file)) {
    failures.push(`Tracked environment file is not allowed: ${file}`)
  }

  if (forbiddenPathPrefixes.some((prefix) => file.startsWith(prefix))) {
    failures.push(`Tracked generated or local-only path is not allowed: ${file}`)
  }
}

const secretAssignmentPattern =
  /^[ \t]*(?:SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY|CRON_SECRET|RESEND_API_KEY|WHALE_ALERT_API_KEY|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN)[ \t]*=[ \t]*(?!$|your_|use_a_long_random_value)[^\s#]+/m
const privateKeyPattern = /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/
const apiKeyPattern = /\bsk-(?:ant|proj|live|test)-[A-Za-z0-9_-]{20,}\b/

for (const file of trackedFiles) {
  let content = ''

  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  if (secretAssignmentPattern.test(content)) {
    failures.push(`Possible real secret assignment found in tracked file: ${file}`)
  }

  if (privateKeyPattern.test(content)) {
    failures.push(`Private key material found in tracked file: ${file}`)
  }

  if (apiKeyPattern.test(content)) {
    failures.push(`Possible API key found in tracked file: ${file}`)
  }
}

if (failures.length > 0) {
  console.error('Repository safety check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Repository safety check passed.')
