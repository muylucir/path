import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Analysis } from "@/lib/types";

interface DetailedAnalysisProps {
  analysis: Analysis;
}

export function DetailedAnalysis({ analysis }: DetailedAnalysisProps) {
  const { feasibility_breakdown, feasibility_score } = analysis;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Problem Decomposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📌 Pain Point</h4>
                <p className="text-sm text-muted-foreground">{analysis.pain_point}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📥 INPUT</h4>
                <p className="text-sm text-muted-foreground">{analysis.input_type}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚙️ PROCESS</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.process_steps.map((step, idx) => (
                    <li key={idx}>{idx + 1}. {step}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📤 OUTPUT</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.output_types.map((type, idx) => (
                    <li key={idx}>• {type}</li>
                  ))}
                </ul>
                {analysis.output_detail && (
                  <p className="text-xs text-muted-foreground mt-2">
                    상세: {analysis.output_detail}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">👤 Human-in-Loop</h4>
                <p className="text-sm text-muted-foreground">{analysis.human_loop}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">추천 패턴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-semibold">패턴: {analysis.pattern}</p>
              </div>
              {analysis.pattern_reason && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm">{analysis.pattern_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feasibility 점수</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{feasibility_score}/50</div>
              </div>

              <div className="space-y-3">
                {Object.entries(feasibility_breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{key}</span>
                      <span className="font-semibold">{value}/10</span>
                    </div>
                    <Progress value={(value / 10) * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">최종 판정</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`p-4 rounded-lg ${
                  feasibility_score >= 40
                    ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"
                    : feasibility_score >= 30
                    ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100"
                    : "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100"
                }`}
              >
                <p className="font-semibold mb-2">
                  {feasibility_score >= 40
                    ? "✅ 즉시 프로토타입 시작"
                    : feasibility_score >= 30
                    ? "⚠️ 조건부 진행"
                    : "🔄 개선 필요"}
                </p>
                <p className="text-sm">{analysis.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
