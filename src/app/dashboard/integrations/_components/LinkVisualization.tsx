import { useRef } from 'react';

import { AnimatedBeam } from '@/components/ui/animated-beam';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';

interface LinkPart {
  accountName: string;
  subaccountName: string;
  currency: string;
  logoUrl?: string;
}

interface LinkVisualizationProps {
  from: LinkPart;
  to?: LinkPart;
}

function LinkPart({ ref, info }: { info?: LinkPart; ref: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      className={cn(
        'size-36 flex flex-col justify-center items-center rounded-lg border-2 p-4 text-center shadow-xs bg-card text-sm',
        !info && 'border-dashed',
      )}
    >
      {info ? (
        <>
          <Avatar className="mb-2">
            <AvatarImage src={info.logoUrl} />
            <AvatarFallback aria-hidden>{info.accountName[0]}</AvatarFallback>
          </Avatar>
          <p className="font-semibold w-full truncate">{info.accountName}</p>
          <p className="text-muted-foreground w-full truncate">{info.subaccountName}</p>
          <p className="text-muted-foreground">({info.currency.toUpperCase()})</p>
        </>
      ) : (
        <p className="text-muted-foreground">Not selected</p>
      )}
    </div>
  );
}

export function LinkVisualization({ from, to }: LinkVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex w-full items-center justify-center" ref={containerRef}>
      <div className="flex w-full justify-between gap-10 z-10">
        <LinkPart ref={div1Ref} info={from} />
        <LinkPart ref={div2Ref} info={to} />
      </div>

      <AnimatedBeam
        duration={3}
        curvature={10}
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
      />
    </div>
  );
}
