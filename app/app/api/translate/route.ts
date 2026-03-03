import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity/client';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface TranslationRequest {
  lessonId: string;
  sourceLocale: 'en' | 'pt-BR' | 'es';
  targetLocale: 'pt-BR' | 'es';
}

async function translateWithGemini(text: string, targetLang: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder') {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Translate the following content to ${targetLang}. Only return the translation, no explanations:

${text}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Translation failed');
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { lessonId, sourceLocale, targetLocale } = body;

    if (!lessonId || !sourceLocale || !targetLocale) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, sourceLocale, targetLocale' },
        { status: 400 }
      );
    }

    // Fetch the lesson from Sanity
    const lesson = await sanityClient.fetch(
      `*[_type == "lesson" && _id == $id][0]`,
      { id: lessonId }
    );

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Translate title
    const titleField = `title${sourceLocale === 'en' ? '' : sourceLocale.replace('-', '')}`;
    const targetTitleField = `title${targetLocale.replace('-', '')}`;
    
    const sourceTitle = lesson[titleField] || lesson.title;
    const translatedTitle = await translateWithGemini(sourceTitle, targetLocale === 'pt-BR' ? 'Portuguese (Brazil)' : 'Spanish');

    // Translate content if exists
    let translatedContent = null;
    const contentField = `content${sourceLocale === 'en' ? '' : sourceLocale.replace('-', '')}`;
    const targetContentField = `content${targetLocale.replace('-', '')}`;
    
    if (lesson[contentField]) {
      // For portable text, we'll translate the raw text representation
      const contentText = JSON.stringify(lesson[contentField]);
      const translatedContentText = await translateWithGemini(contentText, targetLocale === 'pt-BR' ? 'Portuguese (Brazil)' : 'Spanish');
      try {
        translatedContent = JSON.parse(translatedContentText);
      } catch {
        translatedContent = translatedContentText;
      }
    }

    // Update Sanity with translations
    const update: Record<string, unknown> = {
      [targetTitleField]: translatedTitle,
    };

    if (translatedContent) {
      update[targetContentField] = translatedContent;
    }

    await sanityClient.patch(lessonId).set(update).commit();

    return NextResponse.json({
      success: true,
      translatedTitle,
      targetLocale,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}
