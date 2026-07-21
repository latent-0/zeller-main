export default function ZellerStar({ size = 80, color = '#c9aa62', className = '' }) {
  return (
    <span className={`zs-wrap ${className}`}>
      <svg
        className="zs"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Zeller star"
      >
        <path
          className="zs-path"
          pathLength="1"
          d="M 50 7 Q 50 50 93 50 Q 50 50 50 93 Q 50 50 7 50 Q 50 50 50 7 Z"
          fill="transparent"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    </span>
  )
}
