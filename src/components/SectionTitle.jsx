export default function SectionTitle({ eyebrow, title, children, light=false }) {
  return (
    <div className={`section-title ${light ? "light" : ""}`}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
