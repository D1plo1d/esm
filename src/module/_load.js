// Based on Node's `Module._load` method.
// Copyright Node.js contributors. Released under MIT license:
// https://github.com/nodejs/node/blob/master/lib/module.js

import Entry from "../entry.js"
import Module from "../module.js"

import moduleState from "./state.js"

const compileSym = Symbol.for("@std/esm:module._compile")

function load(filePath, parent, isMain, state, loader) {
  let child = state._cache[filePath]

  if (child) {
    const children = parent && parent.children

    if (children && children.indexOf(child) === -1) {
      children.push(child)
    }

    const entry = Entry.get(child)

    if (child.loaded ||
        typeof entry.state !== "number") {
      return child
    }

    // Module states:
    //   1 - Initial state
    //   2 - Parsing phase is complete
    //   3 - Execution phase is complete
    if (moduleState.parsing &&
        entry.state !== 1) {
      return child
    }

    if (! moduleState.parsing &&
        entry.state === 3) {
      return child
    }

    entry.state = 3
  } else {
    child = new Module(filePath, parent)

    if (moduleState.parsing) {
      Entry.get(child).state = 1
    }

    if (isMain) {
      moduleState.mainModule =
      process.mainModule = child
      child.id = "."
    }
  }

  const { _compile } = child

  child._compile = (content, filePath) => {
    delete child._compile

    const func = typeof child[compileSym] === "function"
      ? child[compileSym]
      : _compile

    return func.call(child, content, filePath)
  }

  tryLoad(child, filePath, state, loader)
  return child
}

function tryLoad(mod, filePath, state, loader = mod.load) {
  state._cache[filePath] = mod

  let threw = true

  try {
    loader.call(mod, filePath)
    threw = false
  } finally {
    if (threw) {
      delete state._cache[filePath]
    }
  }
}

export default load
