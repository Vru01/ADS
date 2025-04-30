import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Neo4jService } from '../neo4j.service';
import { CommonModule } from '@angular/common';

interface Paper {
  id: string;
  class: string | null;
}

interface CitationPath {
  exists: boolean;
  path: string[];
  message: string;
}

interface QueryResult {
  [key: string]: any;
}

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.css']
})
export class SearchFormComponent {
  searchForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  paperDetails: Paper | null = null;
  citationPath: CitationPath | null = null;
  results: QueryResult[] = [];
  examplePaperIds = ['31336', '1061127', '1106406'];
  exampleCitationIds = ['31336', 'to', '31353'];

  isPaperSearchVisible = true; // Initially show Paper Search
  isCitationSearchVisible = false;
  isCustomSearchVisible = false;

  constructor(
    private fb: FormBuilder,
    private neo4jService: Neo4jService
  ) {
    this.searchForm = this.fb.group({
      queryType: ['paper', Validators.required], // Still keep this for logic
      paperId: [''],
      fromPaperId: [''],
      toPaperId: [''],
      customQuery: ['MATCH (p:Paper) RETURN p.id as id, p.class as class LIMIT 10']
    });

    // No need for valueChanges subscription anymore
  }

  showPaperSearch(): void {
    this.isPaperSearchVisible = true;
    this.isCitationSearchVisible = false;
    this.isCustomSearchVisible = false;
    this.searchForm.get('queryType')?.setValue('paper');
    this.updateValidators('paper');
  }

  showCitationSearch(): void {
    this.isPaperSearchVisible = false;
    this.isCitationSearchVisible = true;
    this.isCustomSearchVisible = false;
    this.searchForm.get('queryType')?.setValue('citation');
    this.updateValidators('citation');
  }

  showCustomSearch(): void {
    this.isPaperSearchVisible = false;
    this.isCitationSearchVisible = false;
    this.isCustomSearchVisible = true;
    this.searchForm.get('queryType')?.setValue('custom');
    this.updateValidators('custom');
  }

  search(): void {
    if (this.searchForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.resetResults();
    this.isLoading = true;
    this.errorMessage = null;

    const { queryType, paperId, fromPaperId, toPaperId, customQuery } = this.searchForm.value;

    switch (queryType) {
      case 'paper':
        this.searchPaper(paperId);
        break;
      case 'citation':
        this.searchCitationPath(fromPaperId, toPaperId);
        break;
      case 'custom':
        this.runCustomQuery(customQuery);
        break;
    }
  }

  private searchPaper(id: string): void {
    this.neo4jService.getPaperDetails(id).subscribe({
      next: (paper) => {
        this.paperDetails = paper;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(error, `Failed to fetch paper ${id}`);
      }
    });
  }

  private searchCitationPath(fromId: string, toId: string): void {
    this.neo4jService.getCitationPath(fromId, toId).subscribe({
      next: (path) => {
        this.citationPath = path;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(error, `Failed to fetch citation path`);
      }
    });
  }

  private runCustomQuery(query: string): void {
    this.neo4jService.runCustomQuery(query).subscribe({
      next: (results) => {
        this.results = results;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(error, 'Failed to execute custom query');
      }
    });
  }

  getResultKeys(results: any[]): string[] {
    return results && results.length > 0 ? Object.keys(results[0]) : [];
  }

  private updateValidators(queryType: string): void {
    const controls = ['paperId', 'fromPaperId', 'toPaperId', 'customQuery'];
    controls.forEach(control => {
      const formControl = this.searchForm.get(control);
      formControl?.clearValidators();
      formControl?.updateValueAndValidity();
    });

    switch (queryType) {
      case 'paper':
        this.searchForm.get('paperId')?.setValidators(Validators.required);
        break;
      case 'citation':
        this.searchForm.get('fromPaperId')?.setValidators(Validators.required);
        this.searchForm.get('toPaperId')?.setValidators(Validators.required);
        break;
      case 'custom':
        this.searchForm.get('customQuery')?.setValidators(Validators.required);
        break;
    }

    this.searchForm.updateValueAndValidity();
  }

  private resetResults(): void {
    this.paperDetails = null;
    this.citationPath = null;
    this.results = [];
  }

  private handleError(error: Error, defaultMessage: string): void {
    this.isLoading = false;
    this.errorMessage = error.message || defaultMessage;
    console.error(error);
  }
}