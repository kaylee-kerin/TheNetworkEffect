import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Participant, Relationship } from '../types';
import { avatarPaths } from './icons';

interface GraphNode extends Participant {
  influence: number;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: Relationship[];
  onNodeClick: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

interface D3Node extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  trust: number;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, links, onNodeClick, selectedNodeId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const linksRef = useRef(links);
  linksRef.current = links;
  
  const simulationNodesRef = useRef<Map<string, D3Node>>(new Map());

  const calculateRadius = (influence: number) => {
    const minRadius = 15;
    const maxRadius = 75; // Increased max radius to allow for more visual difference
    const scalingFactor = 0.5;
    // Use a sqrt scale that doesn't normalize to the max influence, allowing absolute size to grow
    const radius = minRadius + Math.sqrt(influence) * scalingFactor;
    return Math.min(radius, maxRadius); // Clamp at the max radius to prevent huge nodes
  };
  
  const trustColorScale = d3.scaleLinear<string>().domain([-100, 0, 100]).range(['#ff6347', '#4b5563', '#22d3ee']).clamp(true);
  const trustStrokeWidthScale = d3.scaleLinear().domain([0, 100]).range([1, 6]).clamp(true);

  // Effect for one-time setup
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.parentElement?.clientWidth || 800;
    const height = svgRef.current.parentElement?.clientHeight || 600;

    svg.attr('viewBox', [-width / 2, -height / 2, width, height]);

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'currentColor');
    
    svg.append('g').attr('class', 'links');
    svg.append('g').attr('class', 'nodes');

    const simulation = d3.forceSimulation<D3Node, D3Link>()
        .force('link', d3.forceLink<D3Node, D3Link>().id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .force('collide', d3.forceCollide<D3Node>().radius(d => calculateRadius(d.influence) * 1.5).strength(0.8))
        .on('tick', () => {
          svg.select<SVGGElement>('.nodes').selectAll<SVGGElement, D3Node>('g.node-group')
            .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

          svg.select<SVGGElement>('.links').selectAll<SVGPathElement, Relationship>('path')
            .attr('d', d => {
              const sourceNode = simulationNodesRef.current.get(d.source as string);
              const targetNode = simulationNodesRef.current.get(d.target as string);

              if (!sourceNode || !targetNode || !sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) {
                return null;
              }
              
              const source = sourceNode;
              const target = targetNode;
              
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist === 0) return null;

              const targetRadius = calculateRadius(target.influence) + 6; // Buffer for stroke + arrow
              const targetX = target.x - (dx / dist) * targetRadius;
              const targetY = target.y - (dy / dist) * targetRadius;
              
              const hasReverseLink = linksRef.current.some(l => l.source === target.id && l.target === source.id);
              const dr = hasReverseLink ? dist * 1.5 : 0;

              return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
            });
        });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, []);

  // Effect for updating data and restarting simulation
  useEffect(() => {
    if (!simulationRef.current || !svgRef.current) return;
    const simulation = simulationRef.current;
    const svg = d3.select(svgRef.current);
    
    const nodeMap = simulationNodesRef.current;
    
    nodes.forEach(nodeData => {
      const existingNode = nodeMap.get(nodeData.id);
      nodeMap.set(nodeData.id, {
        ...existingNode,
        ...nodeData
      });
    });

    const currentNodeIds = new Set(nodes.map(n => n.id));
    for (const id of nodeMap.keys()) {
      if (!currentNodeIds.has(id)) {
        nodeMap.delete(id);
      }
    }
    const currentSimulationNodes = Array.from(nodeMap.values());

    // Update collision force radius - NO LONGER DEPENDS ON SELECTION
    const collisionForce = simulation.force<d3.ForceCollide<D3Node>>('collide');
    if (collisionForce) {
      collisionForce.radius(d => calculateRadius(d.influence) * 1.5);
    }

    const linkedIds = new Set<string>();
    if (selectedNodeId) {
        linkedIds.add(selectedNodeId);
        links.forEach(link => {
            if (link.source === selectedNodeId) linkedIds.add(link.target as string);
            if (link.target === selectedNodeId) linkedIds.add(link.source as string);
        });
    }

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    const drag = d3.drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        // Reduced alphaTarget for smoother "reheating"
        if (!event.active) simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
      
    const node = svg.select<SVGGElement>('.nodes')
      .selectAll<SVGGElement, D3Node>('g.node-group')
      .data(currentSimulationNodes, d => d.id)
      .join(
          enter => {
            const g = enter.append('g').attr('class', 'node-group').style('cursor', 'pointer');
            g.append('circle').attr('class', 'node-bg').attr('stroke', '#fff');
            const face = g.append('g').attr('class', 'avatar-face').attr('stroke', '#fff').attr('stroke-width', 1.5).attr('fill', 'none').attr('transform', 'scale(0.8)');
            face.append('path').attr('class', 'avatar-eyes').attr('d', d => avatarPaths[d.avatarIndex % avatarPaths.length].eyes);
            face.append('path').attr('class', 'avatar-mouth').attr('d', d => avatarPaths[d.avatarIndex % avatarPaths.length].mouth);
            g.append('text').attr('fill', '#fff').attr('stroke', 'none').style('font-size', '12px').style('text-anchor', 'middle');
            g.on('click', (event, d) => onNodeClick(d.id));
            g.call(drag);
            return g;
          },
          update => update,
          exit => exit.remove()
      );

    node.select('.node-bg')
      .attr('fill', d => colorScale(d.id))
      .transition().duration(200)
      .attr('r', d => calculateRadius(d.influence))
      .attr('stroke', d => d.id === selectedNodeId ? '#00ffff' : '#fff')
      .attr('stroke-width', d => d.id === selectedNodeId ? 4 : 1.5);
    
    node.select('text')
      .text(d => d.name)
      .transition().duration(200)
      .attr('y', d => calculateRadius(d.influence) + 15);

    node.transition().duration(200)
      .attr('opacity', d => !selectedNodeId || linkedIds.has(d.id) ? 1.0 : 0.2);
    
    const link = svg.select<SVGGElement>('.links')
        .selectAll<SVGPathElement, Relationship>('path')
        .data(links, d => `${d.source}-${d.target}`)
        .join(
            enter => enter.append('path')
                .attr('fill', 'none'),
            update => update,
            exit => exit.remove()
        );

    link.transition().duration(200)
        .attr('stroke-opacity', d => {
            if (!selectedNodeId) return 0.1;
            return d.source === selectedNodeId || d.target === selectedNodeId ? 0.9 : 0;
        })
        .attr('stroke', d => selectedNodeId ? trustColorScale(d.trust) : '#4b5563')
        .attr('stroke-width', d => selectedNodeId ? trustStrokeWidthScale(Math.abs(d.trust)) : 1)
        .attr('color', d => selectedNodeId ? trustColorScale(d.trust) : '#4b5563')
        .attr('marker-end', d => selectedNodeId && (d.source === selectedNodeId || d.target === selectedNodeId) ? 'url(#arrowhead)' : 'none');


    simulation.nodes(currentSimulationNodes);
    
    const simulationLinks = links.map(l => ({...l}));
    
    const linkForce = simulation.force<d3.ForceLink<D3Node, D3Link>>('link');
    if (linkForce) {
      linkForce
        .links(simulationLinks as D3Link[])
        .distance(d => {
            const sourceNode = d.source as D3Node;
            const targetNode = d.target as D3Node;
            if (!sourceNode || !targetNode) return 150;
            const trustValue = (d as D3Link).trust || 0;
            const baseDistance = calculateRadius(sourceNode.influence) * 1.5 + calculateRadius(targetNode.influence) * 1.5;
            const trustFactor = (100 - trustValue);
            return baseDistance + trustFactor;
        })
        .strength(d => Math.abs((d as D3Link).trust || 0) / 150);
    }
    
    simulation.alpha(1).restart();

  }, [nodes, links, onNodeClick, selectedNodeId]);

  return <svg ref={svgRef} width="100%" height="100%"></svg>;
};