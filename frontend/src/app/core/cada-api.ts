import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ApplicationDto,
  ApplicationPayload,
  AssessmentDto,
  AssessmentSummary,
  LevelPreview,
  Meta,
  ReportResponse,
  SupplierDetail,
  SupplierPayload,
} from './models';

/** REST-client voor de Spring Boot-backend. */
@Injectable({ providedIn: 'root' })
export class CadaApi {
  private readonly http = inject(HttpClient);

  getMeta(): Promise<Meta> {
    return firstValueFrom(this.http.get<Meta>('/api/meta'));
  }

  createAssessment(orgName: string): Promise<AssessmentDto> {
    return firstValueFrom(this.http.post<AssessmentDto>('/api/assessments', { orgName }));
  }

  getAssessment(id: string): Promise<AssessmentDto> {
    return firstValueFrom(this.http.get<AssessmentDto>(`/api/assessments/${id}`));
  }

  getReport(id: string): Promise<ReportResponse> {
    return firstValueFrom(this.http.get<ReportResponse>(`/api/assessments/${id}/report`));
  }

  addApplication(assessmentId: string, payload: ApplicationPayload): Promise<ApplicationDto> {
    return firstValueFrom(
      this.http.post<ApplicationDto>(`/api/assessments/${assessmentId}/applications`, payload),
    );
  }

  updateApplication(id: string, payload: ApplicationPayload): Promise<ApplicationDto> {
    return firstValueFrom(this.http.put<ApplicationDto>(`/api/applications/${id}`, payload));
  }

  deleteApplication(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/applications/${id}`)).then(() => undefined);
  }

  previewLevel(
    payload: Omit<ApplicationPayload, 'name' | 'supplierOther' | 'suppliers'>,
  ): Promise<LevelPreview> {
    return firstValueFrom(this.http.post<LevelPreview>('/api/level-preview', payload));
  }

  listAssessments(): Promise<AssessmentSummary[]> {
    return firstValueFrom(this.http.get<AssessmentSummary[]>('/api/assessments'));
  }

  listSuppliers(): Promise<SupplierDetail[]> {
    return firstValueFrom(this.http.get<SupplierDetail[]>('/api/suppliers'));
  }

  createSupplier(payload: SupplierPayload): Promise<SupplierDetail> {
    return firstValueFrom(this.http.post<SupplierDetail>('/api/suppliers', payload));
  }

  updateSupplier(id: string, payload: SupplierPayload): Promise<SupplierDetail> {
    return firstValueFrom(this.http.put<SupplierDetail>(`/api/suppliers/${id}`, payload));
  }

  deleteSupplier(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/suppliers/${id}`)).then(() => undefined);
  }

  /** Haalt de Nederlandstalige foutmelding uit een backend-antwoord. */
  static errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && typeof err.error?.error === 'string') {
      return err.error.error;
    }
    return fallback;
  }
}
