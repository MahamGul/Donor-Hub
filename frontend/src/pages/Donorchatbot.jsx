import React, { useState, useRef, useEffect } from 'react'
import './DonorChatbot.css'

const API_BASE = 'http://localhost:8000'

const SUGGESTED_QUESTIONS = [
  'How do I create a donation?',
  'What categories can I donate?',
  'How do recurring donations work?',
  'How do I see my donation history?',
]

function DonorChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm your AidBridge donor assistant. Ask me anything about creating donations, managing plans, or tracking your impact.",
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
      const res = await fetch(`${API_BASE}/chatbot/donor`, {
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
        className={`donor-chatbot-fab ${open ? 'donor-chatbot-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle donor chat assistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="donor-chatbot-window">
          {/* Header */}
          <div className="donor-chatbot-header">
            <div className="donor-chatbot-header__avatar">🤝</div>
            <div>
              <p className="donor-chatbot-header__name">Donor Assistant</p>
              <p className="donor-chatbot-header__status">
                <span className="donor-chatbot-online-dot" /> Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="donor-chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`donor-chatbot-msg donor-chatbot-msg--${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <span className="donor-chatbot-msg__avatar">🤝</span>
                )}
                <div className="donor-chatbot-msg__bubble">{msg.content}</div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="donor-chatbot-msg donor-chatbot-msg--assistant">
                <span className="donor-chatbot-msg__avatar">🤝</span>
                <div className="donor-chatbot-msg__bubble donor-chatbot-msg__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions (shown only at the start) */}
          {messages.length <= 1 && (
            <div className="donor-chatbot-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="donor-chatbot-suggestion-btn"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="donor-chatbot-input-row">
            <input
              className="donor-chatbot-input"
              type="text"
              placeholder="Ask me anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className="donor-chatbot-send-btn"
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

export default DonorChatbot