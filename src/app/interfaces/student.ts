export interface Student {
    code: string;
    name: string;
    phone?: string;
    state?: string;
    address?: string;
    nationalID?: string;
    email?: string;
    birthDate?: Date;
    gender?: string;
    department?: string;
    birthAddress?:string;
    factory?: string | null;
    grade?: number;
    stage?: string;
    factoryType?: boolean;
    selected?: boolean;
    batch?: string;
  }
