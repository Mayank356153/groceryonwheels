import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FiSend, FiPlus } from 'react-icons/fi';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';

/* axios with auth */
const api = axios.create({ baseURL: '/vps' });
api.interceptors.request.use(cfg => {
  const tok = localStorage.getItem('token');
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

export default function ChatPanel() {
  const myId = localStorage.getItem('userId');

  /* layout */
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  /* conversations */
  const [convs, setConvs] = useState([]);
  const [selected, setSel] = useState(null);

  /* messages */
  const [msgs, setMsgs] = useState([]);
  const [body, setBody] = useState('');
  const bottomRef = useRef(null);

  /* new conversation */
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatCustomers, setNewChatCustomers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);

  /* polling refs */
  const POLL = 5000;
  const listTimer = useRef(null);
  const msgTimer = useRef(null);

  /* ----------------------------- helpers ----------------------------- */
  const idOf = (p) => (typeof p === 'object' && p ? String(p._id) : String(p));

  const nameOf = (p) => {
    if (!p) return null;
    if (typeof p === 'object') return p.name || (p._id ? String(p._id) : null);
    return p;
  };

  const getOtherParticipant = (conv) => {
    if (!conv || !Array.isArray(conv.participants)) return null;
    return conv.participants.find(p => idOf(p) !== String(myId)) || null;
  };

  const getOtherName = (conv) => {
    const oth = getOtherParticipant(conv);
    return nameOf(oth) || 'Unknown';
  };

  const getOtherInitial = (conv) => {
    const name = getOtherName(conv);
    return name && typeof name === 'string' ? name[0].toUpperCase() : '?';
  };

  /* ------------------------------------------------------------------ */
  const enrichUnread = async (list = []) => Promise.all(list.map(async c => {
    try {
      const r = await api.get(`/api/chat/conversations/${c._id}/messages?limit=1`);
      const last = (r.data && r.data.data && r.data.data[0]) || null;
      const unread = last && Array.isArray(last.readBy) ? (!last.readBy.includes(myId) && last.sender !== myId) : false;
      return { ...c, unread };
    } catch {
      return { ...c, unread: false };
    }
  }));

  const loadConvs = async () => {
    try {
      const { data } = await api.get('/api/chat/conversations');
      const convsFromApi = (data && data.data) || [];
      setConvs(await enrichUnread(convsFromApi));
    } catch (err) {
      try {
        const { data } = await api.get('/chat/conversations');
        const convsFromApi = (data && data.data) || [];
        setConvs(await enrichUnread(convsFromApi));
      } catch (err2) {
        console.error('Failed to load conversations:', err2?.message || err?.message);
        setConvs([]);
      }
    }
  };

  const loadMsgs = async (cid) => {
    try {
      const { data } = await api.get(`/api/chat/conversations/${cid}/messages?limit=100`);
      setMsgs(data.data || []);
      await api.patch(`/api/chat/conversations/${cid}/readAll`);
      loadConvs();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (err) {
      console.error('Failed to load messages:', err.message);
      setMsgs([]);
    }
  };

  const selectConv = (cid) => {
    setSel(cid);
    loadMsgs(cid);
    clearInterval(msgTimer.current);
    msgTimer.current = setInterval(() => loadMsgs(cid), POLL);
  };

  const send = async () => {
    if (!body.trim() || !selected) return;
    const tmp = { _id: 'tmp-' + Date.now(), sender: myId, body, createdAt: new Date().toISOString() };
    setMsgs(p => [...p, tmp]);
    setBody('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    try {
      await api.post('/api/chat/messages', { conversationId: selected, body: tmp.body });
      await loadMsgs(selected);
    } catch (err) {
      setMsgs(p => p.filter(m => m._id !== tmp._id));
      alert('Failed to send message');
      console.error(err);
    }
  };

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return; }
    const endpoints = [
      `/api/customers?search=${encodeURIComponent(q)}`,
      `/customer/customers?search=${encodeURIComponent(q)}`,
      `/api/customer/customers?search=${encodeURIComponent(q)}`,
      `/customers?search=${encodeURIComponent(q)}`
    ];
    for (const ep of endpoints) {
      try {
        const res = await api.get(ep);
        const list = (res.data && res.data.data) || res.data || [];
        if (Array.isArray(list)) {
          setSuggestions(list.map(c => ({ _id: c._id, name: c.name || c.email || String(c._id) })));
          return;
        }
      } catch (e) {
        // try next
      }
    }
    setSuggestions([]);
  }, []);

  useEffect(() => { fetchSuggestions(search); }, [search, fetchSuggestions]);

  const fetchNewChatCustomers = useCallback(async (q) => {
    if (!q) { setNewChatCustomers([]); return; }
    const endpoints = [
      `/api/customer/customers`,
      `/customer/customers`,
      `/api/customers`,
      `/customers`
    ];
    for (const ep of endpoints) {
      try {
        const res = await api.get(ep);
        const list = (res.data && res.data.data) || res.data || [];
        if (Array.isArray(list)) {
          const filtered = list
            .filter(c => c.name && c.name.toLowerCase().includes(q.toLowerCase()))
            .map(c => ({ _id: c._id, name: c.name }));
          setNewChatCustomers(filtered);
          return;
        }
      } catch (e) {
        // continue
      }
    }
    setNewChatCustomers([]);
  }, []);

  useEffect(() => { fetchNewChatCustomers(newChatSearch); }, [newChatSearch, fetchNewChatCustomers]);

  const startConv = async (cust) => {
    setSearch(''); setSuggestions([]);
    try {
      const { data } = await api.post('/api/chat/conversations', { otherUserId: cust._id });
      await loadConvs();
      selectConv((data && data.data && data.data._id) || data.data || data._id);
    } catch (err) {
      try {
        const { data } = await api.post('/chat/conversations', { otherUserId: cust._id });
        await loadConvs();
        selectConv((data && data.data && data.data._id) || data.data || data._id);
      } catch (err2) {
        console.error('Could not start chat:', err2?.message || err?.message);
        alert('Could not start chat');
      }
    }
  };

  useEffect(() => {
    loadConvs();
    listTimer.current = setInterval(loadConvs, POLL);
    return () => { clearInterval(listTimer.current); clearInterval(msgTimer.current); };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        {/* Left bar */}
        <aside className={`w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64`}>
          {/* Toggle buttons */}
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-700 flex space-x-2">
            <button
              onClick={() => { setShowNewChat(false); setSearch(''); setSuggestions([]); }}
              className={`flex-1 py-2 font-medium text-sm transition-all duration-200 border-b-2 ${!showNewChat ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400'}`}
            >
              Conversations
            </button>
            <button
              onClick={() => { setShowNewChat(true); setNewChatSearch(''); setNewChatCustomers([]); }}
              className={`flex-1 py-2 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 border-b-2 ${showNewChat ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400'}`}
            >
              <FiPlus size={16} /> New Chat
            </button>
          </div>

          {/* Search for existing conversations */}
          {!showNewChat && (
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers…"
                  className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 bg-white dark:bg-gray-800 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                {!!suggestions.length && (
                  <ul className="absolute z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg w-full mt-2 max-h-60 overflow-y-auto shadow-xl transition-all duration-300">
                    {suggestions.map((c) => (
                      <li
                        key={c._id}
                        onClick={() => startConv(c)}
                        className="px-4 py-3 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 text-gray-800 dark:text-gray-200"
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* New chat customer search */}
          {showNewChat && (
            <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
              <div className="relative">
                <input
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Search customers to start chat…"
                  className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 bg-white dark:bg-gray-800 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                {!!newChatCustomers.length && (
                  <ul className="absolute z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg w-full mt-2 max-h-60 overflow-y-auto shadow-xl transition-all duration-300">
                    {newChatCustomers.map((c) => (
                      <li
                        key={c._id}
                        onClick={() => startConv(c)}
                        className="px-4 py-3 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 text-gray-800 dark:text-gray-200"
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Conversation list */}
          {!showNewChat && convs.map((c) => {
            const otherName = getOtherName(c);
            const otherInitial = otherName[0]?.toUpperCase() || '?';
            return (
              <div
                key={c._id}
                onClick={() => selectConv(c._id)}
                className={`relative px-4 py-3 text-sm cursor-pointer transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-gray-700 ${selected === c._id ? "bg-indigo-100 dark:bg-gray-700" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-200 dark:bg-indigo-500 flex items-center justify-center text-sm font-medium text-indigo-800 dark:text-white shadow-sm">
                    {otherInitial}
                  </div>
                  <div className="flex-1">
                    <span className="truncate font-medium text-gray-800 dark:text-gray-200">{otherName}</span>
                  </div>
                  {c.unread && (
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 bg-red-500 rounded-full shadow-md animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Chat area */}
        <section className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg font-medium">
              Select or start a conversation
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  {(() => {
                    const conv = convs.find(c => c._id === selected);
                    if (!conv) return "Chat";
                    return getOtherName(conv) || "Chat";
                  })()}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {msgs.map((m) => {
                  const mine = String(m.sender) === String(myId);
                  return (
                    <div
                      key={m._id}
                      className={`flex ${mine ? "justify-end" : "justify-start"} mb-3 animate-slide-up`}
                    >
                      <div className={`flex items-end gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                        <div className="h-8 w-8 rounded-full bg-indigo-200 dark:bg-indigo-500 flex items-center justify-center text-sm font-medium text-indigo-800 dark:text-white shadow-sm">
                          {mine ? "You" : String(m.sender)[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-md ${mine ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"}`}>
                            {m.body}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2 group">
                            <span className="group-hover:underline cursor-pointer" title={new Date(m.createdAt).toLocaleString()}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {mine && String(m._id).startsWith("tmp-") && (
                              <span className="text-gray-400 dark:text-gray-500 animate-pulse">Sending...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Message input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t shadow-sm">
                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                  <input
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 bg-white dark:bg-gray-800 dark:text-white"
                    placeholder="Type a message..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    aria-label="Type a message"
                  />
                  <button
                    onClick={send}
                    className="p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                    aria-label="Send message"
                  >
                    <FiSend size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}