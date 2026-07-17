import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ApplicationDto, ApplicationPayload, AssessmentDto } from './types';

export const STORAGE_KEY = 'cada-assessment-id';

/** Vertaalt een HTTP-fout naar de foutmelding van de backend. */
function apiError(err: unknown, fallback: string): Error {
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as { error?: string } | null)?.error;
    if (message) return new Error(message);
  }
  return new Error(fallback);
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  async createAssessment(orgName: string): Promise<AssessmentDto> {
    try {
      return await firstValueFrom(
        this.http.post<AssessmentDto>('/api/assessments', { orgName })
      );
    } catch (err) {
      throw apiError(err, 'Er ging iets mis.');
    }
  }

  async getAssessment(id: string): Promise<AssessmentDto | null> {
    try {
      return await firstValueFrom(
        this.http.get<AssessmentDto>(`/api/assessments/${id}`)
      );
    } catch {
      return null;
    }
  }

  async createApplication(
    assessmentId: string,
    payload: ApplicationPayload
  ): Promise<ApplicationDto> {
    try {
      return await firstValueFrom(
        this.http.post<ApplicationDto>(
          `/api/assessments/${assessmentId}/applications`,
          payload
        )
      );
    } catch (err) {
      throw apiError(err, 'Opslaan is niet gelukt.');
    }
  }

  async updateApplication(
    id: string,
    payload: ApplicationPayload
  ): Promise<ApplicationDto> {
    try {
      return await firstValueFrom(
        this.http.put<ApplicationDto>(`/api/applications/${id}`, payload)
      );
    } catch (err) {
      throw apiError(err, 'Opslaan is niet gelukt.');
    }
  }

  async deleteApplication(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`/api/applications/${id}`));
    } catch (err) {
      throw apiError(err, 'Verwijderen is niet gelukt.');
    }
  }
}
