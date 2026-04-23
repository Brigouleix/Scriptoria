'use client'

import { useState } from 'react'
import Link from 'next/link'

export type NodeType = 'protagonist' | 'antagonist' | 'secondary' | 'team' | 'location' | 'add'

export interface WheelNode {
  id: string
  label: string
  sublabel?: string
  type: NodeType
  href?: string
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
}: {
  nodes: WheelNode[]
  centerLabel: string
  editHref: string
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  // Always show at least 5 nodes total (fill with 'add' placeholders)
  const MIN_NODES = 5
  const filled: WheelNode[] = [...nodes]
  while (filled.length < MIN_NODES) {
    filled.push({ id: `add-${filled.length}`, label: 'Ajouter', type: 'add', href: editHref })
  }

  const positioned = filled.map((node, i) => {
    const angle = (i / filled.length) * 2 * Math.PI - Math.PI / 2
    return { ...node, x: CX + ORBIT_R * Math.cos(angle), y: CY + ORBIT_R * Math.sin(angle) }
  })

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[var(--text-primary)]">
          {nodes.some((n) => n.type === 'team') ? 'Réseau d\'équipe' : 'Carte des personnages'}
        </h2>
        <Link href={editHref} className="text-xs text-[var(--accent)] hover:underline transition-colors">
          Modifier →
        </Link>
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-card)] rounded-2xl overflow-hidden flex-1 flex items-center justify-center p-2">
        <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-sm h-auto" style={{ userSelect: 'none' }}>
          <defs>
            <radialGradient id="center-grad" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
          </defs>

          {/* Connection lines */}
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

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: node.href ? 'pointer' : 'default' }}
                onClick={() => node.href && (window.location.href = node.href)}
              >
                {/* Glow */}
                {isHov && !isAdd && (
                  <circle cx={node.x} cy={node.y} r={NODE_R + 10} fill={color} opacity={0.2} />
                )}

                {/* White ring */}
                <circle
                  cx={node.x} cy={node.y} r={NODE_R + 3}
                  fill="none"
                  stroke={isAdd ? '#78716c' : 'white'}
                  strokeWidth={isAdd ? 1 : 2}
                  strokeDasharray={isAdd ? '5 4' : undefined}
                  opacity={isAdd ? 0.3 : 0.85}
                  style={{ transition: 'opacity 0.2s' }}
                />

                {/* Main circle */}
                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={isAdd ? 'var(--bg-card)' : color}
                  stroke={isAdd ? '#78716c' : 'none'}
                  strokeWidth={isAdd ? 1.5 : 0}
                  strokeDasharray={isAdd ? '5 4' : undefined}
                  opacity={isAdd ? 0.4 : 1}
                />

                {/* Text inside */}
                {isAdd ? (
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                    fill="#78716c" fontSize={20} opacity={0.5}>+</text>
                ) : (
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={13} fontWeight="700">
                    {initials(node.label)}
                  </text>
                )}

                {/* Label below */}
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

      {/* Legend */}
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
