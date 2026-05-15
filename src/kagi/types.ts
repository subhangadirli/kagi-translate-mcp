export type KagiFormality = "default" | "formal" | "informal";

export type KagiGender = "neutral" | "female" | "male";

export interface KagiBaseRequest {
  source_lang: string;
  target_lang: string;
  formality?: KagiFormality;
  gender?: KagiGender;
}

export interface KagiTranslateTextRequest extends KagiBaseRequest {
  text?: string;
  texts?: string[];
  context?: string;
}

export interface KagiTranslateUrlRequest extends KagiBaseRequest {
  url: string;
}

export interface KagiProofreadRequest {
  text: string;
  language?: string;
  target_lang?: string;
}

export interface KagiTranslationItem {
  source?: string;
  translation: string;
  detected_source_lang?: string;
  target_lang?: string;
}

export interface KagiTranslationResponse {
  translation?: string;
  translations?: string[];
  translated_text?: string;
  translated_url?: string;
  url?: string;
  source_lang?: string;
  target_lang?: string;
  items?: KagiTranslationItem[];
  [key: string]: unknown;
}

export interface KagiProofreadResponse {
  text?: string;
  proofread?: string;
  corrected_text?: string;
  suggestions?: string[];
  [key: string]: unknown;
}

export interface KagiApiErrorBody {
  error?: string;
  message?: string;
  detail?: string;
  details?: unknown;
  [key: string]: unknown;
}
