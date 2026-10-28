type JsonLdProps = {
  data: object;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // アプリの名前・説明（利用者が書いたもの）に </script> などがあっても、ここから抜け出してプログラムとして動かないように < > & を逃がす
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }}
    />
  );
}
