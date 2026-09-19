export default function NotFound() {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#080908",
          color: "#e7e9e3",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
        }}
      >
        <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", fontSize: 11 }}>
          Not found
        </p>
      </body>
    </html>
  );
}
