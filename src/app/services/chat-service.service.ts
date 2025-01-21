import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, tap } from 'rxjs/operators';
import { loginForm, registerForm } from '../interfaces/d.interface';
import { Chat } from '../interfaces/d.interface';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  public chatId: number | null = null;
  private readonly apiUrl = 'http://localhost:5000/chat';

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {}

  createChat(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/`, { userId });
  }

  getChatMessages(chatId: number): Observable<any> {
    this.chatId = chatId;
    return this.http.get(`${this.apiUrl}/chat/${chatId}/messages`);
  }

  getUserChats(userId: number): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}/user/${userId}/chats`);
  }

  sendMessage(message: string): void {
    if (this.chatId) {
      this.webSocketService.sendMessage({
        text: message,
        role: 'user',
        chatId: this.chatId,
      });
    }
  }
}
