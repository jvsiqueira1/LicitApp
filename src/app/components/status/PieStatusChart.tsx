/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import type { Status } from "../task/ListList";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

export interface PieStatusChartData {
  statusId: string;
  statusName: string;
  count: number;
}

interface PieStatusChartProps {
  data: PieStatusChartData[];
  statuses: Status[];
  onSliceClick: (status: Status) => void;
  loading?: boolean;
  selectedStatusId?: string; // highlight persistente
  onSliceHover?: (status: Status | null) => void; // hover opcional
  highlightSelected?: boolean; // novo: só highlight se true
  explodeOffset?: number; // novo
}

export const PieStatusChart: React.FC<PieStatusChartProps> = (props) => {
  const { data, statuses, onSliceClick, loading, selectedStatusId, onSliceHover, highlightSelected = false, explodeOffset } = props;
  // Mapeia statusId para cor dinâmica usando color_hex
  const colorMap = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.id] = status.color_hex || "#888";
      return acc;
    }, {} as Record<string, string>);
  }, [statuses]);

  const [hoveredStatusId, setHoveredStatusId] = useState<string | null>(null);
  // Novo: estado para highlight explodido
  const [explodedSlice, setExplodedSlice] = useState<{ index: number; midAngle: number } | null>(null);

  // Função para calcular o midAngle de cada fatia
  function getMidAngles(data: PieStatusChartData[]) {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    let currentAngle = 0;
    return data.map((d) => {
      const angle = (d.count / total) * 360;
      const mid = currentAngle + angle / 2;
      const result = mid;
      currentAngle += angle;
      return result;
    });
  }
  const midAngles = React.useMemo(() => getMidAngles(data), [data]);

  // Handler para clique na fatia
  const handlePieClick = (_: any, index: number) => {
    if (index != null) {
      setExplodedSlice({ index, midAngle: midAngles[index] });
      const entry = data[index];
      const status = statuses.find(s => s.id === entry.statusId);
      if (status) onSliceClick({ ...status });
    }
  };

  // Função customizada para desenhar a fatia "explodida" (offset controlado por prop)
  function renderActiveShapeWithOffset(offsetValue: number) {
    return function renderActiveShape(props: unknown): React.ReactElement {
      // Type guard for required props
      if (
        typeof props === 'object' && props !== null &&
        'cx' in props && 'cy' in props && 'midAngle' in props &&
        'innerRadius' in props && 'outerRadius' in props &&
        'startAngle' in props && 'endAngle' in props && 'fill' in props
      ) {
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props as PieSectorDataItem & {
          cx: number;
          cy: number;
          midAngle: number;
          innerRadius: number;
          outerRadius: number;
          startAngle: number;
          endAngle: number;
          fill: string;
        };
        const RADIAN = Math.PI / 180;
        return (
          <g style={{
            transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), opacity 0.25s cubic-bezier(.4,2,.6,1)',
            transform: 'scale(1.04)',
            opacity: 0.98,
          }}>
            <Sector
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={startAngle}
              endAngle={endAngle}
              fill={fill}
              stroke="none"
              strokeWidth={0}
              fillRule="evenodd"
              pointerEvents="auto"
              style={{
                userSelect: 'none',
                stroke: 'none !important',
                outline: 'none !important',
                boxShadow: 'none !important',
              }}
            />
          </g>
        );
      }
      // Always return a valid ReactElement
      return <g />;
    };
  }

  // Sincroniza o highlight explodido com o status selecionado
  React.useEffect(() => {
    if (!highlightSelected || !selectedStatusId) {
      setExplodedSlice(null);
      return;
    }
    const idx = data.findIndex(d => d.statusId === selectedStatusId);
    if (idx === -1) {
      setExplodedSlice(null);
      return;
    }
    setExplodedSlice({ index: idx, midAngle: midAngles[idx] });
  }, [selectedStatusId, data, highlightSelected, midAngles]);

  // Diagnóstico: verificar se algum status está sem cor
  const missingColor = statuses.filter(s => !s.color_hex || s.color_hex === '#888');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground animate-pulse">
        Carregando gráfico...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Nenhum dado para exibir
        {missingColor.length > 0 && (
          <div className="text-red-500 text-xs mt-2">Atenção: {missingColor.length} status sem cor definida!</div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center"
      style={{ pointerEvents: 'auto', zIndex: 10 }}
    >
      <ResponsiveContainer width="100%" height={220} style={{ pointerEvents: 'auto', zIndex: 10 }}>
        <PieChart style={{ pointerEvents: 'all' }}>
          {(
            <Pie
              data={data}
              dataKey="count"
              nameKey="statusName"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={0}
              paddingAngle={0}
              isAnimationActive={false}
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              stroke="none"
              onClick={highlightSelected ? handlePieClick : ((_, index) => {
                const entry = data[index as number];
                const status = statuses.find(s => s.id === entry.statusId);
                if (status) onSliceClick({ ...status });
              })}
              // Removido activeShape e activeIndex
            >
              {data.map((entry, i) => {
                const isHovered = hoveredStatusId === entry.statusId;
                const isSelected = highlightSelected && selectedStatusId === entry.statusId;
                // Explode highlight: desloca a fatia selecionada na direção do midAngle salvo
                let explodeTransform = '';
                if (isSelected && explodedSlice && explodedSlice.index === i && typeof explodedSlice.midAngle === 'number') {
                  const offset = 8; // px
                  const angle = explodedSlice.midAngle * (Math.PI / 180);
                  const dx = Math.cos(-angle) * offset;
                  const dy = Math.sin(-angle) * offset;
                  explodeTransform = `translate(${dx}px, ${dy}px)`;
                }
                return (
                  <Cell
                    key={`cell-${entry.statusId}`}
                    fill={colorMap[entry.statusId] || '#8884d8'}
                    stroke="none"
                    style={{
                      transform: isSelected ? explodeTransform : undefined,
                      opacity: highlightSelected
                        ? (isSelected ? 1 : 0.35)
                        : 1,
                      filter: isSelected ? undefined : undefined,
                      transition: "transform 0.25s cubic-bezier(.4,2,.6,1), opacity 0.18s cubic-bezier(.4,2,.6,1)",
                    }}
                    className={
                      "cursor-pointer transition-all duration-200 " +
                      (isHovered && !isSelected && !highlightSelected ? "ring-2 ring-[var(--color-border-subtle)]" : "") +
                      (isSelected ? " z-20" : "")
                    }
                    onMouseEnter={() => {
                      setHoveredStatusId(entry.statusId);
                      if (onSliceHover) {
                        const status = statuses.find(s => s.id === entry.statusId);
                        onSliceHover(status || null);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredStatusId(null);
                      if (onSliceHover) onSliceHover(null);
                    }}
                  />
                );
              })}
            </Pie>
          ) as any}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-lg px-3 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] shadow">
                  <div className="font-semibold">{d.statusName}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{d.count} tarefa{d.count === 1 ? "" : "s"}</div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legenda customizada */}
      <div className="flex flex-wrap justify-center gap-4 mt-4" style={{ pointerEvents: 'auto' }}>
        {statuses.map((status) => (
          <div
            key={status.id}
            className="flex items-center gap-2 text-sm cursor-pointer select-none"
            onClick={() => onSliceClick(status)}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSliceClick(status); }}
            style={{
              outline: 'none',
              opacity: highlightSelected && selectedStatusId && selectedStatusId !== status.id ? 0.35 : 1,
              transition: 'opacity 0.18s cubic-bezier(.4,2,.6,1)',
            }}
          >
            <span
              className="inline-block w-4 h-4 rounded-full border border-gray-400"
              style={{ background: status.color_hex || "#888" }}
            />
            <span className="text-[var(--color-text-primary)]">{status.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieStatusChart; 