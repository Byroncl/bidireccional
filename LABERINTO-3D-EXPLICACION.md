# 🎲 Laberinto 3D Multi-nivel con Nodos - Búsqueda Bidireccional

## 🌟 Visión General

El **Laberinto 3D Multi-nivel** es una evolución tridimensional del concepto tradicional de laberintos. En lugar de un grid 2D plano, este laberinto se extiende en **tres dimensiones** con múltiples niveles, donde cada celda es representada por un **nodo esférico** que puede conectarse con sus vecinos en **6 direcciones**.

---

## 🎯 ¿Qué lo Hace Especial?

### Innovación: Combinación de Conceptos

Este ejemplo **combina las mejores características** de los dos ejemplos anteriores:

1. **Del Grafo 3D Abstracto:**

   - Visualización 3D con Three.js
   - Nodos como esferas interactivas
   - Flechas direccionales animadas
   - Control de cámara OrbitControls
   - Efectos de iluminación y materiales

2. **Del Laberinto 2D:**

   - Estructura de grid organizada
   - Generación aleatoria de obstáculos
   - Algoritmo BFS bidireccional
   - Estadísticas comparativas
   - Interacción mediante clicks

3. **Características Únicas:**
   - **Múltiples niveles verticales** (3-5 pisos)
   - **Conexiones en 6 direcciones** (arriba, abajo, adelante, atrás, izquierda, derecha)
   - **Densidad de muros ajustable** (0% - 40%)
   - **Visualización opcional de conexiones** entre nodos
   - **Tamaños escalables** (5x5x3, 7x7x3, 9x9x5)

---

## 🧩 Estructura del Laberinto 3D

### Representación de Nodos

Cada nodo en el laberinto 3D tiene las siguientes propiedades:

```typescript
interface Node3D {
  id: string; // Identificador único "level-row-col"
  position: THREE.Vector3; // Posición 3D en el espacio
  mesh: THREE.Mesh; // Esfera visual
  row: number; // Fila en el grid
  col: number; // Columna en el grid
  level: number; // Nivel/piso (altura)
  isWall: boolean; // ¿Es un obstáculo?
  isStart: boolean; // ¿Es el punto de inicio?
  isGoal: boolean; // ¿Es el objetivo?
  visitedFromStart: boolean; // Visitado desde inicio
  visitedFromGoal: boolean; // Visitado desde objetivo
  isMeeting: boolean; // ¿Punto de encuentro?
  isPath: boolean; // ¿Parte del camino final?
  neighbors: Node3D[]; // Nodos vecinos conectados
  parentFromStart?: Node3D; // Padre en búsqueda desde inicio
  parentFromGoal?: Node3D; // Padre en búsqueda desde objetivo
}
```

### Conexiones en 6 Direcciones

A diferencia del laberinto 2D (4 direcciones), el laberinto 3D permite movimiento en **6 direcciones**:

```typescript
const directions = [
  { dLevel: 1, dRow: 0, dCol: 0 }, // ⬆️ Arriba (subir nivel)
  { dLevel: -1, dRow: 0, dCol: 0 }, // ⬇️ Abajo (bajar nivel)
  { dLevel: 0, dRow: -1, dCol: 0 }, // ⬆️ Adelante
  { dLevel: 0, dRow: 1, dCol: 0 }, // ⬇️ Atrás
  { dLevel: 0, dRow: 0, dCol: -1 }, // ⬅️ Izquierda
  { dLevel: 0, dRow: 0, dCol: 1 }, // ➡️ Derecha
];
```

**Ventaja:** Permite encontrar caminos **más creativos** que pueden subir/bajar niveles para evitar obstáculos.

---

## 🎮 Interacción del Usuario

### 1. Click Simple en Nodo

**Acción:** Alternar entre muro y espacio libre

```typescript
onClick(node) {
  if (!node.isStart && !node.isGoal) {
    node.isWall = !node.isWall;
    updateNodeColor(node);
  }
}
```

**Uso:** Crear o eliminar obstáculos manualmente

### 2. Shift + Click

**Acción:** Mover el punto de inicio

```typescript
onShiftClick(node) {
  startNode.isStart = false;
  node.isStart = true;
  node.isWall = false;
  startNode = node;
}
```

**Uso:** Cambiar la posición inicial de la búsqueda

### 3. Ctrl + Click

**Acción:** Mover el punto objetivo

```typescript
onCtrlClick(node) {
  goalNode.isGoal = false;
  node.isGoal = true;
  node.isWall = false;
  goalNode = node;
}
```

**Uso:** Cambiar el destino de la búsqueda

### 4. Controles de Cámara (OrbitControls)

| Acción                          | Efecto                               |
| ------------------------------- | ------------------------------------ |
| **Click izquierdo + arrastrar** | Rotar cámara alrededor del laberinto |
| **Rueda del mouse**             | Zoom in/out                          |
| **Click derecho + arrastrar**   | Pan (mover vista lateralmente)       |
| **Botón "Resetear Cámara"**     | Volver a vista inicial               |

---

## 🔄 Algoritmo BFS Bidireccional en 3D

### Paso 1: Inicialización

```typescript
const queueFromStart: Node3D[] = [startNode];
const queueFromGoal: Node3D[] = [goalNode];

startNode.visitedFromStart = true;
goalNode.visitedFromGoal = true;
```

### Paso 2: Expansión Simultánea

```typescript
while (queueFromStart.length > 0 || queueFromGoal.length > 0) {
  // Expandir desde inicio (🟢)
  if (queueFromStart.length > 0) {
    const current = queueFromStart.shift();

    for (const neighbor of current.neighbors) {
      if (!neighbor.visitedFromStart && !neighbor.isWall) {
        neighbor.visitedFromStart = true;
        neighbor.parentFromStart = current;
        queueFromStart.push(neighbor);

        createArrow(current, neighbor, GREEN);

        // ⭐ Verificar encuentro
        if (neighbor.visitedFromGoal) {
          meetingNode = neighbor;
          break;
        }
      }
    }
  }

  // Expandir desde objetivo (🔴)
  if (queueFromGoal.length > 0) {
    const current = queueFromGoal.shift();

    for (const neighbor of current.neighbors) {
      if (!neighbor.visitedFromGoal && !neighbor.isWall) {
        neighbor.visitedFromGoal = true;
        neighbor.parentFromGoal = current;
        queueFromGoal.push(neighbor);

        createArrow(current, neighbor, RED);

        // ⭐ Verificar encuentro
        if (neighbor.visitedFromStart) {
          meetingNode = neighbor;
          break;
        }
      }
    }
  }
}
```

### Paso 3: Reconstrucción del Camino 3D

```typescript
function reconstructPath(meetingNode: Node3D): Node3D[] {
  const path: Node3D[] = [];

  // Desde inicio hasta encuentro
  let current: Node3D | undefined = meetingNode;
  while (current) {
    path.unshift(current); // Agregar al inicio
    current = current.parentFromStart;
  }

  // Desde encuentro hasta objetivo
  current = meetingNode.parentFromGoal;
  while (current) {
    path.push(current); // Agregar al final
    current = current.parentFromGoal;
  }

  return path;
}
```

---

## 🎨 Sistema de Colores y Materiales

### Paleta de Colores

| Estado                  | Color           | Código Hex | Emissive Intensity |
| ----------------------- | --------------- | ---------- | ------------------ |
| **Normal**              | Gris            | `0x4a5568` | 0.1                |
| **Inicio**              | Verde brillante | `0x00ff88` | 0.5                |
| **Objetivo**            | Rojo brillante  | `0xff4444` | 0.5                |
| **Muro**                | Gris oscuro     | `0x2a2a3e` | 0.1                |
| **Visitado (inicio)**   | Verde           | `0x00ff88` | 0.2                |
| **Visitado (objetivo)** | Rojo            | `0xff4444` | 0.2                |
| **Encuentro**           | Naranja         | `0xffaa00` | 0.7                |
| **Camino final**        | Cyan            | `0x00d4ff` | 0.6                |

### Materiales Three.js

```typescript
const material = new THREE.MeshStandardMaterial({
  color: color, // Color base
  emissive: emissiveColor, // Color de emisión (brillo)
  emissiveIntensity: intensity, // Intensidad del brillo
  metalness: 0.5, // Aspecto metálico
  roughness: 0.5, // Rugosidad de la superficie
});
```

**Efecto:** Los nodos **brillan** según su estado, haciendo fácil distinguir:

- ✨ Inicio y objetivo son muy brillantes
- 🌟 Punto de encuentro tiene el brillo máximo
- 💫 Camino final brilla en cyan
- 🌑 Muros son oscuros y opacos

---

## 📊 Configuraciones Disponibles

### Tamaños del Laberinto

| Opción      | Grid | Niveles | Total Nodos | Complejidad |
| ----------- | ---- | ------- | ----------- | ----------- |
| **Pequeño** | 5x5  | 3       | 75          | Baja        |
| **Mediano** | 7x7  | 3       | 147         | Media       |
| **Grande**  | 9x9  | 5       | 405         | Alta        |

### Densidad de Muros

- **0%** - Sin obstáculos (camino directo)
- **10%** - Obstáculos mínimos
- **20%** - Balance recomendado
- **30%** - Laberinto desafiante
- **40%** - Muy denso (puede no tener solución)

**Recomendación:** 20% ofrece un buen balance entre dificultad y garantía de solución.

### Velocidad de Búsqueda

- **50ms** - Muy rápido (difícil de seguir)
- **200ms** - Rápido (recomendado para demostración)
- **500ms** - Medio (bueno para análisis)
- **1000ms** - Lento (paso a paso detallado)

---

## 🚀 Ventajas del Laberinto 3D

### 1. Mayor Complejidad Espacial

En un laberinto 2D de 7x7, tienes **49 celdas**.
En un laberinto 3D de 7x7x3, tienes **147 nodos** (3 veces más).

**Resultado:** Problemas más desafiantes y realistas

### 2. Caminos Más Creativos

Con 6 direcciones en lugar de 4, el algoritmo puede:

- Subir niveles para evitar muros
- Bajar niveles para encontrar atajos
- Combinar movimientos horizontales y verticales

### 3. Mejor Representación de Problemas Reales

Muchos problemas del mundo real son tridimensionales:

- **Drones** navegando en el aire (altura variable)
- **Robots submarinos** explorando océanos
- **Edificios inteligentes** con múltiples pisos
- **Videojuegos** con mundos 3D

### 4. Visualización Impactante

La visualización 3D con Three.js:

- Es visualmente atractiva
- Permite rotación para ver desde cualquier ángulo
- Muestra claramente las conexiones entre niveles
- Usa iluminación para resaltar estados

---

## 📈 Análisis de Complejidad en 3D

### Factor de Ramificación

- **2D (4 direcciones):** b = 4
- **3D (6 direcciones):** b = 6

### Impacto en Complejidad

Para profundidad d = 5:

| Método             | 2D (b=4)     | 3D (b=6)      | Ratio |
| ------------------ | ------------ | ------------- | ----- |
| **Unidireccional** | 4^5 = 1,024  | 6^5 = 7,776   | 7.6x  |
| **Bidireccional**  | 2×4^2.5 ≈ 64 | 2×6^2.5 ≈ 294 | 4.6x  |

**Conclusión:** La búsqueda bidireccional es **aún más valiosa** en 3D porque el espacio de búsqueda crece más rápido.

### Mejora de Eficiencia

```
Reducción 2D: 1,024 → 64 (16x mejor)
Reducción 3D: 7,776 → 294 (26x mejor)
```

¡La búsqueda bidireccional es **MÁS efectiva** en espacios 3D! 🚀

---

## 🎓 Casos de Uso del Mundo Real

### 1. Navegación Aérea de Drones

```typescript
// Ejemplo: Drone entregando paquete
const dronePosition = { level: 5, row: 3, col: 2 };
const deliveryPoint = { level: 2, row: 8, col: 7 };
const obstacles = buildingsInCity;

const path = bidirectionalSearch3D(dronePosition, deliveryPoint, obstacles);
```

**Ventaja:** El drone puede subir/bajar para evitar edificios

### 2. Robots en Almacenes Multi-piso

```typescript
// Ejemplo: Robot Amazon en almacén de 5 pisos
const robotLocation = { level: 1, row: 0, col: 0 };
const packageLocation = { level: 4, row: 10, col: 12 };
const shelves = warehouseObstacles;

const route = findShortestPath3D(robotLocation, packageLocation, shelves);
```

**Ventaja:** El robot puede usar escaleras/elevadores para optimizar la ruta

### 3. Videojuegos 3D (Pathfinding de NPCs)

```typescript
// Ejemplo: Enemigo persiguiendo jugador en nivel multi-piso
const enemyPos = { level: 2, row: 5, col: 5 };
const playerPos = { level: 3, row: 10, col: 8 };
const walls = gameMap.obstacles;

const chasePath = bidirectionalPathfinding(enemyPos, playerPos, walls);
```

**Ventaja:** El NPC puede usar escaleras, plataformas, saltos

### 4. Planificación de Evacuación en Edificios

```typescript
// Ejemplo: Ruta de evacuación desde oficina a salida
const officeLocation = { level: 8, row: 12, col: 15 };
const emergencyExit = { level: 0, row: 0, col: 0 };
const blockedAreas = fireLocations;

const evacuationRoute = findEvacuationPath(officeLocation, emergencyExit, blockedAreas);
```

**Ventaja:** Encuentra la ruta más rápida considerando escaleras y pisos bloqueados

---

## 💡 Características Técnicas Avanzadas

### 1. Raycasting para Selección de Nodos

```typescript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onCanvasClick(event: MouseEvent) {
  // Convertir coordenadas de pantalla a coordenadas normalizadas
  mouse.x = (event.clientX / canvas.width) * 2 - 1;
  mouse.y = -(event.clientY / canvas.height) * 2 + 1;

  // Lanzar rayo desde cámara
  raycaster.setFromCamera(mouse, camera);

  // Detectar intersecciones con nodos
  const intersects = raycaster.intersectObjects(nodes.map((n) => n.mesh));

  if (intersects.length > 0) {
    const clickedNode = findNodeByMesh(intersects[0].object);
    handleNodeClick(clickedNode);
  }
}
```

**Resultado:** Click preciso en cualquier nodo visible

### 2. Sistema de Iluminación Dinámico

```typescript
// Luz ambiental suave
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

// Luz direccional (simula sol)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);

// Luces de punto con colores (efectos de neón)
const pointLight1 = new THREE.PointLight(0x667eea, 1, 50);
const pointLight2 = new THREE.PointLight(0x764ba2, 1, 50);
```

**Resultado:** Ambiente visual atractivo y futurista

### 3. Flechas Direccionales 3D

```typescript
function createArrow(from: Node3D, to: Node3D, color: number) {
  const direction = new THREE.Vector3().subVectors(to.position, from.position).normalize();

  const length = from.position.distanceTo(to.position);

  const arrow = new THREE.ArrowHelper(
    direction, // Dirección normalizada
    from.position, // Punto de origen
    length, // Longitud de la flecha
    color, // Color
    length * 0.2, // Tamaño de la punta
    length * 0.15 // Ancho de la punta
  );

  scene.add(arrow);
  arrows.push(arrow);
}
```

**Resultado:** Visualización clara del flujo de búsqueda

### 4. Líneas de Conexión Opcionales

```typescript
function drawConnections() {
  for (const node of nodes) {
    if (node.isWall) continue;

    for (const neighbor of node.neighbors) {
      if (neighbor.isWall) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints([node.position, neighbor.position]);

      const material = new THREE.LineBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.2,
      });

      const line = new THREE.Line(geometry, material);
      scene.add(line);
      connectionLines.push(line);
    }
  }
}
```

**Resultado:** Visualiza la estructura de conectividad del grafo

---

## 🎯 Guía de Uso Paso a Paso

### Paso 1: Generar Laberinto

1. Selecciona tamaño (5x5x3, 7x7x3, 9x9x5)
2. Ajusta densidad de muros (recomendado: 20%)
3. Click en **"🎲 Generar Laberinto"**

**Resultado:** Laberinto aleatorio con inicio (🟢) y objetivo (🔴)

### Paso 2: Personalizar (Opcional)

- **Click en nodo:** Alternar muro ⬛ / espacio libre
- **Shift + Click:** Mover inicio 🟢
- **Ctrl + Click:** Mover objetivo 🔴
- **Checkbox "Mostrar Conexiones":** Ver líneas entre nodos

### Paso 3: Configurar Búsqueda

- Ajusta velocidad (50-1000ms)
- Rota la cámara para mejor vista
- Prepara el panel de logs

### Paso 4: Ejecutar

1. Click en **"▶️ Iniciar Búsqueda"**
2. Observa la expansión verde (inicio) y roja (objetivo)
3. Espera el punto de encuentro naranja (⭐)
4. Ve el camino final en cyan (💠)

### Paso 5: Analizar

- Revisa estadísticas:

  - Nodos explorados desde inicio
  - Nodos explorados desde objetivo
  - Total explorado
  - Longitud del camino
  - Tiempo transcurrido

- Lee los logs:
  - Eventos con timestamps
  - Dirección de cada expansión
  - Punto de encuentro
  - Reconstrucción del camino

### Paso 6: Experimentar

- Click en **"🔄 Reiniciar"** para otra búsqueda
- Genera nuevo laberinto
- Cambia configuraciones
- Compara resultados

---

## 📚 Comparación: 2D vs 3D

| Característica             | Laberinto 2D | Laberinto 3D                 |
| -------------------------- | ------------ | ---------------------------- |
| **Dimensiones**            | 2D (X, Y)    | 3D (X, Y, Z)                 |
| **Direcciones**            | 4 (↑↓←→)     | 6 (↑↓←→⬆️⬇️)                 |
| **Representación**         | Canvas 2D    | Three.js 3D                  |
| **Factor de Ramificación** | 4            | 6                            |
| **Complejidad Visual**     | Simple       | Alta                         |
| **Rotación de Vista**      | No           | Sí                           |
| **Realismo**               | Abstracto    | Espacial                     |
| **Niveles**                | 1            | 3-5                          |
| **Interacción**            | Click 2D     | Raycasting 3D                |
| **Casos de Uso**           | Mapas planos | Drones, edificios, juegos 3D |

**Conclusión:** El laberinto 3D es más complejo, visualmente impactante, y representa mejor problemas del mundo real.

---

## 🔧 Detalles de Implementación

### Geometría de Nodos

```typescript
const geometry = new THREE.SphereGeometry(
  0.3, // Radio de la esfera
  16, // Segmentos horizontales (suavidad)
  16 // Segmentos verticales (suavidad)
);
```

### Espaciado del Grid

```typescript
const spacing = 2; // Distancia entre nodos
const offset = ((gridSize - 1) * spacing) / 2; // Centrar en origen

for (let level = 0; level < levels; level++) {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const position = new THREE.Vector3(
        col * spacing - offset, // X
        level * spacing, // Y (altura)
        row * spacing - offset // Z
      );
      // Crear nodo en esta posición...
    }
  }
}
```

### Optimización de Renderizado

```typescript
// Enable damping para movimiento suave
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Limitar distancia de cámara
controls.minDistance = 10;
controls.maxDistance = 50;

// Limitar ángulo polar (evitar ir debajo del suelo)
controls.maxPolarAngle = Math.PI / 1.5;

// Antialiasing para bordes suaves
renderer = new THREE.WebGLRenderer({ antialias: true });
```

---

## 🎊 Conclusión

El **Laberinto 3D Multi-nivel con Nodos** representa la culminación de todos los conceptos aprendidos:

✅ **Visualización 3D avanzada** con Three.js  
✅ **Algoritmo BFS bidireccional** en 3 dimensiones  
✅ **Interacción intuitiva** con raycasting  
✅ **Configuración flexible** de tamaño y densidad  
✅ **Estadísticas detalladas** y sistema de logs  
✅ **Aplicaciones prácticas** en drones, robótica, videojuegos

Este ejemplo demuestra cómo la **búsqueda bidireccional** escala perfectamente a problemas tridimensionales complejos, manteniendo su eficiencia exponencial incluso cuando el factor de ramificación aumenta de 4 a 6.

---

## 📖 Referencias Técnicas

- **Three.js Documentation:** https://threejs.org/docs/
- **OrbitControls:** https://threejs.org/docs/#examples/en/controls/OrbitControls
- **Raycaster:** https://threejs.org/docs/#api/en/core/Raycaster
- **ArrowHelper:** https://threejs.org/docs/#api/en/helpers/ArrowHelper
- **BFS Algorithm:** Cormen et al., "Introduction to Algorithms"
- **3D Pathfinding:** Harabor, D., & Grastien, A. (2012). "The JPS Pathfinding System"

---

_Desarrollado con ❤️ para demostrar la potencia de la búsqueda bidireccional en espacios tridimensionales_
