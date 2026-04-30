// app/page.tsx — redirect ke dashboard atau login
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/login');
}
