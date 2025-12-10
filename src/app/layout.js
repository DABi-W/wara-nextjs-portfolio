import './globals.css'  // <--- บรรทัดนี้สำคัญมาก! คือการเรียกใช้ Tailwind
import { Sarabun } from 'next/font/google' // เรียกฟอนต์สวยๆ จาก Google

// ตั้งค่าฟอนต์ภาษาไทย
const sarabun = Sarabun({ 
  weight: ['300', '400', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
})

export const metadata = {
  title: 'My Portfolio',
  description: 'Portfolio created with Next.js & Tailwind',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={sarabun.className}>{children}</body>
    </html>
  )
}