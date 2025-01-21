import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }

    this.socket$ = webSocket({
      url: `ws://localhost:5000/ws?token=${this.authService.getToken()}`,
      deserializer: (msg) => JSON.parse(msg.data),
      serializer: (msg) => JSON.stringify(msg),
    });
  }

  sendMessage(message: any): void {
    if (!this.socket$) {
      console.error('WebSocket not initialized');
      return;
    }
    this.socket$.next(message);
  }

  onMessage(): Observable<any> {
    if (!this.socket$) {
      this.connect();
    }
    return this.socket$!.asObservable();
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }
}
