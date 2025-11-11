import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const BusinessCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-56 sm:h-64 w-full" />
    <CardContent className="p-4 sm:p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-10 w-full mt-3" />
    </CardContent>
  </Card>
);
