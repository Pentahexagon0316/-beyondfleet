export type SourceCategory =
  | 'public-institutional'
  | 'commercial-licensed-api'
  | 'editorial-reporting'
  | 'internal-editorial'

export type RedistributionPolicy =
  | 'allowed-with-attribution'
  | 'licensed-only'
  | 'no-redistribution'
  | 'internal-only'

export type CachePolicy =
  | 'allowed'
  | 'allowed-with-review'
  | 'contract-dependent'
  | 'link-and-citation-only'

export interface SourcePolicy {
  id: string
  name: string
  category: SourceCategory
  usage: string
  attribution: string
  redistribution: RedistributionPolicy
  caching: CachePolicy
  requiresCommercialReview: boolean
  notes: string
}

export const SOURCE_POLICIES: SourcePolicy[] = [
  {
    id: 'fred',
    name: 'FRED',
    category: 'public-institutional',
    usage: 'Use for macro time series and historical context.',
    attribution: 'Source: FRED, Federal Reserve Bank of St. Louis, series name, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Use efficient requests. Preserve series labels and release context.',
  },
  {
    id: 'imf',
    name: 'International Monetary Fund',
    category: 'public-institutional',
    usage: 'Use for published statistical data, WEO context, reserves, exchange rates, and country-level macro context.',
    attribution: 'Source: International Monetary Fund, database or dataset name, link, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'State when IMF data has been materially transformed. Check dataset-specific third-party restrictions.',
  },
  {
    id: 'world-bank',
    name: 'World Bank',
    category: 'public-institutional',
    usage: 'Use for country-level development and macro indicators.',
    attribution: 'Source: World Bank, dataset or indicator name, link, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Check indicator metadata for exceptions and third-party restrictions.',
  },
  {
    id: 'oecd',
    name: 'OECD',
    category: 'public-institutional',
    usage: 'Use for OECD datasets, policy indicators, and country comparisons.',
    attribution: 'Source: OECD, dataset name, data source, DOI or URL, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Check source metadata for third-party ownership or additional restrictions.',
  },
  {
    id: 'bls',
    name: 'U.S. Bureau of Labor Statistics',
    category: 'public-institutional',
    usage: 'Use for labor, CPI, PPI, wages, and employment data.',
    attribution: 'Source: U.S. Bureau of Labor Statistics, series or release name, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Do not imply BLS endorses derived analysis. Respect automated retrieval limits.',
  },
  {
    id: 'federal-reserve',
    name: 'Federal Reserve',
    category: 'public-institutional',
    usage: 'Use for policy statements, balance sheet data, reserve balances, and official statistical releases.',
    attribution: 'Source: Federal Reserve, release or dataset name, link, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Separate official data from BeyondFleet interpretation. Avoid implying Federal Reserve endorsement.',
  },
  {
    id: 'us-treasury',
    name: 'U.S. Department of the Treasury',
    category: 'public-institutional',
    usage: 'Use for Treasury yield curve, bill rates, debt, cash, and official fiscal data.',
    attribution: 'Source: U.S. Department of the Treasury, dataset or release name, link, accessed date.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Preserve date, maturity, and methodology context when using rates or fiscal series.',
  },
  {
    id: 'sec-edgar',
    name: 'SEC EDGAR',
    category: 'public-institutional',
    usage: 'Use for company filings and issuer disclosures.',
    attribution: 'Source: SEC EDGAR, filing type, company, filing date, accession or link.',
    redistribution: 'allowed-with-attribution',
    caching: 'allowed-with-review',
    requiresCommercialReview: false,
    notes: 'Respect SEC fair access limits and identify automated requests properly.',
  },
  {
    id: 'tradingeconomics',
    name: 'TradingEconomics',
    category: 'commercial-licensed-api',
    usage: 'Use only under an active plan that permits the intended product surface.',
    attribution: 'Source: TradingEconomics, subject to license.',
    redistribution: 'licensed-only',
    caching: 'contract-dependent',
    requiresCommercialReview: true,
    notes: 'Confirm commercial use, caching, redistribution, display, and user access terms before launch.',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    category: 'commercial-licensed-api',
    usage: 'Use only under an active market data license.',
    attribution: 'Source: Polygon.io, subject to license.',
    redistribution: 'licensed-only',
    caching: 'contract-dependent',
    requiresCommercialReview: true,
    notes: 'Do not expose raw data outside permitted plan terms.',
  },
  {
    id: 'finnhub',
    name: 'Finnhub',
    category: 'commercial-licensed-api',
    usage: 'Use only under an active plan that permits commercial display and derived works.',
    attribution: 'Source: Finnhub, subject to license.',
    redistribution: 'licensed-only',
    caching: 'contract-dependent',
    requiresCommercialReview: true,
    notes: 'Verify quote, news, fundamentals, and redistribution permissions separately.',
  },
  {
    id: 'alpha-vantage',
    name: 'Alpha Vantage',
    category: 'commercial-licensed-api',
    usage: 'Use only within plan limits and permitted display terms.',
    attribution: 'Source: Alpha Vantage, subject to license.',
    redistribution: 'licensed-only',
    caching: 'contract-dependent',
    requiresCommercialReview: true,
    notes: 'Confirm API call limits, data display, and caching permissions.',
  },
  {
    id: 'nasdaq-data-link',
    name: 'Nasdaq Data Link',
    category: 'commercial-licensed-api',
    usage: 'Use only under dataset-specific license terms.',
    attribution: 'Source: Nasdaq Data Link, dataset name, subject to license.',
    redistribution: 'licensed-only',
    caching: 'contract-dependent',
    requiresCommercialReview: true,
    notes: 'Dataset providers may impose separate terms. Review each dataset independently.',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    category: 'editorial-reporting',
    usage: 'Use only as a cited reporting reference for editorial interpretation.',
    attribution: 'Source: Bloomberg reporting, article title or topic, date.',
    redistribution: 'no-redistribution',
    caching: 'link-and-citation-only',
    requiresCommercialReview: true,
    notes: 'Do not reproduce articles, paraphrase paywalled analysis, or rebuild proprietary coverage.',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    category: 'editorial-reporting',
    usage: 'Use only as a cited reporting reference for editorial interpretation.',
    attribution: 'Source: Reuters reporting, article title or topic, date.',
    redistribution: 'no-redistribution',
    caching: 'link-and-citation-only',
    requiresCommercialReview: true,
    notes: 'Do not redistribute article text or use AI to create near-copy summaries.',
  },
  {
    id: 'ft',
    name: 'Financial Times',
    category: 'editorial-reporting',
    usage: 'Use only as a cited reporting reference for editorial interpretation.',
    attribution: 'Source: Financial Times reporting, article title or topic, date.',
    redistribution: 'no-redistribution',
    caching: 'link-and-citation-only',
    requiresCommercialReview: true,
    notes: 'Do not use as a paywall circumvention source.',
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    category: 'editorial-reporting',
    usage: 'Use only as a cited reporting reference for editorial interpretation.',
    attribution: 'Source: Wall Street Journal reporting, article title or topic, date.',
    redistribution: 'no-redistribution',
    caching: 'link-and-citation-only',
    requiresCommercialReview: true,
    notes: 'Do not reproduce or closely paraphrase proprietary journalism.',
  },
  {
    id: 'beyondfleet-editorial',
    name: 'BeyondFleet Editorial Analysis',
    category: 'internal-editorial',
    usage: 'Use for interpretation, second-order analysis, assumptions, and reflection framing.',
    attribution: 'Source: BeyondFleet editorial analysis.',
    redistribution: 'internal-only',
    caching: 'allowed',
    requiresCommercialReview: false,
    notes: 'Clearly separate internal interpretation from third-party facts or data.',
  },
]

export function getSourcePolicy(sourceId: string) {
  return SOURCE_POLICIES.find((source) => source.id === sourceId)
}

export function formatAttribution(sourceId: string, detail?: string, accessedAt?: string) {
  const source = getSourcePolicy(sourceId)
  if (!source) return detail || 'Source: Unknown'

  const parts = [source.attribution]
  if (detail) parts.push(detail)
  if (accessedAt) parts.push(`accessed ${accessedAt}`)

  return parts.join(' · ')
}

export function requiresSourceReview(sourceId: string) {
  const source = getSourcePolicy(sourceId)
  return !source || source.requiresCommercialReview || source.redistribution !== 'allowed-with-attribution'
}
