import type { SVGProps } from 'react';

export function EchoScribeLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19.5c-4.69 0-8.5-3.81-8.5-8.5S7.31 2.5 12 2.5" />
      <path d="M12 15.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 6.5 12 6.5" />
      <path d="M12 11.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
      <path d="M18.5 11c0 3.59-2.91 6.5-6.5 6.5" />
    </svg>
  );
}
