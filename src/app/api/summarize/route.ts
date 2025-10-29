// 주의: 이 API 라우트는 더 이상 사용되지 않습니다.
// 요약 기능은 src/actions/summarize.ts의 서버 액션으로 이동되었습니다.
// 이 파일은 참고용으로만 남겨두며, 필요시 삭제 가능합니다.

import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 요청 본문 파싱
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '메모 내용이 필요합니다.' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: '요약 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      summary,
      tokenCount: response.usageMetadata?.totalTokenCount || 0,
    })
  } catch (error) {
    console.error('요약 생성 중 오류 발생:', error)

    // 에러 메시지 추출
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(
      { error: `요약 생성 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    )
  }
}
