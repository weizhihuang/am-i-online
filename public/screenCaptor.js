const robot = require('robotjs')

const [x, y, width, height] = process.argv.slice(2).map(Number)

process.on('message', () => {
  const img = robot.screen.capture(x, y, width, height)
  const rate = img.width / width

  const colors = []
  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
      colors.push(img.colorAt(i * rate, j * rate))
    }
  }

  process.send(colors)
})
