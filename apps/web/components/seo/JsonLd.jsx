/** Sisipkan structured data schema.org (JSON-LD). `data` = objek atau array objek. Aman dari </script> injection. */
export function JsonLd({ data }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, '\\u003c'); // \\u003c = escape JSON (6 karakter), bukan karakter <
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default JsonLd;
