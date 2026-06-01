'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { MEMBERSHIP_TIERS, MembershipTier } from '@/types'

interface Profile {
  id: string
  email: string
  username: string | null
  membership_tier: MembershipTier
  vote_power: number
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b10]">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b10]">
        <p className="text-gray-400">프로필을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const tierInfo = MEMBERSHIP_TIERS[profile.membership_tier]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-[#070b10] text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{tierInfo.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile.username || '사용자'}
          </h1>
          <p className={`text-lg font-medium bg-gradient-to-r ${tierInfo.color} bg-clip-text text-transparent`}>
            {tierInfo.name} ({tierInfo.nameKr})
          </p>
        </div>

        {/* Profile Info */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <div className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">이메일</p>
                <p className="text-white">{profile.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">사용자명</p>
                <p className="text-white">{profile.username || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">가입일</p>
                <p className="text-white">
                  {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>

          {/* Membership Info */}
          <div className="border border-white/[0.08] bg-white/[0.02] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">멤버십</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">현재 등급</p>
                <p className="text-white flex items-center gap-2">
                  <span>{tierInfo.icon}</span>
                  <span>{tierInfo.name}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">투표권</p>
                <p className="text-white font-bold text-2xl">{profile.vote_power}표</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">혜택</p>
                <ul className="space-y-1">
                  {tierInfo.benefits.map((benefit, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/membership')}>
            멤버십 업그레이드
          </Button>
        </div>
      </div>
    </div>
  )
}
