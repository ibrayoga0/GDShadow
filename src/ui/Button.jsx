export default function Button({ as = 'button', variant = 'default', className = '', ...props }) {
  const Comp = as
  const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60 disabled:pointer-events-none'
  const style = variant === 'primary'
    ? 'bg-brand-600 hover:bg-brand-700 text-white'
    : variant === 'ghost'
    ? 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800'
    : 'bg-neutral-800 hover:bg-neutral-700'
  return <Comp className={`${base} ${style} ${className}`} {...props} />
}
