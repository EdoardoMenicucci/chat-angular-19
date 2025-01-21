import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../services/chat-service.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Chat } from '../interfaces/auth.interface';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  messages: Array<{ text: string; role: string; date: string }> = [];
  newMessage: string = '';
  isAuthenticated: boolean = false;
  isRegistering: boolean = false;
  previousChat: Chat[] | null = [];

  private authErrorSubscription!: Subscription;
  private messageSubscription!: Subscription;

  constructor(private chatService: ChatService, private router: Router) {}

  private initializeConnection(): void {
    this.messageSubscription = this.chatService.onMessage().subscribe({
      next: (data) => {
        console.log('Messaggio ricevuto: ', data);
        this.messages.push(data);
      },
      error: (e) => {
        console.error('Errore nella ricezione del messaggio:', e);
      },
    });
  }

  sendMessage(): void {
    if (this.chatService.chatId === null) {
      this.chatService.createChat(this.chatService.userId!).subscribe({
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

  logout(): void {
    this.chatService.logout();
    this.router.navigate(['/home']);
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
        console.log(this.messages);
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
      },
    });
  }

  ngOnInit(): void {
    this.authErrorSubscription = this.chatService
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
  }

  ngOnDestroy(): void {
    // Chiudi la sottoscrizione memory leaks
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.authErrorSubscription) {
      this.authErrorSubscription.unsubscribe();
    }
    this.chatService.closeConnection();
  }
}
