import { useCallback, useMemo } from 'react';
import { ReactFlow, Background, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Handle invisibile posizionato al centro del nodo.
// Con nodeOrigin=[0.5,0.5] questo coincide esattamente con le coordinate del nodo,
// quindi ogni edge va dal centro di un nodo al centro dell'altro.
const CENTER_HANDLE = {
  opacity: 0,
  pointerEvents: 'none',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 0,
  height: 0,
  minWidth: 0,
  minHeight: 0,
  border: 'none',
  padding: 0,
  margin: 0,
};

function StationNode({ data }) {
  const { isInterchange, isStart, isEnd, isCurrent, showInterchanges, label } = data;

  let bg = '#ffffff';
  let border = '#94a3b8';
  let borderPx = 2;
  let size = 10;

  if (isInterchange && showInterchanges) { size = 14; borderPx = 2.5; border = '#1e293b'; bg = '#ffffff'; }
  if (isCurrent && !isStart && !isEnd)  { size = 14; bg = '#fde68a'; border = '#f59e0b'; borderPx = 3; }
  if (isStart) { size = 16; bg = '#4ade80'; border = '#16a34a'; borderPx = 3; }
  if (isEnd)   { size = 16; bg = '#f87171'; border = '#dc2626'; borderPx = 3; }

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: bg,
      border: `${borderPx}px solid ${border}`,
    }}>
      {/* Due handle al centro (source e target): gli edge vanno da centro a centro */}
      <Handle type="source" position={Position.Left} style={CENTER_HANDLE} />
      <Handle type="target" position={Position.Left} style={CENTER_HANDLE} />

      <div style={{
        position: 'absolute',
        top: size + 4,
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontSize: 10,
        fontWeight: ((isInterchange && showInterchanges) || isStart || isEnd) ? 700 : 400,
        color: '#334155',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {label}
      </div>
    </div>
  );
}

const nodeTypes = { station: StationNode };

function lineColor(lines, lineId) {
  return lines.find(l => l.id === lineId)?.color ?? '#94a3b8';
}

export default function NetworkMap({
  stations = [],
  stationLines = [],
  segments = [],
  lines = [],
  showLines = true,
  showInterchanges = true,
  selectedSegments = [],
  startStationId = null,
  endStationId = null,
  currentNodeId = null,
  onSegmentClick = null,
  height = 480,
  hoveredSegment = null,
}) {
  // L'interscambio è determinato dal flag esplicito (ora sempre true se ci sono >=2 linee)
  const interchangeSet = useMemo(
    () => new Set(stations.filter(s => s.is_interchange).map(s => s.id)),
    [stations]
  );

  const segmentLineMap = useMemo(() => {
    const byLine = {};
    for (const sl of stationLines) {
      (byLine[sl.line_id] ??= []).push(sl);
    }
    const map = {};
    for (const [lineId, entries] of Object.entries(byLine)) {
      const sorted = [...entries].sort((a, b) => a.position - b.position);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = Math.min(sorted[i].station_id, sorted[i + 1].station_id);
        const b = Math.max(sorted[i].station_id, sorted[i + 1].station_id);
        const key = `${a}-${b}`;
        if (!map[key]) map[key] = [];
        map[key].push(Number(lineId));
      }
    }
    return map;
  }, [stationLines]);

  const nodes = useMemo(() => stations.map(s => ({
    id: String(s.id),
    type: 'station',
    position: { x: s.x, y: s.y },
    data: {
      label: s.name,
      isInterchange: interchangeSet.has(s.id),
      isStart: s.id === startStationId,
      isEnd: s.id === endStationId,
      isCurrent: s.id === currentNodeId,
      showInterchanges,
    },
    draggable: false,
  })), [stations, interchangeSet, startStationId, endStationId, currentNodeId, showInterchanges]);

  const edges = useMemo(() => {
    const seen = new Set();
    const canClickSegments = Boolean(onSegmentClick);

    return segments.flatMap(seg => {
      const a = Math.min(seg.from_station_id, seg.to_station_id);
      const b = Math.max(seg.from_station_id, seg.to_station_id);
      const key = `${a}-${b}`;
      if (seen.has(key)) return [];
      seen.add(key);

      const lids = segmentLineMap[key] ?? [];
      if (lids.length === 0) return [];

      const isSelected = selectedSegments.some(
        s => (s.from === seg.from_station_id && s.to === seg.to_station_id) ||
             (s.from === seg.to_station_id   && s.to === seg.from_station_id)
      );

      const isHovered = hoveredSegment && (
        (hoveredSegment.from_station_id === seg.from_station_id && hoveredSegment.to_station_id === seg.to_station_id) ||
        (hoveredSegment.from_station_id === seg.to_station_id && hoveredSegment.to_station_id === seg.from_station_id)
      );

      return lids.map((lid, index) => {
        const color = showLines ? lineColor(lines, lid) : '#94a3b8';
        
        let strokeColor = color;
        // Se ci sono più linee sul segmento, usiamo una linea più spessa per la prima e una più sottile per la seconda disegnata sopra
        let strokeWidth = lids.length > 1 ? (index === 0 ? 5.5 : 2.2) : 3;
        let opacity = showLines ? 1 : 0;
        
        if (isHovered) {
          strokeColor = '#aa3bff'; // Bellissimo viola brand
          strokeWidth = lids.length > 1 ? (index === 0 ? 8.5 : 3.5) : 5.5;
          opacity = 1;
        } else if (isSelected) {
          strokeColor = '#f59e0b'; // Ambra per selezionati
          strokeWidth = lids.length > 1 ? (index === 0 ? 7.5 : 3) : 5;
          opacity = 1;
        }

        return {
          id: `e-${key}-${lid}`,
          source: String(seg.from_station_id),
          target: String(seg.to_station_id),
          type: 'straight',
          className: isSelected ? 'map-edge-selected' : (isHovered ? 'map-edge-hovered' : (canClickSegments && !showLines ? 'map-edge-interactive' : 'map-edge-static')),
          interactionWidth: canClickSegments && index === 0 ? 28 : 0, // Interazione solo sul primo edge per evitare click doppi
          style: {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            cursor: canClickSegments && index === 0 ? 'pointer' : 'default',
          },
          animated: isSelected || isHovered,
          data: { from: seg.from_station_id, to: seg.to_station_id },
        };
      });
    });
  }, [segments, segmentLineMap, lines, showLines, selectedSegments, onSegmentClick, hoveredSegment]);

  const handleEdgeClick = useCallback((_, edge) => {
    onSegmentClick?.({ from: edge.data.from, to: edge.data.to });
  }, [onSegmentClick]);

  return (
    <div style={{ width: '100%', height, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onEdgeClick={handleEdgeClick}
        nodeOrigin={[0.5, 0.5]}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnDoubleClick={false}
      >
        <Background gap={40} size={1} color="#e2e8f0" variant="lines" />
      </ReactFlow>
    </div>
  );
}
