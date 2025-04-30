import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-paper-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NgIf],
  templateUrl: './paper-details.component.html',
  styleUrls: ['./paper-details.component.css']
})
export class PaperDetailsComponent {
  paper: any = null;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    const paperId = this.route.snapshot.paramMap.get('id');
    if (paperId) {
      this.http.get(`/api/paper/${paperId}`).subscribe({
        next: (data) => this.paper = data,
        error: (err) => this.error = 'Paper not found or server error.'
      });
    }
  }
}
