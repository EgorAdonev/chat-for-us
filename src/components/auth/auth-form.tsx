"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Step = 'email' | 'code';

export default function AuthForm({ onLogin }: { onLogin: (user: any) => void }) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setStep('code');
        // Простая проверка: если email не содержит digits, считаем что это может быть новый юзер (демо логика)
        // В реальности API вернет флаг isNewUser
        setIsNewUser(!email.includes('@test.com')); 
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name: isNewUser ? name : undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Успешный вход!');
        onLogin(json.data);
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{step === 'email' ? 'Вход в систему' : 'Подтверждение'}</CardTitle>
          <CardDescription>
            {step === 'email' ? 'Введите ваш email для получения кода доступа' : 'Мы отправили код на вашу почту'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={step === 'email' ? handleSendCode : handleVerify} className="space-y-4">
            {step === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            
            {step === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Код из письма</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
                {isNewUser && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Ваше имя</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Иван Иванов"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 text-sm"
                  onClick={() => setStep('email')}
                >
                  Назад
                </Button>
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Обработка...' : step === 'email' ? 'Получить код' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}