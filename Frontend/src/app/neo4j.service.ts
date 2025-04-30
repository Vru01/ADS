import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Paper {
  id: string;
  class: string | null;
}

export interface CitationPath {
  exists: boolean;
  path: string[];
  message: string;
}

export interface QueryResult {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class Neo4jService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getPaperDetails(id: string): Observable<Paper> {
    return this.http.get<any>(`${this.apiUrl}/paper/${id}`).pipe(
      map(response => ({
        id: response.id,
        class: response.class || null
      })),
      catchError(this.handleError)
    );
  }

  getCitationPath(fromId: string, toId: string): Observable<CitationPath> {
    return this.http.get<CitationPath>(`${this.apiUrl}/citation-path/${fromId}/${toId}`).pipe(
      catchError(this.handleError)
    );
  }

  runCustomQuery(query: string): Observable<QueryResult[]> {
    return this.http.post<QueryResult[]>(`${this.apiUrl}/custom-query`, { query }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    let errorMessage = 'An unknown error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 404) {
      errorMessage = 'Resource not found';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}