export default function ZellerStar({ size = 80, color = '#c9aa62', className = '' }) {
  const h = Math.round(size * (450 / 508))
  return (
    <span className={`zs-wrap ${className}`}>
      <svg
        className="zs"
        width={size}
        height={h}
        viewBox="0 0 508 450"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Zeller mark"
      >
        <g transform="translate(0,450) scale(0.066667,-0.066667)">
          <path
            className="zs-path"
            pathLength="1"
            d="M3784 4669 l-34 -6 0 -404 0 -404 60 0 60 0 0 184 1 184 73 -139
               c120 -227 244 -366 429 -481 l75 -47 -874 -1 -874 0 0 -58 0 -59
               95 -10 c468 -50 820 -423 948 -1003 23 -107 28 -117 58 -109 17 5
               43 9 58 9 24 0 26 29 26 405 l0 405 -60 0 -60 0 -1 -184 0 -183
               -61 119 c-111 216 -251 378 -424 488 l-91 59 873 1 874 0 0 59 0
               58 -94 10 c-479 54 -833 435 -955 1032 -19 89 -21 91 -102 75z"
            fill="transparent"
            stroke={color}
            strokeWidth="30"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </span>
  )
}
