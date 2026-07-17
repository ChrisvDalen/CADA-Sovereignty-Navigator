import { effect, inject, resource, type Signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import type { AssessmentDto } from './types';

/**
 * Laadt de analyse voor de wizardpagina's en stuurt door naar de
 * niet-gevonden-pagina wanneer de sessie niet (meer) bestaat.
 */
export function assessmentResource(id: Signal<string>) {
  const api = inject(ApiService);
  const router = inject(Router);

  const res = resource<AssessmentDto | null, { id: string }>({
    params: () => ({ id: id() }),
    loader: ({ params }) => api.getAssessment(params.id),
  });

  effect(() => {
    if (res.status() === 'resolved' && res.value() === null) {
      router.navigateByUrl('/niet-gevonden');
    }
  });

  return res;
}
