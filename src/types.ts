export type SchoolData = {
  id: string;
  timestamp: number;
  'nama-sekolah': string;
  npsn: string;
  alamat: string;
  'desa-kelurahan-jenis': string;
  'desa-kelurahan-nama': string;
  kecamatan: string;
  'kabupaten-kota-jenis': string;
  'kabupaten-kota-nama': string;
  provinsi: string;
  kelas?: number[];
  isDraft?: boolean;
};

export type SortConfig = {
  key: keyof SchoolData | null;
  direction: 'asc' | 'desc' | null;
};

declare global {
  interface Window {
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

// Add these to global scope just in case the AI studio env injects them directly
declare var __app_id: string | undefined;
declare var __initial_auth_token: string | undefined;
