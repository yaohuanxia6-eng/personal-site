// lib/styles.ts — 统一样式常量，所有组件从这里取，不硬编码颜色

export const styles = {
  page: 'min-h-screen bg-background px-5 py-6 max-w-md mx-auto',

  card: 'bg-surface rounded-card shadow-card border border-border p-4',

  bubbleAI:   'bg-surface border border-border rounded-[4px_14px_14px_14px] px-4 py-3 text-body-md text-text-primary shadow-card max-w-[85%]',
  bubbleUser: 'bg-primary/[0.08] border border-border-dark rounded-[14px_4px_14px_14px] px-4 py-3 text-body-md text-text-primary ml-auto max-w-[85%]',

  btnPrimary:   'bg-primary text-white rounded-btn px-4 py-2.5 text-body-sm font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95',
  btnSecondary: 'bg-surface border border-border text-text-primary rounded-btn px-4 py-2.5 text-body-sm hover:bg-surface-2 transition-colors',
  btnText:      'text-primary text-body-sm hover:underline underline-offset-2',

  input: 'bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200',

  actionCard: 'bg-accent/[0.08] border border-accent/20 rounded-card p-4',
  crisisCard: 'bg-crisis-bg border border-crisis/20 rounded-card p-4',
}
