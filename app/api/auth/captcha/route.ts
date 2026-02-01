import { NextResponse } from 'next/server'
import { generateCaptcha } from '@/lib/store'

export async function POST() {
  const captcha = generateCaptcha()
  return NextResponse.json({ data: captcha })
}
