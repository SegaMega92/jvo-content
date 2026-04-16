export interface Feature {
  icon: string;
  text: string;
}

export interface GenerateRequest {
  image: Buffer;
  imageMimeType: string;
  template: string;
  title: string;
  subtitle?: string;
  features: Feature[];
  accentColor?: string;
  outputWidth: number;
  outputHeight: number;
}

export interface ProcessedImage {
  original: Buffer;
  cutout: Buffer | null;
  dominantColor: string;
  palette: string[];
}

export interface TemplateData {
  title: string;
  subtitle?: string;
  advantage1?: string;
  advantage2?: string;
  features: Feature[];
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  cutoutBase64: string | null;
  originalBase64: string;
  outputWidth: number;
  outputHeight: number;
}

export interface TimingLog {
  step: string;
  durationMs: number;
}
