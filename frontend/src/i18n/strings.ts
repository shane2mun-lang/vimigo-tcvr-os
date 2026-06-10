// ─────────────────────────────────────────────────────────────────────────────
// Bilingual string dictionary (中文 / English). Every key carries both languages;
// `satisfies` makes a missing translation a compile error. Interpolate with {var}.
// Domain enum tokens (product tags, pillars, roles…) are localized here too.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = 'zh' | 'en'

interface Entry {
  zh: string
  en: string
}

export const strings = {
  // ── App / nav ────────────────────────────────────────────────────────────────
  'app.title': { zh: 'vimigo TCVR 收钱自动系统', en: 'vimigo TCVR Revenue OS' },
  'app.subtitle': {
    zh: '看清哪里漏钱，预测哪里增长，奖励真正带来业绩的动作。',
    en: 'See where your money leaks. Forecast your growth. Reward the right actions.',
  },
  'nav.inputs': { zh: '输入资料', en: 'Inputs' },
  'nav.dashboards': { zh: '诊断仪表板', en: 'Dashboards' },
  'nav.company': { zh: '商业资料', en: 'Company Profile' },
  'nav.traffic': { zh: '流量 Traffic', en: 'Traffic' },
  'nav.conversion': { zh: '转化 Conversion', en: 'Conversion' },
  'nav.value': { zh: '价值 Value', en: 'Value' },
  'nav.recurring': { zh: '复购转介 Recurring', en: 'Recurring & Referral' },
  'nav.costs': { zh: '成本 Costs', en: 'Costs' },
  'nav.reward': { zh: '奖励连接 Reward', en: 'Reward & Accountability' },
  'nav.xray': { zh: 'Revenue X-Ray', en: 'Revenue X-Ray' },
  'nav.funnelmap': { zh: 'TCVR 漏斗地图', en: 'TCVR Funnel Map' },
  'nav.productgp': { zh: '产品 & GP 地图', en: 'Product & GP Map' },
  'nav.simulator': { zh: '情景模拟器', en: 'Scenario Simulator' },
  'nav.actionplan': { zh: '90 天行动方案', en: '90-Day Action Plan' },

  // ── Common ───────────────────────────────────────────────────────────────────
  'common.next': { zh: '下一步', en: 'Next' },
  'common.add': { zh: '新增', en: 'Add' },
  'common.addRow': { zh: '新增一行', en: 'Add row' },
  'common.remove': { zh: '删除', en: 'Remove' },
  'common.save': { zh: '保存', en: 'Save' },
  'common.saved': { zh: '已保存', en: 'Saved' },
  'common.saving': { zh: '保存中…', en: 'Saving…' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.total': { zh: '合计', en: 'Total' },
  'common.optional': { zh: '选填', en: 'optional' },
  'common.yes': { zh: '有', en: 'Yes' },
  'common.no': { zh: '无', en: 'No' },
  'common.none': { zh: '—', en: '—' },
  'common.owner': { zh: '负责人', en: 'Owner' },
  'common.loading': { zh: '加载中…', en: 'Loading…' },
  'common.target': { zh: '目标', en: 'Target' },
  'common.current': { zh: '目前', en: 'Current' },
  'common.benchmark': { zh: '行业基准', en: 'Benchmark' },
  'common.perMonth': { zh: '/月', en: '/mo' },
  'common.clearAll': { zh: '清空全部', en: 'Clear all' },
  'common.loadSample': { zh: '载入示范数据', en: 'Load sample' },

  // ── Profile manager ──────────────────────────────────────────────────────────
  'profile.manage': { zh: '公司档案', en: 'Profiles' },
  'profile.new': { zh: '新建空白档案', en: 'New blank profile' },
  'profile.saveAs': { zh: '另存为…', en: 'Save as…' },
  'profile.load': { zh: '载入档案', en: 'Load profile' },
  'profile.export': { zh: '导出 JSON', en: 'Export JSON' },
  'profile.import': { zh: '导入 JSON', en: 'Import JSON' },
  'profile.exportPdf': { zh: '导出 PDF 报告', en: 'Export PDF report' },
  'profile.namePrompt': { zh: '档案名称', en: 'Profile name' },
  'profile.untitled': { zh: '未命名公司', en: 'Untitled company' },

  // ── Company profile module ───────────────────────────────────────────────────
  'company.heading': { zh: '商业基本资料', en: 'Company Profile' },
  'company.lead': {
    zh: '先了解你的生意，AI 和诊断引擎才能判断你的问题在 Traffic、Conversion、Value 还是 Recurring。',
    en: 'Tell us about the business so the engine can locate your problem in Traffic, Conversion, Value, or Recurring.',
  },
  'company.name': { zh: '公司名称', en: 'Company name' },
  'company.industry': { zh: '行业', en: 'Industry' },
  'company.website': { zh: '网站 / 社媒链接', en: 'Website / social link' },
  'company.teamSize': { zh: '团队人数', en: 'Team size' },
  'company.salesModel': { zh: '销售模式', en: 'Sales model' },
  'company.customerType': { zh: '主要客户类型', en: 'Main customer type' },
  'company.currentRevenue': { zh: '目前月营业额', en: 'Current monthly revenue' },
  'company.targetRevenue': { zh: '目标月营业额', en: 'Target monthly revenue' },
  'company.gpMargin': { zh: '目前平均 GP Margin', en: 'Current avg GP margin' },
  'company.bottleneck': { zh: '目前最大销售瓶颈', en: 'Biggest sales bottleneck' },
  'company.aiScan': { zh: 'AI 扫描网站', en: 'AI scan website' },
  'company.scanHint': {
    zh: '输入上方的网站，或在此贴上你的内容让 AI 分析。',
    en: 'Enter your website above, or paste your content here for AI to analyze.',
  },
  'company.scanPastePlaceholder': {
    zh: '在此贴上你的网站 / 社媒内容…',
    en: 'Paste your website / social content here…',
  },

  // ── Traffic module ───────────────────────────────────────────────────────────
  'traffic.heading': { zh: '流量计算器', en: 'Traffic Calculator' },
  'traffic.lead': {
    zh: '填入每个渠道的曝光、Leads、花费与成交，看哪个渠道只是热闹，哪个真的赚钱。',
    en: 'Enter each channel’s reach, leads, spend and closes — see which channels are just noise and which actually make money.',
  },
  'traffic.channel': { zh: '渠道', en: 'Channel' },
  'traffic.impressions': { zh: '曝光量', en: 'Impressions' },
  'traffic.leads': { zh: 'Leads', en: 'Leads' },
  'traffic.spend': { zh: '花费', en: 'Spend' },
  'traffic.quality': { zh: '质量(1-5)', en: 'Quality (1-5)' },
  'traffic.followup': { zh: '有跟进?', en: 'Follow-up?' },
  'traffic.closed': { zh: '成交数', en: 'Closed' },
  'traffic.sales': { zh: '销售额', en: 'Sales' },
  'traffic.gp': { zh: 'GP', en: 'GP' },
  'traffic.cpl': { zh: 'CPL', en: 'CPL' },
  'traffic.convRate': { zh: '转化率', en: 'Conv %' },
  'traffic.roi': { zh: 'ROI', en: 'ROI' },
  'traffic.bestChannel': { zh: '最佳渠道', en: 'Best channel' },
  'traffic.worstChannel': { zh: '最差渠道', en: 'Worst channel' },
  'traffic.blendedCpl': { zh: '综合 CPL', en: 'Blended CPL' },
  'traffic.gapToTarget': { zh: '达标流量缺口', en: 'Traffic gap to target' },
  'traffic.paidEfficiency': { zh: '付费渠道效率', en: 'Paid Channel Efficiency' },
  'traffic.paidEfficiencyLead': {
    zh: '只看付费广告的真实效率 — 不被免费/自然流量稀释。',
    en: 'How well the ads perform — paid channels only, undiluted by free traffic.',
  },
  'traffic.organicChannels': { zh: '免费 / 自然渠道', en: 'Organic / Free Channels' },
  'traffic.organicLead': {
    zh: 'Walk-in、转介、自然内容等免费渠道的贡献（不计入付费效率）。',
    en: 'Walk-in, referral, organic — free channels, shown but excluded from paid efficiency.',
  },
  'traffic.overallPerformance': { zh: '整体 Revenue OS 表现', en: 'Overall Revenue OS Performance' },
  'traffic.paidCpl': { zh: '付费 CPL', en: 'Paid CPL' },
  'traffic.paidRoas': { zh: '付费 ROAS', en: 'Paid ROAS' },
  'traffic.paidGpRoas': { zh: '付费 GP ROAS', en: 'Paid GP ROAS' },
  'traffic.paidCac': { zh: '付费 CAC', en: 'Paid CAC' },
  'traffic.blendedCac': { zh: '综合 CAC', en: 'Blended CAC' },
  'traffic.contribution': { zh: '贡献占比', en: 'Contribution' },
  'traffic.customers': { zh: '成交客户', en: 'Customers' },
  'traffic.paidLabel': { zh: '付费', en: 'Paid' },
  'traffic.organicLabel': { zh: '自然', en: 'Organic' },

  // ── Conversion module ────────────────────────────────────────────────────────
  'conversion.heading': { zh: '转化计算器', en: 'Conversion Calculator' },
  'conversion.lead': {
    zh: '把销售漏斗拆开。不是没有客户，是客户卡在哪一关没有成交。',
    en: 'Break the funnel apart. It’s not that you have no customers — they’re stuck at one stage.',
  },
  'conversion.stage': { zh: '阶段', en: 'Stage' },
  'conversion.count': { zh: '数量', en: 'Count' },
  'conversion.waitTime': { zh: '平均等待(天)', en: 'Avg wait (days)' },
  'conversion.lostReason': { zh: '流失原因', en: 'Lost reason' },
  'conversion.nextAction': { zh: '下一步动作', en: 'Next action' },
  'conversion.hasSop': { zh: '有 SOP/脚本?', en: 'SOP / script?' },
  'conversion.overall': { zh: '整体转化率', en: 'Overall conversion' },
  'conversion.biggestDrop': { zh: '最大流失关卡', en: 'Biggest drop-off' },
  'conversion.lostValue': { zh: '流失销售额', en: 'Lost sales value' },
  'conversion.followupLeak': { zh: '跟进漏失', en: 'Follow-up leakage' },

  // ── Value module ─────────────────────────────────────────────────────────────
  'value.heading': { zh: '产品价值计算器', en: 'Product Value Calculator' },
  'value.lead': {
    zh: '把产品分成引流品、爆品、核心品、利润品、复购品，看你的产品漏斗哪里断了。',
    en: 'Sort products into the lead-magnet → hero → core → profit → repeat ladder and find the missing rung.',
  },
  'value.product': { zh: '产品', en: 'Product' },
  'value.type': { zh: '类型', en: 'Type' },
  'value.price': { zh: '售价', en: 'Price' },
  'value.cost': { zh: '成本', en: 'Cost' },
  'value.cycle': { zh: '成交周期(天)', en: 'Cycle (days)' },
  'value.closeRate': { zh: '成交率', en: 'Close %' },
  'value.volume': { zh: '月销量', en: 'Volume/mo' },
  'value.gpUnit': { zh: '单位 GP', en: 'GP/unit' },
  'value.margin': { zh: 'GP %', en: 'GP %' },
  'value.upsell': { zh: '易升单', en: 'Upsell' },
  'value.repeat': { zh: '易复购', en: 'Repeat' },
  'value.referral': { zh: '易转介', en: 'Referral' },
  'value.ads': { zh: '适合主打广告', en: 'Good for ads' },
  'value.reward': { zh: '适合奖励指标', en: 'Reward target' },
  'value.priceCompare': { zh: '易被比价', en: 'Price-compared' },

  // ── Recurring module ─────────────────────────────────────────────────────────
  'recurring.heading': { zh: '复购 & 转介绍计算器', en: 'Recurring & Referral Calculator' },
  'recurring.lead': {
    zh: '赚钱不是只靠不断买流量。真正的 Revenue OS 是让客户重复回来、重复介绍。',
    en: 'Real revenue isn’t buying more traffic — it’s customers coming back and bringing others.',
  },
  'recurring.newCustomers': { zh: '每月新客户', en: 'New customers/mo' },
  'recurring.repeatCustomers': { zh: '每月回购客户', en: 'Repeat customers/mo' },
  'recurring.avgRepeatCount': { zh: '平均回购次数', en: 'Avg repeat count' },
  'recurring.avgRepeatCycle': { zh: '回购周期(天)', en: 'Repeat cycle (days)' },
  'recurring.lifespan': { zh: '客户生命周期(月)', en: 'Customer lifespan (months)' },
  'recurring.referralsPer': { zh: '每客户介绍人数', en: 'Referrals per customer' },
  'recurring.referralClose': { zh: '转介成交率', en: 'Referral close %' },
  'recurring.membership': { zh: '会员制度', en: 'Membership' },
  'recurring.aftercare': { zh: '售后跟进', en: 'After-care' },
  'recurring.review': { zh: 'Review / 见证机制', en: 'Review mechanism' },
  'recurring.referralReward': { zh: '转介奖励', en: 'Referral reward' },
  'recurring.repeatRate': { zh: '复购率', en: 'Repeat rate' },
  'recurring.referralRate': { zh: '转介率', en: 'Referral rate' },

  // ── Costs ────────────────────────────────────────────────────────────────────
  'costs.heading': { zh: '成本', en: 'Costs' },
  'costs.lead': { zh: '用来计算净利影响与奖励预算。', en: 'Used to compute net-profit impact and reward budget.' },
  'costs.marketing': { zh: '营销成本', en: 'Marketing cost' },
  'costs.reward': { zh: '奖励成本', en: 'Reward cost' },
  'costs.operational': { zh: '运营成本', en: 'Operational cost' },

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  'kpi.currentSales': { zh: '目前月营业额', en: 'Current sales' },
  'kpi.targetSales': { zh: '目标月营业额', en: 'Target sales' },
  'kpi.salesGap': { zh: '营业额缺口', en: 'Sales gap' },
  'kpi.gp': { zh: '毛利 GP', en: 'Gross profit' },
  'kpi.gpMargin': { zh: 'GP 率', en: 'GP margin' },
  'kpi.cac': { zh: '综合获客成本', en: 'Blended CAC' },
  'kpi.paidCac': { zh: '付费获客成本', en: 'Paid CAC' },
  'kpi.abv': { zh: '平均客单 ABV', en: 'Avg basket (ABV)' },
  'kpi.ltv': { zh: '客户终身价值 LTV', en: 'LTV' },
  'kpi.ltvCac': { zh: 'LTV : CAC', en: 'LTV : CAC' },
  'kpi.convRate': { zh: '转化率', en: 'Conversion rate' },
  'kpi.repeatRate': { zh: '复购率', en: 'Repeat rate' },
  'kpi.referralRate': { zh: '转介率', en: 'Referral rate' },
  'kpi.netProfit': { zh: '净利影响', en: 'Net-profit impact' },

  // ── Health ───────────────────────────────────────────────────────────────────
  'health.green': { zh: '健康', en: 'Healthy' },
  'health.yellow': { zh: '注意', en: 'Watch' },
  'health.red': { zh: '警告', en: 'Critical' },

  // ── Dashboards ───────────────────────────────────────────────────────────────
  'xray.heading': { zh: 'Revenue X-Ray — 一眼看清生意', en: 'Revenue X-Ray' },
  'xray.healthHeading': { zh: 'TCVR 四大健康度', en: 'TCVR pillar health' },
  'funnelmap.heading': { zh: 'TCVR 漏斗地图', en: 'TCVR Funnel Map' },
  'funnelmap.center': { zh: '目标月营业额', en: 'Target revenue' },
  'productgp.heading': { zh: '产品漏斗 & GP 地图', en: 'Product Funnel & GP Map' },
  'productgp.ladder': { zh: '产品阶梯', en: 'Product ladder' },
  'productgp.missing': { zh: '缺少', en: 'Missing' },
  'simulator.heading': { zh: '情景模拟器', en: 'Scenario Simulator' },
  'simulator.lead': {
    zh: '拉动滑杆，马上看到 Sales、GP 与奖励预算的变化 — 哪个动作 ROI 最大?',
    en: 'Drag the sliders and watch Sales, GP and reward budget move — which lever has the biggest ROI?',
  },
  'simulator.reset': { zh: '重置', en: 'Reset' },
  'simulator.forecastSales': { zh: '预测营业额', en: 'Forecast sales' },
  'simulator.forecastGp': { zh: '预测毛利 GP', en: 'Forecast GP' },
  'simulator.requiredLeads': { zh: '需要 Leads', en: 'Leads needed' },
  'simulator.requiredCloses': { zh: '需要成交', en: 'Closes needed' },
  'simulator.rewardBudget': { zh: '可释放奖励池', en: 'Reward budget' },
  'simulator.compare': { zh: '情景对比 (按 GP ROI 排序)', en: 'Scenario comparison (by GP ROI)' },
  'simulator.topLever': { zh: '最高 ROI 动作', en: 'Highest-ROI lever' },
  'actionplan.heading': { zh: '90 天行动方案', en: '90-Day Action Plan' },
  'actionplan.day30': { zh: '0–30 天：修流量', en: 'Days 0–30: Fix Traffic' },
  'actionplan.day60': { zh: '30–60 天：修转化', en: 'Days 30–60: Fix Conversion' },
  'actionplan.day90': { zh: '60–90 天：修产品与奖励', en: 'Days 60–90: Product & Reward' },
  'actionplan.topLevers': { zh: 'Top 3 增长杠杆', en: 'Top 3 growth levers' },
  'actionplan.topLeaks': { zh: 'Top 3 漏钱点', en: 'Top 3 leakage points' },
  'actionplan.metrics': { zh: 'Top 5 要追踪的指标', en: 'Top 5 metrics to track' },
  'actionplan.rewardDesign': { zh: '建议奖励设计', en: 'Suggested reward design' },
  'actionplan.vimigoal': { zh: '建议 vimiGoal 设置', en: 'Suggested vimiGoal setup' },
  'actionplan.bottleneck': { zh: '核心瓶颈', en: 'Primary bottleneck' },
  'actionplan.bottleneckConfirmed': { zh: '与你的判断一致', en: 'matches your read' },
  'actionplan.bottleneckDiffers': { zh: '与你的判断不同', en: 'differs from your read' },

  // ── Scenarios ────────────────────────────────────────────────────────────────
  'scenario.A': { zh: '现况', en: 'Current' },
  'scenario.B': { zh: '流量 +20%', en: 'Traffic +20%' },
  'scenario.C': { zh: '转化 +10%', en: 'Conversion +10%' },
  'scenario.D': { zh: '客单 +15%', en: 'ABV +15%' },
  'scenario.E': { zh: '复购+转介 提升', en: 'Repeat + Referral up' },

  // ── Reward / AI ──────────────────────────────────────────────────────────────
  'reward.heading': { zh: '奖励 & 责任连接器', en: 'Reward & Accountability Connector' },
  'reward.lead': {
    zh: '什么被奖励，什么就会被重复。把每个 TCVR 指标连接到谁负责、奖励什么。',
    en: 'What gets rewarded gets repeated. Connect every TCVR metric to who owns it and what to reward.',
  },
  'reward.metric': { zh: '指标', en: 'Metric' },
  'reward.role': { zh: '谁负责', en: 'Owner' },
  'reward.type': { zh: '奖励方式', en: 'Reward type' },
  'reward.kpi': { zh: '奖励 KPI', en: 'Reward KPI' },
  'ai.panelTitle': { zh: 'AI 解读', en: 'AI insight' },
  'ai.run': { zh: '生成 AI 解读', en: 'Generate AI insight' },
  'ai.running': { zh: 'AI 分析中…', en: 'AI analyzing…' },
  'ai.unavailable': {
    zh: 'AI 暂不可用 — 以下为规则引擎结果。',
    en: 'AI unavailable — showing rule-based results.',
  },
  'ai.needPaste': {
    zh: '无法自动读取此网页，请贴上你的内容来分析。',
    en: 'Couldn’t read that page automatically — paste your content to analyze.',
  },
  'ai.categorize': { zh: 'AI 自动分类产品', en: 'AI categorize products' },
  'ai.explain': { zh: 'AI 解释这个预测', en: 'AI explain this forecast' },

  // ── Empty states ─────────────────────────────────────────────────────────────
  'empty.fillTraffic': { zh: '填写流量数据以查看此项', en: 'Fill in Traffic to see this' },
  'empty.fillData': { zh: '填写更多数据以查看此项', en: 'Fill in more data to see this' },
} satisfies Record<string, Entry>

export type StringKey = keyof typeof strings

// ── Domain enum → bilingual label maps ─────────────────────────────────────────

export const domainStrings = {
  tag: {
    引流品: { zh: '引流品', en: 'Lead Magnet' },
    爆品: { zh: '爆品', en: 'Hero' },
    核心品: { zh: '核心品', en: 'Core' },
    利润品: { zh: '利润品', en: 'Profit' },
    现金流品: { zh: '现金流品', en: 'Cashflow' },
    大鲸鱼: { zh: '大鲸鱼', en: 'Whale' },
    复购品: { zh: '复购品', en: 'Repeat' },
  },
  pillar: {
    traffic: { zh: '流量', en: 'Traffic' },
    conversion: { zh: '转化', en: 'Conversion' },
    value: { zh: '价值', en: 'Value' },
    recurring: { zh: '复购转介', en: 'Recurring' },
  },
  model: {
    Retail: { zh: '零售', en: 'Retail' },
    Online: { zh: '线上', en: 'Online' },
    Service: { zh: '服务', en: 'Service' },
    B2B: { zh: 'B2B', en: 'B2B' },
    Project: { zh: '项目', en: 'Project' },
    Distributor: { zh: '经销', en: 'Distributor' },
    Subscription: { zh: '订阅', en: 'Subscription' },
  },
  customer: {
    B2C: { zh: 'B2C 个人', en: 'B2C' },
    SME: { zh: '中小企 SME', en: 'SME' },
    Corporate: { zh: '企业 Corporate', en: 'Corporate' },
    Dealer: { zh: '经销商 Dealer', en: 'Dealer' },
    Designer: { zh: '设计师 Designer', en: 'Designer' },
    Developer: { zh: '发展商 Developer', en: 'Developer' },
  },
  bottleneck: {
    'no-traffic': { zh: '没流量', en: 'No traffic' },
    'traffic-no-close': { zh: '有流量没成交', en: 'Traffic, no close' },
    'low-close': { zh: '成交低', en: 'Low close rate' },
    'no-repeat': { zh: '客户不复购', en: 'No repeat' },
    'no-followup': { zh: '团队不跟进', en: 'No follow-up' },
    'messy-product-structure': { zh: '产品结构乱', en: 'Messy product structure' },
  },
  stage: {
    Lead: { zh: 'Lead 线索', en: 'Lead' },
    QualifiedLead: { zh: '合格 Lead', en: 'Qualified Lead' },
    Appointment: { zh: '预约/到访', en: 'Appointment' },
    Quotation: { zh: '报价', en: 'Quotation' },
    FollowUp: { zh: '跟进', en: 'Follow-up' },
    ClosedWon: { zh: '成交', en: 'Closed Won' },
    ClosedLost: { zh: '失单', en: 'Closed Lost' },
    PaymentCollected: { zh: '收款', en: 'Payment Collected' },
  },
  role: {
    Sales: { zh: '销售', en: 'Sales' },
    Marketing: { zh: '市场', en: 'Marketing' },
    CSM: { zh: '客户成功', en: 'CSM' },
    BranchManager: { zh: '分行经理', en: 'Branch Manager' },
    Project: { zh: '项目组', en: 'Project Team' },
    Designer: { zh: '设计师', en: 'Designer' },
    DealerManager: { zh: '经销经理', en: 'Dealer Manager' },
  },
  reward: {
    Cash: { zh: '现金奖励', en: 'Cash Bonus' },
    Diamond: { zh: 'Diamond 钻石', en: 'Diamond' },
    Commission: { zh: '佣金', en: 'Commission' },
    TeamReward: { zh: '团队奖励', en: 'Team Reward' },
    Recognition: { zh: '认可表扬', en: 'Recognition' },
    Leaderboard: { zh: '排行榜', en: 'Leaderboard' },
  },
} as const

export type DomainGroup = keyof typeof domainStrings
