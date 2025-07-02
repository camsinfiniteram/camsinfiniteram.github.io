import SubmoduleDropdown from './SubmoduleDropdown'

export default function VowelSubmodules() {
  const vowelItems = [
    { label: 'Segment',  path: '../Main' },
    { label: 'Word',     path: '../Main'    },
    { label: 'Phrase',   path: '../Main'  },
    { label: 'Sentence', path: '../Main'}
  ]

  return (
    <SubmoduleDropdown
      title="Vowel Modules"
      items={vowelItems}
    />
  )
}