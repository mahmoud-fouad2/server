'use client';

export default function PageLayout({ children }) {
  return (
    <>
      {/* Content */}
      <div className="pt-20">{children}</div>
    </>
  );
}
