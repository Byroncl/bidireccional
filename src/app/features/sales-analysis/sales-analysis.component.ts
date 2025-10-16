import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SaleData {
  id: string;
  date: Date;
  product: string;
  category: string;
  amount: number;
  quantity: number;
  region: string;
  seller: string;
}

interface ProcessNode {
  id: number;
  name: string;
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
  isStart: boolean;
  isGoal: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  data?: any;
  timestamp?: Date;
  processTime?: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'start' | 'goal' | 'process' | 'complete' | 'data' | 'info';
  nodeId?: number;
}

interface AnalysisResult {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: Array<{ product: string; revenue: number }>;
  topCategories: Array<{ category: string; revenue: number }>;
  salesByRegion: Array<{ region: string; sales: number }>;
  salesTrend: Array<{ date: string; sales: number }>;
  bestSellers: Array<{ seller: string; revenue: number }>;
}

@Component({
  selector: 'app-sales-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="sales-analysis-container">
      <header class="header">
        <button class="back-btn" routerLink="/"><span>←</span> Volver al Inicio</button>
        <h1>📊 Análisis Bidireccional de Ventas</h1>
        <p class="subtitle">Procesamiento paralelo con visualización 3D del flujo de datos</p>
      </header>

      <div class="main-content">
        <!-- Panel de Control -->
        <div class="control-panel">
          <div class="date-selector">
            <div class="date-group">
              <label>📅 Fecha Inicio:</label>
              <input type="date" [(ngModel)]="startDate" [disabled]="isProcessing()" />
            </div>
            <div class="date-group">
              <label>📅 Fecha Fin:</label>
              <input type="date" [(ngModel)]="endDate" [disabled]="isProcessing()" />
            </div>
          </div>

          <div class="control-buttons">
            <button
              class="btn btn-generate"
              (click)="generateSalesData()"
              [disabled]="isProcessing()"
            >
              🎲 Generar Data de Ventas
            </button>

            <button
              class="btn btn-primary"
              (click)="startBidirectionalAnalysis()"
              [disabled]="isProcessing() || salesData().length === 0"
            >
              {{ isProcessing() ? '⏳ Procesando...' : '🚀 Iniciar Análisis Bidireccional' }}
            </button>

            <button class="btn btn-secondary" (click)="resetAnalysis()" [disabled]="isProcessing()">
              🔄 Reiniciar
            </button>
          </div>

          <div class="info-stats">
            <div class="stat-item">
              <span class="stat-label">📦 Registros:</span>
              <span class="stat-value">{{ salesData().length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">⚡ Velocidad:</span>
              <span class="stat-value">{{ processingSpeed() }}ms</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">🎯 Progreso:</span>
              <span class="stat-value">{{ progress() }}%</span>
            </div>
          </div>
        </div>

        <!-- Contenedor Principal: Visualización 3D + Análisis -->
        <div class="visualization-container">
          <!-- Canvas 3D -->
          <div class="canvas-section">
            <h3>🌳 Árbol de Procesamiento Bidireccional</h3>
            <canvas #canvas3d></canvas>
            <div class="canvas-info">
              <p>🖱️ Clic: Rotar | Scroll: Zoom | Arrastra: Pan</p>
            </div>
          </div>

          <!-- Panel de Análisis -->
          <div class="analysis-section">
            <h3>📊 Resultados del Análisis</h3>

            @if (analysisResult()) {
            <div class="results-grid">
              <!-- Métricas Principales -->
              <div class="metric-card">
                <div class="metric-icon">💰</div>
                <div class="metric-content">
                  <p class="metric-label">Ingresos Totales</p>
                  <p class="metric-value">$ {{ formatNumber(analysisResult()!.totalRevenue) }}</p>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">🛒</div>
                <div class="metric-content">
                  <p class="metric-label">Total Ventas</p>
                  <p class="metric-value">{{ formatNumber(analysisResult()!.totalSales) }}</p>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">📈</div>
                <div class="metric-content">
                  <p class="metric-label">Ticket Promedio</p>
                  <p class="metric-value">$ {{ formatNumber(analysisResult()!.averageTicket) }}</p>
                </div>
              </div>

              <!-- Gráficos -->
              <div class="chart-card">
                <h4>📊 Top 5 Productos</h4>
                <canvas #chartProducts></canvas>
              </div>

              <div class="chart-card">
                <h4>🏷️ Ventas por Categoría</h4>
                <canvas #chartCategories></canvas>
              </div>

              <div class="chart-card">
                <h4>🌍 Ventas por Región</h4>
                <canvas #chartRegions></canvas>
              </div>

              <div class="chart-card full-width">
                <h4>📈 Tendencia de Ventas</h4>
                <canvas #chartTrend></canvas>
              </div>

              <div class="chart-card">
                <h4>🏆 Mejores Vendedores</h4>
                <canvas #chartSellers></canvas>
              </div>
            </div>
            } @else {
            <div class="no-results">
              <p>🔍 Esperando análisis...</p>
              <p class="hint">Genera data de ventas y ejecuta el análisis bidireccional</p>
            </div>
            }
          </div>
        </div>

        <!-- Panel de Logs -->
        <div class="logs-panel">
          <div class="logs-header">
            <h3>📝 Logs del Proceso</h3>
            <button class="btn-clear" (click)="clearLogs()">🗑️ Limpiar</button>
          </div>
          <div class="logs-content" #logsContainer>
            @for (log of logs(); track log.timestamp) {
            <div class="log-entry" [class]="'log-' + log.type">
              <span class="log-time">{{ log.timestamp }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .sales-analysis-container {
        width: 100%;
        min-height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #fff;
        padding: 20px;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        position: relative;
      }

      .back-btn {
        position: absolute;
        left: 0;
        top: 0;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(-5px);
      }

      h1 {
        font-size: 2.5rem;
        margin: 0 0 10px 0;
        background: linear-gradient(45deg, #00d4ff, #ff00ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .subtitle {
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.1rem;
      }

      .main-content {
        max-width: 1800px;
        margin: 0 auto;
      }

      .control-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      }

      .date-selector {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .date-group {
        flex: 1;
        min-width: 250px;
      }

      .date-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #00d4ff;
      }

      .date-group input {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 16px;
        transition: all 0.3s;
      }

      .date-group input:focus {
        outline: none;
        border-color: #00d4ff;
        background: rgba(255, 255, 255, 0.15);
      }

      .control-buttons {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .btn {
        flex: 1;
        min-width: 200px;
        padding: 15px 30px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }

      .btn-generate {
        background: linear-gradient(45deg, #ff6b6b, #ee5a6f);
        color: white;
      }

      .btn-primary {
        background: linear-gradient(45deg, #00d4ff, #0099ff);
        color: white;
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.2);
      }

      .btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 212, 255, 0.4);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .info-stats {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }

      .stat-item {
        flex: 1;
        min-width: 150px;
        background: rgba(255, 255, 255, 0.05);
        padding: 15px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .stat-label {
        display: block;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin-bottom: 5px;
      }

      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: #00d4ff;
      }

      .visualization-container {
        display: grid;
        grid-template-columns: 500px 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }

      .canvas-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
      }

      .canvas-section h3 {
        margin: 0 0 15px 0;
        color: #00d4ff;
      }

      canvas {
        width: 100%;
        height: 500px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
      }

      .canvas-info {
        margin-top: 10px;
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
      }

      .analysis-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        overflow-y: auto;
        max-height: 800px;
      }

      .analysis-section h3 {
        margin: 0 0 20px 0;
        color: #00d4ff;
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 15px;
      }

      .metric-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .metric-icon {
        font-size: 40px;
      }

      .metric-content {
        flex: 1;
      }

      .metric-label {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }

      .metric-value {
        margin: 5px 0 0 0;
        font-size: 28px;
        font-weight: 700;
        color: #00d4ff;
      }

      .chart-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 20px;
      }

      .chart-card.full-width {
        grid-column: 1 / -1;
      }

      .chart-card h4 {
        margin: 0 0 15px 0;
        color: #00d4ff;
      }

      .no-results {
        text-align: center;
        padding: 60px 20px;
      }

      .no-results p {
        font-size: 18px;
        margin: 10px 0;
      }

      .hint {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
      }

      .logs-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
      }

      .logs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .logs-header h3 {
        margin: 0;
        color: #00d4ff;
      }

      .btn-clear {
        background: rgba(255, 107, 107, 0.2);
        border: 1px solid rgba(255, 107, 107, 0.4);
        color: #ff6b6b;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
      }

      .btn-clear:hover {
        background: rgba(255, 107, 107, 0.3);
      }

      .logs-content {
        max-height: 400px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 15px;
      }

      .log-entry {
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        border-left: 4px solid;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .log-start {
        background: rgba(0, 255, 136, 0.1);
        border-left-color: #00ff88;
      }

      .log-goal {
        background: rgba(255, 68, 68, 0.1);
        border-left-color: #ff4444;
      }

      .log-process {
        background: rgba(0, 212, 255, 0.1);
        border-left-color: #00d4ff;
      }

      .log-complete {
        background: rgba(255, 215, 0, 0.1);
        border-left-color: #ffd700;
      }

      .log-data {
        background: rgba(255, 0, 255, 0.1);
        border-left-color: #ff00ff;
      }

      .log-info {
        background: rgba(255, 255, 255, 0.05);
        border-left-color: rgba(255, 255, 255, 0.3);
      }

      .log-time {
        color: rgba(255, 255, 255, 0.5);
        margin-right: 10px;
      }

      .log-message {
        color: rgba(255, 255, 255, 0.9);
      }

      /* Scrollbar personalizado */
      .logs-content::-webkit-scrollbar,
      .analysis-section::-webkit-scrollbar {
        width: 8px;
      }

      .logs-content::-webkit-scrollbar-track,
      .analysis-section::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      .logs-content::-webkit-scrollbar-thumb,
      .analysis-section::-webkit-scrollbar-thumb {
        background: rgba(0, 212, 255, 0.5);
        border-radius: 4px;
      }

      .logs-content::-webkit-scrollbar-thumb:hover,
      .analysis-section::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 212, 255, 0.7);
      }

      @media (max-width: 1400px) {
        .visualization-container {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        h1 {
          font-size: 1.8rem;
        }

        .control-buttons {
          flex-direction: column;
        }

        .btn {
          min-width: 100%;
        }

        .results-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SalesAnalysisComponent implements OnInit, OnDestroy {
  // Signals
  salesData = signal<SaleData[]>([]);
  isProcessing = signal(false);
  progress = signal(0);
  processingSpeed = signal(100);
  logs = signal<LogEntry[]>([]);
  analysisResult = signal<AnalysisResult | null>(null);

  // Date range
  startDate: string = '';
  endDate: string = '';

  // Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private canvas!: HTMLCanvasElement;
  private animationId?: number;

  // Nodes
  private nodes: ProcessNode[] = [];
  private arrows: THREE.ArrowHelper[] = [];

  // Charts
  private charts: Chart[] = [];

  constructor() {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Auto-scroll logs
    effect(() => {
      this.logs();
      setTimeout(() => this.scrollLogsToBottom(), 100);
    });
  }

  ngOnInit(): void {
    // Generate initial sales data
    this.generateSalesData();

    // Initialize Three.js after view init
    setTimeout(() => {
      this.initThreeJS();
      this.createProcessingNodes();
      this.animate();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.charts.forEach((chart) => chart.destroy());
  }

  private initThreeJS(): void {
    const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvasElement) return;

    this.canvas = canvasElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 100);
    pointLight2.position.set(-10, 10, -10);
    this.scene.add(pointLight2);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x00d4ff, 0x444444);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private createProcessingNodes(): void {
    // Create 11 nodes in a linear path (bidirectional flow)
    const totalNodes = 11;
    const spacing = 2;
    const startX = -10;

    for (let i = 0; i < totalNodes; i++) {
      const node: ProcessNode = {
        id: i,
        name: this.getNodeName(i),
        position: new THREE.Vector3(startX + i * spacing, 0, 0),
        isStart: i === 0,
        isGoal: i === totalNodes - 1,
        isProcessing: false,
        isCompleted: false,
      };

      // Create mesh
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: node.isStart ? 0x00ff88 : node.isGoal ? 0xff4444 : 0x4444ff,
        emissive: node.isStart ? 0x00ff88 : node.isGoal ? 0xff4444 : 0x4444ff,
        emissiveIntensity: 0.3,
        shininess: 100,
      });

      node.mesh = new THREE.Mesh(geometry, material);
      node.mesh.position.copy(node.position);
      this.scene.add(node.mesh);

      // Add label
      this.createNodeLabel(node);

      this.nodes.push(node);
    }

    // Create connecting lines
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const start = this.nodes[i].position;
      const end = this.nodes[i + 1].position;

      const points = [start, end];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x666666,
        linewidth: 2,
      });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }
  }

  private getNodeName(index: number): string {
    const names = [
      'Inicio',
      'Filtrado',
      'Agrupación',
      'Cálculo',
      'Agregación',
      'Análisis Central',
      'Métricas',
      'Categorización',
      'Estadísticas',
      'Visualización',
      'Fin',
    ];
    return names[index] || `Nodo ${index}`;
  }

  private createNodeLabel(node: ProcessNode): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'Bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(node.name, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(node.position);
    sprite.position.y += 1.2;
    sprite.scale.set(2, 0.5, 1);
    this.scene.add(sprite);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();

    // Animate processing nodes
    this.nodes.forEach((node) => {
      if (node.mesh && node.isProcessing) {
        node.mesh.rotation.y += 0.05;
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
        node.mesh.scale.set(scale, scale, scale);
      }
    });

    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize(): void {
    if (!this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  generateSalesData(): void {
    this.addLog('🎲 Generando data de ventas aleatoria...', 'info');

    const products = [
      'Laptop Dell XPS',
      'iPhone 15 Pro',
      'Samsung Galaxy S24',
      'MacBook Air M3',
      'iPad Pro',
      'AirPods Pro',
      'Mouse Logitech',
      'Teclado Mecánico',
      'Monitor LG 27"',
      'Webcam HD',
      'Auriculares Sony',
      'SSD 1TB',
    ];

    const categories = ['Electrónica', 'Computadoras', 'Accesorios', 'Audio', 'Video'];
    const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
    const sellers = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Lucía', 'Diego', 'Sofia'];

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const salesCount = Math.floor(Math.random() * 200) + 100; // 100-300 sales
    const sales: SaleData[] = [];

    for (let i = 0; i < salesCount; i++) {
      const randomDay = Math.floor(Math.random() * daysDiff);
      const saleDate = new Date(start);
      saleDate.setDate(start.getDate() + randomDay);

      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const basePrice = Math.floor(Math.random() * 2000) + 100;
      const amount = basePrice * quantity;

      sales.push({
        id: `SALE-${String(i + 1).padStart(4, '0')}`,
        date: saleDate,
        product,
        category: categories[Math.floor(Math.random() * categories.length)],
        amount,
        quantity,
        region: regions[Math.floor(Math.random() * regions.length)],
        seller: sellers[Math.floor(Math.random() * sellers.length)],
      });
    }

    // Sort by date
    sales.sort((a, b) => a.date.getTime() - b.date.getTime());

    this.salesData.set(sales);
    this.addLog('✅ ' + sales.length + ' registros de ventas generados', 'data');
  }

  async startBidirectionalAnalysis(): Promise<void> {
    this.isProcessing.set(true);
    this.progress.set(0);
    this.analysisResult.set(null);
    this.clearArrows();
    this.resetNodes();

    this.addLog('🚀 Iniciando análisis bidireccional...', 'info');
    this.addLog('⚡ Procesamiento paralelo desde inicio y fin', 'info');

    const startNode = this.nodes[0];
    const goalNode = this.nodes[this.nodes.length - 1];

    startNode.isProcessing = true;
    goalNode.isProcessing = true;

    this.addLog('🟢 Nodo START: ' + startNode.name, 'start');
    this.addLog('🔴 Nodo GOAL: ' + goalNode.name, 'goal');

    // Simulate bidirectional processing
    const midpoint = Math.floor(this.nodes.length / 2);
    let leftIndex = 0;
    let rightIndex = this.nodes.length - 1;

    while (leftIndex <= rightIndex) {
      // Process from start
      if (leftIndex <= midpoint) {
        await this.processNode(leftIndex, 'start');
        leftIndex++;
      }

      // Process from goal
      if (rightIndex >= midpoint && rightIndex !== leftIndex - 1) {
        await this.processNode(rightIndex, 'goal');
        rightIndex--;
      }

      // Update progress
      const totalProcessed = leftIndex + (this.nodes.length - 1 - rightIndex);
      this.progress.set(Math.floor((totalProcessed / this.nodes.length) * 100));

      await this.delay(this.processingSpeed());
    }

    // Meeting point
    this.addLog('⭐ ¡Encuentro en el nodo central: ' + this.nodes[midpoint].name + '!', 'complete');

    // Generate analysis results
    await this.generateAnalysisResults();

    this.isProcessing.set(false);
    this.progress.set(100);
    this.addLog('✅ Análisis bidireccional completado', 'complete');
  }

  private async processNode(index: number, direction: 'start' | 'goal'): Promise<void> {
    const node = this.nodes[index];
    const color = direction === 'start' ? '🟢' : '🔴';

    this.addLog(color + ' Procesando: ' + node.name, 'process');

    node.isProcessing = true;
    node.timestamp = new Date();

    // Simulate processing time
    await this.delay(this.processingSpeed());

    // Add arrow to next node
    if (direction === 'start' && index < this.nodes.length - 1) {
      this.createArrow(node.position, this.nodes[index + 1].position, 0x00ff88);
    } else if (direction === 'goal' && index > 0) {
      this.createArrow(node.position, this.nodes[index - 1].position, 0xff4444);
    }

    node.isProcessing = false;
    node.isCompleted = true;

    // Update node color
    if (node.mesh) {
      (node.mesh.material as THREE.MeshPhongMaterial).color.setHex(0xffd700);
      (node.mesh.material as THREE.MeshPhongMaterial).emissive.setHex(0xffd700);
    }

    const processTime = Date.now() - node.timestamp.getTime();
    node.processTime = processTime;

    this.addLog('✓ ' + node.name + ' completado (' + processTime + 'ms)', 'complete');
  }

  private createArrow(from: THREE.Vector3, to: THREE.Vector3, color: number): void {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    direction.normalize();

    const arrow = new THREE.ArrowHelper(direction, from, length, color, 0.5, 0.3);

    this.scene.add(arrow);
    this.arrows.push(arrow);
  }

  private clearArrows(): void {
    this.arrows.forEach((arrow) => this.scene.remove(arrow));
    this.arrows = [];
  }

  private resetNodes(): void {
    this.nodes.forEach((node) => {
      node.isProcessing = false;
      node.isCompleted = false;
      node.data = undefined;
      node.timestamp = undefined;
      node.processTime = undefined;

      if (node.mesh) {
        const color = node.isStart ? 0x00ff88 : node.isGoal ? 0xff4444 : 0x4444ff;
        (node.mesh.material as THREE.MeshPhongMaterial).color.setHex(color);
        (node.mesh.material as THREE.MeshPhongMaterial).emissive.setHex(color);
        node.mesh.scale.set(1, 1, 1);
        node.mesh.rotation.set(0, 0, 0);
      }
    });
  }

  private async generateAnalysisResults(): Promise<void> {
    this.addLog('📊 Generando resultados del análisis...', 'data');

    const sales = this.salesData();

    // Calculate metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const averageTicket = totalRevenue / totalSales;

    // Top products
    const productSales = new Map<string, number>();
    sales.forEach((sale) => {
      const current = productSales.get(sale.product) || 0;
      productSales.set(sale.product, current + sale.amount);
    });
    const topProducts = Array.from(productSales.entries())
      .map(([product, revenue]) => ({ product, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top categories
    const categorySales = new Map<string, number>();
    sales.forEach((sale) => {
      const current = categorySales.get(sale.category) || 0;
      categorySales.set(sale.category, current + sale.amount);
    });
    const topCategories = Array.from(categorySales.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Sales by region
    const regionSales = new Map<string, number>();
    sales.forEach((sale) => {
      const current = regionSales.get(sale.region) || 0;
      regionSales.set(sale.region, current + 1);
    });
    const salesByRegion = Array.from(regionSales.entries())
      .map(([region, sales]) => ({ region, sales }))
      .sort((a, b) => b.sales - a.sales);

    // Sales trend
    const dailySales = new Map<string, number>();
    sales.forEach((sale) => {
      const dateKey = sale.date.toISOString().split('T')[0];
      const current = dailySales.get(dateKey) || 0;
      dailySales.set(dateKey, current + sale.amount);
    });
    const salesTrend = Array.from(dailySales.entries())
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Best sellers
    const sellerSales = new Map<string, number>();
    sales.forEach((sale) => {
      const current = sellerSales.get(sale.seller) || 0;
      sellerSales.set(sale.seller, current + sale.amount);
    });
    const bestSellers = Array.from(sellerSales.entries())
      .map(([seller, revenue]) => ({ seller, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const results: AnalysisResult = {
      totalSales,
      totalRevenue,
      averageTicket,
      topProducts,
      topCategories,
      salesByRegion,
      salesTrend,
      bestSellers,
    };

    this.analysisResult.set(results);

    this.addLog('💰 Total ingresos: $' + this.formatNumber(totalRevenue), 'data');
    this.addLog('🛒 Total ventas: ' + totalSales, 'data');
    this.addLog('📈 Ticket promedio: $' + this.formatNumber(averageTicket), 'data');

    // Create charts
    await this.delay(300);
    this.createCharts();
  }

  private createCharts(): void {
    // Clear existing charts
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    setTimeout(() => {
      const result = this.analysisResult();
      if (!result) return;

      // Top Products Chart
      const productsCanvas = document.querySelector('canvas[#chartProducts]') as HTMLCanvasElement;
      if (productsCanvas) {
        this.charts.push(
          new Chart(productsCanvas, {
            type: 'bar',
            data: {
              labels: result.topProducts.map((p) => p.product),
              datasets: [
                {
                  label: 'Ingresos',
                  data: result.topProducts.map((p) => p.revenue),
                  backgroundColor: 'rgba(0, 212, 255, 0.8)',
                  borderColor: 'rgba(0, 212, 255, 1)',
                  borderWidth: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
            },
          })
        );
      }

      // Categories Chart
      const categoriesCanvas = document.querySelector(
        'canvas[#chartCategories]'
      ) as HTMLCanvasElement;
      if (categoriesCanvas) {
        this.charts.push(
          new Chart(categoriesCanvas, {
            type: 'doughnut',
            data: {
              labels: result.topCategories.map((c) => c.category),
              datasets: [
                {
                  data: result.topCategories.map((c) => c.revenue),
                  backgroundColor: [
                    'rgba(0, 212, 255, 0.8)',
                    'rgba(255, 0, 255, 0.8)',
                    'rgba(0, 255, 136, 0.8)',
                    'rgba(255, 215, 0, 0.8)',
                    'rgba(255, 68, 68, 0.8)',
                  ],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            },
          })
        );
      }

      // Regions Chart
      const regionsCanvas = document.querySelector('canvas[#chartRegions]') as HTMLCanvasElement;
      if (regionsCanvas) {
        this.charts.push(
          new Chart(regionsCanvas, {
            type: 'polarArea',
            data: {
              labels: result.salesByRegion.map((r) => r.region),
              datasets: [
                {
                  data: result.salesByRegion.map((r) => r.sales),
                  backgroundColor: [
                    'rgba(0, 212, 255, 0.6)',
                    'rgba(255, 0, 255, 0.6)',
                    'rgba(0, 255, 136, 0.6)',
                    'rgba(255, 215, 0, 0.6)',
                    'rgba(255, 68, 68, 0.6)',
                  ],
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
            },
          })
        );
      }

      // Trend Chart
      const trendCanvas = document.querySelector('canvas[#chartTrend]') as HTMLCanvasElement;
      if (trendCanvas) {
        this.charts.push(
          new Chart(trendCanvas, {
            type: 'line',
            data: {
              labels: result.salesTrend.map((t) => t.date),
              datasets: [
                {
                  label: 'Ventas Diarias',
                  data: result.salesTrend.map((t) => t.sales),
                  borderColor: 'rgba(0, 212, 255, 1)',
                  backgroundColor: 'rgba(0, 212, 255, 0.2)',
                  fill: true,
                  tension: 0.4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true },
              },
            },
          })
        );
      }

      // Sellers Chart
      const sellersCanvas = document.querySelector('canvas[#chartSellers]') as HTMLCanvasElement;
      if (sellersCanvas) {
        this.charts.push(
          new Chart(sellersCanvas, {
            type: 'bar',
            data: {
              labels: result.bestSellers.map((s) => s.seller),
              datasets: [
                {
                  label: 'Ingresos',
                  data: result.bestSellers.map((s) => s.revenue),
                  backgroundColor: 'rgba(255, 0, 255, 0.8)',
                  borderColor: 'rgba(255, 0, 255, 1)',
                  borderWidth: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { beginAtZero: true },
              },
            },
          })
        );
      }

      this.addLog('📊 Gráficos generados correctamente', 'info');
    }, 100);
  }

  resetAnalysis(): void {
    this.analysisResult.set(null);
    this.clearArrows();
    this.resetNodes();
    this.progress.set(0);
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
    this.addLog('🔄 Análisis reiniciado', 'info');
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  private addLog(message: string, type: LogEntry['type'], nodeId?: number): void {
    const timestamp = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });

    this.logs.update((logs) => [...logs, { timestamp, message, type, nodeId }]);
  }

  private scrollLogsToBottom(): void {
    const logsContainer = document.querySelector('.logs-content');
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
