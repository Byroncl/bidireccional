import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'bidirectional-search-3d',
    loadComponent: () =>
      import('./features/bidirectional-search-3d/bidirectional-search-3d.component').then(
        (m) => m.BidirectionalSearch3dComponent
      ),
  },
  {
    path: 'maze-bidirectional',
    loadComponent: () =>
      import('./features/maze-bidirectional/maze-bidirectional.component').then(
        (m) => m.MazeBidirectionalComponent
      ),
  },
  {
    path: 'maze-3d',
    loadComponent: () =>
      import('./features/maze-3d/maze-3d.component').then((m) => m.Maze3dComponent),
  },
  {
    path: 'sales-analysis',
    loadComponent: () =>
      import('./features/sales-analysis/sales-analysis.component').then(
        (m) => m.SalesAnalysisComponent
      ),
  },
];
