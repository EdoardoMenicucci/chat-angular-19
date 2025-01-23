import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../services/chat-service.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Chat } from '../interfaces/d.interface';
import { WebSocketService } from '../services/web-socket.service';
import { AuthService } from '../services/auth.service';
import { DxMenuModule, DxMenuComponent } from 'devextreme-angular/ui/menu';
import { MarkdownComponent } from 'ngx-markdown';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, DxMenuModule, MarkdownComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  messages: Array<{ text: string; role: string; date: string }> = [];
  newMessage: string = '';
  isAuthenticated: boolean = false;
  isRegistering: boolean = false;
  previousChat: Chat[] | null = [];
  username: string = '';
  userColor: string = '#3B82F6'; // default color

  //UI

  isDropdownOpen: boolean = false;

  private authErrorSubscription!: Subscription;
  private messageSubscription!: Subscription;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  private initializeConnection(): void {
    this.messageSubscription = this.webSocketService.onMessage().subscribe({
      next: (data) => {
        console.log('Messaggio ricevuto: ', data);
        this.messages.push(data);
      },
      error: (e) => {
        console.error('Errore nella ricezione del messaggio:', e);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  /////////////// Funzioni di Chat //////////////////////
  sendMessage(): void {
    if (this.chatService.chatId === null) {
      this.chatService.createChat(this.authService.userId!).subscribe({
        next: (chatId: any) => {
          this.chatService.chatId = chatId.chatId;
          console.log('Chat creata con successo con id:', chatId);
          if (this.newMessage.trim()) {
            this.chatService.sendMessage(this.newMessage); // Invia il messaggio al backend
            this.newMessage = ''; // Resetta l'input
          }
        },
        error: (error) => {
          console.error('Errore nella creazione della chat:', error);
        },
      });
    } else if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage); // Invia il messaggio al backend
      this.newMessage = ''; // Resetta l'input
    }
  }

  selectChat(chat: Chat): void {
    this.chatService.getChatMessages(chat.id).subscribe({
      next: (messages) => {
        console.log('Messages received:', messages);
        // Mappa i messaggi in un formato adatto per la visualizzazione
        this.messages = messages.map((message: Message) => ({
          text: message.text,
          role: message.sender === 'user' ? 'user' : 'model',
          date: new Date(message.timestamp).toLocaleString(),
        }));
        // console.log(this.messages);
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
      },
    });
  }

  deleteChat(): void {
    const chatId = this.chatService.chatId;
    if (chatId == null) {
      console.error('ChatId non definito!');
      return;
    }
    this.chatService.deleteChat(chatId!).subscribe({
      next: () => {
        console.log('Chat eliminata con successo!');
        this.newChat();
      },
      error: (error) => {
        console.error('Errore nella cancellazione della chat:', error);
      },
    });
  }

  newChat(): void {
    this.chatService.chatId = null;
    this.messages = [];
  }

  getUsername(): void {
    this.username = this.authService.username ?? 'errire';
  }

  /////////////// Funzioni di utilità //////////////////////
  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  trimMessage(message: string): string {
    return message.length > 10 ? message.slice(0, 20) + '...' : message;
  }

  firstLetter(name: string): string {
    return name[0].toUpperCase();
  }

  /////////////// Ciclo Vita //////////////////////
  ngOnInit(): void {
    this.authErrorSubscription = this.authService
      .getAuthErrors()
      .subscribe((error) => {
        console.error('Errore di autenticazione:', error);
        this.router.navigate(['/signin']); // Reindirizza l'utente alla pagina di autenticazione
      });
    this.chatService.getUserChats(1).subscribe({
      next: (chats) => {
        this.previousChat = chats;
        console.log('User chats:', chats);
      },
      error: (error) => console.error('Error loading chats:', error),
    });
    this.initializeConnection();
    this.getUsername();
    this.userColor = this.themeService.getUserColor();
  }

  ngOnDestroy(): void {
    // Chiudi la sottoscrizione memory leaks
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.authErrorSubscription) {
      this.authErrorSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }
  /////////////////////////////////////////////////////
}
