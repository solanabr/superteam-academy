export const metadata = {
    title: 'Course Studio | Superteam Academy',
    description: 'Content management for Superteam Academy',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
