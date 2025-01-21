import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, tap } from 'rxjs/operators';
import {
  loginForm,
  registerForm,
  Message,
  Chat,
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket$?: WebSocketSubject<any>;
  private token: string = '';
  public userId: number | null = null;
  public chatId: number | null = null;
  public chatApiUrl = 'http://localhost:5000/chat';
  private readonly TOKEN_KEY = 'chat_token';
  private readonly USER_ID = 'user_id';
  private authError = new Subject<boolean>();

  constructor(private http: HttpClient) {
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

  setToken(token: string) {
    this.token = token;
    // Save token to localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    this.initializeWebSocket();
  }

  setUserId(userId: number) {
    this.userId = userId;
    localStorage.setItem(this.USER_ID, userId.toString());
  }

  initializeWebSocket() {
    if (this.socket$) {
      this.socket$.complete();
    }

    // if (this.userId === null) {
    //   console.error('User ID not set');
    // }
    // if (this.chatId === null) {
    //   console.error('Chat ID not set');
    //   return;
    // }

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
        if (response.userId) {
          this.setUserId(response.userId);
          console.log('User ID:', this.userId);
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
    console.log('Sending message:', message, 'Chat ID:', this.chatId);

    if (!this.socket$) {
      console.error('WebSocket not initialized');
      return;
    }

    const msg = {
      text: message,
      role: 'user',
      chatId: this.chatId,
    };

    const data = JSON.stringify(msg);
    this.socket$.next(data);
    console.log('Message sent:', data);
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

  // // // // ---- Chat API ---- // // // //

  createChat(userId: number): Observable<any> {
    return this.http.post(`${this.chatApiUrl}/chat/`, { userId }).pipe(
      catchError((error) => {
        console.error('Error fetching chat messages:', error);
        throw error;
      })
    );
  }

  getChatMessages(chatId: number): Observable<any> {
    this.chatId = chatId;
    return this.http.get(`${this.chatApiUrl}/chat/${chatId}/messages`).pipe(
      catchError((error) => {
        console.error('Error fetching chat messages:', error);
        throw error;
      })
    );
  }

  getUserChats(userId: number): Observable<Chat[]> {
    return this.http
      .get<Chat[]>(`${this.chatApiUrl}/user/${userId}/chats`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching user chats:', error);
          throw error;
        })
      );
  }
}
