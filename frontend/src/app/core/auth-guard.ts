import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from './auth-store';

/** Stuurt niet-aangemelde bezoekers naar de aanmeldpagina. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  await store.ensureLoaded();
  if (store.user()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { terug: state.url } });
};
