import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Search, Edit, Phone, Video, Info, Image, Mic, Smile, PlusCircle } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import Avatar from '../components/common/Avatar';
import { useStore } from '../store/useStore';
import { timeAgo } from '../utils/helpers';
import type { Conversation, Message } from '../types';

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', senderId: 'user-1', receiverId: 'current-user', text: 'Hola! Cómo estás? 👋', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'm2', senderId: 'current-user', receiverId: 'user-1', text: 'Todo bien! Y tú? 😊', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
    { id: 'm3', senderId: 'user-1', receiverId: 'current-user', text: 'Genial! Oye, ¿viste las fotos del fin de semana?', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'm4', senderId: 'current-user', receiverId: 'user-1', text: 'Sí! Estuvieron increíbles 🔥', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { id: 'm5', senderId: 'user-1', receiverId: 'current-user', text: 'Hey! Are you coming to the photo walk this weekend? 📸', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
  'conv-2': [
    { id: 'm1', senderId: 'user-2', receiverId: 'current-user', text: 'Hola! Vi que te gustó mi último post 😊', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'm2', senderId: 'current-user', receiverId: 'user-2', text: 'Love your latest artwork! 🎨', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ],
};

export default function MessagesPage() {
  const { conversations, sendMessage } = useStore();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setMessages(MOCK_MESSAGES[conv.id] || []);
  };

  const handleSend = () => {
    if (!text.trim() || !selectedConv) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      receiverId: selectedConv.participants.find(p => p.id !== 'current-user')?.id || '',
      text: text.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setText('');
    sendMessage(selectedConv.id, newMsg);
  };

  const otherUser = (conv: Conversation) =>
    conv.isGroup ? null : conv.participants.find(p => p.id !== 'current-user');

  const filteredConvs = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = otherUser(conv);
    if (conv.isGroup) return conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           other?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (selectedConv) {
    const other = otherUser(selectedConv);
    const name = selectedConv.isGroup ? selectedConv.groupName : other?.displayName;
    const avatar = selectedConv.isGroup
      ? selectedConv.groupAvatar || ''
      : other?.avatar || '';

    return (
      <div className="fixed inset-0 bg-white dark:bg-black flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black z-10 pt-safe">
          <button onClick={() => setSelectedConv(null)} className="text-gray-700 dark:text-gray-300 p-1">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2.5 flex-1" onClick={() => {}}>
            <Avatar src={avatar} alt={name || ''} size="sm" />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{name}</p>
              <p className="text-xs text-green-500">En línea</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <Video size={20} />
            </button>
            <button className="p-2 text-gray-700 dark:text-gray-300">
              <Info size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => {
            const isMine = msg.senderId === 'current-user';
            const showAvatar = !isMine && (i === 0 || messages[i-1].senderId !== msg.senderId);

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {!isMine && (
                  <div className="w-7 flex-shrink-0">
                    {showAvatar && <Avatar src={other?.avatar || ''} alt="" size="xs" />}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="" className="rounded-2xl max-w-full mb-1" />
                  )}
                  {msg.text && (
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed ${
                        isMine
                          ? 'bubble-sent bg-blue-500 text-white'
                          : 'bubble-received bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800 pb-safe bg-white dark:bg-black">
          <button className="text-blue-500 p-1">
            <PlusCircle size={26} />
          </button>
          <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Mensaje..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <button className="text-gray-400">
              <Smile size={20} />
            </button>
            {!text && (
              <>
                <button className="text-gray-400">
                  <Mic size={20} />
                </button>
                <button className="text-gray-400">
                  <Image size={20} />
                </button>
              </>
            )}
          </div>
          {text ? (
            <button
              onClick={handleSend}
              className="text-blue-500 font-semibold text-sm px-2 py-1"
            >
              Enviar
            </button>
          ) : (
            <button className="text-blue-500 font-semibold text-sm px-2 py-1">
              ❤️
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar title="Mensajes" showActions={false} rightElement={
        <button className="p-2 text-gray-700 dark:text-gray-300">
          <Edit size={22} />
        </button>
      } />

      <div className="pt-14">
        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar mensajes..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div>
          {filteredConvs.map(conv => {
            const other = otherUser(conv);
            const name = conv.isGroup ? conv.groupName : other?.displayName;
            const avatar = conv.isGroup ? (conv.groupAvatar || '') : (other?.avatar || '');
            const lastMsg = conv.lastMessage;

            return (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={avatar} alt={name || ''} size="md" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-black" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${conv.unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {name}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {lastMsg ? timeAgo(lastMsg.createdAt) : ''}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${
                    conv.unreadCount > 0
                      ? 'font-medium text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {lastMsg?.text || 'Toca para escribir...'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
