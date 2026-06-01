import type { MembershipTier } from '@/types'

export const MEMBERSHIP_TIER_ORDER: MembershipTier[] = [
  'cadet',
  'navigator',
  'pilot',
  'commander',
  'admiral',
]

export const DEFAULT_MEMBERSHIP_TIER: MembershipTier = 'cadet'

export const MEMBERSHIP_TIER_LABELS: Record<MembershipTier, string> = {
  cadet: 'Reader',
  navigator: 'Navigator',
  pilot: 'Analyst',
  commander: 'Mentor',
  admiral: 'Steward',
}

export function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === 'string' && MEMBERSHIP_TIER_ORDER.includes(value as MembershipTier)
}

export function normalizeMembershipTier(value: unknown): MembershipTier {
  return isMembershipTier(value) ? value : DEFAULT_MEMBERSHIP_TIER
}

export function getMembershipTierRank(tier: MembershipTier) {
  return MEMBERSHIP_TIER_ORDER.indexOf(tier)
}

export function canAccessTier(
  userTier: MembershipTier | null | undefined,
  requiredTier: MembershipTier | null | undefined,
) {
  if (!requiredTier) return true

  return getMembershipTierRank(normalizeMembershipTier(userTier)) >= getMembershipTierRank(requiredTier)
}

export function getRequiredTierLabel(requiredTier: MembershipTier | null | undefined) {
  if (!requiredTier) return 'Reader'

  return MEMBERSHIP_TIER_LABELS[requiredTier]
}
