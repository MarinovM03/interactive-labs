export type Tick = 'click' | 'detent' | 'land'

type Voice = { from: number; to: number; duration: number; gain: number; type: OscillatorType; gap: number }

const voices: Record<Tick, Voice> = {
  click: { from: 520, to: 300, duration: 0.065, gain: 0.026, type: 'sine', gap: 0.07 },
  detent: { from: 1250, to: 1050, duration: 0.018, gain: 0.011, type: 'sine', gap: 0.04 },
  land: { from: 240, to: 170, duration: 0.09, gain: 0.026, type: 'sine', gap: 0.12 },
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
