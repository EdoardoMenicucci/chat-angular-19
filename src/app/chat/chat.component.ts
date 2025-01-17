import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../services/chat-service.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  messages: Array<{ text: string; role: string }> = [];
  newMessage: string = '';
  isAuthenticated: boolean = false;
  isRegistering: boolean = false;

  private authErrorSubscription!: Subscription;
  private messageSubscription!: Subscription;

  constructor(private chatService: ChatService, private router: Router) {}

  initializeConnection(): void {
    this.messageSubscription = this.chatService.onMessage().subscribe(
      (data) => {
        console.log('Messaggio ricevuto: ', data);
        this.messages.push(data);
      },
      (error) => {
        console.error('Errore nella ricezione del messaggio:', error);
      }
    );
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage); // Invia il messaggio al backend
      this.newMessage = ''; // Resetta l'input
    }
  }

  resetChat(): void {
    this.messages = []; // Svuota l'array dei messaggi
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    setTimeout(() => this.initializeConnection(), 500); //ristabilisci la connessione
  }

  ngOnInit(): void {
    this.authErrorSubscription = this.chatService
      .getAuthErrors()
      .subscribe((error) => {
        console.error('Errore di autenticazione:', error);
        this.router.navigate(['/auth']); // Reindirizza l'utente alla pagina di autenticazione
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
