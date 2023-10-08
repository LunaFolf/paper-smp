export function waitForKey(keyCode?: number): Promise<void> {
  return new Promise(resolve => {
    process.stdin.on('data',function (chunk) {
      if (keyCode && chunk[0] !== keyCode) return

      resolve()
      process.stdin.pause()
    })
  })
}