'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

const RECORDING_LIMIT = 120
const COUNTDOWN = 3

interface VideoRecorderProps {
  questionId: number
  questionText: string
  userId: string
  existingVideoUrl?: string | null
  onComplete: () => void
}

export function VideoRecorder({
  questionId,
  questionText,
  userId,
  existingVideoUrl,
  onComplete,
}: VideoRecorderProps) {
  const [countdown, setCountdown] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(RECORDING_LIMIT)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingVideoUrl || null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const recordedRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => () => {
    cleanupStream()
    if (timerRef.current) clearInterval(timerRef.current)
  }, [cleanupStream])

  const uploadRecording = async (blob: Blob) => {
    setUploading(true)
    setError('')

    try {
      const supabase = await getSupabaseBrowserClient()
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const path = `${userId}/${questionId}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('video-answers')
        .upload(path, blob, { contentType: blob.type, upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: existing } = await supabase
        .from('video_answers')
        .select('id')
        .eq('applicant_id', userId)
        .eq('question_id', questionId)
        .maybeSingle()

      const row = {
        applicant_id: userId,
        question_id: questionId,
        video_url: path,
        status: 'completed' as const,
        updated_at: new Date().toISOString(),
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('video_answers')
          .update(row)
          .eq('id', existing.id)
        if (updateError) throw new Error(updateError.message)
      } else {
        const { error: insertError } = await supabase.from('video_answers').insert(row)
        if (insertError) throw new Error(insertError.message)
      }

      const { data: signed } = await supabase.storage
        .from('video-answers')
        .createSignedUrl(path, 3600)

      if (signed?.signedUrl) setPreviewUrl(signed.signedUrl)
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      cleanupStream()
    }
  }

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const startRecording = useCallback(async () => {
    setError('')
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play()
      }

      setCountdown(COUNTDOWN)
      const cd = setInterval(() => {
        setCountdown((n) => {
          if (n <= 1) {
            clearInterval(cd)
            const mime =
              ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(
                (t) => MediaRecorder.isTypeSupported(t),
              ) || 'video/webm'

            const recorder = new MediaRecorder(stream, { mimeType: mime })
            mediaRecorderRef.current = recorder
            recorder.ondataavailable = (ev) => {
              if (ev.data.size > 0) chunksRef.current.push(ev.data)
            }
            recorder.onstop = async () => {
              const blob = new Blob(chunksRef.current, { type: mime })
              if (blob.size === 0) {
                setError('No video captured — try again')
                return
              }
              const url = URL.createObjectURL(blob)
              if (recordedRef.current) recordedRef.current.src = url
              await uploadRecording(blob)
            }
            recorder.start(1000)
            setIsRecording(true)
            setTimeLeft(RECORDING_LIMIT)
            timerRef.current = setInterval(() => {
              setTimeLeft((t) => {
                if (t <= 1) {
                  handleStop()
                  return 0
                }
                return t - 1
              })
            }, 1000)
            return 0
          }
          return n - 1
        })
      }, 1000)
    } catch {
      setError('Camera/microphone access denied. Check browser permissions.')
    }
  }, [handleStop, uploadRecording])

  return (
    <div className="portal-glass rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--client-secondary)' }}>
        {questionText}
      </h2>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm opacity-80 mb-2">Live preview</p>
          <video ref={videoRef} className="w-full rounded-lg aspect-video bg-black" playsInline />
        </div>
        <div>
          <p className="text-sm opacity-80 mb-2">Recording preview</p>
          <video
            ref={recordedRef}
            src={previewUrl || undefined}
            className="w-full rounded-lg aspect-video bg-black"
            controls
            playsInline
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!isRecording && countdown === 0 && !uploading && (
          <button
            type="button"
            onClick={startRecording}
            className="px-6 py-2 rounded-full font-semibold"
            style={{
              background: 'linear-gradient(to right, var(--client-primary), var(--client-secondary))',
              color: 'var(--client-bg-start)',
            }}
          >
            {previewUrl ? 'Re-record answer' : 'Start recording'}
          </button>
        )}
        {countdown > 0 && (
          <span className="text-2xl font-bold recording-pulse">Starting in {countdown}…</span>
        )}
        {isRecording && (
          <>
            <span className="recording-pulse text-red-300 font-semibold">
              ● Recording — {timeLeft}s left
            </span>
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-semibold"
            >
              Stop
            </button>
          </>
        )}
        {uploading && <span className="text-sm opacity-80">Uploading to Supabase…</span>}
      </div>
    </div>
  )
}
