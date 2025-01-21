export interface loginForm {
  email: string;
  password: string;
}

export interface registerForm {
  username: string;
  email: string;
  password: string;
}

export interface Chat {
  id: number;
  userId: number;
  messages: Message[];
  createdAt: Date;
}

export interface Message {
  id: number;
  chatId: number;
  text: string;
  sender: string;
  timestamp: Date;
}
