import SubmoduleDropdown from './SubmoduleDropdown'

export default function StressSubmodules() {
  const stressItems = [
    { label: 'Segment',  path: '../Main'  },
    { label: 'Word',     path: '../Main'     },
    { label: 'Phrase',   path: '../Main'   },
    { label: 'Sentence', path: '../Main' }
  ];

  const handleItemClick = (label) => {
    // Navigate to Main page and pass label as state or query param
    window.location.href = `../Main?submodule=${encodeURIComponent(label)}`;
  };

  return (
    <SubmoduleDropdown
      title="Stress Modules"
      items={stressItems}
      onItemClick={handleItemClick}
    />
  )
}