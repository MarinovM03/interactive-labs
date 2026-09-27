export type Tick = 'hover' | 'click' | 'detent' | 'land'

type Voice = { from: number; to: number; duration: number; gain: number; type: OscillatorType; gap: number }

const voices: Record<Tick, Voice> = {
  hover: { from: 940, to: 700, duration: 0.04, gain: 0.016, type: 'sine', gap: 0.07 },
  click: { from: 620, to: 320, duration: 0.07, gain: 0.034, type: 'sine', gap: 0.07 },
  detent: { from: 2300, to: 1900, duration: 0.012, gain: 0.009, type: 'triangle', gap: 0.035 },
  land: { from: 260, to: 180, duration: 0.09, gain: 0.03, type: 'sine', gap: 0.12 },
}

let context: AudioContext | undefined
const lastTick: Partial<Record<Tick, number>> = {}

export async function unlockAudio() {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') await context.resume()
  } catch {
    // Audio is decorative. Browser policy must never block a link.
  }
}

export function tick(kind: Tick) {
  if (!context || context.state !== 'running') return
  const voice = voices[kind]
  const now = context.currentTime
  if (now - (lastTick[kind] ?? -Infinity) < voice.gap) return
  lastTick[kind] = now
  try {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = voice.type
    oscillator.frequency.setValueAtTime(voice.from, now)
    oscillator.frequency.exponentialRampToValueAtTime(voice.to, now + voice.duration)
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(voice.gain, now + 0.003)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + voice.duration)
    oscillator.connect(envelope)
    envelope.connect(context.destination)
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
    oscillator.start(now)
    oscillator.stop(now + voice.duration + 0.01)
  } catch {
    // Keep navigation immediate if the audio device is unavailable.
  }
}
