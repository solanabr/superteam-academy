import type { SVGProps } from "react";

export function Spill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 325 100"><defs><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="ssspill-grad"><stop stopColor="hsl(37, 99%, 67%)" stopOpacity="1" offset="45%"></stop><stop stopColor="hsl(316, 73%, 52%)" stopOpacity="1" offset="100%"></stop></linearGradient></defs><rect width="100%" height="100%" fill="hsl(292, 100%, 22%)"></rect><g fill="url(#ssspill-grad)">
      <rect width="100%" height="40" fill="hsl(37, 99%, 67%)"></rect>
      <rect x="0" width="7.69%" height="83.27924491772504" rx="15" />
      <rect x="50" width="7.69%" height="55.584569668029566" rx="15" />
      <rect x="100" width="7.69%" height="55.5779786216891" rx="15" />
      <rect x="150" width="7.69%" height="57.45388086392227" rx="15" />
      <rect x="200" width="7.69%" height="78.15741551812526" rx="15" />
      <rect x="250" width="7.69%" height="93.57837542151324" rx="15" />
      <rect x="300" width="7.69%" height="72.64030439553592" rx="15" />
    </g><g fill="hsl(292, 100%, 22%)">
        <rect x="25" y="6.995847392300342" width="7.69%" height="60" rx="15" />
        <rect x="75" y="20.555708138414456" width="7.69%" height="60" rx="15" />
        <rect x="125" y="10.373589182630992" width="7.69%" height="60" rx="15" />
        <rect x="175" y="18.261669955574902" width="7.69%" height="60" rx="15" />
        <rect x="225" y="2.915748170664446" width="7.69%" height="60" rx="15" />
        <rect x="275" y="23.18695029127327" width="7.69%" height="60" rx="15" />
      </g>
    </svg>
  );
}