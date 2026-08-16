'use client'

import dynamic from 'next/dynamic'

// three.js หนัก ~1MB — โหลดแบบ dynamic เฉพาะฝั่ง client ไม่ SSR (แทน React.lazy + Suspense เดิม)
const NeonScene = dynamic(() => import('./NeonScene.jsx'), { ssr: false })

export default function NeonSceneLazy() {
  return <NeonScene />
}
