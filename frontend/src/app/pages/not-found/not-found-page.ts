import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p class="eyebrow">Niet gevonden</p>
      <h1 class="font-serif text-3xl font-semibold text-ink">
        Deze sessie bestaat niet (meer)
      </h1>
      <p class="max-w-md text-sm text-ink-muted">
        De opgevraagde analyse is niet gevonden. Start een nieuwe risicoanalyse vanaf
        het beginscherm.
      </p>
      <a
        routerLink="/"
        class="mt-2 border border-navy-600 bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
      >
        Naar het startscherm
      </a>
    </div>
  `,
})
export class NotFoundPage {}
