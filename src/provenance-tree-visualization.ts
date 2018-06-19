import * as d3 from 'd3';
import { HierarchyPointNode } from 'd3';
import {
  ProvenanceNode,
  ProvenanceGraphTraverser,
  isStateNode,
} from '@visualstorytelling/provenance-core';

import gratzl from './gratzl';

type D3SVGSelection = d3.Selection<SVGElement, any, null, undefined>;

export class ProvenanceTreeVisualization {
  private traverser: ProvenanceGraphTraverser;
  private svg: D3SVGSelection;

  constructor(traverser: ProvenanceGraphTraverser, elm: HTMLDivElement) {
    this.traverser = traverser;
    this.svg = (d3.select(elm).append('svg') as D3SVGSelection)
      .attr('width', 1000)
      .attr('height', 700);
    traverser.graph.on('currentChanged', () => this.update());
    this.update();
  }

  public update() {
    const treeRoot = d3.hierarchy(this.traverser.graph.root);
    const treeLayout = gratzl<ProvenanceNode>().size([500, 500]);

    let layoutCurrentNode = treeRoot;
    treeRoot.each((node) => {
      if (node.data === this.traverser.graph.current) {
        layoutCurrentNode = node;
      }
    });
    const tree = treeLayout(treeRoot, layoutCurrentNode);
    const treeNodes = tree.descendants();

    const nodes = this.svg
      .selectAll('g.node')
      .data(treeNodes, (d: any) => d.data.id as any);

    const newNodes = nodes
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .on('click', (d) => this.traverser.toStateNode(d.data.id));

    newNodes.append('circle').attr('r', 5);

    newNodes
      .append('text')
      .text((d) => (isStateNode(d.data) ? d.data.label : ''));

    nodes
      .transition()
      .duration(100)
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    const links = this.svg
      .selectAll('path.link')
      .data(tree.links(), (d: any) => d.target.data.id);

    const linkPath = ({
      source,
      target,
    }: {
      source: HierarchyPointNode<ProvenanceNode>;
      target: HierarchyPointNode<ProvenanceNode>;
    }) => {
      const [s, t] = [source, target];
      return `M${s.x},${s.y}C${s.x},${(s.y + t.y) / 2} ${t.x},${(s.y + t.y) /
        2} ${t.x},${t.y}`;
    };

    links
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', linkPath);

    links
      .transition()
      .duration(100)
      .attr('d', linkPath);
  }
}