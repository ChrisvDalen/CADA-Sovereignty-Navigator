import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ApplicationDto,
  ApplicationPayload,
  AssessmentDto,
  AssessmentSummary,
  ImportResult,
  LevelPreview,
  MagicLinkResult,
  Meta,
  ReportResponse,
  ShareLinkDto,
  SharedReport,
  ShareStatus,
  SupplierDetail,
  SupplierPayload,
  UserDto,
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

  importApplications(
    assessmentId: string,
    applications: ApplicationPayload[],
  ): Promise<ImportResult> {
    return firstValueFrom(
      this.http.post<ImportResult>(`/api/assessments/${assessmentId}/applications/import`, {
        applications,
      }),
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

  // — Authenticatie —

  requestMagicLink(email: string): Promise<MagicLinkResult> {
    return firstValueFrom(this.http.post<MagicLinkResult>('/api/auth/magic-link', { email }));
  }

  createSession(token: string): Promise<UserDto> {
    return firstValueFrom(this.http.post<UserDto>('/api/auth/sessions', { token }));
  }

  me(): Promise<UserDto> {
    return firstValueFrom(this.http.get<UserDto>('/api/auth/me'));
  }

  logout(): Promise<void> {
    return firstValueFrom(this.http.delete<void>('/api/auth/sessions/current')).then(
      () => undefined,
    );
  }

  // — Deellinks (alleen-lezen rapport) —

  createShareLink(assessmentId: string): Promise<ShareLinkDto> {
    return firstValueFrom(this.http.post<ShareLinkDto>(`/api/assessments/${assessmentId}/share`, {}));
  }

  shareStatus(assessmentId: string): Promise<ShareStatus> {
    return firstValueFrom(this.http.get<ShareStatus>(`/api/assessments/${assessmentId}/share`));
  }

  revokeShareLink(assessmentId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/assessments/${assessmentId}/share`)).then(
      () => undefined,
    );
  }

  getSharedReport(token: string): Promise<SharedReport> {
    return firstValueFrom(this.http.get<SharedReport>(`/api/share/${token}`));
  }

  /** Haalt de Nederlandstalige foutmelding uit een backend-antwoord. */
  static errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && typeof err.error?.error === 'string') {
      return err.error.error;
    }
    return fallback;
  }
}
