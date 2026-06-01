import { Cpu, DollarSign, Droplets, Landmark, LineChart, Waves, Coins, TrendingUp } from 'lucide-react'

export type AmbientSignalTone = 'calm' | 'mixed' | 'watch' | 'tight'

export interface AmbientMarketSignal {
  id: string
  symbol: string
  name: string
  region: string
  status: string
  tone: AmbientSignalTone
  context: string
  whatChanged: string
  whyMarketsCare: string
  unclear: string
  watch: string
  relatedLesson: {
    title: string
    href: string
    reason: string
  }
  sourceNote: string
  icon: typeof Landmark
}

const sourceNote = 'Market weather is a delayed editorial orientation layer, not a live quote feed. Confirm live prices and yields with official exchanges, brokers, or primary market data providers.'

export const ambientMarketSignals: AmbientMarketSignal[] = [
  {
    id: 'kospi',
    symbol: 'KOSPI',
    name: 'Korea equity tone',
    region: 'Korea',
    status: 'local risk appetite',
    tone: 'calm',
    context: 'KOSPI is useful as a quiet read on local growth expectations, exporters, semiconductors, and foreign flow sensitivity.',
    whatChanged: 'The useful signal is not one index move, but whether Korea risk is moving with global tech, local currency pressure, or domestic growth expectations.',
    whyMarketsCare: 'Korea often sits between global manufacturing, China demand, semiconductor cycles, and dollar liquidity. That makes it a compact macro weather check.',
    unclear: 'One session cannot separate local fundamentals from global risk appetite. Currency and foreign-flow context still matters.',
    watch: 'Watch whether equity strength can hold without new pressure from USD/KRW or global yields.',
    relatedLesson: {
      title: 'Dollar Cycle: strong dollar and weak dollar',
      href: '/learn/macro-foundations-dollar',
      reason: 'Korea risk often becomes easier to read when currency pressure is part of the frame.',
    },
    sourceNote,
    icon: Landmark,
  },
  {
    id: 'sp500',
    symbol: 'S&P500',
    name: 'US Large Cap Index',
    region: 'US',
    status: 'global equity benchmark',
    tone: 'calm',
    context: 'The S&P500 represents the core index for global asset allocation and broad equity risk sentiment.',
    whatChanged: 'Observing whether earnings growth supports current valuation multipliers across a high-interest-rate environment.',
    whyMarketsCare: 'It is the single most watched equity benchmark globally, driving active and passive capital flow worldwide.',
    unclear: 'Short-term passive capital flows can override fundamental macro changes.',
    watch: 'Watch whether market concentration in megacap tech increases or starts to broaden out to cyclical sectors.',
    relatedLesson: {
      title: 'Rates: interest rates and discount rates',
      href: '/learn/macro-foundations-rates',
      reason: 'Equity valuations are structurally tied to the discount rates set by long-term yields.',
    },
    sourceNote,
    icon: LineChart,
  },
  {
    id: 'nasdaq',
    symbol: 'NASDAQ',
    name: 'US Tech Benchmark',
    region: 'US',
    status: 'growth and tech sentiment',
    tone: 'mixed',
    context: 'NASDAQ tracks duration-sensitive technology, innovation, and high-growth equity sentiment.',
    whatChanged: 'Valuations are heavily pricing in the future productivity gains of the AI economy and infrastructure spending.',
    whyMarketsCare: 'Tech firms are highly duration-sensitive, meaning their future cash flows are heavily discounted by current interest rates.',
    unclear: 'Speculative tech bubbles can diverge from interest rate regimes for extended periods.',
    watch: 'Watch whether GPU demand translates to real corporate productivity and margin expansion.',
    relatedLesson: {
      title: 'Compute: GPU, power, and data centers',
      href: '/learn/ai-economy-compute',
      reason: 'Innovation cycles are the absolute bedrock of tech index outperformance.',
    },
    sourceNote,
    icon: TrendingUp,
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    region: 'Crypto',
    status: 'risk beta check',
    tone: 'mixed',
    context: 'BTC is a high-sensitivity risk asset and liquidity mood check. It should not dominate the reading flow.',
    whatChanged: 'The calmer read is whether BTC is moving with broad liquidity, dollar conditions, or crypto-specific positioning.',
    whyMarketsCare: 'When BTC moves with rates and liquidity, it can help reveal risk appetite. When it moves alone, the signal may be narrower.',
    unclear: 'ETF flows, leverage, and headline positioning can make short-term moves noisy.',
    watch: 'Watch whether BTC confirms or contradicts the tone from rates and equities.',
    relatedLesson: {
      title: 'Liquidity: the flow that moves markets',
      href: '/learn/macro-foundations-liquidity',
      reason: 'Liquidity gives a better frame than chasing each crypto move.',
    },
    sourceNote,
    icon: Waves,
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    region: 'Crypto',
    status: 'network risk tone',
    tone: 'mixed',
    context: 'ETH can reflect crypto risk appetite, network usage expectations, and broader beta to liquidity.',
    whatChanged: 'The useful question is whether ETH is moving because of crypto-specific flows or because risk appetite is shifting everywhere.',
    whyMarketsCare: 'ETH often sits between technology, liquidity, and on-chain activity narratives.',
    unclear: 'A price move alone does not tell whether usage, fees, positioning, or macro liquidity is responsible.',
    watch: 'Watch whether ETH strength is broad-based or only a catch-up move.',
    relatedLesson: {
      title: 'Second-Order Thinking: seeing the next response',
      href: '/learn/risk-thinking-second-order',
      reason: 'ETH narratives often require separating first moves from follow-on behavior.',
    },
    sourceNote,
    icon: Coins,
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    region: 'Crypto',
    status: 'high-beta tech sentiment',
    tone: 'mixed',
    context: 'SOL is a highly sensitive on-chain economic indicator, useful purely for measuring aggressive retail liquidity appetite.',
    whatChanged: 'Assessing if high-speed transactional network fees can remain sustainable without highly speculative cycles.',
    whyMarketsCare: 'SOL behaves as a high-beta proxy for retail speculative sentiment within decentralized application protocols.',
    unclear: 'Meme token speculative cycles distort underlying network utilization and active address metrics.',
    watch: 'Watch whether real educational on-chain utilities or stablecoin settlements can anchor the network during low-beta regimes.',
    relatedLesson: {
      title: 'Liquidity: the flow that moves markets',
      href: '/learn/macro-foundations-liquidity',
      reason: 'Solana is highly sensitive to broad dollar liquidity levels in global retail channels.',
    },
    sourceNote,
    icon: Waves,
  },
  {
    id: 'usd-krw',
    symbol: 'USD/KRW',
    name: 'Korean won',
    region: 'FX',
    status: 'currency pressure',
    tone: 'watch',
    context: 'USD/KRW is a quiet pressure gauge for Korea, foreign flow, imported inflation, and dollar liquidity.',
    whatChanged: 'The useful signal is whether won pressure is easing or tightening alongside global yields and dollar strength.',
    whyMarketsCare: 'FX pressure can change how local equities, exporters, inflation, and policy expectations are interpreted.',
    unclear: 'FX moves can reflect dollar strength, local growth, rates, intervention expectations, or global risk appetite.',
    watch: 'Watch whether USD/KRW pressure fades when global rates calm down.',
    relatedLesson: {
      title: 'Dollar Cycle: strong dollar and weak dollar',
      href: '/learn/macro-foundations-dollar',
      reason: 'Dollar cycles help connect FX moves to broader market pressure.',
    },
    sourceNote,
    icon: DollarSign,
  },
  {
    id: 'us10y',
    symbol: 'US10Y',
    name: 'US 10-year yield',
    region: 'Rates',
    status: 'discount-rate weather',
    tone: 'watch',
    context: 'The US 10-year yield is one of the cleanest background signals for discount rates, duration, and risk appetite.',
    whatChanged: 'The calmer read is whether yields are rising because growth looks stronger, inflation looks stickier, or supply/risk premium is changing.',
    whyMarketsCare: 'Higher long yields can pressure long-duration assets and reshape how growth stories are valued.',
    unclear: 'The same yield move can mean different things depending on inflation, growth, supply, and Fed communication.',
    watch: 'Watch whether risk assets can stay calm if long yields remain firm.',
    relatedLesson: {
      title: 'Rates: interest rates and discount rates',
      href: '/learn/macro-foundations-rates',
      reason: 'Rates are the core language behind many daily market moves.',
    },
    sourceNote,
    icon: LineChart,
  },
  {
    id: 'wti',
    symbol: 'WTI',
    name: 'Energy pressure',
    region: 'Commodities',
    status: 'inflation input',
    tone: 'calm',
    context: 'WTI Crude Oil is best treated as an inflation and growth weather signal, not a standalone alarm.',
    whatChanged: 'The useful question is whether energy is changing the inflation story, the growth story, or only reflecting short-term supply noise.',
    whyMarketsCare: 'Energy can affect inflation expectations, consumer pressure, margins, and central bank patience.',
    unclear: 'Supply, demand, geopolitics, inventory data, and dollar moves can all point in different directions.',
    watch: 'Watch whether oil pressure feeds into inflation expectations or stays contained.',
    relatedLesson: {
      title: 'Inflation: prices and expectations',
      href: '/learn/macro-foundations-inflation',
      reason: 'Oil matters most when it changes the inflation frame.',
    },
    sourceNote,
    icon: Droplets,
  },
  {
    id: 'gold',
    symbol: 'Gold',
    name: 'Safe Haven Anchor',
    region: 'Commodities',
    status: 'monetary hedge benchmark',
    tone: 'calm',
    context: 'Gold represents the classic safe-haven commodity, responsive to real interest rates and long-term purchasing power expectations.',
    whatChanged: 'Evaluating if central bank purchase trends continue to support gold prices amidst high global real yields.',
    whyMarketsCare: 'Gold often reflects underlying anxieties around inflation, systemic currency degradation, and geopolitical friction.',
    unclear: 'Central bank actions and sovereign reserve accumulation can occasionally decouple gold from US real interest rates.',
    watch: 'Watch whether real bond yields and dollar strength begin to limit non-yielding gold demand.',
    relatedLesson: {
      title: 'Inflation: prices and expectations',
      href: '/learn/macro-foundations-inflation',
      reason: 'Gold functions historically as an anchor for preservation against global price inflation.',
    },
    sourceNote,
    icon: DollarSign,
  },
]

export function getAmbientMarketSignal(id: string) {
  return ambientMarketSignals.find((signal) => signal.id === id)
}

export function getAmbientMarketSignalIds() {
  return ambientMarketSignals.map((signal) => signal.id)
}
