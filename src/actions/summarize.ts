'use server'

import { createServerClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'
import { revalidatePath } from 'next/cache'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function summarizeMemo(
  id: string,
  content: string
): Promise<{ summary: string; tokenCount: number }> {
  // API 키 확인
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  if (!content || typeof content !== 'string') {
    throw new Error('메모 내용이 필요합니다.')
  }

  try {
    // Gemini API 클라이언트 초기화
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    // 메모 요약 요청
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: `다음 메모의 핵심 내용을 3-5개의 간결한 불릿 포인트로 요약해주세요. 요약은 한국어로 작성하고, 주요 포인트만 포함해주세요.\n\n메모 내용:\n${content}`,
      config: {
        maxOutputTokens: 500,
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
      },
    })

    // 응답에서 텍스트 추출
    const summary = response.text

    if (!summary) {
      throw new Error('요약 생성에 실패했습니다.')
    }

    // 요약 결과를 DB에 저장
    const supabase = createServerClient()
    const { error: updateError } = await supabase
      .from('memos')
      .update({ summary })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to save summary to DB:', updateError)
      throw new Error('요약 결과를 저장하는데 실패했습니다.')
    }

    revalidatePath('/')

    return {
      summary,
      tokenCount: response.usageMetadata?.totalTokenCount || 0,
    }
  } catch (error) {
    console.error('요약 생성 중 오류 발생:', error)
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    throw new Error(`요약 생성 중 오류가 발생했습니다: ${errorMessage}`)
  }
}
