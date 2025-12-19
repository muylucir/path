export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold">P.A.T.H Agent Designer</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            AI Agent 아이디어를 프로토타입으로
          </p>
        </div>
      </div>
    </header>
  );
}
