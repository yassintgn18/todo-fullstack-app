import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient) {}

  register(username: string, email: string, password: string) {
    return this.http.post<{ token: string; username: string }>(
      `${this.apiUrl}/register`,
      { username, email, password }
    );
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string; username: string }>(
      `${this.apiUrl}/login`,
      { username, password }
    );
  }

  saveToken(token: string, username: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.clear();
  }
}