"use client";

import { useEffect, useState } from 'react';
import AuthForm from '@/components/auth/auth-form';
import ChatInterface from '@/components/chat/chat-interface';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверка наличия сессии при загрузке
    const checkAuth = async () => {
      try {
        // Пытаемся получить сообщения, если 401, значит не авторизованы
        const res = await fetch('/api/chat');
        if (res.ok) {
           // Допустим, нам нужно получить данные пользователя, но api/chat отдает сообщения.
           // Для упрощения, если запрос прошел, покажем чат.
           // В реальности нужен GET /api/me
           setUser({ email: 'user@mock.ru' }); 
        }
      } catch (e) {
        // Игнорируем
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header>
        {user && (
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm font-medium">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Выйти</Button>
          </div>
        )}
      </Header>
      
      <main className="flex-1">
        {!user ? (
          <AuthForm onLogin={setUser} />
        ) : (
          <ChatInterface currentUser={user} />
        )}
      </main>
      
      <Footer />
    </div>
  );
}