import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { loginForm, registerForm } from '../interfaces/d.interface';
import { ChatService } from './chat-service.service';
import { Observable, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'chat_token';
  private readonly USER_ID = 'user_id';
  private token: string = '';
  private authError = new Subject<boolean>();
  public userId: number | null = null;

  constructor(private http: HttpClient) {
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const savedToken = localStorage.getItem(this.TOKEN_KEY);
    if (savedToken) {
      console.log('Token:', savedToken);
      this.setToken(savedToken);
    }
    const savedUserId = localStorage.getItem(this.USER_ID);
    if (savedUserId) {
      console.log('User ID:', savedUserId);
      this.userId = parseInt(savedUserId, 10);
    } else {
      console.error('User ID not found');
    }
  }

  getToken(): string {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setUserId(userId: number): void {
    this.userId = userId;
    localStorage.setItem(this.USER_ID, userId.toString());
  }

  login(credentials: loginForm): Observable<any> {
    return this.http.post('http://localhost:5000/auth/login', credentials).pipe(
      tap((response: any) => {
        if (response.token) this.setToken(response.token);
        if (response.userId) this.setUserId(response.userId);
      })
    );
  }

  register(credentials: registerForm): Observable<any> {
    return this.http
      .post('http://localhost:5000/auth/register', credentials)
      .pipe(
        tap((response: any) => {
          if (response.token) {
            this.setToken(response.token);
          }
          if (response.userId) {
            this.setUserId(response.userId);
            console.log('User ID:', this.userId);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID);
    this.userId = null;
    this.token = '';
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.userId;
  }

  getAuthErrors(): Observable<boolean> {
    return this.authError.asObservable();
  }
}
