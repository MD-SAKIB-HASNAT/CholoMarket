import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <MapPin className="size-7" />
      </span>
      <h1 className="text-2xl font-semibold">This aisle doesn’t exist</h1>
      <p lang="bn" className="text-muted-foreground">
        দুঃখিত, পাতাটি খুঁজে পাওয়া যায়নি
      </p>
      <div className="flex gap-2">
        <Button render={<Link href="/" />}>Go home</Button>
        <Button variant="outline" render={<Link href="/markets" />}>
          Browse malls
        </Button>
      </div>
    </div>
  );
}
