import { Routes } from '@angular/router';

import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'login/verify',
    loadComponent: () => import('./features/auth/verify-page').then((m) => m.VerifyPage),
  },
  {
    // Alleen-lezen deellink; bewust zonder authGuard.
    path: 'delen/:token',
    loadComponent: () =>
      import('./features/delen/gedeeld-rapport-page').then((m) => m.GedeeldRapportPage),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./features/start/start-page').then((m) => m.StartPage),
  },
  {
    path: 'dossiers',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dossiers/dossiers-page').then((m) => m.DossiersPage),
  },
  {
    path: 'beheer/leveranciers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/beheer/leveranciers-beheer-page').then((m) => m.LeveranciersBeheerPage),
  },
  {
    path: 'assessment/:id/toepassingen',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/toepassingen/toepassingen-page').then((m) => m.ToepassingenPage),
  },
  {
    path: 'assessment/:id/leveranciers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/leveranciers/leveranciers-page').then((m) => m.LeveranciersPage),
  },
  {
    path: 'assessment/:id/rapport',
    canActivate: [authGuard],
    loadComponent: () => import('./features/rapport/rapport-page').then((m) => m.RapportPage),
  },
  {
    path: 'assessment/:id/export',
    canActivate: [authGuard],
    loadComponent: () => import('./features/export/export-page').then((m) => m.ExportPage),
  },
  { path: '**', redirectTo: '' },
];
