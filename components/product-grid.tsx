const products = [
  { id: "1", title: "シフト管理Pro", price: "¥2,980", category: "店舗管理" },
  { id: "2", title: "Notion営業テンプレ", price: "¥1,480", category: "テンプレート" },
  { id: "3", title: "LINE自動返信ボット", price: "¥3,480", category: "自動化" },
  { id: "4", title: "経費精算シート", price: "¥980", category: "Excel" },
];

export function ProductGrid() {
  return (
    <section className="container mx-auto px-4 py-6">
      <h2 className="mb-4 text-xl font-semibold text-foreground">おすすめツール</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              プレビュー
            </div>
            <p className="text-xs text-muted-foreground">{product.category}</p>
            <h3 className="mt-1 font-medium text-foreground">{product.title}</h3>
            <p className="mt-1 text-sm font-semibold text-primary">{product.price}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
