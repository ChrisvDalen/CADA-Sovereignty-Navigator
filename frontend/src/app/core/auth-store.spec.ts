import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStore } from './auth-store';
import { CadaApi } from './cada-api';

describe('AuthStore', () => {
  const api = {
    me: vi.fn(),
    createSession: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: CadaApi, useValue: api }] });
  });

  it('laadt de aangemelde gebruiker eenmalig', async () => {
    api.me.mockResolvedValue({ email: 'test@gemeente.nl' });
    const store = TestBed.inject(AuthStore);

    await store.ensureLoaded();
    await store.ensureLoaded();

    expect(store.user()).toEqual({ email: 'test@gemeente.nl' });
    expect(api.me).toHaveBeenCalledTimes(1);
  });

  it('behandelt een 401 als niet aangemeld', async () => {
    api.me.mockRejectedValue(new Error('401'));
    const store = TestBed.inject(AuthStore);

    await store.ensureLoaded();

    expect(store.user()).toBeNull();
  });

  it('zet de gebruiker na het inwisselen van een magic-link-token', async () => {
    api.me.mockRejectedValue(new Error('401'));
    api.createSession.mockResolvedValue({ email: 'nieuw@gemeente.nl' });
    const store = TestBed.inject(AuthStore);
    await store.ensureLoaded();

    await store.completeLogin('token-123');

    expect(api.createSession).toHaveBeenCalledWith('token-123');
    expect(store.user()).toEqual({ email: 'nieuw@gemeente.nl' });
    // Een latere ensureLoaded doet geen nieuwe netwerkcall
    await store.ensureLoaded();
    expect(api.me).toHaveBeenCalledTimes(1);
  });

  it('vergeet de gebruiker na afmelden', async () => {
    api.me.mockResolvedValue({ email: 'test@gemeente.nl' });
    api.logout.mockResolvedValue(undefined);
    const store = TestBed.inject(AuthStore);
    await store.ensureLoaded();

    await store.logout();

    expect(api.logout).toHaveBeenCalled();
    expect(store.user()).toBeNull();
  });
});
