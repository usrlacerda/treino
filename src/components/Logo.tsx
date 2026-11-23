/** Marca do app: o mesmo ícone do aplicativo instalado (monograma "CG" branco sobre degradê). Decorativa (o nome vem do texto ao lado). */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo" viewBox="0 0 1200 1200" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cg-grad" x1="0" y1="1200" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f148a" /><stop offset=".5" stopColor="#d81b60" /><stop offset="1" stopColor="#ff6f00" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="264" fill="url(#cg-grad)" />
      <path d="M436.8 786.3Q394.5 786.3 358.4 772.7Q322.4 759.2 295.9 734.1Q269.4 709.1 254.7 675.1Q240.0 641.0 240.0 600.0Q240.0 559.0 254.7 524.9Q269.4 490.9 295.9 465.9Q322.5 440.8 358.6 427.3Q394.6 413.7 437.0 413.7Q486.6 413.7 525.8 430.9Q565.0 448.2 590.9 481.1L526.6 539.5Q509.4 519.1 488.5 508.2Q467.5 497.4 442.0 497.4Q419.9 497.4 401.7 504.6Q383.5 511.9 370.2 525.5Q357.0 539.1 349.7 558.0Q342.3 577.0 342.3 600.0Q342.3 623.0 349.7 642.0Q357.0 660.9 370.2 674.5Q383.5 688.1 401.7 695.4Q419.9 702.6 442.0 702.6Q467.5 702.6 488.5 691.8Q509.4 680.9 526.6 660.3L590.9 718.7Q565.0 751.3 525.8 768.8Q486.6 786.3 436.8 786.3ZM801.2 786.3Q758.3 786.3 722.2 772.7Q686.1 759.2 659.5 734.1Q632.9 709.1 618.2 675.1Q603.5 641.0 603.5 600.0Q603.5 559.0 618.2 524.9Q632.9 490.9 659.7 465.9Q686.6 440.8 723.1 427.3Q759.5 413.7 803.3 413.7Q853.7 413.7 893.6 430.5Q933.5 447.3 960.0 479.0L895.2 537.4Q876.9 517.3 855.5 507.3Q834.1 497.4 808.3 497.4Q785.3 497.4 766.4 504.6Q747.5 511.9 734.0 525.5Q720.5 539.1 713.2 557.9Q705.9 576.6 705.9 600.0Q705.9 622.5 713.2 641.5Q720.5 660.4 734.0 674.1Q747.5 687.8 766.0 695.2Q784.5 702.6 807.1 702.6Q829.8 702.6 851.2 695.2Q872.5 687.7 894.7 669.7L951.7 740.7Q920.6 762.9 880.4 774.6Q840.2 786.3 801.2 786.3ZM951.7 740.7 861.8 727.7V592.3H951.7Z" fill="#fff" />
    </svg>
  );
}

/** Cabeçalho de marca das telas principais: o nome da tela fica na barra de baixo, então o título vira texto só para leitor de tela. */
export function BrandBar({ compact = false }: { compact?: boolean }) {
  return <div className={"brandbar" + (compact ? " compact" : "")}><Logo size={compact ? 32 : 44} /><span className="brand-name">CG Fit</span></div>;
}

export function BrandHeader({ title }: { title: string }) {
  return (
    <>
      <BrandBar />
      <h1 className="sr-only">{title}</h1>
    </>
  );
}
