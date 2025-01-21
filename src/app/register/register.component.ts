import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { registerForm } from '../interfaces/auth.interface';
import { ChatService } from '../services/chat-service.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  isAuthenticated: boolean = false;
  private authErrorSubscription!: Subscription;

  public registerForm: registerForm = {
    username: '',
    email: '',
    password: '',
  };

  constructor(private chatService: ChatService, private router: Router) {}

  ngOnInit(): void {
    // Controlla autenticazione iniziale
    if (this.chatService.isAuthenticated()) {
      this.isAuthenticated = true;
      this.router.navigate(['/chat']);
    }
    // Sottoscrizione agli errori di autenticazione
    this.authErrorSubscription = this.chatService
      .getAuthErrors()
      .subscribe(() => {
        this.isAuthenticated = false;
        // Opzionale: mostra messaggio all'utente
        console.log('Sessione scaduta, effettua nuovamente il login');
      });
  }

  handleRegister(): void {
    this.chatService.register(this.registerForm).subscribe({
      next: () => {
        this.isAuthenticated = true;
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
      },
    });
  }

  ngOnDestroy(): void {
    // Chiudi la sottoscrizione memory leaks
    if (this.authErrorSubscription) {
      this.authErrorSubscription.unsubscribe();
    }
  }
}
