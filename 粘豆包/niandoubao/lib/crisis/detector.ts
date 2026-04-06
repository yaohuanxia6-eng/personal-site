// lib/crisis/detector.ts

const CRISIS_KEYWORDS = [
  '想死', '去死', '不想活', '自杀', '结束生命', '活不下去',
  '不想活了', '消失算了', '了结', '跳楼', '割腕', '轻生',
]

export function detectCrisis(text: string): boolean {
  return CRISIS_KEYWORDS.some(keyword => text.includes(keyword))
}
