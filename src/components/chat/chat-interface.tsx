"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
}

export default function ChatInterface({ currentUser }: { currentUser: { email: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Polling для сообщений (имитация WebSocket)
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
        // Авто-скролл вниз
        setTimeout(() => {
           if (scrollRef.current) {
             scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
           }
        }, 100);
      }
    } catch (e) {
      console.error('Fetch error', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Опрос каждые 3 сек
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      const json = await res.json();
      if (json.success) {
        setInput('');
        fetchMessages(); // Обновить список
      } else {
        toast.error(json.error || 'Ошибка отправки');
      }
    } catch (e) {
      toast.error('Ошибка сети');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    // Заглушка поиска пользователей
    // В реальном API вызов endpoint /api/users/search
    setSearchResults([
      { id: '1', name: 'Алексей' },
      { id: '2', name: 'Мария' },
    ].filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())));
  };

  return (
    <div className="container mx-auto h-[calc(100vh-140px)] py-4 flex gap-4">
      {/* Сайдбар поиска */}
      <Card className="w-1/4 hidden md:block">
        <CardHeader>
          <CardTitle className="text-sm">Поиск пользователей</CardTitle>
          <div className="flex gap-2">
            <Input 
              placeholder="Имя пользователя..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                <Avatar className="h-8 w-8"><AvatarFallback>{u.name[0]}</AvatarFallback></Avatar>
                <span className="text-sm">{u.name}</span>
              </div>
            ))}
            {searchQuery && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground">Ничего не найдено</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Область чата */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b py-3">
          <CardTitle>Общий чат (Россия)</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderName === currentUser.email.split('@')[0];
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>{msg.senderName[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                      <span className="text-xs text-muted-foreground mb-1">
                        {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <div className={`rounded-lg px-3 py-2 text-sm ${
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Введите сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <Button onClick={handleSend} disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}