export function getSequence(arr) {
  const result = [0]
  let len = arr.length
  const p = arr.slice(0)
  for (let i = 1; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      //处理掉0
      let resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex // 标记当前前一个对应的索引
        result.push(i)
        continue
      }

      let start = 0
      let end = result.length - 1
      while (start < end) {
        let mid = Math.floor(start + (end - start) / 2)

        console.log("arr[result[mid]]=>", arr[result[mid]])
        if (arr[result[mid]] < arrI) {
          start = mid + 1
        } else {
          end = mid
        }
      }

      if (arrI < arr[result[start]]) {
        if (start > 0) {
          // 才需要替换
          p[i] = result[start - 1] // 要将他替换的前一个记住
        }
        result[start] = i
      }
    }
  }

  let i = result.length - 1
  let last = result[result.length - 1]

  while (i >= 0) {
    result[i] = last
    last = p[last]
    i--
  }
  return result
}

// [0 1 2 ]

console.log(getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]))
