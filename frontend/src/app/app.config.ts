import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

registerLocaleData(localeNl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'nl' },
  ],
};
