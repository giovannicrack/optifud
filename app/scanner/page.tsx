'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Package } from 'lucide-react'

interface DetectedItem {
  name: string
  quantity: number
  weight_g: number
}

interface ScanResult {
  detected: DetectedItem[]
  added: string[]
}

export default function ScannerPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(f: File) {
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
  }

  async function handleScan() {
    if (!file) return
    setScanning(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append('image', file)

    const res = await fetch('/api/scanner', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al procesar la imagen')
    } else {
      setResult(data)
    }
    setScanning(false)
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center">
          <Camera size={20} className="text-sky-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-800">Escáner de facturas</h1>
          <p className="text-zinc-400 text-sm">Fotografiá tu ticket y cargamos el stock automáticamente</p>
        </div>
      </div>

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
        >
          <Upload size={40} className="mx-auto text-zinc-300 group-hover:text-emerald-400 mb-3 transition-colors" />
          <p className="font-medium text-zinc-600 group-hover:text-emerald-700">Subir foto de la factura</p>
          <p className="text-sm text-zinc-400 mt-1">Arrastrá o hacé clic · JPG, PNG, WEBP</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Factura" className="w-full max-h-64 object-contain bg-zinc-50" />
          </div>

          {!result && !scanning && (
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 border border-zinc-200 text-zinc-600 font-medium py-3 rounded-2xl hover:bg-zinc-50 transition-colors text-sm"
              >
                Cambiar imagen
              </button>
              <button
                onClick={handleScan}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Camera size={16} />
                Analizar factura
              </button>
            </div>
          )}

          {scanning && (
            <div className="bg-sky-50 rounded-2xl p-6 text-center space-y-2">
              <Loader2 size={32} className="mx-auto animate-spin text-sky-500" />
              <p className="font-medium text-sky-700">Analizando con IA...</p>
              <p className="text-sm text-sky-500">Detectando productos de la factura</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-700">Error al analizar</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
                {error.includes('ANTHROPIC_API_KEY') && (
                  <p className="text-xs text-red-500 mt-2">
                    Para usar el escáner, configurá la variable <code className="bg-red-100 px-1 rounded">ANTHROPIC_API_KEY</code> en el archivo <code className="bg-red-100 px-1 rounded">.env.local</code>
                  </p>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-emerald-800">Listo! {result.added.length} items agregados al stock</p>
                  <p className="text-sm text-emerald-600 mt-0.5">{result.detected.length} productos detectados en la factura</p>
                </div>
              </div>

              {result.detected.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-50">
                    <h3 className="text-sm font-semibold text-zinc-700">Productos detectados</h3>
                  </div>
                  <div className="divide-y divide-zinc-50">
                    {result.detected.map((item, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-zinc-400" />
                          <span className="text-sm text-zinc-700 font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm text-zinc-500">
                          {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.weight_g >= 1000 ? `${item.weight_g / 1000} kg` : `${item.weight_g} g`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.added.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-50">
                    <h3 className="text-sm font-semibold text-zinc-700">Agregado al stock</h3>
                  </div>
                  <div className="divide-y divide-zinc-50">
                    {result.added.map((item, i) => (
                      <div key={i} className="px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-sm text-zinc-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium py-3 rounded-2xl transition-colors text-sm"
              >
                Escanear otra factura
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-zinc-50 rounded-2xl p-4 text-sm text-zinc-500 space-y-1.5">
        <p className="font-medium text-zinc-600">¿Cómo funciona?</p>
        <p>1. Fotografiá el ticket de compra del supermercado</p>
        <p>2. La IA detecta automáticamente los productos y cantidades</p>
        <p>3. Los alimentos se agregan a tu stock en segundos</p>
      </div>
    </div>
  )
}
