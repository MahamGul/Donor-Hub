import React, { useState, useRef, useEffect } from 'react'
import './RecipientChatbot.css'

const API_BASE = 'http://localhost:8000'

const SUGGESTED_QUESTIONS = [
  'How do I make a new request?',
  'How do I track my request?',
  'What does "Granted" mean?',
  'How do I give feedback?',
]

function RecipientChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm your AidBridge assistant. Ask me anything about making requests, tracking status, or using the platform.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: newMessages.slice(1), // exclude the initial greeting
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`chatbot-fab ${open ? 'chatbot-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle chat assistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header__avatar">🤲</div>
            <div>
              <p className="chatbot-header__name">AidBridge Assistant</p>
              <p className="chatbot-header__status">
                <span className="chatbot-online-dot" /> Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-msg chatbot-msg--${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <span className="chatbot-msg__avatar">🤲</span>
                )}
                <div className="chatbot-msg__bubble">{msg.content}</div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="chatbot-msg chatbot-msg--assistant">
                <span className="chatbot-msg__avatar">🤲</span>
                <div className="chatbot-msg__bubble chatbot-msg__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions (shown only at the start) */}
          {messages.length <= 1 && (
            <div className="chatbot-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="chatbot-suggestion-btn"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-row">
            <input
              className="chatbot-input"
              type="text"
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default RecipientChatbot
