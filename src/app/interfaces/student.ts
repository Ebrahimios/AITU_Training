export interface StudentReport {
  id?: string;
  name: string;
  date: number;
  url: string;
  status?: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  type?: 'weekly' | 'monthly' | 'final';
  description?: string;
}

export interface Student {
    code: string;
    name: string;
    phone?: string;
    state?: string;
    address?: string;
    nationalID?: string;
    email?: string;
    birthDate?: string | null;
    createOn?: string;
    gender?: string;
    department?: string;
    birthAddress?:string;
    factory?: string | null;
    stage?: string;
    factoryType?: boolean;
    selected?: boolean;
    batch?: string;
    supervisor?: string | null;
    report?: StudentReport;
  }
