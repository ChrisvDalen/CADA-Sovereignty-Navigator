import { Injectable, inject, signal } from '@angular/core';

import { CadaApi } from './cada-api';
import { UserDto } from './models';

/** Houdt de aangemelde gebruiker bij; de sessie zelf leeft in een HttpOnly-cookie. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(CadaApi);
  private readonly _user = signal<UserDto | null>(null);
  private loaded: Promise<void> | null = null;

  readonly user = this._user.asReadonly();

  /** Haalt de sessiestatus eenmalig op bij de backend. */
  ensureLoaded(): Promise<void> {
    this.loaded ??= this.api.me().then(
      (user) => this._user.set(user),
      () => this._user.set(null),
    );
    return this.loaded;
  }

  /** Wisselt een magic-link-token in voor een sessie. */
  async completeLogin(token: string): Promise<UserDto> {
    const user = await this.api.createSession(token);
    this._user.set(user);
    this.loaded = Promise.resolve();
    return user;
  }

  async logout(): Promise<void> {
    await this.api.logout();
    this.reset();
  }

  /** Vergeet de sessie client-side (bijv. na een 401 van de backend). */
  reset(): void {
    this._user.set(null);
    this.loaded = Promise.resolve();
  }
}
