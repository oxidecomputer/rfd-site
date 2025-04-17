import uFuzzy from '@leeoniya/ufuzzy'

export const fuzzConf: uFuzzy.Options = {
  intraMode: 1,
  intraIns: 1, // Max number of extra chars allowed between each char within a term
  // ↓ Error types to tolerate within terms
  intraSub: 1,
  intraTrn: 1,
  intraDel: 1,
}

export const fuzz = new uFuzzy(fuzzConf)
