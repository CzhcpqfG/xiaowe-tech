export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  author: string;
  content: ArticleBlock[];
  prevArticle?: { id: string; title: string };
  nextArticle?: { id: string; title: string };
  medicalAd?: {
    productName: string;
    regNumber: string;
    adNumber: string;
    notice: string;
  };
}

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string };
