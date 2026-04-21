// Based on https://github.com/zhenghuahou/text-diff
import Diff from 'fast-diff'

type Operation = -1 | 0 | 1

interface DiffPatchResult {
  before: string
  after: string
}

function format(operation: Operation, txt: string): string {
  if (!txt) return txt
  if (operation === Diff.DELETE) return `<del>${txt}</del>`
  if (operation === Diff.INSERT) return `<ins>${txt}</ins>`
  return txt
}

/** Character-level diff of two strings with <del>/<ins> markup on the changed runs. */
export function diffPatch(oldText = '', newText = ''): DiffPatchResult {
  let before = ''
  let after = ''
  for (const [operation, str] of Diff(oldText, newText)) {
    if (operation !== Diff.INSERT) before += format(operation, str)
    if (operation !== Diff.DELETE) after += format(operation, str)
  }
  return { before, after }
}

function getPatchText(
  revisionArr: string[],
  intersectSet: Set<string>,
  separator: string,
  isBefore: boolean,
): string {
  return revisionArr
    .map((segment) => {
      const operation = intersectSet.has(segment)
        ? Diff.EQUAL
        : isBefore
          ? Diff.DELETE
          : Diff.INSERT
      return format(operation, segment)
    })
    .join(separator)
}

/** Split both inputs by `separator`, then mark segments that differ with <del>/<ins>. */
export function diffPatchBySeparator(
  oldText = '',
  newText = '',
  separator = ',',
): DiffPatchResult {
  const originalArr = oldText.split(separator)
  const compareArr = newText.split(separator)
  const originalSet = new Set(originalArr)
  const intersectSet = new Set(compareArr.filter((x) => originalSet.has(x)))

  return {
    before: getPatchText(originalArr, intersectSet, separator, true),
    after: getPatchText(compareArr, intersectSet, separator, false),
  }
}
