import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-[300px]" />
      <Skeleton className="h-4 w-[500px]" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full md:w-[300px]" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>

        <div className="rounded-md border">
          <div className="h-10 px-4 border-b flex items-center">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px] ml-4" />
            <Skeleton className="h-4 w-[150px] ml-4" />
            <Skeleton className="h-4 w-[80px] ml-4" />
            <Skeleton className="h-4 w-[150px] ml-4" />
            <Skeleton className="h-4 w-[80px] ml-auto" />
          </div>

          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 px-4 border-b flex items-center">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px] ml-4" />
              <Skeleton className="h-4 w-[150px] ml-4" />
              <Skeleton className="h-4 w-[30px] ml-4" />
              <Skeleton className="h-4 w-[100px] ml-4" />
              <Skeleton className="h-8 w-[80px] ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
