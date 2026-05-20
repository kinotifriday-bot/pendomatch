import "./globals.css"

export const metadata = {
  title: "Mingle",
  description: "Social app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0f17", color: "white" }}>
        {children}
      </body>
    </html>
  )
}