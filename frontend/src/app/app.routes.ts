import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/start/start-page').then((m) => m.StartPage),
    title: 'CADA Sovereignty Navigator',
  },
  {
    path: 'assessment/:id',
    children: [
      { path: '', redirectTo: 'toepassingen', pathMatch: 'full' },
      {
        path: 'toepassingen',
        loadComponent: () =>
          import('./pages/toepassingen/toepassingen-page').then(
            (m) => m.ToepassingenPage
          ),
        title: 'Toepassingsprofiel — CADA Sovereignty Navigator',
      },
      {
        path: 'leveranciers',
        loadComponent: () =>
          import('./pages/leveranciers/leveranciers-page').then(
            (m) => m.LeveranciersPage
          ),
        title: 'Leverancierstoets — CADA Sovereignty Navigator',
      },
      {
        path: 'rapport',
        loadComponent: () =>
          import('./pages/rapport/rapport-page').then((m) => m.RapportPage),
        title: 'Gap-rapport & roadmap — CADA Sovereignty Navigator',
      },
      {
        path: 'export',
        loadComponent: () =>
          import('./pages/export/export-page').then((m) => m.ExportPage),
        title: 'Exporteren — CADA Sovereignty Navigator',
      },
    ],
  },
  {
    path: 'niet-gevonden',
    loadComponent: () =>
      import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage),
    title: 'Niet gevonden — CADA Sovereignty Navigator',
  },
  { path: '**', redirectTo: 'niet-gevonden' },
];
