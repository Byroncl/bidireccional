import { Component, ElementRef, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Node3D {
  id: string;
  position: THREE.Vector3;
  connections: string[];
  mesh?: THREE.Mesh;
  label?: THREE.Sprite;
}

interface SearchState {
  visitedFromStart: Set<string>;
  visitedFromGoal: Set<string>;
  queueFromStart: string[];
  queueFromGoal: string[];
  parentFromStart: Map<string, string>;
  parentFromGoal: Map<string, string>;
  meetingPoint: string | null;
  isComplete: boolean;
}

interface LogEntry {
  id: number;
  message: string;
  icon: string;
  timestamp: string;
  direction?: 'start' | 'goal';
  type?: 'normal' | 'meeting' | 'path';
}

@Component({
  selector: 'app-bidirectional-search-3d',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="canvas-container" #canvasContainer>
        @if (selectionMode() !== 'none') {
        <div class="selection-overlay">
          <p>
            {{
              selectionMode() === 'start'
                ? 'Haz clic en un nodo para seleccionar el INICIO'
                : 'Haz clic en un nodo para seleccionar el OBJETIVO'
            }}
          </p>
          <button (click)="cancelSelection()">Cancelar</button>
        </div>
        }
      </div>
      <div class="controls">
        <h2>Búsqueda Bidireccional 3D</h2>

        <div class="node-selection">
          <h3>Selección de Nodos:</h3>
          <div class="node-selector">
            <label>Nodo Inicio:</label>
            <div class="selector-group">
              <select
                [(ngModel)]="startNode"
                [disabled]="isSearching()"
                (change)="onNodeSelectionChange()"
              >
                @for (nodeId of availableNodes(); track nodeId) {
                <option [value]="nodeId" [disabled]="nodeId === goalNode">{{ nodeId }}</option>
                }
              </select>
              <button (click)="selectStartNode()" [disabled]="isSearching()" class="pick-button">
                <span class="start-color">●</span> Seleccionar
              </button>
            </div>
          </div>

          <div class="node-selector">
            <label>Nodo Objetivo:</label>
            <div class="selector-group">
              <select
                [(ngModel)]="goalNode"
                [disabled]="isSearching()"
                (change)="onNodeSelectionChange()"
              >
                @for (nodeId of availableNodes(); track nodeId) {
                <option [value]="nodeId" [disabled]="nodeId === startNode">{{ nodeId }}</option>
                }
              </select>
              <button (click)="selectGoalNode()" [disabled]="isSearching()" class="pick-button">
                <span class="goal-color">●</span> Seleccionar
              </button>
            </div>
          </div>
        </div>

        <div class="info">
          <p><strong>Nodo Inicio:</strong> <span class="start-color">●</span> {{ startNode }}</p>
          <p><strong>Nodo Objetivo:</strong> <span class="goal-color">●</span> {{ goalNode }}</p>
          <p><strong>Visitados desde inicio:</strong> {{ stats().fromStart }}</p>
          <p><strong>Visitados desde objetivo:</strong> {{ stats().fromGoal }}</p>
          <p><strong>Estado:</strong> {{ status() }}</p>
        </div>
        <div class="button-group">
          <button (click)="startSearch()" [disabled]="isSearching()">
            {{ isSearching() ? 'Buscando...' : 'Iniciar Búsqueda' }}
          </button>
          <button (click)="resetSearch()" [disabled]="isSearching()">Reiniciar</button>
          <button (click)="generateNewGraph()" [disabled]="isSearching()">Nuevo Grafo</button>
        </div>
        <div class="speed-control">
          <label>Velocidad:</label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            [value]="speed()"
            (input)="onSpeedChange($event)"
            [disabled]="isSearching()"
          />
          <span>{{ speed() }}ms</span>
        </div>
        <div class="legend">
          <h3>Leyenda:</h3>
          <p><span class="node-default">●</span> Nodo no visitado</p>
          <p><span class="start-color">●</span> Búsqueda desde inicio</p>
          <p><span class="goal-color">●</span> Búsqueda desde objetivo</p>
          <p><span class="meeting-color">●</span> Punto de encuentro</p>
          <p><span class="path-color">━</span> Camino final</p>
          <p><span class="arrow-color">➜</span> Flechas de movimiento</p>
        </div>

        <div class="logs-panel">
          <h3>📋 Registro de Movimientos</h3>
          <div class="logs-controls">
            <button
              (click)="clearLogs()"
              [disabled]="isSearching() || logs().length === 0"
              class="clear-logs-btn"
            >
              🗑️ Limpiar
            </button>
            <label class="auto-scroll-label">
              <input type="checkbox" [(ngModel)]="autoScroll" />
              Auto-scroll
            </label>
          </div>
          <div class="logs-container" #logsContainer>
            @if (logs().length === 0) {
            <p class="no-logs">No hay movimientos registrados</p>
            } @for (log of logs(); track log.id) {
            <div
              class="log-entry"
              [class.from-start]="log.direction === 'start'"
              [class.from-goal]="log.direction === 'goal'"
              [class.meeting]="log.type === 'meeting'"
              [class.path]="log.type === 'path'"
            >
              <span class="log-icon">{{ log.icon }}</span>
              <span class="log-message">{{ log.message }}</span>
              <span class="log-time">{{ log.timestamp }}</span>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
        height: 100vh;
        width: 100vw;
        background: #1a1a2e;
        color: #eee;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .canvas-container {
        flex: 1;
        position: relative;
      }

      .controls {
        width: 320px;
        padding: 20px;
        background: #16213e;
        overflow-y: auto;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
      }

      h2 {
        margin-top: 0;
        color: #00d4ff;
        font-size: 1.5em;
        border-bottom: 2px solid #00d4ff;
        padding-bottom: 10px;
      }

      h3 {
        color: #00d4ff;
        font-size: 1.1em;
        margin-top: 20px;
      }

      .info {
        background: #0f1419;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }

      .info p {
        margin: 8px 0;
        font-size: 0.95em;
      }

      .button-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 20px 0;
      }

      button {
        padding: 12px 20px;
        font-size: 1em;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      }

      button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
      }

      button:disabled {
        background: #555;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .speed-control {
        background: #0f1419;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }

      .speed-control label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #00d4ff;
      }

      input[type='range'] {
        width: 100%;
        margin: 10px 0;
      }

      .legend {
        background: #0f1419;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
      }

      .legend p {
        margin: 8px 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .node-default {
        color: #888;
        font-size: 1.5em;
      }

      .start-color {
        color: #00ff88;
        font-size: 1.5em;
      }

      .goal-color {
        color: #ff4444;
        font-size: 1.5em;
      }

      .meeting-color {
        color: #ffaa00;
        font-size: 1.5em;
      }

      .path-color {
        color: #00d4ff;
        font-size: 1.5em;
      }

      .arrow-color {
        color: #ffcc00;
        font-size: 1.5em;
      }

      .logs-panel {
        background: #0f1419;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
      }

      .logs-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        gap: 10px;
      }

      .clear-logs-btn {
        padding: 6px 12px;
        font-size: 0.85em;
        background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
      }

      .auto-scroll-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85em;
        cursor: pointer;
      }

      .auto-scroll-label input[type='checkbox'] {
        cursor: pointer;
        width: auto;
        margin: 0;
      }

      .logs-container {
        flex: 1;
        overflow-y: auto;
        max-height: 320px;
        padding: 10px;
        background: #0a0e14;
        border-radius: 6px;
        border: 1px solid #2a2a3e;
      }

      .logs-container::-webkit-scrollbar {
        width: 8px;
      }

      .logs-container::-webkit-scrollbar-track {
        background: #0a0e14;
        border-radius: 4px;
      }

      .logs-container::-webkit-scrollbar-thumb {
        background: #667eea;
        border-radius: 4px;
      }

      .logs-container::-webkit-scrollbar-thumb:hover {
        background: #764ba2;
      }

      .no-logs {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
        margin: 0;
      }

      .log-entry {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        margin-bottom: 6px;
        border-radius: 4px;
        font-size: 0.9em;
        animation: slideIn 0.3s ease-out;
        border-left: 3px solid transparent;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .log-entry.from-start {
        background: rgba(0, 255, 136, 0.1);
        border-left-color: #00ff88;
      }

      .log-entry.from-goal {
        background: rgba(255, 68, 68, 0.1);
        border-left-color: #ff4444;
      }

      .log-entry.meeting {
        background: rgba(255, 170, 0, 0.15);
        border-left-color: #ffaa00;
        font-weight: bold;
      }

      .log-entry.path {
        background: rgba(0, 212, 255, 0.15);
        border-left-color: #00d4ff;
      }

      .log-icon {
        font-size: 1.2em;
        min-width: 20px;
      }

      .log-message {
        flex: 1;
        line-height: 1.4;
      }

      .log-time {
        font-size: 0.75em;
        color: #888;
        white-space: nowrap;
      }

      .node-selection {
        background: #0f1419;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }

      .node-selector {
        margin: 15px 0;
      }

      .node-selector label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #00d4ff;
      }

      .selector-group {
        display: flex;
        gap: 8px;
        align-items: stretch;
      }

      .selector-group select {
        flex: 1;
        padding: 8px 12px;
        background: #16213e;
        color: #eee;
        border: 2px solid #667eea;
        border-radius: 6px;
        font-size: 1em;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .selector-group select:focus {
        outline: none;
        border-color: #00d4ff;
        box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
      }

      .selector-group select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pick-button {
        padding: 8px 16px;
        font-size: 0.9em;
        white-space: nowrap;
      }

      .selection-overlay {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 212, 255, 0.95);
        color: #000;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
        font-weight: 600;
      }

      .selection-overlay p {
        margin: 0;
        font-size: 1.1em;
      }

      .selection-overlay button {
        background: #ff4444;
        padding: 8px 20px;
        font-size: 0.9em;
      }

      .selection-overlay button:hover {
        background: #cc0000;
      }
    `,
  ],
})
export class BidirectionalSearch3dComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  @ViewChild('logsContainer', { static: false }) logsContainer?: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private nodes: Map<string, Node3D> = new Map();
  private edges: THREE.Line[] = [];
  private animationId: number = 0;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private arrows: THREE.ArrowHelper[] = [];
  private logIdCounter = 0;

  startNode = 'A';
  goalNode = 'L';
  autoScroll = true;

  stats = signal({ fromStart: 0, fromGoal: 0 });
  status = signal('Listo para iniciar');
  isSearching = signal(false);
  speed = signal(500);
  selectionMode = signal<'none' | 'start' | 'goal'>('none');
  availableNodes = signal<string[]>([]);
  logs = signal<LogEntry[]>([]);

  private searchState!: SearchState;
  ngOnInit(): void {
    this.initThreeJS();
    this.generateGraph();
    this.animate();
    this.setupMouseEvents();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer?.dispose();
    this.controls?.dispose();
    window.removeEventListener('resize', () => this.onWindowResize());
  }

  private setupMouseEvents(): void {
    const container = this.canvasContainer.nativeElement;

    container.addEventListener('click', (event: MouseEvent) => {
      if (this.selectionMode() === 'none') return;

      const rect = container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const meshes = Array.from(this.nodes.values())
        .map((node) => node.mesh)
        .filter((mesh) => mesh !== undefined) as THREE.Mesh[];

      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const selectedMesh = intersects[0].object as THREE.Mesh;
        const nodeId = selectedMesh.userData['nodeId'] as string;

        if (this.selectionMode() === 'start' && nodeId !== this.goalNode) {
          this.startNode = nodeId;
          this.selectionMode.set('none');
          this.onNodeSelectionChange();
        } else if (this.selectionMode() === 'goal' && nodeId !== this.startNode) {
          this.goalNode = nodeId;
          this.selectionMode.set('none');
          this.onNodeSelectionChange();
        }
      }
    });
  }

  selectStartNode(): void {
    if (!this.isSearching()) {
      this.selectionMode.set('start');
      this.status.set('Selecciona el nodo de inicio haciendo clic en él');
    }
  }

  selectGoalNode(): void {
    if (!this.isSearching()) {
      this.selectionMode.set('goal');
      this.status.set('Selecciona el nodo objetivo haciendo clic en él');
    }
  }

  cancelSelection(): void {
    this.selectionMode.set('none');
    this.status.set('Listo para iniciar');
  }

  onNodeSelectionChange(): void {
    if (this.startNode === this.goalNode) {
      // Si son iguales, cambiar el otro nodo
      const allNodes = Array.from(this.nodes.keys());
      const otherNode = allNodes.find((id) => id !== this.startNode);
      if (otherNode) {
        this.goalNode = otherNode;
      }
    }
    this.resetSearch();
  }

  clearLogs(): void {
    this.logs.set([]);
    this.logIdCounter = 0;
  }

  private addLog(
    message: string,
    icon: string,
    direction?: 'start' | 'goal',
    type: 'normal' | 'meeting' | 'path' = 'normal'
  ): void {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLog: LogEntry = {
      id: this.logIdCounter++,
      message,
      icon,
      timestamp,
      direction,
      type,
    };

    this.logs.update((logs) => [...logs, newLog]);

    // Auto-scroll
    if (this.autoScroll) {
      setTimeout(() => {
        if (this.logsContainer) {
          const container = this.logsContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  }

  private createArrow(from: THREE.Vector3, to: THREE.Vector3, color: number): THREE.ArrowHelper {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    direction.normalize();

    const origin = from.clone().add(direction.clone().multiplyScalar(1.2)); // Offset from node
    const arrowLength = length - 2.4; // Adjust to not overlap nodes

    const arrow = new THREE.ArrowHelper(
      direction,
      origin,
      arrowLength,
      color,
      0.8, // Head length
      0.6 // Head width
    );

    return arrow;
  }

  private clearArrows(): void {
    this.arrows.forEach((arrow) => this.scene.remove(arrow));
    this.arrows = [];
  }

  private initThreeJS(): void {
    const container = this.canvasContainer.nativeElement;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.Fog(0x0a0a0f, 50, 200);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(30, 30, 30);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private generateGraph(): void {
    // Clear existing nodes and edges
    this.clearScene();

    // Create a 3D graph structure
    const nodeIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const positions = [
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(-10, 5, -8),
      new THREE.Vector3(-5, -3, -10),
      new THREE.Vector3(0, 8, -5),
      new THREE.Vector3(-8, -5, 0),
      new THREE.Vector3(5, 3, 0),
      new THREE.Vector3(-3, 10, 5),
      new THREE.Vector3(10, -2, 5),
      new THREE.Vector3(0, -8, 10),
      new THREE.Vector3(8, 5, 8),
      new THREE.Vector3(15, 0, 12),
      new THREE.Vector3(15, -3, 15),
    ];

    // Define connections for a connected graph
    const connections: { [key: string]: string[] } = {
      A: ['B', 'C', 'E'],
      B: ['A', 'D', 'F'],
      C: ['A', 'E'],
      D: ['B', 'F', 'G'],
      E: ['A', 'C', 'I'],
      F: ['B', 'D', 'H'],
      G: ['D', 'J'],
      H: ['F', 'J', 'K'],
      I: ['E', 'K'],
      J: ['G', 'H', 'L'],
      K: ['H', 'I', 'L'],
      L: ['J', 'K'],
    };

    // Create nodes
    nodeIds.forEach((id, index) => {
      const node: Node3D = {
        id,
        position: positions[index],
        connections: connections[id],
      };

      // Create sphere for node
      const geometry = new THREE.SphereGeometry(0.8, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x222222,
        shininess: 100,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(node.position);
      mesh.userData = { nodeId: id };
      this.scene.add(mesh);
      node.mesh = mesh;

      // Create label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      context.fillStyle = '#ffffff';
      context.font = 'Bold 40px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(id, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(node.position);
      sprite.position.y += 2;
      sprite.scale.set(3, 3, 1);
      this.scene.add(sprite);
      node.label = sprite;

      this.nodes.set(id, node);
    });

    // Create edges
    this.nodes.forEach((node) => {
      node.connections.forEach((connId) => {
        const connNode = this.nodes.get(connId);
        if (connNode && node.id < connId) {
          // Avoid duplicate edges
          const points = [node.position, connNode.position];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.6,
          });
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          this.edges.push(line);
        }
      });
    });

    // Update available nodes list
    this.availableNodes.set(Array.from(this.nodes.keys()));

    this.resetSearch();
  }

  generateNewGraph(): void {
    this.generateGraph();
  }

  private clearScene(): void {
    this.nodes.forEach((node) => {
      if (node.mesh) this.scene.remove(node.mesh);
      if (node.label) this.scene.remove(node.label);
    });
    this.edges.forEach((edge) => this.scene.remove(edge));
    this.nodes.clear();
    this.edges = [];
  }

  resetSearch(): void {
    this.searchState = {
      visitedFromStart: new Set([this.startNode]),
      visitedFromGoal: new Set([this.goalNode]),
      queueFromStart: [this.startNode],
      queueFromGoal: [this.goalNode],
      parentFromStart: new Map(),
      parentFromGoal: new Map(),
      meetingPoint: null,
      isComplete: false,
    };

    // Reset all node colors
    this.nodes.forEach((node) => {
      if (node.mesh) {
        (node.mesh.material as THREE.MeshPhongMaterial).color.setHex(0x888888);
        (node.mesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x222222);
      }
    });

    // Color start and goal nodes
    const startMesh = this.nodes.get(this.startNode)?.mesh;
    if (startMesh) {
      (startMesh.material as THREE.MeshPhongMaterial).color.setHex(0x00ff88);
      (startMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x005533);
    }

    const goalMesh = this.nodes.get(this.goalNode)?.mesh;
    if (goalMesh) {
      (goalMesh.material as THREE.MeshPhongMaterial).color.setHex(0xff4444);
      (goalMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x551111);
    }

    // Clear arrows and logs
    this.clearArrows();
    this.clearLogs();

    this.stats.set({ fromStart: 0, fromGoal: 0 });
    this.status.set('Listo para iniciar');
  }

  async startSearch(): Promise<void> {
    if (this.isSearching()) return;

    this.isSearching.set(true);
    this.resetSearch();
    this.status.set('Buscando...');

    this.addLog(
      `🚀 Iniciando búsqueda bidireccional desde ${this.startNode} hasta ${this.goalNode}`,
      '🎯',
      undefined,
      'normal'
    );
    this.addLog(`✅ Nodo inicial: ${this.startNode}`, '🟢', 'start');
    this.addLog(`🎯 Nodo objetivo: ${this.goalNode}`, '🔴', 'goal');

    while (
      !this.searchState.isComplete &&
      (this.searchState.queueFromStart.length > 0 || this.searchState.queueFromGoal.length > 0)
    ) {
      // Expand from start
      if (this.searchState.queueFromStart.length > 0) {
        await this.expandFromStart();
        if (this.searchState.isComplete) break;
        await this.delay(this.speed());
      }

      // Expand from goal
      if (this.searchState.queueFromGoal.length > 0) {
        await this.expandFromGoal();
        if (this.searchState.isComplete) break;
        await this.delay(this.speed());
      }
    }

    if (this.searchState.meetingPoint) {
      this.status.set('¡Camino encontrado!');
      await this.highlightPath();
    } else {
      this.status.set('No se encontró camino');
    }

    this.isSearching.set(false);
  }

  private async expandFromStart(): Promise<void> {
    const current = this.searchState.queueFromStart.shift()!;
    const node = this.nodes.get(current);

    if (!node) return;

    for (const neighborId of node.connections) {
      if (!this.searchState.visitedFromStart.has(neighborId)) {
        this.searchState.visitedFromStart.add(neighborId);
        this.searchState.queueFromStart.push(neighborId);
        this.searchState.parentFromStart.set(neighborId, current);

        // Add arrow from current to neighbor
        const neighborNode = this.nodes.get(neighborId);
        if (neighborNode) {
          const arrow = this.createArrow(node.position, neighborNode.position, 0x00ff88);
          this.scene.add(arrow);
          this.arrows.push(arrow);
        }

        // Add log
        this.addLog(`${current} → ${neighborId}`, '🟢', 'start');

        // Check if this node was visited from goal
        if (this.searchState.visitedFromGoal.has(neighborId)) {
          this.searchState.meetingPoint = neighborId;
          this.searchState.isComplete = true;

          const meetingMesh = this.nodes.get(neighborId)?.mesh;
          if (meetingMesh) {
            (meetingMesh.material as THREE.MeshPhongMaterial).color.setHex(0xffaa00);
            (meetingMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x885500);
          }

          this.addLog(
            `🎉 ¡Punto de encuentro encontrado en ${neighborId}!`,
            '⭐',
            undefined,
            'meeting'
          );
          return;
        }

        // Color the node as visited from start
        const neighborMesh = this.nodes.get(neighborId)?.mesh;
        if (neighborMesh && neighborId !== this.goalNode) {
          (neighborMesh.material as THREE.MeshPhongMaterial).color.setHex(0x00ff88);
          (neighborMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x005533);
        }

        this.stats.set({
          fromStart: this.searchState.visitedFromStart.size,
          fromGoal: this.searchState.visitedFromGoal.size,
        });
      }
    }
  }

  private async expandFromGoal(): Promise<void> {
    const current = this.searchState.queueFromGoal.shift()!;
    const node = this.nodes.get(current);

    if (!node) return;

    for (const neighborId of node.connections) {
      if (!this.searchState.visitedFromGoal.has(neighborId)) {
        this.searchState.visitedFromGoal.add(neighborId);
        this.searchState.queueFromGoal.push(neighborId);
        this.searchState.parentFromGoal.set(neighborId, current);

        // Add arrow from current to neighbor
        const neighborNode = this.nodes.get(neighborId);
        if (neighborNode) {
          const arrow = this.createArrow(node.position, neighborNode.position, 0xff4444);
          this.scene.add(arrow);
          this.arrows.push(arrow);
        }

        // Add log
        this.addLog(`${current} → ${neighborId}`, '🔴', 'goal');

        // Check if this node was visited from start
        if (this.searchState.visitedFromStart.has(neighborId)) {
          this.searchState.meetingPoint = neighborId;
          this.searchState.isComplete = true;

          const meetingMesh = this.nodes.get(neighborId)?.mesh;
          if (meetingMesh) {
            (meetingMesh.material as THREE.MeshPhongMaterial).color.setHex(0xffaa00);
            (meetingMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x885500);
          }

          this.addLog(
            `🎉 ¡Punto de encuentro encontrado en ${neighborId}!`,
            '⭐',
            undefined,
            'meeting'
          );
          return;
        }

        // Color the node as visited from goal
        const neighborMesh = this.nodes.get(neighborId)?.mesh;
        if (neighborMesh && neighborId !== this.startNode) {
          (neighborMesh.material as THREE.MeshPhongMaterial).color.setHex(0xff4444);
          (neighborMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x551111);
        }

        this.stats.set({
          fromStart: this.searchState.visitedFromStart.size,
          fromGoal: this.searchState.visitedFromGoal.size,
        });
      }
    }
  }

  private async highlightPath(): Promise<void> {
    if (!this.searchState.meetingPoint) return;

    const path: string[] = [];

    // Build path from start to meeting point
    let current = this.searchState.meetingPoint;
    const pathFromStart: string[] = [current];
    while (this.searchState.parentFromStart.has(current)) {
      current = this.searchState.parentFromStart.get(current)!;
      pathFromStart.unshift(current);
    }

    // Build path from meeting point to goal
    current = this.searchState.meetingPoint;
    const pathFromGoal: string[] = [];
    while (this.searchState.parentFromGoal.has(current)) {
      current = this.searchState.parentFromGoal.get(current)!;
      pathFromGoal.push(current);
    }

    const fullPath = [...pathFromStart, ...pathFromGoal];

    // Log the complete path
    this.addLog(`📍 Camino completo encontrado: ${fullPath.join(' → ')}`, '✨', undefined, 'path');
    this.addLog(`📏 Longitud del camino: ${fullPath.length} nodos`, '📊', undefined, 'path');

    // Highlight the path
    for (let i = 0; i < fullPath.length - 1; i++) {
      const from = this.nodes.get(fullPath[i])!;
      const to = this.nodes.get(fullPath[i + 1])!;

      const points = [from.position, to.position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        linewidth: 5,
      });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);

      // Add thick arrow for path
      const pathArrow = this.createArrow(from.position, to.position, 0x00d4ff);
      this.scene.add(pathArrow);
      this.arrows.push(pathArrow);

      this.addLog(`${fullPath[i]} ═► ${fullPath[i + 1]}`, '💠', undefined, 'path');

      await this.delay(this.speed() / 2);
    }

    this.addLog(`✅ Búsqueda completada exitosamente!`, '🎊', undefined, 'path');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  onSpeedChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.speed.set(parseInt(value));
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const container = this.canvasContainer.nativeElement;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}
