'use client';

import { useState, useEffect } from 'react';
import { improvementApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ImprovementView() {
  const [gaps, setGaps] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gapsData, suggestionsData] = await Promise.all([
          improvementApi.getGaps(),
          improvementApi.getSuggestions()
        ]);
        setGaps(Array.isArray(gapsData) ? gapsData : (gapsData?.data || []));
        setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : (suggestionsData?.data || []));
      } catch (error) {
        console.error('Failed to fetch improvement data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">التحسين المستمر</h2>
        <p className="text-muted-foreground">تحليل الفجوات واقتراحات لتحسين أداء البوت</p>
      </div>

      <Tabs defaultValue="gaps" className="w-full">
        <TabsList>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            الفجوات المعرفية
            <Badge variant="secondary" className="mr-2">{gaps.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            الاقتراحات
            <Badge variant="secondary" className="mr-2">{suggestions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4 mt-4">
          {gaps.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                لا توجد فجوات معرفية مسجلة حالياً.
              </CardContent>
            </Card>
          ) : (
            gaps.map((gap, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base font-medium">{gap.query || 'استفسار غير معروف'}</CardTitle>
                  <CardDescription>
                    تكرر {gap.frequency || 1} مرة · آخر ظهور: {new Date(gap.lastSeen || Date.now()).toLocaleDateString('ar-EG')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4 mt-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                لا توجد اقتراحات حالياً.
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base font-medium">{suggestion.topic || 'اقتراح عام'}</CardTitle>
                  <CardDescription>{suggestion.reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    {suggestion.content}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {suggestion.status || 'جديد'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
