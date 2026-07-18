import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/start/start-page').then((m) => m.StartPage),
  },
  {
    path: 'dossiers',
    loadComponent: () => import('./features/dossiers/dossiers-page').then((m) => m.DossiersPage),
  },
  {
    path: 'beheer/leveranciers',
    loadComponent: () =>
      import('./features/beheer/leveranciers-beheer-page').then((m) => m.LeveranciersBeheerPage),
  },
  {
    path: 'assessment/:id/toepassingen',
    loadComponent: () =>
      import('./features/toepassingen/toepassingen-page').then((m) => m.ToepassingenPage),
  },
  {
    path: 'assessment/:id/leveranciers',
    loadComponent: () =>
      import('./features/leveranciers/leveranciers-page').then((m) => m.LeveranciersPage),
  },
  {
    path: 'assessment/:id/rapport',
    loadComponent: () => import('./features/rapport/rapport-page').then((m) => m.RapportPage),
  },
  {
    path: 'assessment/:id/export',
    loadComponent: () => import('./features/export/export-page').then((m) => m.ExportPage),
  },
  { path: '**', redirectTo: '' },
];
