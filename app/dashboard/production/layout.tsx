import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { redirect } from 'next/navigation';
import { ContentLayout } from '@/components/user-panel/content-layout';
import DynamicBreadcrumbs from '@/components/DynamicBreadcrumbs';

export default async function ProductionLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
      if (!session) {
    redirect('/auth');
  }

  const canCreate = session.user.access?.includes('CREATE_PRODUCTION_INVENTORY');
  const canView = session.user.access?.includes('VIEW_PRODUCTION_DASHBOARD');

  if (!canCreate && !canView) {
    redirect('/dashboard');
  }

  const isAdmin = ['ADMIN', 'IT_ADMIN'].includes(session.user.role);
  return (
    <ContentLayout title="Production">
      <DynamicBreadcrumbs />
      {children}
    </ContentLayout>
  );
}