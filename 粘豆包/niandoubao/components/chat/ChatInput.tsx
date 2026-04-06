'use client'
import { useState, useRef } from 'react'

interface ImageItem {
  apiBase64: string   // 发给 API 的压缩图（600px）
  thumbBase64: string // 持久化用的小缩略图（120px）
  name: string
}

interface ChatInputProps {
  onSend: (message: string, images?: { api: string; thumb: string }[]) => void
  disabled?: boolean
  placeholder?: string
}

/** 压缩图片到指定最大宽度，返回 base64 */
function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let w = img.width
      let h = img.height
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w)
        w = maxWidth
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export function ChatInput({ onSend, disabled, placeholder = '说说现在的感受…' }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [compressing, setCompressing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    const text = value.trim()
    if (!text && images.length === 0) return
    if (disabled || compressing) return
    const imgList = images.length > 0 ? images.map(i => ({ api: i.apiBase64, thumb: i.thumbBase64 })) : undefined
    onSend(text || '[图片]', imgList)
    setValue('')
    setImages([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 192) + 'px'
  }

  function handleImageClick() {
    fileInputRef.current?.click()
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setCompressing(true)
    try {
      const remaining = 5 - images.length
      const toProcess = Array.from(files).slice(0, remaining)

      const results: ImageItem[] = []
      for (const file of toProcess) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 20 * 1024 * 1024) continue
        try {
          // 两种尺寸：API 用 600px（减小体积加速识别），缩略图 120px（持久化到数据库）
          const [apiImg, thumbImg] = await Promise.all([
            compressImage(file, 600, 0.6),
            compressImage(file, 120, 0.4),
          ])
          results.push({ apiBase64: apiImg, thumbBase64: thumbImg, name: file.name })
        } catch {
          // 压缩失败跳过
        }
      }
      if (results.length > 0) {
        setImages(prev => [...prev, ...results].slice(0, 5))
      }
    } finally {
      setCompressing(false)
    }
    e.target.value = ''
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div
      className="flex-shrink-0 border-t border-border"
      style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.apiBase64} alt="预览" className="h-16 w-16 rounded-lg border border-border object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-text-primary text-white rounded-full flex items-center justify-center text-[12px] leading-none"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              onClick={handleImageClick}
              className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-colors"
            >
              <span className="text-xl">+</span>
            </button>
          )}
        </div>
      )}

      {compressing && (
        <p className="text-[12px] text-text-muted mb-1">图片处理中…</p>
      )}

      <div className="flex gap-1.5 items-center">
        {/* 左：上传图片 */}
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-text-muted hover:text-primary hover:bg-primary/5 active:scale-90 transition-all"
          onClick={handleImageClick}
          disabled={disabled || compressing}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="16" />
            <line x1="8" x2="16" y1="12" y2="12" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />

        {/* 中：输入框 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); handleInput() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          disabled={disabled}
          placeholder={disabled ? '粘豆包正在思考…' : placeholder}
          rows={1}
          className="flex-1 resize-none bg-surface text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50 scrollbar-hide"
          style={{
            border: '1px solid rgba(139,115,85,0.25)',
            borderRadius: '10px',
            padding: '10px 13px',
            lineHeight: '1.6',
            maxHeight: '192px',
            fontFamily: 'inherit',
          }}
        />

        {/* 右：发送 */}
        <button
          onClick={handleSend}
          disabled={disabled || compressing || (!value.trim() && images.length === 0)}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 hover:bg-primary-dark transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
