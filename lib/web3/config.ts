import { http, createConfig } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { injected } from '@wagmi/core'

const chains = [mainnet, polygon, arbitrum, optimism] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})

// Solana network configuration
export const SOLANA_NETWORK = 'mainnet-beta' as const
export const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
