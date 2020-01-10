import { app } from 'electron'
import path from 'path'
import fs from 'fs'


export default class Store {
  constructor() {
    this.path = path.join(app.getPath('userData'), 'settings.json')
    this.data = JSON.parse(fs.readFileSync(this.path))
  }

  get(key) {
    return this.data[key]
  }

  set(key, val) {
    this.data[key] = val
    fs.writeFileSync(this.path, JSON.stringify(this.data))
  }
}
