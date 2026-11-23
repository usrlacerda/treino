/** Marca do app: halter com degradê roxo, magenta e laranja. Decorativa (o nome vem do texto ao lado). */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo" viewBox="96 192 1008 816" width={size} height={size * 0.81} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cg-grad" x1="96" x2="1104" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7a35c0" /><stop offset=".5" stopColor="#e63a78" /><stop offset="1" stopColor="#ff6f00" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#cg-grad)" strokeWidth="56" strokeLinejoin="round">
        <rect x="124" y="316" width="116" height="568" rx="44" /><rect x="268" y="220" width="140" height="760" rx="44" />
        <rect x="792" y="220" width="140" height="760" rx="44" /><rect x="960" y="316" width="116" height="568" rx="44" />
        <path d="M432 552H768M432 648H768" />
      </g>
    </svg>
  );
}

/** Cabeçalho de marca das telas principais: o nome da tela fica na barra de baixo, então o título vira texto só para leitor de tela. */
export function BrandBar({ compact = false }: { compact?: boolean }) {
  return <div className={"brandbar" + (compact ? " compact" : "")}><Logo size={compact ? 32 : 44} /><span className="brand-name">Corre Gordo</span></div>;
}

export function BrandHeader({ title }: { title: string }) {
  return (
    <>
      <BrandBar />
      <h1 className="sr-only">{title}</h1>
    </>
  );
}
