import SubmoduleDropdown from './SubmoduleDropdown'

export default function VowelSubmodules() {
  const vowelItems = [
    { label: 'Segment',  path: '../Main?submodule=Segment' },
    { label: 'Word',     path: '../Main?submodule=Word' },
    { label: 'Phrase',   path: '../Main?submodule=Phrase' },
    { label: 'Sentence', path: '../Main?submodule=Sentence' }
  ];


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#080133',
      }}
    >
      <div
        style={{
          background: '#1a202c',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          padding: '2.5rem 2rem',
          minWidth: 340,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2
          style={{
            marginBottom: 24,
            fontWeight: 700,
            fontSize: '2.5rem',
            color: '#FFFFFF',
            letterSpacing: '1px',
            textAlign: 'center',
          }}
        >
          Vowel Modules
        </h2>
        <div style={{ width: '100%', marginBottom: 16 }}>
          <SubmoduleDropdown
            items={vowelItems}
          />
        </div>
      </div>
    </div>
  );
}