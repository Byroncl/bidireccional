# Visualización de Búsqueda Bidireccional en 3D

## 🎯 Características Principales

### 1. **Visualización Interactiva en 3D**

- Grafo en espacio tridimensional con nodos etiquetados (A-L)
- Rotación y zoom de la cámara con controles OrbitControls
- Iluminación y efectos visuales profesionales
- Grid de referencia para mejor orientación espacial
- **🆕 Flechas direccionales 3D** que muestran visualmente el movimiento entre nodos
  - Flechas verdes para movimientos desde el inicio
  - Flechas rojas para movimientos desde el objetivo
  - Flechas azul cyan para el camino final óptimo

### 2. **Selección de Nodos**

Ahora puedes elegir los nodos de inicio y objetivo de 3 formas diferentes:

#### A. **Usando los Selectores Dropdown**

- Selecciona el nodo de inicio desde el primer dropdown
- Selecciona el nodo objetivo desde el segundo dropdown
- Los nodos no pueden ser iguales (se deshabilitan automáticamente)

#### B. **Haciendo Clic en los Nodos 3D**

1. Haz clic en el botón "Seleccionar" junto al dropdown de inicio o objetivo
2. Aparecerá un mensaje en pantalla indicando el modo de selección
3. Haz clic directamente sobre cualquier nodo en el espacio 3D
4. El nodo seleccionado se actualizará automáticamente

#### C. **Botón de Cancelación**

- Si estás en modo de selección y cambias de opinión, puedes cancelar haciendo clic en "Cancelar"

### 3. **Algoritmo de Búsqueda Bidireccional**

- **Búsqueda desde el inicio** (color verde): Explora desde el nodo de inicio
- **Búsqueda desde el objetivo** (color rojo): Explora desde el nodo objetivo
- **Punto de encuentro** (color naranja): Donde ambas búsquedas se encuentran
- **Camino final** (color azul cyan): El camino más corto encontrado

### 4. **Visualización Paso a Paso**

- Observa cómo los nodos cambian de color conforme son visitados
- Verde: Visitados desde el inicio
- Rojo: Visitados desde el objetivo
- Naranja: Punto de encuentro
- Azul cyan: Camino final

### 5. **Control de Velocidad**

- Ajusta la velocidad de la animación (100ms - 2000ms)
- Control deslizante intuitivo
- Ideal para estudiar el algoritmo en detalle o ver una demostración rápida

### 6. **Estadísticas en Tiempo Real**

- Contador de nodos visitados desde el inicio
- Contador de nodos visitados desde el objetivo
- Estado actual de la búsqueda
- Información de los nodos seleccionados

### 7. **Generación de Grafos**

- Genera un nuevo grafo aleatorio con el botón "Nuevo Grafo"
- Los nodos se distribuyen en el espacio 3D
- Conexiones garantizadas entre nodos

### 8. **🆕 Panel de Registro de Movimientos (Logs)**

- **Visualización en tiempo real** de cada movimiento entre nodos
- **Registro detallado** con timestamps (HH:MM:SS)
- **Código de colores por tipo**:
  - 🟢 Movimientos desde inicio (fondo verde claro)
  - 🔴 Movimientos desde objetivo (fondo rojo claro)
  - ⭐ Punto de encuentro (fondo naranja, destacado)
  - 💠 Camino final (fondo azul cyan)
- **Funcionalidades**:
  - ✅ Auto-scroll activable/desactivable
  - 🗑️ Botón para limpiar historial
  - 📜 Scrollbar personalizado
  - ✨ Animaciones suaves de entrada
  - 📊 Estadísticas del camino encontrado

## 🎮 Cómo Usar

1. **Inicia la aplicación**: `npm start`
2. **Selecciona los nodos**:
   - Usa los dropdowns O
   - Haz clic en "Seleccionar" y luego clic en un nodo 3D
3. **Ajusta la velocidad** si lo deseas
4. **Haz clic en "Iniciar Búsqueda"** para ver el algoritmo en acción
5. **Observa** cómo ambas búsquedas se expanden y se encuentran
6. **Reinicia** para probar con los mismos nodos o genera un nuevo grafo

## 🎨 Código de Colores

| Color                  | Significado                       |
| ---------------------- | --------------------------------- |
| 🟢 Verde (#00ff88)     | Nodos y flechas desde el inicio   |
| 🔴 Rojo (#ff4444)      | Nodos y flechas desde el objetivo |
| 🟠 Naranja (#ffaa00)   | Punto de encuentro                |
| 🔵 Azul Cyan (#00d4ff) | Camino final y sus flechas        |
| ⚪ Gris (#888888)      | Nodos no visitados                |
| 🟡 Amarillo (#ffcc00)  | Flechas direccionales             |

## 📋 Registro de Movimientos (Logs)

El panel de logs muestra información detallada en tiempo real:

### Tipos de Mensajes:

- **🎯 Inicio**: Configuración de nodos inicial y objetivo
- **🟢 →**: Cada movimiento desde el nodo inicial (ej: `A → B`)
- **🔴 →**: Cada movimiento desde el nodo objetivo (ej: `L → K`)
- **⭐ Encuentro**: Momento cuando ambas búsquedas se conectan
- **💠 Camino**: Secuencia completa del camino óptimo paso a paso
- **📏 Estadísticas**: Longitud total y métricas del camino
- **✅ Finalización**: Confirmación de búsqueda exitosa

### Características del Panel:

- **Timestamps**: Cada log tiene hora exacta de registro
- **Animaciones**: Los logs aparecen con animación deslizante
- **Auto-scroll**: Sigue automáticamente los últimos movimientos
- **Limpieza**: Botón para resetear el historial cuando lo necesites

## 🔧 Tecnologías Utilizadas

- **Angular 20**: Framework principal
- **Three.js**: Renderizado 3D
- **TypeScript**: Tipado fuerte y seguridad
- **RxJS Signals**: Estado reactivo
- **OrbitControls**: Controles de cámara intuitivos

## 📚 Teoría del Algoritmo

La **búsqueda bidireccional** es una optimización de la búsqueda en anchura (BFS) que:

1. Comienza la búsqueda desde ambos extremos simultáneamente
2. Expande alternadamente desde el inicio y el objetivo
3. Se detiene cuando ambas búsquedas se encuentran
4. Reconstruye el camino completo combinando ambas partes

**Ventaja**: En el mejor caso, reduce la complejidad de O(b^d) a O(b^(d/2)), donde:

- b = factor de ramificación
- d = profundidad de la solución

## 🎯 Características Destacadas Recientes

### ✨ **Flechas Direccionales Animadas**

Las flechas 3D se crean dinámicamente y muestran:

- Dirección exacta del movimiento
- Color según el origen de la búsqueda
- Persistencia visual para análisis
- Grosor y diseño profesional

### 📊 **Sistema de Logs Completo**

El panel de logs incluye:

- **Timestamps precisos** en formato HH:MM:SS
- **Iconos descriptivos** para cada tipo de evento
- **Colores contextuales** según el tipo de movimiento
- **Auto-scroll inteligente** (activable/desactivable)
- **Botón de limpieza** para reiniciar el historial
- **Animaciones suaves** al agregar nuevos logs
- **Scrollbar personalizado** con el tema de la aplicación

### 🔍 **Análisis Visual Mejorado**

Ahora puedes:

- Ver exactamente cómo se propagan las búsquedas
- Seguir el flujo con flechas direccionales
- Leer el historial completo en el panel de logs
- Entender cada decisión del algoritmo paso a paso

## 🚀 Mejoras Futuras Posibles

- [ ] Agregar más algoritmos de búsqueda (A\*, Dijkstra, DFS)
- [ ] Comparación lado a lado de diferentes algoritmos
- [ ] Importar/exportar grafos personalizados
- [ ] Agregar pesos a las aristas
- [ ] Modo de edición de grafos
- [ ] Exportar logs a archivo
- [ ] Estadísticas de rendimiento más detalladas
- [ ] Modo de reproducción paso a paso

## 📸 Ejemplo de Uso

1. **Selecciona nodos**: Usa los dropdowns o haz clic en los nodos 3D
2. **Observa las flechas**: Durante la búsqueda, verás flechas verdes y rojas
3. **Lee los logs**: El panel lateral muestra cada movimiento en detalle
4. **Analiza el resultado**: El camino final se resalta con flechas azules
5. **Experimenta**: Prueba diferentes combinaciones de nodos

---

¡Disfruta explorando el algoritmo de búsqueda bidireccional en 3D con visualización completa! 🎉✨
