import { ResearchWizard } from '@/components/research/research-wizard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewResearchPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/research">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Research</h1>
          <p className="text-muted-foreground mt-1">
            Configure and start a new keyword discovery session.
          </p>
        </div>
      </div>

      <ResearchWizard />
    </div>
  );
}
