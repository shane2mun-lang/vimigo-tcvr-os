// ─────────────────────────────────────────────────────────────────────────────
// Help dictionary — the hover "?" explanations for every metric and feature.
// Each entry: `what` (这是什么/为什么重要) + `how` (怎么算 — the actual formula).
// Rendered by <HelpTip k="..."/>. Keys are referenced across all screens.
// ─────────────────────────────────────────────────────────────────────────────

export interface HelpEntry {
  what: { zh: string; en: string }
  how: { zh: string; en: string }
}

export const helpStrings = {
  // ── Revenue X-Ray KPIs ───────────────────────────────────────────────────────
  currentSales: {
    what: { zh: '你现在每个月实际收进来的营业额。整个诊断以它为基准。', en: 'The revenue you actually book each month. The whole diagnosis is anchored to it.' },
    how: { zh: '来源：你在「商业资料」填的目前月营业额；没填时由 流量×转化率×客单 推算。', en: 'Source: the current monthly revenue you entered; if blank, modeled as Traffic × Conversion × ABV.' },
  },
  targetSales: {
    what: { zh: '你想达到的月营业额目标。', en: 'The monthly revenue you want to reach.' },
    how: { zh: '来源：你在「商业资料」填的目标月营业额。', en: 'Source: the target monthly revenue you entered in Company Profile.' },
  },
  salesGap: {
    what: { zh: '离目标还差多少。整个 TCVR 诊断就是在找：用哪个杠杆补上这个缺口最快。', en: 'How far you are from target. The TCVR diagnosis finds the fastest lever to close it.' },
    how: { zh: '营业额缺口 = 目标月营业额 − 目前月营业额', en: 'Sales gap = Target revenue − Current revenue' },
  },
  gp: {
    what: { zh: '毛利才是你真正赚到的钱 — 老板不能只看营业额。', en: 'Gross profit is the money you actually make — never look at sales alone.' },
    how: { zh: '毛利 GP = 营业额 × GP率', en: 'Gross Profit = Revenue × GP margin' },
  },
  gpMargin: {
    what: { zh: '每 RM100 营业额里，扣掉货品/直接成本后剩多少。', en: 'Out of every RM100 in sales, what remains after direct/product cost.' },
    how: { zh: 'GP率 = (售价−成本)÷售价。来源优先级：你填的 → 渠道GP÷销售 → 产品加权 → 行业基准。', en: 'GP margin = (Price − Cost) ÷ Price. Priority: your input → channel GP ÷ sales → product-weighted → benchmark.' },
  },
  blendedCac: {
    what: { zh: '平均获得一个新客户花多少钱 — 包含免费渠道（walk-in、转介绍），反映整体获客效率。', en: 'Average cost to win one new customer — includes free channels, shows overall acquisition efficiency.' },
    how: { zh: '综合 CAC = 总营销花费 ÷ 所有新客户数', en: 'Blended CAC = Total marketing spend ÷ ALL new customers' },
  },
  paidCac: {
    what: { zh: '纯靠广告买一个客户的真实成本 — 不被免费客户稀释。和综合 CAC 的差距 = 免费渠道帮你省的钱。', en: 'The true cost of buying a customer with ads — undiluted by free customers.' },
    how: { zh: '付费 CAC = 付费广告花费 ÷ 付费渠道成交客户数', en: 'Paid CAC = Paid ad spend ÷ customers closed from paid channels' },
  },
  abv: {
    what: { zh: '平均一张单做多大。提升客单是不加流量也能涨业绩的杠杆。', en: 'Average size of one order. Raising it grows revenue without more traffic.' },
    how: { zh: 'ABV = Σ(售价×月销量) ÷ Σ月销量（不含引流品）', en: 'ABV = Σ(price × volume) ÷ Σ volume (lead-magnet products excluded)' },
  },
  ltv: {
    what: { zh: '一个客户一辈子总共帮你赚多少毛利。LTV 越高，你能花更多钱抢客户还稳赚。', en: 'Total gross profit one customer brings over their lifetime. Higher LTV = you can outspend competitors on acquisition.' },
    how: { zh: 'LTV = 客单 ABV × GP率 × 生命周期内购买次数（生命周期月数×30 ÷ 回购周期天数）', en: 'LTV = ABV × GP margin × purchases over lifespan (lifespan-months × 30 ÷ repeat-cycle days)' },
  },
  ltvCac: {
    what: { zh: '赚回获客成本的倍数。≥3 健康；<1 表示买一个客户是亏钱的。', en: 'How many times you earn back acquisition cost. ≥3 healthy; <1 means you lose money per customer.' },
    how: { zh: 'LTV : CAC = 客户终身毛利 ÷ 综合获客成本', en: 'LTV : CAC = lifetime gross profit ÷ blended CAC' },
  },
  convRate: {
    what: { zh: '100 个 Leads 里有几个变成付钱客户。最常见的隐形漏水点。', en: 'Of 100 leads, how many become paying customers. The most common hidden leak.' },
    how: { zh: '转化率 = 成交客户数 ÷ 总 Leads（成交数优先取漏斗「成交」，其次渠道成交合计）', en: 'Conversion = customers ÷ total leads (customers from funnel Closed-Won, else channel totals)' },
  },
  repeatRate: {
    what: { zh: '客户回来再买的比例。复购是最便宜的营业额 — 不用再花广告费。', en: 'Share of customers who come back. Repeat revenue is the cheapest revenue — no ad spend needed.' },
    how: { zh: '复购率 = 回购客户 ÷ (新客户 + 回购客户)', en: 'Repeat rate = repeat customers ÷ (new + repeat customers)' },
  },
  referralRate: {
    what: { zh: '客户帮你带来新客户的能力。转介绍客户成交快、CAC 几乎为零。', en: 'How well customers bring you new customers. Referrals close fast at near-zero CAC.' },
    how: { zh: '转介率 = 每客户平均介绍人数 × 转介成交率', en: 'Referral rate = avg referrals per customer × referral close rate' },
  },
  netProfit: {
    what: { zh: '扣掉三大费用后，生意每月真正留下的钱。', en: 'What the business actually keeps each month after the three big costs.' },
    how: { zh: '净利影响 = 毛利 − 营销成本 − 奖励成本 − 运营成本', en: 'Net-profit impact = GP − marketing − reward − operational costs' },
  },
  newCustomers: {
    what: { zh: '每月新成交的客户数，是 CAC 和转化率的分母/分子来源。', en: 'New customers closed per month — feeds CAC and conversion rate.' },
    how: { zh: '优先级：漏斗「成交」数 → 各渠道成交合计 → 你填的每月新客户。', en: 'Priority: funnel Closed-Won → sum of channel closes → your entered new customers.' },
  },
  pillarHealth: {
    what: { zh: 'TCVR 四大支柱各打 0–100 分：≥70 绿（健康）、45–69 黄（注意）、<45 红（警告）。最低分的支柱就是你的瓶颈。', en: 'Each TCVR pillar scores 0–100: ≥70 green, 45–69 yellow, <45 red. The lowest pillar is your bottleneck.' },
    how: { zh: '把你的实际数字对比同业基准（按销售模式），加权平均。例：转化分 = 成交率(×2.5) + SOP覆盖(×1) + 收款率(×1)。', en: 'Your actuals vs industry benchmarks (by sales model), weighted. E.g. Conversion = close-rate(×2.5) + SOP coverage(×1) + payment rate(×1).' },
  },

  // ── Traffic ──────────────────────────────────────────────────────────────────
  cpl: {
    what: { zh: '这个渠道买一个 Lead 要多少钱。免费渠道（0 花费）显示 — 不参与计算。', en: 'Cost to buy one lead on this channel. Free channels (0 spend) show — and are excluded.' },
    how: { zh: 'CPL = 该渠道月花费 ÷ 该渠道月 Leads', en: 'CPL = channel monthly spend ÷ channel monthly leads' },
  },
  channelConv: {
    what: { zh: '这个渠道的 Leads 有多少变成成交 — 分辨「热闹渠道」和「赚钱渠道」。', en: 'How many of this channel\'s leads close — separates noisy channels from money channels.' },
    how: { zh: '渠道转化率 = 该渠道成交数 ÷ 该渠道 Leads', en: 'Channel conversion = channel closes ÷ channel leads' },
  },
  roi: {
    what: { zh: '广告花 RM1 能赚回多少毛利。负数 = 这个渠道在亏钱。', en: 'GP earned per RM1 of ad spend. Negative = this channel loses money.' },
    how: { zh: 'ROI = (该渠道毛利 − 花费) ÷ 花费', en: 'ROI = (channel GP − spend) ÷ spend' },
  },
  contribution: {
    what: { zh: '这个渠道占全公司销售额的比重 — 看清生意靠哪条腿站着。', en: 'This channel\'s share of total sales — see which leg the business stands on.' },
    how: { zh: '贡献占比 = 该渠道销售额 ÷ 所有渠道销售额', en: 'Contribution = channel sales ÷ total sales across channels' },
  },
  leadQuality: {
    what: { zh: '1–5 主观评分：这个渠道来的客准不准。会计入流量健康分。', en: 'Subjective 1–5: how qualified this channel\'s leads are. Feeds the Traffic health score.' },
    how: { zh: '你自己评分（1 最差 5 最好）；流量健康分取各渠道平均。', en: 'You rate it (1 worst – 5 best); Traffic health uses the average.' },
  },
  channelFollowup: {
    what: { zh: '这个渠道的 Leads 有没有人系统地跟进 — 没跟进的 Leads = 白买的流量。', en: 'Is someone systematically following up this channel\'s leads? Unfollowed leads = wasted traffic spend.' },
    how: { zh: '开/关记录用；提醒你哪个渠道在漏 Leads。', en: 'A record toggle — flags which channels leak leads.' },
  },
  paidCpl: {
    what: { zh: '只算付费广告的 Lead 成本 — 不被免费流量拉低，看广告的真实效率。', en: 'Lead cost from paid ads ONLY — not flattered by free traffic; the real ad efficiency.' },
    how: { zh: '付费 CPL = 付费渠道总花费 ÷ 付费渠道总 Leads', en: 'Paid CPL = total paid spend ÷ total paid-channel leads' },
  },
  paidRoas: {
    what: { zh: '广告花 RM1 带回多少销售额。', en: 'Sales brought back per RM1 of ad spend.' },
    how: { zh: '付费 ROAS = 付费渠道销售额 ÷ 付费广告花费', en: 'Paid ROAS = paid-channel sales ÷ paid ad spend' },
  },
  paidGpRoas: {
    what: { zh: '广告花 RM1 带回多少毛利 — 比 ROAS 更诚实：>1 才是真赚钱。', en: 'GP brought back per RM1 of ad spend — more honest than ROAS: only >1 truly makes money.' },
    how: { zh: '付费 GP ROAS = 付费渠道毛利 ÷ 付费广告花费', en: 'Paid GP ROAS = paid-channel GP ÷ paid ad spend' },
  },
  organicPanel: {
    what: { zh: 'Walk-in、转介绍、自然内容等免费渠道的贡献 — 照常展示，但不计入付费效率，避免误判广告表现。', en: 'Free channels (walk-in, referral, organic) — fully shown, but excluded from paid efficiency so ad numbers stay honest.' },
    how: { zh: '花费为 0 的渠道自动归为免费渠道。', en: 'Channels with zero spend are auto-classified organic.' },
  },
  bestChannel: {
    what: { zh: 'ROI 最高的付费渠道 — 加预算优先加这里。', en: 'Highest-ROI paid channel — scale budget here first.' },
    how: { zh: '在 Leads≥5 的付费渠道中按 ROI 排名。', en: 'Ranked by ROI among paid channels with ≥5 leads.' },
  },
  worstChannel: {
    what: { zh: 'ROI 最低的付费渠道 — 先修，修不好就停。', en: 'Lowest-ROI paid channel — fix it, or stop it.' },
    how: { zh: '在 Leads≥5 的付费渠道中按 ROI 排名（最低）。', en: 'Lowest ROI among paid channels with ≥5 leads.' },
  },
  trafficGap: {
    what: { zh: '照现在的转化和客单不变，要达标还缺多少 Leads。', en: 'At today\'s conversion and ABV, how many more leads you need to hit target.' },
    how: { zh: '缺口 = 目标营业额 ÷ (营业额÷总Leads) − 现有 Leads', en: 'Gap = target ÷ (revenue ÷ total leads) − current leads' },
  },

  // ── Conversion ───────────────────────────────────────────────────────────────
  overallConv: {
    what: { zh: '从 Lead 到成交的整体转化率 — 漏斗的总成绩单。', en: 'Overall lead-to-close rate — the funnel\'s report card.' },
    how: { zh: '整体转化率 = 成交数 ÷ Lead 数', en: 'Overall conversion = Closed-Won ÷ Leads' },
  },
  stepRate: {
    what: { zh: '每一关有多少客户走到下一关 — 找出客户卡死在哪一关。', en: 'How many advance from each stage to the next — find exactly where customers get stuck.' },
    how: { zh: '关卡转化率 = 下一关数量 ÷ 这一关数量', en: 'Step rate = next-stage count ÷ this-stage count' },
  },
  biggestDrop: {
    what: { zh: '转化率最低的一关 = 最大流失关卡，优先修这里（话术/SOP）。', en: 'The stage with the lowest pass rate = your biggest leak. Fix here first.' },
    how: { zh: '取主路径上 stepRate 最低、且数量≥3 的一关。', en: 'Lowest step rate along the main path (count ≥3).' },
  },
  lostValue: {
    what: { zh: '失单等于丢掉的营业额 — 把"丢了多少钱"变成看得见的数字。', en: 'Lost deals are lost revenue — makes the leak visible in RM.' },
    how: { zh: '流失销售额 = 失单数 × 平均客单 ABV', en: 'Lost sales value = lost deals × ABV' },
  },
  followupLeak: {
    what: { zh: '报了价/进了跟进却没收尾的钱 — 通常是最容易救回来的一笔。', en: 'Deals quoted/followed-up but never closed — usually the easiest money to recover.' },
    how: { zh: '跟进漏失 = (跟进数 − 成交数) × ABV', en: 'Follow-up leakage = (FollowUp − ClosedWon) × ABV' },
  },
  sop: {
    what: { zh: '这一关有没有标准化脚本/SOP（话术、模板、跟进节奏）。有 SOP = 靠系统赢；没 SOP = 靠个人发挥。', en: 'Does this stage have a standardized script/SOP? With SOP results come from the system, not individual talent.' },
    how: { zh: 'SOP 覆盖率计入转化健康分；覆盖率 <50% 且转化最弱时，瓶颈判为「团队不跟进」，并触发跟进纪律奖励建议。', en: 'SOP coverage feeds Conversion health; if <50% and conversion is weakest, the bottleneck is diagnosed as no-follow-up and a discipline-reward is suggested.' },
  },
  salesCycle: {
    what: { zh: '一张单从 Lead 到收款平均要走多少天 — 越长现金流压力越大。', en: 'Days from lead to payment — the longer, the heavier the cashflow strain.' },
    how: { zh: '销售周期 = 各阶段平均等待天数之和', en: 'Sales cycle = sum of average wait days across stages' },
  },

  // ── Value / products ─────────────────────────────────────────────────────────
  gpUnit: {
    what: { zh: '卖一件真正赚到的钱。', en: 'What you actually earn per unit sold.' },
    how: { zh: '单位毛利 = 售价 − 成本', en: 'GP per unit = price − cost' },
  },
  productMargin: {
    what: { zh: '这个产品的毛利率 — 决定它该不该被主推、被奖励。', en: 'This product\'s margin — decides if it deserves push and rewards.' },
    how: { zh: 'GP% = (售价 − 成本) ÷ 售价', en: 'GP% = (price − cost) ÷ price' },
  },
  productTag: {
    what: { zh: '产品在阶梯中的角色：引流品拉新客 → 爆品上量 → 核心品扛营收 → 利润品赚钱 → 大鲸鱼做高客单 → 复购品锁住客户。缺一环，钱就从那一环漏。', en: 'The product\'s ladder role: lead-magnet pulls customers → hero drives volume → core carries revenue → profit makes money → whale lifts ticket size → repeat locks customers in.' },
    how: { zh: '你自己选，或让 AI 按价格/成本/定位自动分类。', en: 'Pick manually, or let AI classify by price/cost/positioning.' },
  },
  mixContribution: {
    what: { zh: '这个产品占全公司毛利的比重 — 看清谁在真正养活公司。', en: 'This product\'s share of total GP — see what actually feeds the company.' },
    how: { zh: '组合占比 = 该产品月毛利 ÷ 所有产品月毛利', en: 'Mix = product monthly GP ÷ total monthly GP' },
  },
  rewardPriority: {
    what: { zh: '高毛利但卖得少的产品 — 最适合设成销售挑战/奖励指标，让团队有动力推。', en: 'High-margin but low-volume products — perfect as a sales challenge so the team pushes them.' },
    how: { zh: '自动标记：GP% ≥50% 且销量低于中位数，或你勾选「适合奖励指标」。', en: 'Auto-flagged: GP% ≥50% with below-median volume, or your reward-target tick.' },
  },

  // ── Recurring / referral ─────────────────────────────────────────────────────
  rpf: {
    what: { zh: '复购把营业额放大的倍数。没人回购 = 1.0（不放大）。', en: 'How much repeat buying multiplies revenue. No repeats = 1.0 (no lift).' },
    how: { zh: '复购系数 = 1 + 回购占比 × (平均回购次数 − 1)', en: 'RPF = 1 + repeat-share × (avg repeat count − 1)' },
  },
  rm: {
    what: { zh: '转介绍把营业额放大的倍数。', en: 'How much referrals multiply revenue.' },
    how: { zh: '转介系数 = 1 + 人均介绍数 × 转介成交率', en: 'RM = 1 + referrals per customer × referral close rate' },
  },
  lostRetention: {
    what: { zh: '如果复购做到同业健康水平，每月可以多收的营业额 — 你正在漏掉的复购钱。', en: 'Extra monthly revenue if repeat behavior reached healthy benchmark — the retention money you\'re leaking.' },
    how: { zh: '损失 = 营业额 × (基准复购系数 ÷ 现在复购系数 − 1)', en: 'Loss = revenue × (benchmark RPF ÷ current RPF − 1)' },
  },
  referralForecast: {
    what: { zh: '照现在的转介绍习惯，每月能带来的销售额。', en: 'Monthly sales your current referral behavior generates.' },
    how: { zh: '预测 = 新客户 × 人均介绍数 × 转介成交率 × ABV', en: 'Forecast = new customers × referrals each × close rate × ABV' },
  },
  comeback: {
    what: { zh: '回购客户带来的月销售额。', en: 'Monthly sales from returning customers.' },
    how: { zh: '回访预测 = 回购客户数 × ABV', en: 'Comeback = repeat customers × ABV' },
  },
  retentionMechanisms: {
    what: { zh: '四个锁客机制：会员制度、售后跟进、Review 见证、转介奖励。每缺一个，复购健康分就降一档。', en: 'Four retention mechanisms: membership, after-care, reviews, referral reward. Each missing one lowers Recurring health.' },
    how: { zh: '机制得分 = 已开启数 ÷ 4，计入复购健康分。', en: 'Infra score = enabled ÷ 4, feeds Recurring health.' },
  },

  // ── Costs ────────────────────────────────────────────────────────────────────
  rewardShare: {
    what: { zh: '奖励占毛利的比例 — 健康的奖励应该从「多赚的增量毛利」里提拨，而不是固定开销。', en: 'Reward as % of GP — healthy rewards come out of INCREMENTAL GP, not fixed overhead.' },
    how: { zh: '奖励占比 = 奖励成本 ÷ 毛利', en: 'Reward share = reward cost ÷ gross profit' },
  },

  // ── Simulator ────────────────────────────────────────────────────────────────
  deltaGp: {
    what: { zh: '拉杆之后每月多赚（或少赚）的毛利 — 模拟器最重要的一个数字。', en: 'Extra monthly GP after your lever moves — the single most important simulator number.' },
    how: { zh: 'ΔGP = 模拟后毛利 − 现在毛利；营业额按 流量×转化×客单×复购×转介 五个系数同步推算。', en: 'ΔGP = simulated GP − current GP; revenue recomputed via the five TCVR multipliers.' },
  },
  rewardBudget: {
    what: { zh: '建议从增量毛利中拿 20% 做团队奖励池 — 团队分到钱，公司还多赚 80%。', en: 'Suggested team reward pool: 20% of the incremental GP — the team earns, you still keep 80%.' },
    how: { zh: '奖励池 = max(0, ΔGP) × 20%', en: 'Reward budget = max(0, ΔGP) × 20%' },
  },
  leadsNeeded: {
    what: { zh: '这个情景下市场部每月要交付的 Leads 数。', en: 'Leads marketing must deliver monthly under this scenario.' },
    how: { zh: '需要 Leads = 现有 Leads × (1 + 流量%)', en: 'Leads needed = current leads × (1 + traffic%)' },
  },
  closesNeeded: {
    what: { zh: '这个情景下销售团队每月要收尾的成交单数。', en: 'Deals the sales team must close monthly under this scenario.' },
    how: { zh: '需要成交 = 现有成交 × (1 + 流量%) × (1 + 转化%)', en: 'Closes needed = current closes × (1 + traffic%) × (1 + conversion%)' },
  },
  topLever: {
    what: { zh: '最划算的增长动作：每个杠杆单独 +10% 模拟一次，按 ΔGP 排名；平手时优先选更省力的（练转化 < 买流量）。', en: 'The best-value growth move: each lever simulated alone at +10%, ranked by ΔGP; ties break to the lower-effort lever.' },
    how: { zh: '对 6 个杠杆各做一次独立模拟（+10%，GP率 +3 点），取 ΔGP 最大者。', en: 'Each of the 6 levers simulated independently (+10%; GP margin +3 pts); highest ΔGP wins.' },
  },
  sliderTraffic: {
    what: { zh: '模拟 Leads 增加 X%（加广告、开新渠道）。', en: 'Simulate X% more leads (more ads, new channels).' },
    how: { zh: '营业额 × (1 + X%)', en: 'Revenue × (1 + X%)' },
  },
  sliderConversion: {
    what: { zh: '模拟成交率提升 X%（练话术、修 SOP、加紧跟进）。', en: 'Simulate X% better close rate (scripts, SOPs, tighter follow-up).' },
    how: { zh: '营业额 × (1 + X%)，成交率封顶 100%', en: 'Revenue × (1 + X%), close rate capped at 100%' },
  },
  sliderAbv: {
    what: { zh: '模拟客单提升 X%（升单、套餐、加购）。', en: 'Simulate X% bigger baskets (upsell, bundles, add-ons).' },
    how: { zh: '营业额 × (1 + X%)', en: 'Revenue × (1 + X%)' },
  },
  sliderGpMargin: {
    what: { zh: '模拟毛利率提高 X 个百分点（卖更多高毛利产品、谈成本）。', en: 'Simulate GP margin up X points (sell more high-margin products, negotiate costs).' },
    how: { zh: 'GP率 + X 点（加法，不是乘法），封顶 95%', en: 'GP margin + X points (additive), capped at 95%' },
  },
  sliderRepeat: {
    what: { zh: '模拟复购行为提升 X%（会员、售后回访、唤醒老客）。', en: 'Simulate X% stronger repeat behavior (membership, after-care, win-backs).' },
    how: { zh: '放大复购系数的增益部分；从零复购起步时按同业基准注入。', en: 'Scales the repeat-factor headroom; from zero base, injects a benchmark-anchored lift.' },
  },
  sliderReferral: {
    what: { zh: '模拟转介绍提升 X%（设转介奖励、要 Review）。', en: 'Simulate X% more referrals (referral rewards, asking for reviews).' },
    how: { zh: '放大转介系数的增益部分；从零转介起步时按同业基准注入。', en: 'Scales the referral-multiplier headroom; benchmark-anchored from a zero base.' },
  },
} satisfies Record<string, HelpEntry>

export type HelpKey = keyof typeof helpStrings
