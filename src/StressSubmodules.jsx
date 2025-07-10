import SubmoduleDropdown from './SubmoduleDropdown'

export default function StressSubmodules() {
  const stressItems = [
    { label: 'Segment',  path: '../Main'  },
    { label: 'Word',     path: '../Main'     },
    { label: 'Phrase',   path: '../Main'   },
    { label: 'Sentence', path: '../Main' }
  ]

  return (
    <SubmoduleDropdown
      title="Stress Modules"
      items={stressItems}
    />
  )
}