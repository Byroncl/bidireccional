import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'bidirectional-search-3d',
    pathMatch: 'full',
  },
  {
    path: 'bidirectional-search-3d',
    loadComponent: () =>
      import('./features/bidirectional-search-3d/bidirectional-search-3d.component').then(
        (m) => m.BidirectionalSearch3dComponent
      ),
  },
];
