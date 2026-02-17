/**
 * Archive Page - Browse past daily content by date
 */

'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import type { DailyNews, DailyPrinciples, DailyIdeas } from '@/lib/types';

interface ArchiveData {
  news: DailyNews | null;
  principles: DailyPrinciples | null;
  ideas: DailyIdeas | null;
}

export default function ArchivePage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [data, setData] = useState<ArchiveData>({
    news: null,
    principles: null,
    ideas: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArchiveData = async () => {
      if (!selectedDate) return;

      setLoading(true);
      setError(null);

      try {
        const [newsDoc, principlesDoc, ideasDoc] = await Promise.all([
          getDoc(doc(db, 'daily_news', selectedDate)),
          getDoc(doc(db, 'daily_principles', selectedDate)),
          getDoc(doc(db, 'daily_ideas', selectedDate)),
        ]);

        setData({
          news: newsDoc.exists() ? (newsDoc.data() as DailyNews) : null,
          principles: principlesDoc.exists()
            ? (principlesDoc.data() as DailyPrinciples)
            : null,
          ideas: ideasDoc.exists() ? (ideasDoc.data() as DailyIdeas) : null,
        });
      } catch (err) {
        console.error('Error fetching archive data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchArchiveData();
  }, [selectedDate]);

  const hasData = data.news || data.principles || data.ideas;

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 mb-20 md:mb-0">
      <div className="mb-10">
        <h1 className="text-section text-foreground mb-2">아카이브</h1>
        <p className="text-body-kr text-muted-foreground">
          과거의 뉴스, 학문 원리, 아이디어를 날짜별로 탐색하세요
        </p>
      </div>

      <div className="mb-8">
        <label className="block mb-2">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            날짜 선택
          </span>
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 py-4 px-5 border border-border rounded-lg mb-6">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">오류 발생</p>
            <p className="text-caption text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {!loading && !hasData && !error && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            선택한 날짜에 데이터가 없습니다.
          </p>
        </div>
      )}

      {!loading && hasData && (
        <div className="space-y-10">
          {data.news && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span>AI 뉴스</span>
                <span className="text-caption text-muted-foreground font-normal">
                  {data.news.count}개
                </span>
              </h2>
              {data.news.daily_overview && (
                <div className="mb-5 p-4 bg-muted/50 rounded-lg">
                  <p className="text-body-kr text-foreground/85 leading-korean-tight">
                    {data.news.daily_overview}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {data.news.articles.slice(0, 5).map((article, idx) => (
                  <a
                    key={idx}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <h3 className="text-card-title text-foreground mb-1">
                      {article.title}
                    </h3>
                    <p className="text-caption text-muted-foreground line-clamp-2">
                      {article.summary || article.description}
                    </p>
                    {article.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs text-foreground/70 bg-muted rounded">
                        {article.category}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {data.principles && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span>학문 원리</span>
                <span className="text-caption text-muted-foreground font-normal">
                  {data.principles.discipline_info.name}
                </span>
              </h2>
              {data.principles.principle && (
                <div className="p-5 border border-border rounded-lg">
                  <h3 className="text-card-title text-foreground mb-2">
                    {data.principles.principle.title}
                  </h3>
                  <p className="text-body-kr text-muted-foreground leading-korean-tight mb-3">
                    {data.principles.principle.foundation.principle}
                  </p>
                  {data.principles.principle.integration.solution && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        융합 사례
                      </p>
                      <p className="text-caption text-foreground/80">
                        {data.principles.principle.integration.solution}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {data.ideas && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center justify-between">
                <span>융합 아이디어</span>
                <span className="text-caption text-muted-foreground font-normal">
                  {data.ideas.count}개
                </span>
              </h2>
              <div className="space-y-4">
                {data.ideas.ideas.slice(0, 3).map((idea, idx) => (
                  <div key={idx} className="p-5 border border-border rounded-lg">
                    <h3 className="text-card-title text-foreground mb-2">
                      {idea.concept_name}
                    </h3>
                    <p className="text-body-kr text-muted-foreground leading-korean-tight line-clamp-3">
                      {idea.description || idea.narrative}
                    </p>
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {idea.tags.slice(0, 3).map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="px-2 py-0.5 text-xs text-muted-foreground border border-border rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
