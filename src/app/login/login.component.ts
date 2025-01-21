import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../services/chat-service.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { loginForm } from '../interfaces/auth.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean = false;
  private authErrorSubscription!: Subscription;

  public loginForm: loginForm = {
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

  handleLogin(): void {
    this.chatService.login(this.loginForm).subscribe({
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
