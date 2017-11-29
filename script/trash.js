"use strict"

const _trash = require("trash")

function trash(iterable) {
  return new Promise((resolve) =>
    _trash(iterable)
      .then(resolve)
      .catch((e) => {
        if (e.code === "EACCES") {
          console.error(e)
          process.exitCode = e.code
        }

        resolve()
      })
  )
}

module.exports = trash
