import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { tap } from 'rxjs/operators';
import { loginForm, registerForm } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket$?: WebSocketSubject<any>;
  private token: string = '';
  private readonly TOKEN_KEY = 'chat_token';
  private authError = new Subject<boolean>();

  constructor(private http: HttpClient) {
    const savedToken = localStorage.getItem(this.TOKEN_KEY);
    if (savedToken) {
      this.setToken(savedToken);
    }
  }

  setToken(token: string) {
    this.token = token;
    // Save token to localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    if (this.socket$) {
      this.socket$.complete();
    }

    this.socket$ = webSocket({
      url: `ws://localhost:5000/ws?token=${this.token}`,
      deserializer: (msg) => JSON.parse(msg.data),
      serializer: (msg) => JSON.stringify(msg),
    });

    this.socket$.subscribe({
      error: (error) => {
        console.log('WebSocket error:', error);
        // Handle both explicit 401 status and connection errors
        if (error.status === 401 || error.type === 'error') {
          this.logout();
          this.authError.next(true);
        }
      },
      complete: () => {
        // Also handle connection closure
        this.logout();
        this.authError.next(true);
      },
    });
  }

  login(credentials: loginForm): Observable<any> {
    return this.http.post('http://localhost:5000/auth/login', credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
        }
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
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.token = '';
    if (this.socket$) {
      this.socket$.complete();
    }
  }

  getAuthErrors(): Observable<boolean> {
    return this.authError.asObservable();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  sendMessage(message: string): void {
    if (!this.socket$) {
      console.error('WebSocket not initialized');
      return;
    }

    const msg = {
      text: message,
      role: 'user',
    };

    const data = JSON.stringify(msg);
    this.socket$.next(data);
  }

  onMessage(): Observable<any> {
    if (!this.socket$) {
      this.initializeWebSocket();
    }
    return this.socket$!.asObservable();
  }

  closeConnection(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }
}
