import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public userColor: string | null = null;
  private readonly USER_COLOR = 'user_color';

  constructor() {}

  setUserColor(color: string): void {
    this.userColor = color;
    localStorage.setItem(this.USER_COLOR, color);
  }

  getUserColor(): string {
    const savedColor = localStorage.getItem(this.USER_COLOR);
    if (savedColor) {
      this.userColor = savedColor;
    }
    return this.userColor!;
  }
}
