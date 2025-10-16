import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Example {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  features: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <header class="hero">
        <h1>🔍 Algoritmos de Búsqueda Bidireccional</h1>
        <p class="subtitle">
          Visualización interactiva y educativa de búsquedas bidireccionales en diferentes contextos
        </p>
        <div class="info-box">
          <h3>¿Qué es la Búsqueda Bidireccional?</h3>
          <p>
            La búsqueda bidireccional es una técnica de optimización que ejecuta dos búsquedas
            simultáneas: una desde el <strong>punto inicial</strong> y otra desde el
            <strong>punto objetivo</strong>. Ambas búsquedas se encuentran en el medio, reduciendo
            significativamente el tiempo de búsqueda.
          </p>
          <div class="complexity">
            <div class="complexity-item">
              <span class="label">Búsqueda Normal:</span>
              <span class="value">O(b<sup>d</sup>)</span>
            </div>
            <div class="complexity-item">
              <span class="label">Búsqueda Bidireccional:</span>
              <span class="value good">O(b<sup>d/2</sup>)</span>
            </div>
          </div>
        </div>
      </header>

      <section class="examples-section">
        <h2>📚 Selecciona un Ejemplo</h2>
        <div class="examples-grid">
          @for (example of examples; track example.id) {
          <div class="example-card" [style.border-left-color]="example.color">
            <div class="card-icon" [style.color]="example.color">
              {{ example.icon }}
            </div>
            <div class="card-content">
              <h3>{{ example.title }}</h3>
              <p class="description">{{ example.description }}</p>
              <ul class="features">
                @for (feature of example.features; track feature) {
                <li>✓ {{ feature }}</li>
                }
              </ul>
            </div>
            <a [routerLink]="example.route" class="card-button" [style.background]="example.color">
              Explorar →
            </a>
          </div>
          }
        </div>
      </section>

      <section class="how-it-works">
        <h2>🎯 ¿Cómo Funciona?</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h4>Inicio Simultáneo</h4>
            <p>Se inician dos búsquedas: una desde el origen (🟢) y otra desde el destino (🔴)</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h4>Expansión Alternada</h4>
            <p>
              Ambas búsquedas exploran alternadamente sus vecinos, expandiéndose hacia el centro
            </p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h4>Punto de Encuentro</h4>
            <p>Las búsquedas se detienen cuando encuentran un nodo en común (⭐)</p>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <h4>Reconstrucción</h4>
            <p>
              Se combina el camino desde el inicio hasta el encuentro con el camino desde el
              encuentro hasta el objetivo
            </p>
          </div>
        </div>
      </section>

      <section class="advantages">
        <h2>✨ Ventajas del Método Bidireccional</h2>
        <div class="advantages-grid">
          <div class="advantage">
            <span class="advantage-icon">⚡</span>
            <h4>Más Rápido</h4>
            <p>Reduce exponencialmente el tiempo de búsqueda al explorar desde ambos extremos</p>
          </div>
          <div class="advantage">
            <span class="advantage-icon">💾</span>
            <h4>Menos Memoria</h4>
            <p>
              Almacena menos nodos en la cola comparado con una búsqueda unidireccional completa
            </p>
          </div>
          <div class="advantage">
            <span class="advantage-icon">🎯</span>
            <h4>Más Eficiente</h4>
            <p>Ideal para grafos grandes donde se conocen ambos extremos del camino</p>
          </div>
          <div class="advantage">
            <span class="advantage-icon">🔄</span>
            <h4>Simétrico</h4>
            <p>Aprovecha la simetría del problema para optimizar la exploración</p>
          </div>
        </div>
      </section>

      <footer class="footer">
        <p>💡 Desarrollado con Angular 20 + Three.js | Algoritmos de IA</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .home-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        color: #eee;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .hero {
        text-align: center;
        padding: 60px 20px 40px;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 2px solid #00d4ff;
      }

      h1 {
        font-size: 3em;
        margin: 0;
        background: linear-gradient(135deg, #00d4ff, #667eea);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .subtitle {
        font-size: 1.3em;
        color: #aaa;
        margin: 20px 0;
      }

      .info-box {
        max-width: 800px;
        margin: 40px auto;
        background: rgba(15, 52, 96, 0.5);
        padding: 30px;
        border-radius: 12px;
        border: 2px solid #00d4ff;
        text-align: left;
      }

      .info-box h3 {
        color: #00d4ff;
        margin-top: 0;
        font-size: 1.5em;
      }

      .info-box p {
        line-height: 1.8;
        font-size: 1.1em;
      }

      .complexity {
        display: flex;
        gap: 30px;
        margin-top: 20px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .complexity-item {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .complexity-item .label {
        color: #aaa;
        font-size: 0.9em;
      }

      .complexity-item .value {
        font-size: 1.5em;
        font-weight: bold;
        color: #ff6b6b;
      }

      .complexity-item .value.good {
        color: #00ff88;
      }

      .examples-section {
        padding: 60px 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .examples-section h2 {
        text-align: center;
        font-size: 2.5em;
        margin-bottom: 50px;
        color: #00d4ff;
      }

      .examples-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 40px;
        padding: 0 20px;
      }

      .example-card {
        background: rgba(22, 33, 62, 0.8);
        border-radius: 16px;
        padding: 30px;
        border-left: 5px solid;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .example-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 30px rgba(0, 212, 255, 0.3);
      }

      .card-icon {
        font-size: 4em;
        text-align: center;
        margin-bottom: 20px;
      }

      .card-content {
        flex: 1;
      }

      .card-content h3 {
        font-size: 1.8em;
        margin: 0 0 15px 0;
        color: #fff;
      }

      .description {
        color: #ccc;
        line-height: 1.6;
        margin-bottom: 20px;
        font-size: 1.05em;
      }

      .features {
        list-style: none;
        padding: 0;
        margin: 20px 0;
      }

      .features li {
        padding: 8px 0;
        color: #aaa;
        font-size: 0.95em;
      }

      .card-button {
        display: block;
        text-align: center;
        padding: 15px;
        border-radius: 8px;
        color: white;
        text-decoration: none;
        font-weight: bold;
        font-size: 1.1em;
        transition: all 0.3s ease;
        margin-top: 20px;
      }

      .card-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
      }

      .how-it-works {
        padding: 60px 20px;
        background: rgba(0, 0, 0, 0.3);
      }

      .how-it-works h2 {
        text-align: center;
        font-size: 2.5em;
        margin-bottom: 50px;
        color: #00d4ff;
      }

      .steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 30px;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .step {
        background: rgba(22, 33, 62, 0.6);
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        border: 2px solid rgba(0, 212, 255, 0.3);
        transition: all 0.3s ease;
      }

      .step:hover {
        border-color: #00d4ff;
        transform: translateY(-5px);
      }

      .step-number {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8em;
        font-weight: bold;
        margin: 0 auto 20px;
      }

      .step h4 {
        color: #00d4ff;
        margin: 15px 0;
        font-size: 1.3em;
      }

      .step p {
        color: #ccc;
        line-height: 1.6;
      }

      .advantages {
        padding: 60px 20px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .advantages h2 {
        text-align: center;
        font-size: 2.5em;
        margin-bottom: 50px;
        color: #00d4ff;
      }

      .advantages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 30px;
        padding: 0 20px;
      }

      .advantage {
        background: rgba(22, 33, 62, 0.6);
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        border: 2px solid rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
      }

      .advantage:hover {
        border-color: #667eea;
        transform: scale(1.05);
      }

      .advantage-icon {
        font-size: 3em;
        display: block;
        margin-bottom: 15px;
      }

      .advantage h4 {
        color: #00d4ff;
        margin: 15px 0;
        font-size: 1.4em;
      }

      .advantage p {
        color: #ccc;
        line-height: 1.6;
      }

      .footer {
        text-align: center;
        padding: 40px 20px;
        background: rgba(0, 0, 0, 0.5);
        border-top: 2px solid #00d4ff;
        color: #aaa;
      }

      @media (max-width: 768px) {
        h1 {
          font-size: 2em;
        }

        .subtitle {
          font-size: 1.1em;
        }

        .examples-grid {
          grid-template-columns: 1fr;
        }

        .steps {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class HomeComponent {
  examples: Example[] = [
    {
      id: 'graph-3d',
      title: 'Grafo 3D Abstracto',
      description:
        'Visualiza la búsqueda bidireccional en un grafo tridimensional abstracto con nodos conectados. Perfecto para entender el algoritmo puro.',
      icon: '🌐',
      route: '/bidirectional-search-3d',
      color: '#00ff88',
      features: [
        'Nodos 3D interactivos',
        'Selección manual de inicio y objetivo',
        'Flechas direccionales animadas',
        'Panel de logs detallado',
        'Control de velocidad',
        'Generación de grafos aleatorios',
      ],
    },
    {
      id: 'maze',
      title: 'Laberinto 2D (Canvas)',
      description:
        'Encuentra el camino más corto en un laberinto 2D usando búsqueda bidireccional. Visualiza cómo ambas búsquedas se encuentran en el medio.',
      icon: '🎯',
      route: '/maze-bidirectional',
      color: '#ff6b6b',
      features: [
        'Laberinto 2D interactivo',
        'Generación aleatoria de laberintos',
        'Visualización paso a paso',
        'Comparación con búsqueda normal',
        'Estadísticas de rendimiento',
        'Dibujo manual de obstáculos',
      ],
    },
    {
      id: 'maze-3d',
      title: 'Laberinto 3D Multi-nivel',
      description:
        'Explora un laberinto 3D con múltiples niveles. Cada nodo es una esfera que se conecta en 6 direcciones. ¡La evolución del laberinto tradicional!',
      icon: '🎲',
      route: '/maze-3d',
      color: '#667eea',
      features: [
        'Laberinto 3D con nodos esféricos',
        'Múltiples niveles (hasta 5 pisos)',
        'Conexiones en 6 direcciones',
        'Click para alternar muros',
        'Shift+Click mover inicio',
        'Ctrl+Click mover objetivo',
        'Flechas 3D direccionales',
        'Visualización de conexiones opcional',
      ],
    },
    {
      id: 'sales-analysis',
      title: 'Análisis de Ventas (Data Mining)',
      description:
        'Aplica búsqueda bidireccional al análisis de datos de ventas. Procesa información desde fecha inicio y fin simultáneamente, visualizando el flujo con nodos 3D y gráficos estadísticos.',
      icon: '📊',
      route: '/sales-analysis',
      color: '#ff00ff',
      features: [
        'Procesamiento bidireccional de datos',
        'Árbol 3D del flujo de análisis',
        'Gráficos interactivos (Chart.js)',
        'Análisis de ventas por productos',
        'Métricas por categorías y regiones',
        'Tendencias temporales',
        'Top vendedores',
        'Logs detallados del proceso',
      ],
    },
  ];
}
