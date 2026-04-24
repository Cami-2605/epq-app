import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class ReportesComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/dashboard-admin']);
  }
}
