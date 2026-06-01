'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
// import { useAccount, useDisconnect } from 'wagmi'
// import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from '@/lib/supabase/client'
import AuthModal from '@/components/auth/AuthModal'
import Button from '@/components/ui/Button'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'web2' | 'web3'>('web2')
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null)

  // Web3 wallet states disabled for compliance review
  const ethAddress = null
  const isEthConnected = false
  const disconnectEth = () => {}
  const solPublicKey = null
  const isSolConnected = false
  const disconnectSol = () => {}

  const isWalletConnected = false
  const walletAddress: string | null = null

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    }).catch(err => {
      console.error('Error in Header getUser:', err)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      // 1. 로컬 상태 먼저 초기화
      setUser(null)

      // 2. 지갑 연결 해제 (ETH)
      if (isEthConnected) {
        try {
          disconnectEth()
        } catch (e) {
          console.error('ETH disconnect error:', e)
        }
      }

      // 3. 지갑 연결 해제 (SOL)
      if (isSolConnected) {
        try {
          await disconnectSol()
        } catch (e) {
          console.error('SOL disconnect error:', e)
        }
      }

      // 4. 로컬 스토리지 완전 정리 (Supabase signOut 전에 수행)
      if (typeof window !== 'undefined') {
        // 지갑 관련
        localStorage.removeItem('walletconnect')
        localStorage.removeItem('wagmi.wallet')
        localStorage.removeItem('wagmi.connected')
        localStorage.removeItem('wagmi.account')
        localStorage.removeItem('wagmi.store')
        localStorage.removeItem('walletName')

        // Supabase 관련 (sb-로 시작하는 모든 키 삭제)
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.startsWith('supabase'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        // 세션 스토리지도 정리
        sessionStorage.clear()
      }

      // 5. Supabase 로그아웃 (local scope - 현재 브라우저만)
      await supabase.auth.signOut({ scope: 'local' })

      // 6. 강제 페이지 새로고침으로 완전 초기화
      window.location.replace('/')
    } catch (error) {
      console.error('Logout error:', error)
      // 에러가 나도 스토리지 정리 후 강제 새로고침
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      setUser(null)
      window.location.replace('/')
    }
  }

  const openAuthModal = (tab: 'web2' | 'web3' = 'web2') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const navLinks = [
    { href: '/briefs', label: '브리프' },
    { href: '/learn', label: '학습' },
    { href: '/news', label: '뉴스 읽기' },
    { href: '/journal', label: 'Thinking Lab' },
    { href: '/intelligence', label: '리서치 분석' },
    { href: '/events', label: '학습 챌린지' },
    { href: '/ai-search', label: 'AI 학습 검색' },
    { href: '/dashboard', label: '대시보드' },
  ]

  // 표시할 주소/이메일 결정
  const getDisplayName = () => {
    if (user?.email) {
      // 이메일이 지갑 주소 형식이면 주소 표시
      if (user.email.includes('@wallet.')) {
        const addr = user.email.split('@')[0]
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
      }
      return user.email.split('@')[0]
    }
    return null
  }

  const displayName = getDisplayName()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-space-900/90 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-200">
                BF
              </span>
              <span className="text-xl font-semibold tracking-normal text-white">
                BeyondFleet
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {user || isWalletConnected ? (
                // 로그인 상태
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full font-mono">
                    {displayName}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                // 로그인 전
                <Button size="sm" onClick={() => openAuthModal('web2')}>
                  로그인
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
                  {user || isWalletConnected ? (
                    <>
                      <span className="text-cyan-400 text-sm font-mono">
                        {displayName}
                      </span>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsMobileMenuOpen(false)
                        }}
                        className="text-left text-gray-300 hover:text-white text-sm"
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        openAuthModal('web2')
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      로그인
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  )
}
