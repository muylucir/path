"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { SessionListItem } from "@/lib/types";

interface SessionCardProps {
  session: SessionListItem;
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionCard({ session, onLoad, onDelete }: SessionCardProps) {
  const timestamp = session.timestamp.slice(0, 16).replace("T", " ");
  const painPoint =
    session.pain_point.length > 50
      ? session.pain_point.slice(0, 50) + "..."
      : session.pain_point;

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={() => onLoad(session.session_id)}
            className="flex-1 text-left space-y-1"
          >
            <p className="text-xs text-muted-foreground">📅 {timestamp}</p>
            <p className="text-sm font-medium">{painPoint}</p>
            <p className="text-xs text-muted-foreground">
              점수: {session.feasibility_score}/50
            </p>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.session_id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
