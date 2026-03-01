export interface Note {
  _id?: string;
  userId?: string;
  text: string;
  dateCreated?: Date;
}

export interface Recipe {
  _id?: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes?: Note[];
  dateCreated?: Date;
  dateUpdated?: Date;
  difficulty?: 'easy' | 'medium' | 'hard';
  image?: string;
}
