import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface CustomNodeData {
  label: string;
  depth: number;
  isRoot: boolean;
}

export const CustomNode = memo<NodeProps<CustomNodeData>>(({ data }) => {
  return (
    <div
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        background: data.isRoot ? '#4A90E2' : '#FFFFFF',
        color: data.isRoot ? '#FFFFFF' : '#333333',
        border: `2px solid ${data.isRoot ? '#2E5C8A' : '#CCCCCC'}`,
        minWidth: '180px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: data.isRoot ? 'bold' : 'normal',
      }}
    >
      {/* Top handle for incoming edges */}
      {!data.isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#555' }}
        />
      )}

      {data.label}

      {/* Bottom handle for outgoing edges */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
