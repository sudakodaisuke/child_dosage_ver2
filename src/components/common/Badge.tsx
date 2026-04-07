// Simple colored category badge
const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(h)
}

interface Props {
  label: string
  className?: string
}

export default function Badge({ label, className = '' }: Props) {
  const color = COLORS[hashString(label) % COLORS.length]
  return (
    <span className={`badge ${color} ${className}`}>{label}</span>
  )
}
