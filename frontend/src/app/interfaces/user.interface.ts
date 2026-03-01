export interface User {
  _id?: string;
  name: string;
  email: string;
  dateJoined: Date;
  role?: 'admin' | 'editor' | '';
}
