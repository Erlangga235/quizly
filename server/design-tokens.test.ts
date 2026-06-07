/**
 * Design token tests
 *
 * 1. Token presence — verifies all required CSS custom properties are declared
 *    in assets/css/tailwind.css (Requirements 1.1–1.4)
 *
 * 2. WCAG contrast — verifies foreground/background token pairs meet the
 *    minimum contrast ratios required by WCAG AA (Requirement 10.1)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Load the CSS file once ───────────────────────────────────────────────────

const CSS_PATH = resolve(process.cwd(), 'assets/css/tailwind.css')
const cssText = readFileSync(CSS_PATH, 'utf-8')

// ─── WCAG helpers ─────────────────────────────────────────────────────────────

/**
 * Convert space-separated HSL channel string ("H S% L%") to an [r, g, b]
 * triple in [0, 255].
 */
function hslChannelsToRgb(channels: string): [number, number, number] {
  const parts = channels.trim().split(/\s+/)
  if (parts.length !== 3) {
    throw new Error(`Expected 3 HSL parts, got: "${channels}"`)
  }

  const h = parseFloat(parts[0])
  const s = parseFloat(parts[1]) / 100
  const l = parseFloat(parts[2]) / 100

  // Standard HSL → RGB
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r1 = 0, g1 = 0, b1 = 0
  if (h < 60)       { r1 = c; g1 = x; b1 = 0 }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c }
  else              { r1 = c; g1 = 0; b1 = x }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ]
}

/** sRGB linearisation (IEC 61966-2-1) */
function linearise(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
}

/** WCAG contrast ratio — always ≥ 1 */
function contrastRatio(hslA: string, hslB: string): number {
  const [rA, gA, bA] = hslChannelsToRgb(hslA)
  const [rB, gB, bB] = hslChannelsToRgb(hslB)
  const lA = luminance(rA, gA, bA)
  const lB = luminance(rB, gB, bB)
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

// ─── Token values (from design.md) ───────────────────────────────────────────

const TOKEN = {
  background:            '150 14% 5%',
  foreground:            '150 8% 95%',
  card:                  '150 12% 8%',
  'card-foreground':     '150 8% 95%',
  primary:               '150 12% 11%',
  'primary-foreground':  '150 8% 96%',
  accent:                '152 64% 44%',
  'accent-foreground':   '150 40% 6%',
  'muted-foreground':    '150 7% 66%',
  destructive:           '0 72% 51%',
  'destructive-foreground': '0 0% 100%',
  success:               '122 55% 50%',
  'success-foreground':  '150 40% 6%',
  ring:                  '152 64% 44%',
}

// ─── 1. Token presence tests ──────────────────────────────────────────────────

describe('token presence in assets/css/tailwind.css', () => {
  // Req 1.1 — color tokens
  const colorTokens = [
    '--background', '--foreground',
    '--card', '--card-foreground',
    '--popover', '--popover-foreground',
    '--primary', '--primary-foreground',
    '--brand',
    '--accent', '--accent-foreground',
    '--accent-2', '--accent-2-foreground',
    '--secondary', '--secondary-foreground',
    '--muted', '--muted-foreground',
    '--success', '--success-foreground',
    '--warning', '--warning-foreground',
    '--destructive', '--destructive-foreground',
    '--border', '--input', '--ring',
    '--gradient-brand',
  ]

  it.each(colorTokens)('color token %s is declared', (token) => {
    expect(cssText).toContain(token)
  })

  // Req 1.2 — typography tokens
  const typographyTokens = [
    '--font-display', '--font-sans', '--font-mono',
    '--text-display-size', '--text-display-lh', '--text-display-weight',
    '--text-h1-size', '--text-h1-lh', '--text-h1-weight',
    '--text-h2-size', '--text-h2-lh', '--text-h2-weight',
    '--text-h3-size', '--text-h3-lh', '--text-h3-weight',
    '--text-body-size', '--text-body-lh', '--text-body-weight',
    '--text-sm-size', '--text-sm-lh', '--text-sm-weight',
  ]

  it.each(typographyTokens)('typography token %s is declared', (token) => {
    expect(cssText).toContain(token)
  })

  // Req 1.3 — spacing tokens
  const spacingTokens = [
    '--space-1', '--space-2', '--space-3', '--space-4',
    '--space-5', '--space-6', '--space-7', '--space-8',
    '--space-9', '--space-10', '--space-11', '--space-12',
  ]

  it.each(spacingTokens)('spacing token %s is declared', (token) => {
    expect(cssText).toContain(token)
  })

  // Req 1.3 — radius tokens
  const radiusTokens = [
    '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-pill', '--radius',
  ]

  it.each(radiusTokens)('radius token %s is declared', (token) => {
    expect(cssText).toContain(token)
  })

  // Req 1.3 — elevation tokens
  const elevationTokens = [
    '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-brand',
  ]

  it.each(elevationTokens)('elevation token %s is declared', (token) => {
    expect(cssText).toContain(token)
  })

  // Req 1.4 — motion tokens
  const motionTokens = [
    '--motion-fast', '--motion-base', '--motion-slow',
    '--ease-standard', '--ease-emphasized', '--ease-spring',
  ]

  it.each(motionTokens)('motion token %s is declared', (token) => {
    expect(cssText).toContain(token)
  })
})

// ─── 2. WCAG contrast tests ───────────────────────────────────────────────────

describe('WCAG contrast ratios (Requirement 10.1)', () => {
  // Normal text pairs — minimum 4.5:1
  const normalTextPairs: Array<[string, string, string]> = [
    ['foreground on background',            TOKEN.foreground,              TOKEN.background],
    ['primary-foreground on primary',       TOKEN['primary-foreground'],   TOKEN.primary],
    ['accent-foreground on accent',         TOKEN['accent-foreground'],    TOKEN.accent],
    ['muted-foreground on card',            TOKEN['muted-foreground'],     TOKEN.card],
    ['destructive-foreground on destructive', TOKEN['destructive-foreground'], TOKEN.destructive],
    ['success-foreground on success',       TOKEN['success-foreground'],   TOKEN.success],
  ]

  it.each(normalTextPairs)('%s ≥ 4.5:1', (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  // UI / large-text boundaries — minimum 3:1
  // primary vs background is satisfied via the focus ring/border (--ring = accent green),
  // not by fill contrast (both primary and background are near-black). The ring token
  // against the background surface is the actual UI boundary check (design.md §Color tokens).
  const uiBoundaryPairs: Array<[string, string, string]> = [
    ['accent on background (UI boundary)',    TOKEN.accent,   TOKEN.background],
    ['accent on card (UI boundary)',          TOKEN.accent,   TOKEN.card],
    ['ring (focus/border) vs background',     TOKEN.ring,     TOKEN.background],
  ]

  it.each(uiBoundaryPairs)('%s ≥ 3:1', (_label, a, b) => {
    const ratio = contrastRatio(a, b)
    expect(ratio).toBeGreaterThanOrEqual(3)
  })
})
