// TC-1 reproduction: scripted retail-boss interview. Answers deliberately use
// percentages and per-day figures (the tester's style) — the question is whether
// the final data JSON contains engine-usable COUNTS for conversion & repeat.
const BASE = 'http://localhost:3001'

const ANSWERS = [
  'START',
  '我的店叫 Lucky Mart，是杂货零售店',
  '零售，主要是 B2C 散客',
  '一个月大概营业额 8 万，想做到 12 万。毛利大概 25% 左右',
  '主要就是 walk-in 客人，一天大概 60 个人进店。也有一点 Facebook，一个月大概 50 个询问，花 RM500 广告',
  '进店的人大概 65% 会买东西。Facebook 的话大概 10 个会来买',
  '不知道什么漏斗，跳过吧',
  '主要卖日用品，平均一单大概 RM30。也有卖米和食用油，一包米 RM38 成本 RM32，一个月卖 300 包',
  '我的客人大概一半是熟客，常常回来买的，差不多一个星期来一次',
  '熟客会介绍朋友来，大概 10 个里面有 1 个会带新朋友',
  '广告就 RM500，没有给员工奖励，店租人工一个月大概 RM12000',
  '对，没错，就这样',
]

interface Turn { role: 'user' | 'assistant'; content: string }

async function main(): Promise<void> {
  const history: Turn[] = []
  let finalData: unknown = null

  for (const answer of ANSWERS) {
    history.push({ role: 'user', content: answer })
    const res = await fetch(`${BASE}/api/ai/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'zh', messages: history }),
    })
    const json = (await res.json()) as { reply?: string; done?: boolean; data?: unknown; message?: string }
    if (!res.ok) {
      console.log(`[HTTP ${res.status}] ${json.message ?? ''}`)
      break
    }
    console.log(`\nQ→ ${answer.slice(0, 40)}`)
    console.log(`A← ${(json.reply ?? '').slice(0, 160)}`)
    history.push({ role: 'assistant', content: JSON.stringify({ reply: json.reply, done: json.done, data: json.done ? json.data : null }) })
    if (json.done && json.data) {
      finalData = json.data
      break
    }
  }

  console.log('\n════ FINAL DATA ════')
  console.log(JSON.stringify(finalData, null, 1))

  // The verdict checks: did percentages become counts?
  const d = finalData as Record<string, any> | null
  if (d) {
    const walkIn = (d.channels ?? []).find((c: any) => /walk/i.test(c.name) || /店/.test(c.name))
    const won = d.funnel?.ClosedWon
    console.log('\n════ TC-1 VERDICT CHECKS ════')
    console.log('walk-in channel:', JSON.stringify(walkIn))
    console.log('funnel.ClosedWon:', won)
    console.log('recurring.repeatCustomers:', d.recurring?.repeatCustomers, ' newCustomers:', d.recurring?.newCustomers)
    console.log('recurring.avgRepeatCycle:', d.recurring?.avgRepeatCycle, ' referralsPer:', d.recurring?.avgReferralsPerCustomer)
  }
}

main().catch((e) => console.error('REPRO FAILED:', e))
