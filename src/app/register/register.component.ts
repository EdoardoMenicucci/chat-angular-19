import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { registerForm } from '../interfaces/d.interface';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

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

  availableColors: string[] = [
    '#3B82F7', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];

  public registerForm: registerForm = {
    username: '',
    email: '',
    password: '',
    color: this.availableColors[0], //default color
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  selectColor(color: string) {
    this.themeService.setUserColor(color);
  }

  ngOnInit(): void {
    // Controlla autenticazione iniziale
    if (this.authService.isAuthenticated()) {
      this.isAuthenticated = true;
      this.router.navigate(['/chat']);
    }
    // Sottoscrizione agli errori di autenticazione
    this.authErrorSubscription = this.authService
      .getAuthErrors()
      .subscribe(() => {
        this.isAuthenticated = false;
        // Opzionale: mostra messaggio all'utente
        console.log('Sessione scaduta, effettua nuovamente il login');
      });
  }

  handleRegister(): void {
    this.authService.register(this.registerForm).subscribe({
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
