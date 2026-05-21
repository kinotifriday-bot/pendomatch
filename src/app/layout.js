import "./globals.css"

export const metadata = {
  title: "PendoMatch | Premium Dating & Connections 💖",
  description: "Match, connect, and converse seamlessly on PendoMatch. Discover meaningful connections near you.",
  openGraph: {
    title: "PendoMatch | Find Your Perfect Match 💖",
    description: "Premium dating and seamless conversation threads. Join PendoMatch today.",
    url: "https://pendomatch.vercel.app",
    siteName: "PendoMatch",
    images: [
      {
        url: "/og-image.png", // Next.js maps this slash straight to your public/og-image.png file
        width: 1200,
        height: 630,
        alt: "PendoMatch Elegant Flaming 3D Heart Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PendoMatch | Premium Dating 💖",
    description: "Premium dating and seamless conversation threads.",
    images: ["/og-image.png"],
  },
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