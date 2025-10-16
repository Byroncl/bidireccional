import { Component, ElementRef, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Cell {
  row: number;
  col: number;
  isWall: boolean;
  isStart: boolean;
  isGoal: boolean;
  visitedFromStart: boolean;
  visitedFromGoal: boolean;
  isMeeting: boolean;
  isPath: boolean;
  parentFromStart?: Cell;
  parentFromGoal?: Cell;
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
  selector: 'app-maze-bidirectional',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <header class="header">
        <a routerLink="/" class="back-button">← Volver al Home</a>
        <h1>🎯 Laberinto - Búsqueda Bidireccional</h1>
      </header>

      <div class="main-content">
        <div class="maze-container">
          <canvas
            #mazeCanvas
            (click)="onCanvasClick($event)"
            (mousedown)="onMouseDown($event)"
            (mousemove)="onMouseMove($event)"
            (mouseup)="onMouseUp()"
            (mouseleave)="onMouseUp()"
          ></canvas>

          <div class="canvas-legend">
            <div class="legend-item">
              <div class="legend-color start"></div>
              <span>Inicio (Clic para mover)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color goal"></div>
              <span>Objetivo (Clic para mover)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color wall"></div>
              <span>Muro (Arrastra para dibujar)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color visited-start"></div>
              <span>Explorado desde inicio</span>
            </div>
            <div class="legend-item">
              <div class="legend-color visited-goal"></div>
              <span>Explorado desde objetivo</span>
            </div>
            <div class="legend-item">
              <div class="legend-color meeting"></div>
              <span>Punto de encuentro</span>
            </div>
            <div class="legend-item">
              <div class="legend-color path"></div>
              <span>Camino final</span>
            </div>
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
                <option value="15">15x15 (Pequeño)</option>
                <option value="25">25x25 (Mediano)</option>
                <option value="35">35x35 (Grande)</option>
              </select>
            </div>

            <div class="control-group">
              <label>Velocidad:</label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                [(ngModel)]="speed"
                [disabled]="isSearching()"
              />
              <span>{{ speed }}ms</span>
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
            </div>
          </div>

          <div class="explanation-section">
            <h3>💡 ¿Cómo Funciona?</h3>
            <div class="explanation-content">
              <p><strong>Búsqueda Bidireccional</strong> ejecuta dos búsquedas BFS simultáneas:</p>
              <ul>
                <li>🟢 <strong>Búsqueda Forward:</strong> Expande desde el punto de inicio</li>
                <li>🔴 <strong>Búsqueda Backward:</strong> Expande desde el punto objetivo</li>
                <li>⭐ <strong>Encuentro:</strong> Se detiene cuando ambas se encuentran</li>
                <li>💠 <strong>Reconstrucción:</strong> Combina ambos caminos</li>
              </ul>
              <p class="efficiency">
                <strong>Eficiencia:</strong> En lugar de explorar O(b<sup>d</sup>) nodos, explora
                aproximadamente O(2×b<sup>d/2</sup>) nodos, ¡mucho más eficiente!
              </p>
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
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #eee;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .header {
        background: rgba(0, 0, 0, 0.3);
        padding: 20px;
        border-bottom: 2px solid #00d4ff;
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .back-button {
        padding: 10px 20px;
        background: rgba(0, 212, 255, 0.2);
        color: #00d4ff;
        text-decoration: none;
        border-radius: 6px;
        border: 1px solid #00d4ff;
        transition: all 0.3s ease;
        font-weight: 600;
      }

      .back-button:hover {
        background: rgba(0, 212, 255, 0.3);
        transform: translateX(-5px);
      }

      h1 {
        margin: 0;
        font-size: 2em;
        color: #00d4ff;
      }

      .main-content {
        display: flex;
        gap: 20px;
        padding: 20px;
        flex-wrap: wrap;
      }

      .maze-container {
        flex: 1;
        min-width: 500px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      canvas {
        background: #0f1419;
        border: 2px solid #00d4ff;
        border-radius: 8px;
        cursor: crosshair;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
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

      .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .legend-color.start {
        background: #00ff88;
      }
      .legend-color.goal {
        background: #ff4444;
      }
      .legend-color.wall {
        background: #2a2a3e;
      }
      .legend-color.visited-start {
        background: rgba(0, 255, 136, 0.3);
      }
      .legend-color.visited-goal {
        background: rgba(255, 68, 68, 0.3);
      }
      .legend-color.meeting {
        background: #ffaa00;
      }
      .legend-color.path {
        background: #00d4ff;
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
        border: 1px solid rgba(0, 212, 255, 0.3);
      }

      h2,
      h3 {
        margin-top: 0;
        color: #00d4ff;
        border-bottom: 2px solid rgba(0, 212, 255, 0.3);
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
        color: #00d4ff;
        font-weight: 600;
      }

      .control-group select,
      .control-group input[type='range'] {
        width: 100%;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #667eea;
        border-radius: 4px;
        color: #eee;
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
        color: #00d4ff;
        border: 1px solid #00d4ff;
      }

      .btn-secondary:hover:not(:disabled) {
        background: rgba(0, 212, 255, 0.2);
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

      .efficiency {
        background: rgba(0, 212, 255, 0.1);
        padding: 12px;
        border-radius: 6px;
        border-left: 3px solid #00d4ff;
        margin-top: 15px;
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

      .auto-scroll-label input[type='checkbox'] {
        cursor: pointer;
        width: auto;
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

        .maze-container {
          min-width: 100%;
        }

        .controls-panel {
          width: 100%;
        }

        canvas {
          width: 100%;
          height: auto;
        }
      }
    `,
  ],
})
export class MazeBidirectionalComponent implements OnInit, OnDestroy {
  @ViewChild('mazeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('logsContainer', { static: false }) logsContainer?: ElementRef;

  private ctx!: CanvasRenderingContext2D;
  private grid: Cell[][] = [];
  private cellSize = 20;
  mazeSize = '25';
  private rows = 25;
  private cols = 25;

  private startCell: Cell | null = null;
  private goalCell: Cell | null = null;

  private isDrawing = false;
  private drawMode: 'wall' | 'erase' = 'wall';

  speed = 50;
  autoScroll = true;

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

  ngOnInit(): void {
    this.initCanvas();
    this.initGrid();
    this.generateMaze();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.cols * this.cellSize;
    canvas.height = this.rows * this.cellSize;
  }

  private initGrid(): void {
    this.grid = [];
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = {
          row,
          col,
          isWall: false,
          isStart: false,
          isGoal: false,
          visitedFromStart: false,
          visitedFromGoal: false,
          isMeeting: false,
          isPath: false,
        };
      }
    }

    // Set start and goal
    this.startCell = this.grid[1][1];
    this.startCell.isStart = true;

    this.goalCell = this.grid[this.rows - 2][this.cols - 2];
    this.goalCell.isGoal = true;

    this.drawGrid();
  }

  changeMazeSize(): void {
    this.rows = this.cols = parseInt(this.mazeSize);
    this.initGrid();
    this.resizeCanvas();
  }

  generateMaze(): void {
    this.initGrid();

    // Simple random maze generation
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.grid[row][col].isStart && !this.grid[row][col].isGoal) {
          if (Math.random() < 0.3) {
            // 30% chance of wall
            this.grid[row][col].isWall = true;
          }
        }
      }
    }

    this.drawGrid();
    this.addLog('🎲 Laberinto generado aleatoriamente', '🎲', undefined, 'info');
  }

  clearWalls(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.grid[row][col].isStart && !this.grid[row][col].isGoal) {
          this.grid[row][col].isWall = false;
        }
      }
    }
    this.drawGrid();
    this.addLog('🗑️ Muros eliminados', '🗑️', undefined, 'info');
  }

  resetMaze(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        cell.visitedFromStart = false;
        cell.visitedFromGoal = false;
        cell.isMeeting = false;
        cell.isPath = false;
        cell.parentFromStart = undefined;
        cell.parentFromGoal = undefined;
      }
    }

    this.stats.set({
      fromStart: 0,
      fromGoal: 0,
      total: 0,
      pathLength: 0,
      timeElapsed: 0,
    });

    this.status.set('Listo para iniciar');
    this.drawGrid();
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.isSearching()) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      const cell = this.grid[row][col];

      if (event.shiftKey && this.startCell) {
        // Move start
        this.startCell.isStart = false;
        cell.isStart = true;
        cell.isWall = false;
        this.startCell = cell;
        this.addLog(`🟢 Inicio movido a (${row}, ${col})`, '🟢', 'start', 'info');
      } else if (event.ctrlKey && this.goalCell) {
        // Move goal
        this.goalCell.isGoal = false;
        cell.isGoal = true;
        cell.isWall = false;
        this.goalCell = cell;
        this.addLog(`🔴 Objetivo movido a (${row}, ${col})`, '🔴', 'goal', 'info');
      }

      this.drawGrid();
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (this.isSearching()) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      const cell = this.grid[row][col];

      if (!cell.isStart && !cell.isGoal) {
        this.isDrawing = true;
        this.drawMode = cell.isWall ? 'erase' : 'wall';
        cell.isWall = this.drawMode === 'wall';
        this.drawGrid();
      }
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || this.isSearching()) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      const cell = this.grid[row][col];

      if (!cell.isStart && !cell.isGoal) {
        cell.isWall = this.drawMode === 'wall';
        this.drawGrid();
      }
    }
  }

  onMouseUp(): void {
    this.isDrawing = false;
  }

  async startBidirectionalSearch(): Promise<void> {
    if (this.isSearching() || !this.startCell || !this.goalCell) return;

    this.isSearching.set(true);
    this.resetMaze();
    this.status.set('🔍 Buscando...');
    this.searchStartTime = Date.now();

    this.addLog(`🚀 Iniciando búsqueda bidireccional`, '🎯', undefined, 'info');
    this.addLog(`🟢 Desde (${this.startCell.row}, ${this.startCell.col})`, '🟢', 'start');
    this.addLog(`🔴 Hasta (${this.goalCell.row}, ${this.goalCell.col})`, '🔴', 'goal');

    const queueFromStart: Cell[] = [this.startCell];
    const queueFromGoal: Cell[] = [this.goalCell];

    this.startCell.visitedFromStart = true;
    this.goalCell.visitedFromGoal = true;

    let meetingCell: Cell | null = null;

    while (queueFromStart.length > 0 || queueFromGoal.length > 0) {
      // Expand from start
      if (queueFromStart.length > 0) {
        const current = queueFromStart.shift()!;
        const neighbors = this.getNeighbors(current);

        for (const neighbor of neighbors) {
          if (!neighbor.visitedFromStart && !neighbor.isWall) {
            neighbor.visitedFromStart = true;
            neighbor.parentFromStart = current;
            queueFromStart.push(neighbor);

            // Check if visited from goal
            if (neighbor.visitedFromGoal) {
              meetingCell = neighbor;
              break;
            }

            this.stats.update((s) => ({
              ...s,
              fromStart: s.fromStart + 1,
              total: s.total + 1,
            }));

            this.drawGrid();
            await this.delay(this.speed);
          }
        }

        if (meetingCell) break;
      }

      // Expand from goal
      if (queueFromGoal.length > 0) {
        const current = queueFromGoal.shift()!;
        const neighbors = this.getNeighbors(current);

        for (const neighbor of neighbors) {
          if (!neighbor.visitedFromGoal && !neighbor.isWall) {
            neighbor.visitedFromGoal = true;
            neighbor.parentFromGoal = current;
            queueFromGoal.push(neighbor);

            // Check if visited from start
            if (neighbor.visitedFromStart) {
              meetingCell = neighbor;
              break;
            }

            this.stats.update((s) => ({
              ...s,
              fromGoal: s.fromGoal + 1,
              total: s.total + 1,
            }));

            this.drawGrid();
            await this.delay(this.speed);
          }
        }

        if (meetingCell) break;
      }
    }

    const timeElapsed = Date.now() - this.searchStartTime;
    this.stats.update((s) => ({ ...s, timeElapsed }));

    if (meetingCell) {
      meetingCell.isMeeting = true;
      this.addLog(
        `⭐ ¡Punto de encuentro en (${meetingCell.row}, ${meetingCell.col})!`,
        '⭐',
        undefined,
        'meeting'
      );
      await this.reconstructPath(meetingCell);
      this.status.set('✅ Camino encontrado!');
      this.addLog(`✅ Búsqueda completada en ${timeElapsed}ms`, '🎊', undefined, 'path');
    } else {
      this.status.set('❌ No hay camino');
      this.addLog(`❌ No se encontró camino`, '❌', undefined, 'info');
    }

    this.isSearching.set(false);
  }

  private async reconstructPath(meetingCell: Cell): Promise<void> {
    const path: Cell[] = [];

    // Path from start to meeting
    let current: Cell | undefined = meetingCell;
    while (current) {
      path.unshift(current);
      current = current.parentFromStart;
    }

    // Path from meeting to goal
    current = meetingCell.parentFromGoal;
    while (current) {
      path.push(current);
      current = current.parentFromGoal;
    }

    this.stats.update((s) => ({ ...s, pathLength: path.length }));
    this.addLog(`📏 Longitud del camino: ${path.length} celdas`, '📊', undefined, 'path');

    // Animate path
    for (const cell of path) {
      cell.isPath = true;
      this.drawGrid();
      await this.delay(this.speed / 2);
    }
  }

  private getNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1], // up, down, left, right
    ];

    for (const [dr, dc] of directions) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;

      if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
        neighbors.push(this.grid[newRow][newCol]);
      }
    }

    return neighbors;
  }

  private drawGrid(): void {
    this.ctx.clearRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        // Fill cell
        if (cell.isWall) {
          this.ctx.fillStyle = '#2a2a3e';
        } else if (cell.isPath) {
          this.ctx.fillStyle = '#00d4ff';
        } else if (cell.isMeeting) {
          this.ctx.fillStyle = '#ffaa00';
        } else if (cell.visitedFromStart && cell.visitedFromGoal) {
          this.ctx.fillStyle = '#ffaa00';
        } else if (cell.visitedFromStart) {
          this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
        } else if (cell.visitedFromGoal) {
          this.ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
        } else {
          this.ctx.fillStyle = '#0f1419';
        }

        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

        // Draw start/goal
        if (cell.isStart) {
          this.ctx.fillStyle = '#00ff88';
          this.ctx.beginPath();
          this.ctx.arc(
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            this.cellSize / 3,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        } else if (cell.isGoal) {
          this.ctx.fillStyle = '#ff4444';
          this.ctx.beginPath();
          this.ctx.arc(
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            this.cellSize / 3,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }

        // Grid lines
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
      }
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
