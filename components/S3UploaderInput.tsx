'use client'

import React, {useState, useCallback, useEffect, useRef} from 'react'
import type {ObjectInputProps} from 'sanity'
import {set, unset, useFormValue} from 'sanity'
import {Card, Stack, Text, Button, Flex, Spinner} from '@sanity/ui'
import {FFmpeg} from '@ffmpeg/ffmpeg'
import {fetchFile, toBlobURL} from '@ffmpeg/util'
import { hmacSha256Hex } from '../utils/hmac'

interface HighResFileValue {
  fileName?: string
  s3Key?: string
  mp3AssetId?: string
  mp3Url?: string
}

const ffmpeg = new FFmpeg()

export default function S3UploaderInput(props: ObjectInputProps<HighResFileValue>) {
  const {value, onChange, readOnly} = props

  // Correct: Sanity document ID
  const documentId = useFormValue(['_id']) as string | undefined

  const [isEncoding, setIsEncoding] = useState(false)
  const [isFfmpegReady, setIsFfmpegReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------- Load WASM on mount ----------
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        if (!ffmpeg.loaded) {
          const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm'

          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          })
        }

        if (!cancelled) {
          setIsFfmpegReady(true)
        }
      } catch (err) {
        console.error('FFmpeg load failed:', err)
        if (!cancelled) setError('Failed to load audio encoder.')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // ---------- Upload handler ----------
  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return

      const wavFile = event.target.files?.[0]
      if (!wavFile) return

      if (!wavFile.name.toLowerCase().endsWith('.wav')) {
        setError('Only .wav files can be uploaded.')
        return
      }

      if (!documentId) {
        setError('Document ID missing.')
        return
      }

      if (!isFfmpegReady) {
        setError('Audio encoder still loading.')
        return
      }

      try {
        setIsEncoding(true)
        setError(null)

        // -----------------------------
        // 1️⃣ WAV → MP3 (browser-side ffmpeg.wasm)
        // -----------------------------
        const wavBytes = await fetchFile(wavFile)
        await ffmpeg.writeFile('input.wav', wavBytes)

        await ffmpeg.exec(['-i', 'input.wav', '-b:a', '96k', 'output.mp3'])

        const mp3Data = await ffmpeg.readFile('output.mp3')

        const mp3Bytes = typeof mp3Data === 'string' ? new TextEncoder().encode(mp3Data) : mp3Data

        // -----------------------------
        // Ensures Blob gets a real ArrayBuffer (never SharedArrayBuffer)
        // -----------------------------
        const mp3Buffer = new Uint8Array(mp3Bytes).buffer.slice(0)

        const mp3Blob = new Blob([mp3Buffer], {type: 'audio/mpeg'})

        const mp3File = new File([mp3Blob], wavFile.name.replace(/\.wav$/i, '.mp3'), {
          type: 'audio/mpeg',
        })

        // -----------------------------
        // 2️⃣ Send WAV + MP3 to backend
        // -----------------------------
        const formData = new FormData()
        formData.append('wav', wavFile)
        formData.append('mp3', mp3File)
        formData.append('documentId', documentId)

        const uploadSecret = process.env.SANITY_STUDIO_UPLOAD_SECRET

        if (!uploadSecret) {
          throw new Error('SANITY_STUDIO_UPLOAD_SECRET is not configured')
        }

        const timestamp = Date.now().toString()
        const message = `${documentId}:${timestamp}`
        const signature = await hmacSha256Hex(uploadSecret, message)

        const res = await fetch(`${process.env.SANITY_STUDIO_API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'x-upload-timestamp': timestamp,
            'x-upload-signature': signature
          }
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')

        // -----------------------------
        // 3️⃣ Update the highResFile field
        // (Backend patches previewFile automatically)
        // -----------------------------
        onChange(
          set({
            fileName: wavFile.name,
            s3Key: data.s3Key,
            mp3AssetId: data.assetId,
            mp3Url: data.url,
          }),
        )

        // Cleanup WASM FS
        ffmpeg.deleteFile('input.wav')
        ffmpeg.deleteFile('output.mp3')
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Encoding/upload failed.')
      } finally {
        setIsEncoding(false)
      }
    },
    [onChange, readOnly, documentId, isFfmpegReady],
  )

  // ---------- Clear all fields ----------
  const clearValue = useCallback(() => {
    onChange(unset())
  }, [onChange])

  // ---------- UI ----------
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        {/* Existing file info */}
        {value?.fileName && (
          <Stack space={3}>
            <Text size={2} weight="semibold">
              {value.fileName}
            </Text>

            {value.s3Key && (
              <Text size={1} muted>
                S3 key: <code>{value.s3Key}</code>
              </Text>
            )}

            {value.mp3Url && (
              <Stack space={2}>
                <audio controls src={value.mp3Url} style={{width: '100%'}} />
                <Text size={1} muted>
                  Generated MP3 preview
                </Text>
              </Stack>
            )}
          </Stack>
        )}

        {/* Upload input */}
        <Stack space={3}>
          <input
            type="file"
            accept=".wav"
            disabled={isEncoding || readOnly || !isFfmpegReady}
            onChange={handleUpload}
          />

          {!isFfmpegReady && !error && (
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text size={1}>Loading audio encoder…</Text>
            </Flex>
          )}

          {isEncoding && (
            <Flex align="center" gap={2}>
              <Spinner muted />
              <Text>Encoding & uploading…</Text>
            </Flex>
          )}
        </Stack>

        {/* Clear */}
        {value && !isEncoding && !readOnly && (
          <Button text="Remove upload" tone="critical" onClick={clearValue} />
        )}

        {/* Error */}
        {error && (
          <Card tone="critical" padding={3} radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        )}
      </Stack>
    </Card>
  )
}
