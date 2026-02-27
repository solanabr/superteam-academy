'use client';

import { Group, Panel, Separator } from 'react-resizable-panels';

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function LessonResizableSplit({ left, right }: Props) {
  return (
    <Group orientation="horizontal" className="mt-6 min-h-[400px] w-full">
      <Panel id="lesson-content" defaultSize={50} minSize={25}>
        <div className="pr-4">{left}</div>
      </Panel>
      <Separator className="relative w-2 shrink-0 rounded bg-border/50 transition hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2" />
      <Panel id="lesson-editor" defaultSize={50} minSize={25}>
        <div className="pl-4">{right}</div>
      </Panel>
    </Group>
  );
}
