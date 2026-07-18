import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { CadaApi } from './cada-api';

describe('CadaApi.errorMessage', () => {
  it('gebruikt de Nederlandstalige melding uit het backend-antwoord', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { error: 'Geef de toepassing een naam.' },
    });
    expect(CadaApi.errorMessage(err, 'Er ging iets mis.')).toBe('Geef de toepassing een naam.');
  });

  it('valt terug op de fallback bij een antwoord zonder melding', () => {
    const err = new HttpErrorResponse({ status: 500, error: 'Internal Server Error' });
    expect(CadaApi.errorMessage(err, 'Er ging iets mis.')).toBe('Er ging iets mis.');
  });

  it('valt terug op de fallback bij een niet-HTTP-fout', () => {
    expect(CadaApi.errorMessage(new Error('boom'), 'Er ging iets mis.')).toBe('Er ging iets mis.');
  });
});
