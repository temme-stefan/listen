export interface Card {
  sort: number;
  url: string;
  title: string;
  image: string;
  comment: string;
  bought: boolean;
}

export interface MetaResult {
  ok: boolean;
  title: string;
  image: string;
  error?: string;
}

export interface ListConfig {
  name: string;
  title: string;
  archived: boolean;
  oldName?: string; // gesetzt wenn Slug geändert wurde, wird nicht persistent gespeichert
}

