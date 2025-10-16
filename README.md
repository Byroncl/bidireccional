# 🔍 Ejemplos de Búsqueda Bidireccional en Angular

Aplicación interactiva que demuestra visualmente el algoritmo de **búsqueda bidireccional** en dos contextos diferentes:

1. **🎨 Grafo 3D Abstracto** - Visualización de nodos en Three.js
2. **🎯 Laberinto (Maze)** - Pathfinding en grid 2D

## ✨ Características Principales

### 🎨 Ejemplo 1: Grafo 3D Abstracto

- Visualización 3D interactiva con **Three.js**
- 12 nodos conectados en espacio 3D
- **Selección de nodos:** Click 3D o dropdown
- **Flechas direccionales:** Visualización del recorrido
- **Sistema de logs:** Seguimiento en tiempo real
- **Control de velocidad:** Ajustable de 100ms a 2000ms
- **Estadísticas detalladas:** Nodos visitados desde cada dirección

### 🎯 Ejemplo 2: Laberinto 2D (Canvas)

- Grid 2D con canvas HTML5
- **Generación aleatoria** de laberintos
- **Dibujo interactivo** de muros (drag & drop)
- **Movimiento de inicio/objetivo** con modificadores (Shift/Ctrl)
- **Visualización bidireccional:** Expansión desde ambos extremos
- **Comparación con BFS unidireccional:** Métricas de eficiencia
- **Tamaños ajustables:** 15x15, 25x25, 35x35

### 🎲 Ejemplo 3: Laberinto 3D Multi-nivel ⭐ NUEVO

- **Nodos esféricos en 3D** con Three.js
- **Múltiples niveles** (3-5 pisos verticales)
- **6 direcciones de movimiento** (↑↓←→⬆️⬇️)
- **Click interactivo:** Alternar muros, mover inicio/objetivo
- **Densidad ajustable:** 0%-40% de obstáculos
- **Visualización de conexiones** entre nodos (opcional)
- **Flechas 3D direccionales** con colores
- **OrbitControls:** Rotar, zoom, pan de cámara
- **Tamaños:** 5x5x3 (75 nodos), 7x7x3 (147 nodos), 9x9x5 (405 nodos)

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/ejemplos-bidireccionales.git

# Instalar dependencias
cd examples-ai
npm install
```

### Servidor de Desarrollo

```bash
ng serve
```

Abre tu navegador en `http://localhost:4200/` para ver la aplicación.

## 📋 Navegación

### Home (/)

Página principal con:

- Tarjetas de selección de 3 ejemplos
- Explicación de búsqueda bidireccional
- Comparación de complejidad: O(b^d) → O(b^(d/2))
- Ventajas y casos de uso

### Grafo 3D (/bidirectional-search-3d)

- Visualización en Three.js
- Nodos interactivos en 3D
- Flechas de dirección (verde, roja, cyan)
- Logs con timestamps

### Laberinto 2D (/maze-bidirectional)

- Grid 2D con canvas
- Generación y dibujo de muros
- Visualización bidireccional
- Estadísticas comparativas

### Laberinto 3D (/maze-3d) ⭐ NUEVO

- Nodos esféricos en espacio 3D
- Múltiples niveles verticales
- Conexiones en 6 direcciones
- Interacción con Raycasting
- Flechas y líneas de conexión

## 🧮 Algoritmo de Búsqueda Bidireccional

### ¿Qué es?

La búsqueda bidireccional ejecuta **dos búsquedas BFS simultáneas**:

- 🟢 **Forward:** Desde el nodo/celda de inicio
- 🔴 **Backward:** Desde el nodo/celda objetivo

### ¿Por qué es más eficiente?

#### Complejidad Temporal

```
BFS Unidireccional:  O(b^d)
BFS Bidireccional:   O(2 × b^(d/2)) ≈ O(b^(d/2))
```

Donde:

- `b` = factor de ramificación
- `d` = profundidad de la solución

#### Ejemplo Numérico

Para `b=3` y `d=10`:

- **Unidireccional:** 3^10 = 59,049 nodos
- **Bidireccional:** 2 × 3^5 = 486 nodos
- **Mejora:** 99.2% menos nodos explorados! 🚀

### Ventajas

✅ **Velocidad exponencialmente mejor** en grafos/laberintos grandes  
✅ **Uso eficiente de memoria** (dos colas pequeñas vs una cola enorme)  
✅ **Óptimo** para encontrar el camino más corto  
✅ **Ideal para problemas simétricos** donde origen y destino son conocidos

## 📚 Documentación Adicional

- **[CARACTERISTICAS.md](./CARACTERISTICAS.md)** - Lista completa de características
- **[NUEVAS-FUNCIONES.md](./NUEVAS-FUNCIONES.md)** - Documentación de flechas y logs
- **[LABERINTO-EXPLICACION.md](./LABERINTO-EXPLICACION.md)** - Explicación detallada del laberinto 2D
- **[LABERINTO-3D-EXPLICACION.md](./LABERINTO-3D-EXPLICACION.md)** - Explicación del laberinto 3D multi-nivel ⭐

## 🛠️ Tecnologías Utilizadas

- **Angular 20.2.0** - Framework principal
- **Three.js 0.180.0** - Visualización 3D
- **TypeScript 5.9.2** - Lenguaje de programación
- **RxJS Signals** - Gestión de estado reactivo
- **Canvas API** - Renderizado 2D para el laberinto
- **Angular SSR** - Renderizado del lado del servidor

## 📦 Construcción

Para construir el proyecto:

```bash
ng build
```

Los artefactos de construcción se almacenarán en el directorio `dist/`.

## 🧪 Testing

Ejecutar pruebas unitarias:

```bash
ng test
```

## 🎯 Casos de Uso Reales

1. **Navegación GPS** - Google Maps, Waze
2. **Videojuegos** - Pathfinding para NPCs
3. **Robótica** - Navegación en almacenes automatizados
4. **Redes de transporte** - Planificación de rutas
5. **Sistemas de evacuación** - Rutas de escape en edificios

## 📖 Referencias

- [Introduction to Algorithms - Cormen et al.](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/)
- [Artificial Intelligence: A Modern Approach - Russell & Norvig](http://aima.cs.berkeley.edu/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Angular Documentation](https://angular.dev/)

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ para demostrar visualmente la eficiencia de la búsqueda bidireccional.

---

_Proyecto generado con [Angular CLI](https://github.com/angular/angular-cli) version 20.2.2_
