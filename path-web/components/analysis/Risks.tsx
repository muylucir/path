import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { Analysis } from "@/lib/types";

interface RisksProps {
  analysis: Analysis;
}

export function Risks({ analysis }: RisksProps) {
  const { risks, feasibility_score, feasibility_breakdown } = analysis;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            리스크 및 고려사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {risks.map((risk, idx) => (
            <div
              key={idx}
              className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800"
            >
              <p className="text-sm">{risk}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {feasibility_score < 40 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              ⚠️ 개선 필요 항목
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">
              Feasibility 점수가 낮습니다. 다음을 개선하세요:
            </p>
            <ul className="space-y-2">
              {Object.entries(feasibility_breakdown).map(([key, value]) => {
                if (value < 7) {
                  return (
                    <li key={key} className="text-sm">
                      • {key}: {value}/10 → 개선 필요
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
