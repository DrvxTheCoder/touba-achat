export interface EDB {
  id: string;
  queryId: string;
  title: string;
  category: string;
  status: string;
  department: string;
  amount: number;
  email: string;
  items: { designation: string; quantity: number }[];
  employee: {
    name: string;
    department: string;
    email: string;
  };
  documents: string[];
  date: string;
}
  