import Credit from '@/components/Credit'
import { AUTHOR_NAME } from '@/lib/site'

export interface TutorialVideoData {
  src: string
  poster: string
  width: number
  height: number
  posterWidth: number
  posterHeight: number
  duration: number
  bytes: number
}

export default function TutorialVideo({ video, title }: { video: TutorialVideoData; title: string }) {
  return (
    <figure className="tutorial-video">
      <div className="video-wrap">
        {/* ไม่มี <track> โดยตั้งใจ: วิดีโอไม่มีเสียงและคำบรรยายฝังในภาพแล้ว ใส่ VTT ซ้ำจะขึ้นซ้อนสองชั้น */}
        <video controls playsInline preload="none" poster={video.poster} width={video.width} height={video.height} aria-label={title}>
          <source src={video.src} type="video/mp4" />
          เบราว์เซอร์นี้เล่นวิดีโอไม่ได้
        </video>
      </div>
      <Credit label={`วิดีโอ: ${AUTHOR_NAME} — ทำเองด้วย three.js (WebGL) ไม่ใช่ภาพจากเกม · ไม่มีเสียง อ่านคำบรรยายบนจอ`} />
    </figure>
  )
}
