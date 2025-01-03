
import { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import { io, Socket } from 'socket.io-client';
import { GraphData, Agent, Tool } from '../../types';

export default function Home() {
  const cyRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cy, setCy] = useState<Core | null>(null);

  useEffect(() => {
    const socket: Socket = io();

    const cyInstance = cytoscape({
      container: cyRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#4CAF50',
            'label': 'data(label)',
            'color': '#fff',
            'text-outline-color': '#333',
            'text-outline-width': 2,
            'font-size': '12px'
          }
        },
        {
          selector: 'node[type="agent"]',
          style: {
            'background-color': '#2196F3',
            'shape': 'rectangle'
          }
        },
        {
          selector: 'node[type="tool"]',
          style: {
            'background-color': '#FF5722',
            'shape': 'ellipse'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#FFC107',
            'line-color': '#FFC107',
            'target-arrow-color': '#FFC107',
            'transition-property': 'background-color, line-color, target-arrow-color',
            'transition-duration': 500
          }
        }
      ],
      layout: {
        name: 'cose',
        padding: 50
      },
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.2
    });

    setCy(cyInstance);

    cyInstance.on('zoom', (evt) => {
      setZoomLevel(cyInstance.zoom());
    });

    cyInstance.on('tap', 'node, edge', (evt) => {
      setSelectedElement(evt.target.data());
    });

    cyInstance.on('tap', (evt) => {
      if (evt.target === cyInstance) {
        setSelectedElement(null);
      }
    });

    socket.on('graphUpdate', (data: GraphData) => {
      updateGraph(cyInstance, data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateGraph = (cy: Core, data: GraphData) => {
    cy.elements().remove();
    const elements: ElementDefinition[] = [];

    data.agents.forEach((agent: Agent) => {
      elements.push({ data: { id: agent.idx, label: agent.name, type: 'agent' } });

      agent.tools.forEach((tool: Tool) => {
        elements.push({ data: { id: tool.idx, label: tool.name, type: 'tool' } });
        elements.push({ data: { source: agent.idx, target: tool.idx } });
      });
    });

    cy.add(elements);
    cy.layout({ name: 'cose' }).run();
  };

  const handleSearch = () => {
    if (cy) {
      cy.elements().unselect();
      const found = cy.elements(`[id @*= "${searchTerm}"]`);
      if (found.length > 0) {
        found.select();
        cy.fit(found, 50);
      }
    }
  };

  const applyFilter = () => {
    if (cy) {
      cy.elements().style('display', 'element');
      if (filterType !== 'all') {
        cy.elements(`[type != "${filterType}"]`).style('display', 'none');
      }
    }
  };

  const highlightPath = (startNode: string, endNode: string) => {
    if (cy) {
      const path = cy.elements().aStar({ root: `#${startNode}`, goal: `#${endNode}` }).path;
      cy.elements().removeClass('highlighted');
      path.addClass('highlighted');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nodes"
            className="px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Search
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="agent">Agents</option>
            <option value="tool">Tools</option>
          </select>
          <button
            onClick={applyFilter}
            className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600"
          >
            Apply Filter
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 relative">
          <div ref={cyRef} className="w-full h-full" />

          <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-2 space-y-2">
            <button
              onClick={() => cy?.zoom(cy.zoom() * 1.2)}
              className="block w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
            >
              +
            </button>
            <button
              onClick={() => cy?.zoom(cy.zoom() / 1.2)}
              className="block w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
            >
              -
            </button>
            <button
              onClick={() => cy?.fit()}
              className="block w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
            >
              ?
            </button>
          </div>
        </div>

        {selectedElement && (
          <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedElement.label || selectedElement.id}
            </h2>
            <div className="space-y-2">
              <div className="p-2 bg-gray-700 rounded">
                <h3 className="font-semibold">Type</h3>
                <p>{selectedElement.type || 'N/A'}</p>
              </div>
              {selectedElement.output && (
                <div className="p-2 bg-gray-700 rounded">
                  <h3 className="font-semibold">Output</h3>
                  <p>{selectedElement.output}</p>
                </div>
              )}
              {selectedElement.tools && (
                <div className="p-2 bg-gray-700 rounded">
                  <h3 className="font-semibold">Connected Tools</h3>
                  <ul className="list-disc list-inside">
                    {selectedElement.tools.map((tool: any) => (
                      <li key={tool.idx}>{tool.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 mr-2"></div>
            <span>Agent</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
            <span>Tool</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 mr-2"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

