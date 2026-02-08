/**
 * 아이디어 생성 API 라우트
 * Gemini API를 사용하여 AI 뉴스와 학문 원리를 결합한 창의적 아이디어 생성
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { news, principle } = await request.json();

    if (!news || !principle) {
      return NextResponse.json(
        { error: 'News and principle data are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Gemini API 호출
    const prompt = `당신은 창의적인 아이디어 생성 전문가입니다. 다음의 AI 뉴스와 학문 원리를 융합하여 혁신적이고 실용적인 아이디어를 생성해주세요.

**AI 뉴스:**
제목: ${news.title}
요약: ${news.summary}

**학문 원리:**
분야: ${principle.category}
제목: ${principle.title}
설명: ${principle.description}
상세: ${principle.explanation}

이 두 가지를 융합하여:
1. 실제로 구현 가능한 구체적인 아이디어를 제시하세요
2. 왜 이 조합이 효과적인지 설명하세요
3. 어떤 문제를 해결하거나 어떤 가치를 창출할 수 있는지 명확히 하세요
4. 3-5문단으로 작성하되, 각 문단은 2-3문장으로 간결하게 작성하세요

한국어로 답변하세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate idea' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '아이디어를 생성할 수 없습니다.';

    return NextResponse.json({ idea: generatedText });
  } catch (error) {
    console.error('Error in generate-idea API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
