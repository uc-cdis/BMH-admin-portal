import { RequestWorkspaceForm } from '@/components/request-workspace-form';

export default async function RequestWorkspacePage() {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Request New Workspace</h1>
        <RequestWorkspaceForm />
      </div>
    </div>
  );
}
