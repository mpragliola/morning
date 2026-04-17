interface Props {
  onClick: () => void
}

export function GearButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Preferences"
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 100,
        background: 'rgba(255,255,255,0.08)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        fontSize: '20px',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      ⚙
    </button>
  )
}
