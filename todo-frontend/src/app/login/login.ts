import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';  // ← add RouterLink here
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],  // ← add RouterLink here
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res: any) => {
        this.authService.saveToken(res.token, res.username);
        this.router.navigate(['/todos']);
      },
      error: () => {
        this.errorMessage = 'Invalid username or password';
      }
    });
  }
}