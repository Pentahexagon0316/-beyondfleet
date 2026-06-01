/**
 * BeyondFleet Email Templates
 * Premium dark-theme HTML email templates (Korean)
 */

const BRAND_COLORS = {
  bg: '#070b10',
  card: '#0f1520',
  border: 'rgba(255,255,255,0.08)',
  cyan: '#67e8f9',
  emerald: '#6ee7b7',
  amber: '#fcd34d',
  text: '#e2e8f0',
  muted: '#94a3b8',
  dimmed: '#64748b',
} as const

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://beyondfleet.io'

function baseLayout(content: string, preheader: string = ''): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>BeyondFleet</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND_COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_COLORS.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <div style="display:inline-block;width:44px;height:44px;background:linear-gradient(135deg,${BRAND_COLORS.cyan},${BRAND_COLORS.emerald});border-radius:12px;"></div>
              <p style="margin:12px 0 0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em;">BeyondFleet</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:${BRAND_COLORS.card};border:1px solid ${BRAND_COLORS.border};border-radius:16px;overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND_COLORS.dimmed};line-height:20px;">
                이 이메일은 BeyondFleet 알림 설정에 따라 발송되었습니다.
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="${SITE_URL}/dashboard/settings" style="color:${BRAND_COLORS.dimmed};text-decoration:underline;">알림 설정 변경</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}" style="color:${BRAND_COLORS.dimmed};text-decoration:underline;">beyondfleet.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/* ─── WELCOME EMAIL ─── */

export function welcomeEmailTemplate(displayName: string): { subject: string; html: string } {
  const name = displayName || '새로운 멤버'

  const content = `
    <td style="padding:40px 32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${BRAND_COLORS.cyan};text-transform:uppercase;letter-spacing:0.1em;">Welcome aboard</p>
      <h1 style="margin:0 0 20px;font-size:28px;font-weight:700;color:#fff;line-height:1.3;">
        ${escapeHtml(name)}님,<br/>BeyondFleet에 오신 걸 환영합니다 🚀
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${BRAND_COLORS.muted};line-height:26px;">
        뉴스를 읽고, 판단을 기록하고, 천천히 더 나아지는 공간입니다.
        매일 완벽할 필요 없습니다. 오늘은 하나만 읽어보세요.
      </p>

      <!-- Feature Cards -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr>
          <td style="padding:14px 16px;background:rgba(103,232,249,0.06);border:1px solid rgba(103,232,249,0.15);border-radius:12px;margin-bottom:8px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:${BRAND_COLORS.cyan};">📋 데일리 브리프</p>
            <p style="margin:4px 0 0;font-size:13px;color:${BRAND_COLORS.muted};line-height:20px;">매일 핵심 뉴스와 시장 분석을 한눈에</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:14px 16px;background:rgba(110,231,183,0.06);border:1px solid rgba(110,231,183,0.15);border-radius:12px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:${BRAND_COLORS.emerald};">📚 학습 트랙</p>
            <p style="margin:4px 0 0;font-size:13px;color:${BRAND_COLORS.muted};line-height:20px;">매크로 기초부터 AI 경제까지, 실전 지식 14개 레슨</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:14px 16px;background:rgba(252,211,77,0.06);border:1px solid rgba(252,211,77,0.15);border-radius:12px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:${BRAND_COLORS.amber};">🌐 인텔리전스</p>
            <p style="margin:4px 0 0;font-size:13px;color:${BRAND_COLORS.muted};line-height:20px;">세계 경제 지표와 투자 원칙을 한 페이지에서</p>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${SITE_URL}/briefs" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,${BRAND_COLORS.cyan},${BRAND_COLORS.emerald});color:#070b10;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
              오늘의 브리프 읽기 →
            </a>
          </td>
        </tr>
      </table>
    </td>`

  return {
    subject: `🚀 ${name}님, BeyondFleet에 오신 걸 환영합니다!`,
    html: baseLayout(content, `${name}님, BeyondFleet에서 첫 여정을 시작하세요.`),
  }
}

/* ─── TIER UPGRADE EMAIL ─── */

export function tierUpgradeEmailTemplate(
  displayName: string,
  newTier: string,
  newTierLabel: string,
  benefits: string[],
): { subject: string; html: string } {
  const name = displayName || '멤버'

  const benefitRows = benefits
    .map(
      (b) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:${BRAND_COLORS.text};line-height:22px;">
        <span style="color:${BRAND_COLORS.emerald};margin-right:8px;">✓</span> ${escapeHtml(b)}
      </td>
    </tr>`,
    )
    .join('')

  const content = `
    <td style="padding:40px 32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${BRAND_COLORS.emerald};text-transform:uppercase;letter-spacing:0.1em;">Tier Upgraded</p>
      <h1 style="margin:0 0 20px;font-size:28px;font-weight:700;color:#fff;line-height:1.3;">
        ${escapeHtml(name)}님의 등급이<br/>${escapeHtml(newTierLabel)}로 변경되었습니다 ⬆️
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${BRAND_COLORS.muted};line-height:26px;">
        새로운 등급에서 추가로 이용할 수 있는 기능들입니다:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;padding:20px;background:rgba(110,231,183,0.05);border:1px solid rgba(110,231,183,0.12);border-radius:12px;">
        ${benefitRows}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,${BRAND_COLORS.cyan},${BRAND_COLORS.emerald});color:#070b10;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
              대시보드 확인하기 →
            </a>
          </td>
        </tr>
      </table>
    </td>`

  return {
    subject: `⬆️ ${name}님의 등급이 ${newTierLabel}로 업그레이드되었습니다`,
    html: baseLayout(content, `${name}님, 새로운 등급 혜택을 확인하세요.`),
  }
}

/* ─── DAILY BRIEF DIGEST ─── */

export function dailyBriefDigestTemplate(
  briefTitle: string,
  briefSummary: string,
  marketSignals: Array<{ symbol: string; change: string; up: boolean }>,
): { subject: string; html: string } {
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

  const signalRows = marketSignals
    .slice(0, 6)
    .map(
      (s) => `
    <td style="padding:8px 12px;text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:700;color:${BRAND_COLORS.muted};letter-spacing:0.05em;">${escapeHtml(s.symbol)}</p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:${s.up ? BRAND_COLORS.emerald : '#f87171'};">${escapeHtml(s.change)}</p>
    </td>`,
    )
    .join('')

  const content = `
    <td style="padding:40px 32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${BRAND_COLORS.cyan};text-transform:uppercase;letter-spacing:0.1em;">Daily Brief</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
        ${escapeHtml(briefTitle)}
      </h1>
      <p style="margin:0 0 24px;font-size:13px;color:${BRAND_COLORS.dimmed};">${today}</p>
      <p style="margin:0 0 28px;font-size:15px;color:${BRAND_COLORS.muted};line-height:26px;">
        ${escapeHtml(briefSummary)}
      </p>

      ${
        marketSignals.length > 0
          ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:rgba(255,255,255,0.03);border:1px solid ${BRAND_COLORS.border};border-radius:12px;">
        <tr>
          <td style="padding:12px 16px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:${BRAND_COLORS.muted};">📈 오늘의 시장</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>${signalRows}</tr>
            </table>
          </td>
        </tr>
      </table>`
          : ''
      }

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${SITE_URL}/briefs" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,${BRAND_COLORS.cyan},${BRAND_COLORS.emerald});color:#070b10;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
              전체 브리프 읽기 →
            </a>
          </td>
        </tr>
      </table>
    </td>`

  return {
    subject: `📋 오늘의 브리프: ${briefTitle}`,
    html: baseLayout(content, `${today} — ${briefSummary.slice(0, 80)}...`),
  }
}

/* ─── WEEKLY SUMMARY ─── */

export function weeklySummaryTemplate(
  displayName: string,
  stats: {
    briefsRead: number
    lessonsCompleted: number
    reflections: number
    streak: number
    totalXp: number
  },
): { subject: string; html: string } {
  const name = displayName || '멤버'
  const weekRange = getWeekRange()

  const content = `
    <td style="padding:40px 32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${BRAND_COLORS.amber};text-transform:uppercase;letter-spacing:0.1em;">Weekly Summary</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
        ${escapeHtml(name)}님의 이번 주 요약
      </h1>
      <p style="margin:0 0 28px;font-size:13px;color:${BRAND_COLORS.dimmed};">${weekRange}</p>

      <!-- Stats Grid -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr>
          <td width="50%" style="padding:16px;background:rgba(103,232,249,0.06);border:1px solid rgba(103,232,249,0.12);border-radius:12px 0 0 12px;">
            <p style="margin:0;font-size:28px;font-weight:800;color:${BRAND_COLORS.cyan};">${stats.briefsRead}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${BRAND_COLORS.muted};">브리프 읽음</p>
          </td>
          <td width="50%" style="padding:16px;background:rgba(110,231,183,0.06);border:1px solid rgba(110,231,183,0.12);border-radius:0 12px 12px 0;">
            <p style="margin:0;font-size:28px;font-weight:800;color:${BRAND_COLORS.emerald};">${stats.lessonsCompleted}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${BRAND_COLORS.muted};">레슨 완료</p>
          </td>
        </tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr>
          <td width="50%" style="padding:16px;background:rgba(252,211,77,0.06);border:1px solid rgba(252,211,77,0.12);border-radius:12px 0 0 12px;">
            <p style="margin:0;font-size:28px;font-weight:800;color:${BRAND_COLORS.amber};">${stats.reflections}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${BRAND_COLORS.muted};">리플렉션 작성</p>
          </td>
          <td width="50%" style="padding:16px;background:rgba(255,255,255,0.03);border:1px solid ${BRAND_COLORS.border};border-radius:0 12px 12px 0;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#fff;">🔥 ${stats.streak}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${BRAND_COLORS.muted};">연속 학습일</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 28px;font-size:14px;color:${BRAND_COLORS.muted};line-height:24px;text-align:center;">
        총 <strong style="color:#fff;">${stats.totalXp} XP</strong> 획득 · 꾸준히 나아가고 있습니다 💪
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${SITE_URL}/learn" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,${BRAND_COLORS.amber},#f59e0b);color:#070b10;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
              이번 주 학습 계속하기 →
            </a>
          </td>
        </tr>
      </table>
    </td>`

  return {
    subject: `📊 ${name}님의 주간 요약 — 브리프 ${stats.briefsRead}개, 레슨 ${stats.lessonsCompleted}개 완료`,
    html: baseLayout(content, `이번 주 ${stats.briefsRead}개 브리프, ${stats.lessonsCompleted}개 레슨을 완료했습니다.`),
  }
}

/* ─── HELPERS ─── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getWeekRange(): string {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  return `${fmt(start)} — ${fmt(now)}`
}
