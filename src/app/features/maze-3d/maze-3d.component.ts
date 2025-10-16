import { Component, ElementRef, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Node3D {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  row: number;
  col: number;
  level: number;
  isWall: boolean;
  isStart: boolean;
  isGoal: boolean;
  visitedFromStart: boolean;
  visitedFromGoal: boolean;
  isMeeting: boolean;
  isPath: boolean;
  neighbors: Node3D[];
  parentFromStart?: Node3D;
  parentFromGoal?: Node3D;
}

interface LogEntry {
  id: number;
  message: string;
  icon: string;
  timestamp: string;
  direction?: 'start' | 'goal';
  type?: 'normal' | 'meeting' | 'path' | 'info';
}

interface Stats {
  fromStart: number;
  fromGoal: number;
  total: number;
  pathLength: number;
  timeElapsed: number;
}

@Component({
  selector: 'app-maze-3d',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <header class="header">
        <a routerLink="/" class="back-button">← Volver al Home</a>
        <h1>🎲 Laberinto 3D con Nodos - Búsqueda Bidireccional</h1>
      </header>

      <div class="main-content">
        <div class="canvas-container">
          <canvas #mazeCanvas></canvas>

          <div class="canvas-legend">
            <div class="legend-item">
              <div class="legend-sphere start"></div>
              <span>Inicio (Click para mover)</span>
            </div>
            <div class="legend-item">
              <div class="legend-sphere goal"></div>
              <span>Objetivo (Click para mover)</span>
            </div>
            <div class="legend-item">
              <div class="legend-sphere wall"></div>
              <span>Muro (Click para alternar)</span>
            </div>
            <div class="legend-item">
              <div class="legend-sphere visited-start"></div>
              <span>Explorado desde inicio</span>
            </div>
            <div class="legend-item">
              <div class="legend-sphere visited-goal"></div>
              <span>Explorado desde objetivo</span>
            </div>
            <div class="legend-item">
              <div class="legend-sphere meeting"></div>
              <span>Punto de encuentro</span>
            </div>
            <div class="legend-item">
              <div class="legend-sphere path"></div>
              <span>Camino final</span>
            </div>
          </div>

          <div class="camera-hint">
            🎮 Usa el mouse: Click izquierdo para rotar | Rueda para zoom | Click derecho para mover
          </div>
        </div>

        <div class="controls-panel">
          <div class="info-section">
            <h2>📊 Estadísticas</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Explorados (Inicio):</span>
                <span class="stat-value start-color">{{ stats().fromStart }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Explorados (Objetivo):</span>
                <span class="stat-value goal-color">{{ stats().fromGoal }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Explorados:</span>
                <span class="stat-value">{{ stats().total }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Longitud Camino:</span>
                <span class="stat-value path-color">{{ stats().pathLength }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Tiempo:</span>
                <span class="stat-value">{{ stats().timeElapsed }}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Estado:</span>
                <span class="stat-value" [class.searching]="isSearching()">{{ status() }}</span>
              </div>
            </div>
          </div>

          <div class="controls-section">
            <h3>🎮 Controles</h3>

            <div class="control-group">
              <label>Tamaño del Laberinto:</label>
              <select [(ngModel)]="mazeSize" (change)="changeMazeSize()" [disabled]="isSearching()">
                <option value="5">5x5x3 (Pequeño)</option>
                <option value="7">7x7x3 (Mediano)</option>
                <option value="9">9x9x5 (Grande)</option>
              </select>
            </div>

            <div class="control-group">
              <label>Densidad de Muros:</label>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                [(ngModel)]="wallDensity"
                [disabled]="isSearching()"
              />
              <span>{{ wallDensity }}%</span>
            </div>

            <div class="control-group">
              <label>Velocidad de Búsqueda:</label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                [(ngModel)]="speed"
                [disabled]="isSearching()"
              />
              <span>{{ speed }}ms</span>
            </div>

            <div class="control-group">
              <label>Mostrar Conexiones:</label>
              <input type="checkbox" [(ngModel)]="showConnections" (change)="toggleConnections()" />
            </div>

            <div class="button-group">
              <button
                (click)="startBidirectionalSearch()"
                [disabled]="isSearching()"
                class="btn-primary"
              >
                {{ isSearching() ? '🔄 Buscando...' : '▶️ Iniciar Búsqueda' }}
              </button>

              <button (click)="resetMaze()" [disabled]="isSearching()" class="btn-secondary">
                🔄 Reiniciar
              </button>

              <button (click)="generateMaze()" [disabled]="isSearching()" class="btn-secondary">
                🎲 Generar Laberinto
              </button>

              <button (click)="clearWalls()" [disabled]="isSearching()" class="btn-secondary">
                🗑️ Limpiar Muros
              </button>

              <button (click)="resetCamera()" class="btn-secondary">📷 Resetear Cámara</button>
            </div>
          </div>

          <div class="explanation-section">
            <h3>💡 ¿Qué es esto?</h3>
            <div class="explanation-content">
              <p><strong>Laberinto 3D Multi-nivel</strong></p>
              <p>
                Un laberinto 3D donde cada nodo es una esfera que puede conectarse con sus vecinos
                en 6 direcciones (arriba, abajo, izquierda, derecha, adelante, atrás).
              </p>
              <ul>
                <li>🎯 <strong>Click en nodos:</strong> Alternar muro/espacio libre</li>
                <li>🟢 <strong>Shift+Click:</strong> Establecer punto de inicio</li>
                <li>🔴 <strong>Ctrl+Click:</strong> Establecer punto objetivo</li>
                <li>🔄 <strong>Búsqueda Bidireccional:</strong> Expande desde ambos extremos</li>
                <li>⭐ <strong>Ventaja:</strong> Reduce exploración de O(b^d) a O(b^(d/2))</li>
              </ul>
            </div>
          </div>

          <div class="logs-panel">
            <h3>📋 Registro de Eventos</h3>
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
              <p class="no-logs">No hay eventos registrados</p>
              } @for (log of logs(); track log.id) {
              <div
                class="log-entry"
                [class.from-start]="log.direction === 'start'"
                [class.from-goal]="log.direction === 'goal'"
                [class.meeting]="log.type === 'meeting'"
                [class.path]="log.type === 'path'"
                [class.info]="log.type === 'info'"
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
    </div>
  `,
  styles: [
    `
      .container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0a0e27 0%, #16213e 100%);
        color: #eee;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .header {
        background: rgba(0, 0, 0, 0.4);
        padding: 20px;
        border-bottom: 2px solid #667eea;
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .back-button {
        padding: 10px 20px;
        background: rgba(102, 126, 234, 0.2);
        color: #667eea;
        text-decoration: none;
        border-radius: 6px;
        border: 1px solid #667eea;
        transition: all 0.3s ease;
        font-weight: 600;
      }

      .back-button:hover {
        background: rgba(102, 126, 234, 0.3);
        transform: translateX(-5px);
      }

      h1 {
        margin: 0;
        font-size: 2em;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .main-content {
        display: flex;
        gap: 20px;
        padding: 20px;
        flex-wrap: wrap;
      }

      .canvas-container {
        flex: 1;
        min-width: 600px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      canvas {
        width: 100%;
        height: 600px;
        background: #0f1419;
        border: 2px solid #667eea;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      }

      .canvas-legend {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
        padding: 15px;
        background: rgba(15, 20, 25, 0.8);
        border-radius: 8px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9em;
      }

      .legend-sphere {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .legend-sphere.start {
        background: #00ff88;
        box-shadow: 0 0 10px #00ff88;
      }
      .legend-sphere.goal {
        background: #ff4444;
        box-shadow: 0 0 10px #ff4444;
      }
      .legend-sphere.wall {
        background: #2a2a3e;
      }
      .legend-sphere.visited-start {
        background: rgba(0, 255, 136, 0.5);
      }
      .legend-sphere.visited-goal {
        background: rgba(255, 68, 68, 0.5);
      }
      .legend-sphere.meeting {
        background: #ffaa00;
        box-shadow: 0 0 10px #ffaa00;
      }
      .legend-sphere.path {
        background: #00d4ff;
        box-shadow: 0 0 10px #00d4ff;
      }

      .camera-hint {
        text-align: center;
        padding: 10px;
        background: rgba(102, 126, 234, 0.1);
        border-radius: 6px;
        font-size: 0.9em;
        color: #667eea;
      }

      .controls-panel {
        width: 350px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .info-section,
      .controls-section,
      .explanation-section,
      .logs-panel {
        background: rgba(15, 20, 25, 0.8);
        padding: 20px;
        border-radius: 8px;
        border: 1px solid rgba(102, 126, 234, 0.3);
      }

      h2,
      h3 {
        margin-top: 0;
        color: #667eea;
        border-bottom: 2px solid rgba(102, 126, 234, 0.3);
        padding-bottom: 10px;
      }

      .stats-grid {
        display: grid;
        gap: 10px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }

      .stat-label {
        color: #aaa;
        font-size: 0.9em;
      }

      .stat-value {
        font-weight: bold;
        font-size: 1.1em;
      }

      .start-color {
        color: #00ff88;
      }
      .goal-color {
        color: #ff4444;
      }
      .path-color {
        color: #00d4ff;
      }
      .searching {
        color: #ffaa00;
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .control-group {
        margin: 15px 0;
      }

      .control-group label {
        display: block;
        margin-bottom: 8px;
        color: #667eea;
        font-weight: 600;
      }

      .control-group select,
      .control-group input[type='range'],
      .control-group input[type='checkbox'] {
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #667eea;
        border-radius: 4px;
        color: #eee;
      }

      .control-group select,
      .control-group input[type='range'] {
        width: 100%;
      }

      .control-group input[type='checkbox'] {
        width: auto;
        cursor: pointer;
      }

      .button-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 20px;
      }

      button {
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1em;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-secondary {
        background: linear-gradient(135deg, #2a2a3e 0%, #16213e 100%);
        color: #667eea;
        border: 1px solid #667eea;
      }

      .btn-secondary:hover:not(:disabled) {
        background: rgba(102, 126, 234, 0.2);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .explanation-content {
        font-size: 0.95em;
        line-height: 1.6;
      }

      .explanation-content ul {
        margin: 15px 0;
        padding-left: 20px;
      }

      .explanation-content li {
        margin: 8px 0;
      }

      .logs-panel {
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
        color: white;
      }

      .auto-scroll-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85em;
        cursor: pointer;
      }

      .logs-container {
        flex: 1;
        overflow-y: auto;
        max-height: 300px;
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

      .log-entry.info {
        background: rgba(102, 126, 234, 0.1);
        border-left-color: #667eea;
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

      @media (max-width: 1200px) {
        .main-content {
          flex-direction: column;
        }

        .canvas-container {
          min-width: 100%;
        }

        .controls-panel {
          width: 100%;
        }
      }
    `,
  ],
})
export class Maze3dComponent implements OnInit, OnDestroy {
  @ViewChild('mazeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('logsContainer', { static: false }) logsContainer?: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private nodes: Node3D[] = [];
  private connectionLines: THREE.Line[] = [];
  private arrows: THREE.ArrowHelper[] = [];

  mazeSize = '7';
  private gridSize = 7;
  private levels = 3;
  private spacing = 2;

  wallDensity = 20;
  speed = 200;
  autoScroll = true;
  showConnections = false;

  private startNode: Node3D | null = null;
  private goalNode: Node3D | null = null;

  isSearching = signal(false);
  status = signal('Listo para iniciar');
  stats = signal<Stats>({
    fromStart: 0,
    fromGoal: 0,
    total: 0,
    pathLength: 0,
    timeElapsed: 0,
  });
  logs = signal<LogEntry[]>([]);

  private logIdCounter = 0;
  private searchStartTime = 0;
  private animationFrameId: number | null = null;

  ngOnInit(): void {
    this.initThreeJS();
    this.generateMaze();
    this.animate();

    // Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.canvasRef.nativeElement.addEventListener('click', this.onCanvasClick.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.canvasRef.nativeElement.removeEventListener('click', this.onCanvasClick.bind(this));

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose Three.js resources
    this.renderer.dispose();
    this.nodes.forEach((node) => {
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
    });
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1419);
    this.scene.fog = new THREE.Fog(0x0f1419, 10, 50);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x667eea, 1, 50);
    pointLight1.position.set(-10, 10, -10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x764ba2, 1, 50);
    pointLight2.position.set(10, 10, 10);
    this.scene.add(pointLight2);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 1.5;

    // Grid helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x667eea, 0x2a2a3e);
    gridHelper.position.y = -1;
    this.scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const canvas = this.canvasRef.nativeElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  changeMazeSize(): void {
    const sizeConfig: { [key: string]: { size: number; levels: number } } = {
      '5': { size: 5, levels: 3 },
      '7': { size: 7, levels: 3 },
      '9': { size: 9, levels: 5 },
    };

    const config = sizeConfig[this.mazeSize];
    this.gridSize = config.size;
    this.levels = config.levels;
    this.generateMaze();
  }

  generateMaze(): void {
    this.clearMaze();
    this.addLog('🔨 Construyendo estructura del laberinto...', '⚙️', undefined, 'info');

    this.createNodes();
    this.addLog(`✅ ${this.nodes.length} nodos creados`, '📍', undefined, 'info');

    this.establishConnections();
    this.addLog('🔗 Conexiones establecidas entre nodos', '🔗', undefined, 'info');

    const wallCount = this.createRandomWalls();
    this.addLog(
      `⬛ ${wallCount} muros generados (${this.wallDensity}% densidad)`,
      '🧱',
      undefined,
      'info'
    );

    // Set start and goal
    if (this.nodes.length > 0) {
      this.startNode = this.nodes[0];
      this.startNode.isStart = true;
      this.updateNodeColor(this.startNode);
      this.addLog(`🟢 Inicio establecido en nodo ${this.startNode.id}`, '🏁', 'start', 'info');

      this.goalNode = this.nodes[this.nodes.length - 1];
      this.goalNode.isGoal = true;
      this.updateNodeColor(this.goalNode);
      this.addLog(`🔴 Objetivo establecido en nodo ${this.goalNode.id}`, '🎯', 'goal', 'info');
    }

    if (this.showConnections) {
      this.drawConnections();
      this.addLog('🌐 Conexiones visuales activadas', '👁️', undefined, 'info');
    }

    this.addLog('🎲 Laberinto 3D generado con éxito', '✨', undefined, 'info');
    this.addLog(
      `📐 Tamaño: ${this.gridSize}x${this.gridSize}x${this.levels} = ${this.nodes.length} nodos`,
      '�',
      undefined,
      'info'
    );
  }

  private clearMaze(): void {
    // Remove nodes
    this.nodes.forEach((node) => {
      this.scene.remove(node.mesh);
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
    });
    this.nodes = [];

    // Remove connections
    this.connectionLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.connectionLines = [];

    // Remove arrows
    this.clearArrows();

    this.startNode = null;
    this.goalNode = null;
  }

  private createNodes(): void {
    const offset = ((this.gridSize - 1) * this.spacing) / 2;

    for (let level = 0; level < this.levels; level++) {
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          const position = new THREE.Vector3(
            col * this.spacing - offset,
            level * this.spacing,
            row * this.spacing - offset
          );

          const geometry = new THREE.SphereGeometry(0.3, 16, 16);
          const material = new THREE.MeshStandardMaterial({
            color: 0x4a5568,
            emissive: 0x1a1a2e,
            emissiveIntensity: 0.2,
            metalness: 0.5,
            roughness: 0.5,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.copy(position);
          this.scene.add(mesh);

          const node: Node3D = {
            id: `${level}-${row}-${col}`,
            position,
            mesh,
            row,
            col,
            level,
            isWall: false,
            isStart: false,
            isGoal: false,
            visitedFromStart: false,
            visitedFromGoal: false,
            isMeeting: false,
            isPath: false,
            neighbors: [],
          };

          this.nodes.push(node);
        }
      }
    }
  }

  private establishConnections(): void {
    for (const node of this.nodes) {
      const neighbors: Node3D[] = [];

      // 6 directions: up, down, left, right, forward, backward
      const directions = [
        { dLevel: 1, dRow: 0, dCol: 0 }, // up
        { dLevel: -1, dRow: 0, dCol: 0 }, // down
        { dLevel: 0, dRow: -1, dCol: 0 }, // forward
        { dLevel: 0, dRow: 1, dCol: 0 }, // backward
        { dLevel: 0, dRow: 0, dCol: -1 }, // left
        { dLevel: 0, dRow: 0, dCol: 1 }, // right
      ];

      for (const dir of directions) {
        const newLevel = node.level + dir.dLevel;
        const newRow = node.row + dir.dRow;
        const newCol = node.col + dir.dCol;

        if (
          newLevel >= 0 &&
          newLevel < this.levels &&
          newRow >= 0 &&
          newRow < this.gridSize &&
          newCol >= 0 &&
          newCol < this.gridSize
        ) {
          const neighbor = this.nodes.find(
            (n) => n.level === newLevel && n.row === newRow && n.col === newCol
          );

          if (neighbor) {
            neighbors.push(neighbor);
          }
        }
      }

      node.neighbors = neighbors;
    }
  }

  private createRandomWalls(): number {
    const wallCount = Math.floor(this.nodes.length * (this.wallDensity / 100));
    let actualWallCount = 0;

    for (let i = 0; i < wallCount; i++) {
      const randomIndex = Math.floor(Math.random() * this.nodes.length);
      const node = this.nodes[randomIndex];

      if (!node.isStart && !node.isGoal) {
        node.isWall = true;
        this.updateNodeColor(node);
        actualWallCount++;
      }
    }

    return actualWallCount;
  }

  private drawConnections(): void {
    // Clear existing connections
    this.connectionLines.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.connectionLines = [];

    // Draw new connections
    for (const node of this.nodes) {
      if (node.isWall) continue;

      for (const neighbor of node.neighbors) {
        if (neighbor.isWall) continue;

        const geometry = new THREE.BufferGeometry().setFromPoints([
          node.position,
          neighbor.position,
        ]);

        const material = new THREE.LineBasicMaterial({
          color: 0x667eea,
          transparent: true,
          opacity: 0.2,
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.connectionLines.push(line);
      }
    }
  }

  toggleConnections(): void {
    if (this.showConnections) {
      this.drawConnections();
    } else {
      this.connectionLines.forEach((line) => {
        this.scene.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      this.connectionLines = [];
    }
  }

  clearWalls(): void {
    this.nodes.forEach((node) => {
      if (!node.isStart && !node.isGoal) {
        node.isWall = false;
        this.updateNodeColor(node);
      }
    });
    this.addLog('🗑️ Muros eliminados', '🗑️', undefined, 'info');
  }

  resetMaze(): void {
    this.nodes.forEach((node) => {
      node.visitedFromStart = false;
      node.visitedFromGoal = false;
      node.isMeeting = false;
      node.isPath = false;
      node.parentFromStart = undefined;
      node.parentFromGoal = undefined;
      this.updateNodeColor(node);
    });

    this.clearArrows();

    this.stats.set({
      fromStart: 0,
      fromGoal: 0,
      total: 0,
      pathLength: 0,
      timeElapsed: 0,
    });

    this.status.set('Listo para iniciar');
  }

  resetCamera(): void {
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private onCanvasClick(event: MouseEvent): void {
    if (this.isSearching()) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.nodes.map((n) => n.mesh));

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const clickedNode = this.nodes.find((n) => n.mesh === clickedMesh);

      if (clickedNode) {
        if (event.shiftKey && this.startNode) {
          // Move start
          this.startNode.isStart = false;
          this.updateNodeColor(this.startNode);

          clickedNode.isStart = true;
          clickedNode.isWall = false;
          this.startNode = clickedNode;
          this.updateNodeColor(clickedNode);

          this.addLog(`🟢 Inicio movido a nodo ${clickedNode.id}`, '🟢', 'start', 'info');
        } else if (event.ctrlKey && this.goalNode) {
          // Move goal
          this.goalNode.isGoal = false;
          this.updateNodeColor(this.goalNode);

          clickedNode.isGoal = true;
          clickedNode.isWall = false;
          this.goalNode = clickedNode;
          this.updateNodeColor(clickedNode);

          this.addLog(`🔴 Objetivo movido a nodo ${clickedNode.id}`, '🔴', 'goal', 'info');
        } else if (!clickedNode.isStart && !clickedNode.isGoal) {
          // Toggle wall
          clickedNode.isWall = !clickedNode.isWall;
          this.updateNodeColor(clickedNode);
        }
      }
    }
  }

  async startBidirectionalSearch(): Promise<void> {
    if (this.isSearching() || !this.startNode || !this.goalNode) return;

    this.isSearching.set(true);
    this.resetMaze();
    this.status.set('🔍 Buscando...');
    this.searchStartTime = Date.now();

    this.addLog('🚀 Iniciando búsqueda bidireccional 3D', '🎯', undefined, 'info');
    this.addLog(`🟢 Desde nodo ${this.startNode.id}`, '🟢', 'start');
    this.addLog(`🔴 Hasta nodo ${this.goalNode.id}`, '🔴', 'goal');

    const queueFromStart: Node3D[] = [this.startNode];
    const queueFromGoal: Node3D[] = [this.goalNode];

    this.startNode.visitedFromStart = true;
    this.goalNode.visitedFromGoal = true;

    let meetingNode: Node3D | null = null;

    while (queueFromStart.length > 0 || queueFromGoal.length > 0) {
      // Expand from start
      if (queueFromStart.length > 0) {
        const current = queueFromStart.shift()!;
        this.addLog(`🟢 Expandiendo desde nodo ${current.id}`, '🔍', 'start');

        for (const neighbor of current.neighbors) {
          if (!neighbor.visitedFromStart && !neighbor.isWall) {
            neighbor.visitedFromStart = true;
            neighbor.parentFromStart = current;
            queueFromStart.push(neighbor);

            this.createArrow(current, neighbor, 0x00ff88);
            this.addLog(`🟢 Visitando nodo ${neighbor.id} desde ${current.id}`, '➡️', 'start');

            // Check meeting
            if (neighbor.visitedFromGoal) {
              meetingNode = neighbor;
              this.addLog(
                `⭐ ¡Encuentro detectado! Nodo ${neighbor.id} visitado desde ambas direcciones`,
                '🎯',
                undefined,
                'meeting'
              );
              break;
            }

            this.stats.update((s) => ({
              ...s,
              fromStart: s.fromStart + 1,
              total: s.total + 1,
            }));

            this.updateNodeColor(neighbor);
            await this.delay(this.speed);
          }
        }

        if (meetingNode) break;
      }

      // Expand from goal
      if (queueFromGoal.length > 0) {
        const current = queueFromGoal.shift()!;
        this.addLog(`🔴 Expandiendo desde nodo ${current.id}`, '🔍', 'goal');

        for (const neighbor of current.neighbors) {
          if (!neighbor.visitedFromGoal && !neighbor.isWall) {
            neighbor.visitedFromGoal = true;
            neighbor.parentFromGoal = current;
            queueFromGoal.push(neighbor);

            this.createArrow(current, neighbor, 0xff4444);
            this.addLog(`🔴 Visitando nodo ${neighbor.id} desde ${current.id}`, '➡️', 'goal');

            // Check meeting
            if (neighbor.visitedFromStart) {
              meetingNode = neighbor;
              this.addLog(
                `⭐ ¡Encuentro detectado! Nodo ${neighbor.id} visitado desde ambas direcciones`,
                '🎯',
                undefined,
                'meeting'
              );
              break;
            }

            this.stats.update((s) => ({
              ...s,
              fromGoal: s.fromGoal + 1,
              total: s.total + 1,
            }));

            this.updateNodeColor(neighbor);
            await this.delay(this.speed);
          }
        }

        if (meetingNode) break;
      }
    }

    const timeElapsed = Date.now() - this.searchStartTime;
    this.stats.update((s) => ({ ...s, timeElapsed }));

    if (meetingNode) {
      meetingNode.isMeeting = true;
      this.updateNodeColor(meetingNode);
      this.addLog(`⭐ ¡Punto de encuentro en nodo ${meetingNode.id}!`, '⭐', undefined, 'meeting');
      await this.highlightPath(meetingNode);
      this.status.set('✅ Camino encontrado!');
      this.addLog(`✅ Búsqueda completada en ${timeElapsed}ms`, '🎊', undefined, 'path');
    } else {
      this.status.set('❌ No hay camino');
      this.addLog('❌ No se encontró camino', '❌', undefined, 'info');
    }

    this.isSearching.set(false);
  }

  private async highlightPath(meetingNode: Node3D): Promise<void> {
    const path: Node3D[] = [];

    this.addLog('🔄 Reconstruyendo camino óptimo...', '🔧', undefined, 'path');

    // Path from start to meeting
    let current: Node3D | undefined = meetingNode;
    while (current) {
      path.unshift(current);
      current = current.parentFromStart;
    }

    // Path from meeting to goal
    current = meetingNode.parentFromGoal;
    while (current) {
      path.push(current);
      current = current.parentFromGoal;
    }

    this.stats.update((s) => ({ ...s, pathLength: path.length }));
    this.addLog(`📏 Longitud del camino: ${path.length} nodos`, '📊', undefined, 'path');
    this.addLog(`💠 Trazando camino final...`, '✨', undefined, 'path');

    // Animate path
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      from.isPath = true;
      this.updateNodeColor(from);
      this.createArrow(from, to, 0x00d4ff);

      this.addLog(
        `💠 Camino: ${from.id} → ${to.id} (paso ${i + 1}/${path.length - 1})`,
        '🔷',
        undefined,
        'path'
      );

      await this.delay(this.speed / 2);
    }

    if (path.length > 0) {
      path[path.length - 1].isPath = true;
      this.updateNodeColor(path[path.length - 1]);
    }
  }

  private createArrow(from: Node3D, to: Node3D, color: number): void {
    const direction = new THREE.Vector3().subVectors(to.position, from.position).normalize();

    const length = from.position.distanceTo(to.position);
    const origin = from.position.clone();

    const arrow = new THREE.ArrowHelper(
      direction,
      origin,
      length,
      color,
      length * 0.2,
      length * 0.15
    );

    this.scene.add(arrow);
    this.arrows.push(arrow);
  }

  private clearArrows(): void {
    this.arrows.forEach((arrow) => {
      this.scene.remove(arrow);
      arrow.dispose();
    });
    this.arrows = [];
  }

  private updateNodeColor(node: Node3D): void {
    const material = node.mesh.material as THREE.MeshStandardMaterial;

    if (node.isStart) {
      material.color.setHex(0x00ff88);
      material.emissive.setHex(0x00ff88);
      material.emissiveIntensity = 0.5;
    } else if (node.isGoal) {
      material.color.setHex(0xff4444);
      material.emissive.setHex(0xff4444);
      material.emissiveIntensity = 0.5;
    } else if (node.isWall) {
      material.color.setHex(0x2a2a3e);
      material.emissive.setHex(0x1a1a2e);
      material.emissiveIntensity = 0.1;
    } else if (node.isPath) {
      material.color.setHex(0x00d4ff);
      material.emissive.setHex(0x00d4ff);
      material.emissiveIntensity = 0.6;
    } else if (node.isMeeting) {
      material.color.setHex(0xffaa00);
      material.emissive.setHex(0xffaa00);
      material.emissiveIntensity = 0.7;
    } else if (node.visitedFromStart && node.visitedFromGoal) {
      material.color.setHex(0xffaa00);
      material.emissive.setHex(0xffaa00);
      material.emissiveIntensity = 0.3;
    } else if (node.visitedFromStart) {
      material.color.setHex(0x00ff88);
      material.emissive.setHex(0x00ff88);
      material.emissiveIntensity = 0.2;
    } else if (node.visitedFromGoal) {
      material.color.setHex(0xff4444);
      material.emissive.setHex(0xff4444);
      material.emissiveIntensity = 0.2;
    } else {
      material.color.setHex(0x4a5568);
      material.emissive.setHex(0x1a1a2e);
      material.emissiveIntensity = 0.1;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private addLog(
    message: string,
    icon: string,
    direction?: 'start' | 'goal',
    type: 'normal' | 'meeting' | 'path' | 'info' = 'normal'
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

    if (this.autoScroll) {
      setTimeout(() => {
        if (this.logsContainer) {
          const container = this.logsContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  }

  clearLogs(): void {
    this.logs.set([]);
    this.logIdCounter = 0;
  }
}
