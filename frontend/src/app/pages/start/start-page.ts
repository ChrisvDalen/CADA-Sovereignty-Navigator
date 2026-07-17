import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, STORAGE_KEY } from '../../core/api.service';
import { LEVEL_INFO, type CadaLevel } from '../../core/cada';

interface ResumeInfo {
  id: string;
  orgName: string;
  applicationCount: number;
}

@Component({
  selector: 'app-start-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './start-page.html',
})
export class StartPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly levels: CadaLevel[] = [1, 2, 3, 4];
  protected readonly levelInfo = LEVEL_INFO;

  protected readonly orgName = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resume = signal<ResumeInfo | null>(null);

  constructor() {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      this.api.getAssessment(savedId).then((assessment) => {
        if (assessment) {
          this.resume.set({
            id: assessment.id,
            orgName: assessment.orgName,
            applicationCount: assessment.applications.length,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      });
    }
  }

  protected async start(): Promise<void> {
    const orgName = this.orgName().trim();
    if (!orgName || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const assessment = await this.api.createAssessment(orgName);
      localStorage.setItem(STORAGE_KEY, assessment.id);
      await this.router.navigate(['/assessment', assessment.id, 'toepassingen']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Er ging iets mis.');
      this.busy.set(false);
    }
  }

  protected resumeSession(id: string): void {
    this.router.navigate(['/assessment', id, 'toepassingen']);
  }
}
