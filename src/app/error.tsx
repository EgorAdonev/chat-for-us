'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>Произошла ошибка</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            К сожалению, что-то пошло не так. Наши инженеры уже уведомлены об этой проблеме.
          </p>
          <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto">
            {error.message}
          </div>
          <Button onClick={reset} variant="outline" className="w-full">
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}