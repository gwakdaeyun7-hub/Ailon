/**
 * Bookmarks Page - Saved news, snaps, and ideas
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, LogIn, Bookmark as BookmarkIcon } from 'lucide-react';

export default function BookmarksPage() {
  const { user } = useAuth();
  const { bookmarks, getBookmarksByType, toggleBookmark, loading } = useBookmarks();
  const [activeTab, setActiveTab] = useState('news');
  const [deleting, setDeleting] = useState<string | null>(null);

  const newsBookmarks = getBookmarksByType('news');
  const snapBookmarks = getBookmarksByType('snap');
  const ideaBookmarks = getBookmarksByType('idea');

  const handleDelete = async (type: 'news' | 'snap' | 'idea', itemId: string) => {
    const key = `${type}_${itemId}`;
    setDeleting(key);
    try {
      await toggleBookmark(type, itemId);
    } finally {
      setDeleting(null);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl px-6 py-10 mb-20 md:mb-0">
        <div className="mb-10">
          <h1 className="text-section text-foreground mb-2">북마크</h1>
          <p className="text-body-kr text-muted-foreground">
            저장한 콘텐츠를 모아보세요
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <LogIn className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            로그인이 필요해요
          </h2>
          <p className="text-body-kr text-muted-foreground text-center mb-6">
            북마크 기능을 사용하려면 먼저 로그인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 mb-20 md:mb-0">
      <div className="mb-8">
        <h1 className="text-section text-foreground mb-2">북마크</h1>
        <p className="text-body-kr text-muted-foreground">
          저장한 콘텐츠를 모아보세요
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="news">
              뉴스 ({newsBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="snap">
              학문 스낵 ({snapBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="idea">
              아이디어 ({ideaBookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news">
            {newsBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  저장된 뉴스가 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {newsBookmarks.map((bookmark, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        뉴스 항목
                      </p>
                      <p className="text-caption text-muted-foreground">
                        ID: {bookmark.itemId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete('news', bookmark.itemId)}
                      disabled={deleting === `news_${bookmark.itemId}`}
                    >
                      {deleting === `news_${bookmark.itemId}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="snap">
            {snapBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  저장된 학문 스낵이 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapBookmarks.map((bookmark, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        학문 스낵
                      </p>
                      <p className="text-caption text-muted-foreground">
                        ID: {bookmark.itemId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete('snap', bookmark.itemId)}
                      disabled={deleting === `snap_${bookmark.itemId}`}
                    >
                      {deleting === `snap_${bookmark.itemId}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="idea">
            {ideaBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  저장된 아이디어가 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ideaBookmarks.map((bookmark, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {bookmark.itemId}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        융합 아이디어
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete('idea', bookmark.itemId)}
                      disabled={deleting === `idea_${bookmark.itemId}`}
                    >
                      {deleting === `idea_${bookmark.itemId}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
