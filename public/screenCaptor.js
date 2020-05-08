const robot = require('robotjs')
const { each, range } = require('lodash')

const [x, y, width, height] = process.argv.slice(2).map(Number)

process.on('message', () => {
  const img = robot.screen.capture(x, y, width, height)
  const rate = img.width / width

  const colors = []
  each(range(width), i => {
    each(range(height), j => {
      colors.push(img.colorAt(i * rate, j * rate))
    })
  })

  process.send(colors)
})
