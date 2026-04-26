'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type NodeType = 'protagonist' | 'antagonist' | 'secondary' | 'team' | 'location' | 'add'

export interface WheelNode {
  id: string
  label: string
  sublabel?: string
  type: NodeType
  href?: string
}

export interface WheelLink {
  person_a_id: string
  person_b_id: string
  relationship?: string
}

const TYPE_COLOR: Record<NodeType, string> = {
  protagonist: '#f59e0b',
  antagonist:  '#ef4444',
  secondary:   '#8b5cf6',
  team:        '#0d9488',
  location:    '#3b82f6',
  add:         'transparent',
}

const W = 480
const CX = W / 2
const CY = W / 2
const CENTER_R = 50
const NODE_R = 34
const ORBIT_R = 158
const LINE_COLOR = '#0d9488'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function cap(s: string, n = 12) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export default function PersonaWheel({
  nodes,
  centerLabel,
  editHref,
  onNodeClick,
  links = [],
}: {
  nodes: WheelNode[]
  centerLabel: string
  editHref?: string
  onNodeClick?: () => void
  links?: WheelLink[]
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const router = useRouter()

  const MIN_NODES = 5
  const filled: WheelNode[] = [...nodes]
  while (filled.length < MIN_NODES) {
    filled.push({ id: `add-${filled.length}`, label: 'Ajouter', type: 'add' })
  }

  const positioned = filled.map((node, i) => {
    const angle = (i / filled.length) * 2 * Math.PI - Math.PI / 2
    return { ...node, x: CX + ORBIT_R * Math.cos(angle), y: CY + ORBIT_R * Math.sin(angle) }
  })

  function handleClick() {
    onNodeClick?.()
  }

  return (
    <div className="flex flex-col gap-3 h-full w-full">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[var(--text-primary)]">
          {nodes.some((n) => n.type === 'team') ? 'Réseau d\'équipe' : 'Carte des personnages'}
        </h2>
        {editHref && (
          <a href={editHref} className="text-xs text-[var(--accent)] hover:underline transition-colors">
            Modifier →
          </a>
        )}
      </div>

      <div
        className="border border-[var(--border)] bg-[var(--bg-card)] rounded-2xl overflow-hidden flex-1 flex items-center justify-center p-2 cursor-pointer group hover:border-amber-500/40 transition-colors"
        onClick={handleClick}
        title="Gérer les personnages"
      >
        <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-sm h-auto" style={{ userSelect: 'none' }}>
          <defs>
            <radialGradient id="center-grad" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
          </defs>

          {positioned.map((node) => (
            <line
              key={`l-${node.id}`}
              x1={CX} y1={CY} x2={node.x} y2={node.y}
              stroke={hovered === node.id ? '#22d3ee' : LINE_COLOR}
              strokeWidth={hovered === node.id ? 2 : 1.5}
              strokeDasharray={node.type === 'add' ? '5 4' : undefined}
              opacity={node.type === 'add' ? 0.25 : 0.55}
              style={{ transition: 'stroke 0.2s, opacity 0.2s' }}
            />
          ))}

          {/* Liens entre personnages */}
          {links.map((link, i) => {
            const a = positioned.find((n) => n.id === link.person_a_id)
            const b = positioned.find((n) => n.id === link.person_b_id)
            if (!a || !b || a.type === 'add' || b.type === 'add') return null
            const mx = (a.x + b.x) / 2
            const my = (a.y + b.y) / 2
            return (
              <g key={`cl-${i}`}>
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  opacity={0.55}
                />
                {link.relationship && (
                  <text
                    x={mx} y={my}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#f59e0b" fontSize={8} opacity={0.75}
                    style={{ pointerEvents: 'none' }}
                  >
                    {link.relationship.length > 10 ? link.relationship.slice(0, 9) + '…' : link.relationship}
                  </text>
                )}
              </g>
            )
          })}

          {/* Center node */}
          <circle cx={CX} cy={CY} r={CENTER_R + 6} fill="url(#center-grad)" opacity={0.15} />
          <circle cx={CX} cy={CY} r={CENTER_R} fill="url(#center-grad)" />
          <circle cx={CX} cy={CY} r={CENTER_R + 2} fill="none" stroke="white" strokeWidth={1.5} opacity={0.3} />
          <text x={CX} y={CY - 7} textAnchor="middle" fill="white" fontSize={13} fontWeight="700">
            {initials(centerLabel) || '✦'}
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" fill="white" fontSize={8.5} opacity={0.85}>
            {cap(centerLabel, 14)}
          </text>

          {/* Surrounding nodes */}
          {positioned.map((node) => {
            const isAdd = node.type === 'add'
            const isHov = hovered === node.id
            const color = TYPE_COLOR[node.type]
            const isClickable = !isAdd && !!node.href

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  if (isClickable) {
                    e.stopPropagation()
                    router.push(node.href!)
                  }
                }}
                style={{ cursor: isClickable ? 'pointer' : isAdd ? 'pointer' : 'default' }}
              >
                {isHov && !isAdd && (
                  <circle cx={node.x} cy={node.y} r={NODE_R + 10} fill={color} opacity={0.2} />
                )}

                <circle
                  cx={node.x} cy={node.y} r={NODE_R + 3}
                  fill="none"
                  stroke={isAdd ? '#78716c' : 'white'}
                  strokeWidth={isAdd ? 1 : 2}
                  strokeDasharray={isAdd ? '5 4' : undefined}
                  opacity={isAdd ? 0.3 : 0.85}
                  style={{ transition: 'opacity 0.2s' }}
                />

                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={isAdd ? 'var(--bg-card)' : color}
                  stroke={isAdd ? '#78716c' : 'none'}
                  strokeWidth={isAdd ? 1.5 : 0}
                  strokeDasharray={isAdd ? '5 4' : undefined}
                  opacity={isAdd ? 0.4 : 1}
                />

                {isAdd ? (
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                    fill="#78716c" fontSize={20} opacity={0.5}>+</text>
                ) : (
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={13} fontWeight="700">
                    {initials(node.label)}
                  </text>
                )}

                <text
                  x={node.x} y={node.y + NODE_R + 15}
                  textAnchor="middle"
                  style={{ fill: isAdd ? '#78716c' : isHov ? '#22d3ee' : 'var(--text-secondary)', transition: 'fill 0.2s' }}
                  fontSize={11}
                  fontWeight={isHov && !isAdd ? '600' : '400'}
                >
                  {cap(node.label)}
                </text>

                {node.sublabel && (
                  <text
                    x={node.x} y={node.y + NODE_R + 27}
                    textAnchor="middle"
                    fill="#78716c"
                    fontSize={9}
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {nodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'protagonist', label: 'Protagoniste' },
            { type: 'antagonist', label: 'Antagoniste' },
            { type: 'secondary', label: 'Secondaire' },
            { type: 'team', label: 'Membre' },
          ].filter((l) => nodes.some((n) => n.type === l.type)).map((l) => (
            <span key={l.type} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: TYPE_COLOR[l.type as NodeType] }}
              />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
