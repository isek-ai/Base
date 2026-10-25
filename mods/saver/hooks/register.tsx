import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Stats } from '../types'

type Tier = 'haiku' | 'sonnet' | 'keep'

// USD per million tokens, [input, output]. Estimates: edit to match your plan's real prices.
const PRICES: Record<string, readonly [number, number]> = {
  fable: [15, 75],
  opus: [5, 25],
  sonnet: [3, 15],
  haiku: [1, 5],
}
const CACHE_READ = 0.1
const CACHE_WRITE = 1.25

const HEAVY =
  /refactor|architect|design|debug|implement|migrat|security|race condition|рефактор|архитектур|спроектир|реализ|отлад|безопасн|миграц/i
const LIGHT =
  /typo|rename|format|translate|summari[sz]e|what is|what does|explain|опечат|переимен|форматир|переведи|кратко|что такое|что делает|объясни/i

const stats = atom(
  { plugin: 'saver', key: 'stats' } as const,
  { turns: 0, switched: 0, spent: 0, saved: 0, note: '' } as Stats,
)
const isEnabled = atom({ plugin: 'saver', key: 'isEnabled' } as const, true)
const isHidden = atom({ plugin: 'saver', key: 'isHidden' } as const, false)

const family = (model: string): string | undefined =>
  Object.keys(PRICES).find(name => model.toLowerCase().includes(name))

const classify = (text: string): Tier => {
  if (text.length > 1500 || HEAVY.test(text)) return 'keep'
  if (text.length < 240 && LIGHT.test(text)) return 'haiku'
  if (text.length < 600) return 'sonnet'
  return 'keep'
}

const rank = (name: string | undefined): number => {
  const order = ['haiku', 'sonnet', 'opus', 'fable']

  return name === undefined ? -1 : order.indexOf(name)
}

const cost = (
  name: string,
  u: {
    input_tokens: number
    output_tokens: number
    cache_read_input_tokens: number
    cache_creation_input_tokens: number
  },
): number => {
  const [input, output] = PRICES[name]

  return (
    (u.input_tokens * input +
      u.cache_read_input_tokens * input * CACHE_READ +
      u.cache_creation_input_tokens * input * CACHE_WRITE +
      u.output_tokens * output) /
    1_000_000
  )
}

const money = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`

export const register: Register = on => {
  let tier: Tier = 'keep'
  let chosen: string | undefined
  let original: string | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'saver',
      description: 'Show what Saver has spent and saved this session',
    })

    return next(e)
  })

  on('command.run', { command: 'saver' }, async $ => {
    const s = await read($, stats)

    return {
      text: `Saver: ${s.switched} of ${s.turns} turns moved to a cheaper model. Spent ${money(s.spent)}, saved about ${money(s.saved)} (estimate). Turn it on or off with the button above the prompt.`,
    }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command === undefined && e.origin !== undefined && !e.isMeta) {
      tier = (await read($, isEnabled)) ? classify(e.text) : 'keep'
      chosen = undefined
      original = undefined
    }

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined || tier === 'keep') {
      return yield* next(e)
    }

    const from = family(e.model)
    const target = chosen ?? tier
    const isCheaper = rank(target) < rank(from)

    if (!isCheaper) {
      return yield* next(e)
    }

    if (chosen === undefined) {
      chosen = target
      original = from
      void $.ui.toast(`Saver: using ${target} for this turn (was ${from})`)
    }

    return yield* next({ ...e, model: target })
  })

  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    const name = u === undefined ? undefined : family(u.model)

    if (u !== undefined && name !== undefined) {
      const spent = cost(name, u)
      const base = original !== undefined ? cost(original, u) : spent
      const isSwitched = original !== undefined
      await update($, stats, s => ({
        turns: s.turns + 1,
        switched: s.switched + (isSwitched ? 1 : 0),
        spent: s.spent + spent,
        saved: s.saved + Math.max(0, base - spent),
        note: isSwitched ? `last turn: ${name} instead of ${original}` : 'last turn: kept your model',
      }))
    }

    tier = 'keep'
    chosen = undefined
    original = undefined

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, stats)
    const enabled = await read($, isEnabled)

    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>
          Saver {enabled ? 'on' : 'off'}: spent {money(s.spent)}, saved ~{money(s.saved)}
          {s.note === '' ? '' : ` (${s.note})`}{' '}
        </Text>
        <Button
          key="toggle"
          label={enabled ? 'Turn off' : 'Turn on'}
          onPress={() => update($, isEnabled, v => !v)}
        />
        <Button key="hide" label="Hide" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
