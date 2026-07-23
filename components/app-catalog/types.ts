export type ModalApp = {
  id: string | number;
  name: string;
  description: string;
  creator: string;
  rating: number;
  reviews: number;
  category: string;
  gradient: string;
  emoji?: string;
};

export type CatalogCardApp = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  creator_name: string | null;
  created_at?: string;
  stamp_count?: number;
};
