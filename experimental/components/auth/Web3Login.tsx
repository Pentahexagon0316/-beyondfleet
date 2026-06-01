'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import Button from '@/components/ui/Button'
import { PhantomIcon } from '@/components/icons/WalletIcons'
import { generateNonce, createSignMessage } from '@/lib/web3/auth'

interface Web3LoginProps {
  onSuccess: () => void
  onError: (error: string) => void
  onClose?: () => void
}

export default function Web3Login({ onSuccess, onError, onClose }: Web3LoginProps) {
  const [loading, setLoading] = useState(false)

  // Ethereum (wagmi injected connector)
  const { address: ethAddress, isConnected: isEthConnected } = useAccount()
  const { connect, connectors, isPending: isEthConnecting } = useConnect()
  const { disconnect: disconnectEth } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  // Solana (wallet-adapter)
  const { publicKey, disconnect: disconnectSolana, connected: isSolConnected, signMessage: signSolanaMessage } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()

  const solAddress = publicKey?.toBase58()
  const isConnected = isEthConnected || isSolConnected

  // Disconnect all wallets
  const handleDisconnect = useCallback(() => {
    if (isEthConnected) disconnectEth()
    if (isSolConnected) disconnectSolana()
  }, [isEthConnected, isSolConnected, disconnectEth, disconnectSolana])

  // Handle Ethereum Sign & Login
  const handleEthLogin = useCallback(async (address: string) => {
    try {
      setLoading(true)
      onError('')
      
      const nonce = generateNonce()
      const msg = createSignMessage(address, nonce)
      
      // 1. Ethereum 지갑 서명 요청
      const signature = await signMessageAsync({ message: msg })
      
      // 2. 백엔드 API 검증 요청
      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          walletType: 'ethereum',
          message: msg,
          signature: signature,
          nonce: nonce
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ethereum 로그인 실패')
      
      // 3. 일회성 로그인 링크(magiclink) 이동을 통한 세션 획득
      if (data.actionLink) {
        window.location.href = data.actionLink
      } else {
        onSuccess()
      }
    } catch (err: any) {
      console.error(err)
      onError(err.message || '서명 과정에서 오류가 발생했습니다.')
      handleDisconnect()
    } finally {
      setLoading(false)
    }
  }, [signMessageAsync, onError, onSuccess, handleDisconnect])

  // Handle Solana Sign & Login
  const handleSolanaLogin = useCallback(async (address: string) => {
    try {
      setLoading(true)
      onError('')

      if (!publicKey || !signSolanaMessage) {
        throw new Error('지갑이 연결되어 있지 않거나 서명을 지원하지 않습니다.')
      }

      const nonce = generateNonce()
      const msg = createSignMessage(address, nonce)
      const encodedMessage = new TextEncoder().encode(msg)

      // 1. Solana 지갑 서명 요청
      const signature = await signSolanaMessage(encodedMessage)
      const signatureArray = Array.from(signature)

      // 2. 백엔드 API 검증 요청
      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          walletType: 'solana',
          message: msg,
          signature: signatureArray,
          nonce: nonce
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Solana 로그인 실패')

      // 3. 일회성 로그인 링크(magiclink) 이동을 통한 세션 획득
      if (data.actionLink) {
        window.location.href = data.actionLink
      } else {
        onSuccess()
      }
    } catch (err: any) {
      console.error(err)
      onError(err.message || '서명 과정에서 오류가 발생했습니다.')
      handleDisconnect()
    } finally {
      setLoading(false)
    }
  }, [publicKey, signSolanaMessage, onError, onSuccess, handleDisconnect])

  // 지갑 연결 감지 시 서명 프로세스 자동 시작
  useEffect(() => {
    if (loading) return

    if (isEthConnected && ethAddress) {
      handleEthLogin(ethAddress)
    } else if (isSolConnected && solAddress) {
      handleSolanaLogin(solAddress)
    }
  }, [isEthConnected, ethAddress, isSolConnected, solAddress, loading, handleEthLogin, handleSolanaLogin])

  // Handle Ethereum wallet connect
  const handleEthConnect = useCallback(() => {
    const connector = connectors[0]
    if (!connector) {
      onError('사용 가능한 Ethereum 지갑을 찾을 수 없습니다.')
      return
    }
    connect({ connector })
  }, [connect, connectors, onError])

  // Handle Solana wallet connect
  const handleSolConnect = useCallback(() => {
    // 1. Solana 모달 띄우기
    setSolanaModalVisible(true)
    // 2. AuthModal 닫기 (Z-index 충돌 방지 및 자연스러운 UX)
    if (onClose) {
      setTimeout(() => onClose(), 100)
    }
  }, [setSolanaModalVisible, onClose])

  const connectedAddress = ethAddress || solAddress
  const walletType = isEthConnected ? 'Ethereum' : isSolConnected ? 'Solana' : null
  const isPending = isEthConnecting || loading

  return (
    <div className="space-y-4">
      {/* Connection Status & Signature Loading */}
      {isConnected && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {walletType} 지갑 연결됨 {loading && '(서명 진행 중...)'}
              </p>
              <p className="text-gray-400 text-xs font-mono mt-1">
                {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="text-gray-400 hover:text-white text-sm disabled:opacity-50"
            >
              연결 해제
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connect Buttons */}
      {!isConnected && (
        <>
          <div className="text-center mb-4">
            <p className="text-gray-400 text-sm">지갑을 연결하여 로그인하세요</p>
          </div>

          {/* Ethereum Wallets */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Ethereum</p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEthConnect}
              disabled={isPending}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6 mr-3" />
              {isEthConnecting ? '연결 중...' : 'MetaMask / 브라우저 지갑'}
            </Button>
          </div>

          {/* Solana Wallets */}
          <div className="space-y-3 mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Solana</p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSolConnect}
              disabled={isPending}
            >
              <PhantomIcon className="w-6 h-6 mr-3 rounded-full" />
              Phantom / Solflare
            </Button>
          </div>
        </>
      )}

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-gray-400 text-xs">
          <span className="text-purple-400">🔒 보안 안내:</span> 지갑 로그인 서명은 가스 비용이 청구되지 않는 **단순 주소 소유권 확인 서명**입니다. 자산 이동이나 트랜잭션 승인을 절대 요구하지 않으므로 안전합니다.
        </p>
      </div>
    </div>
  )
}
