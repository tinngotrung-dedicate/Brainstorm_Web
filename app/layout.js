import './globals.css';

export const metadata = {
  title: 'Brainstorm Lab - Khoa học sáng tạo có hệ thống',
  description: 'Nền tảng brainstorm khoa học cho đội nhóm hiện đại.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
