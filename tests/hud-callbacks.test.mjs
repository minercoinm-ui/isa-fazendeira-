import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8")
const hud = await readFile(new URL("../src/components/HUD.tsx", import.meta.url), "utf8")

test("App fornece todos os callbacks de navegação usados pelo HUD", () => {
  for (const prop of ["onOpenOrders", "onOpenMyPlots", "onOpenAvatarCustomizer"]) {
    assert.match(app, new RegExp(`${prop}=\\{\\(\\) =>`), `callback ausente: ${prop}`)
    assert.match(hud, new RegExp(`${prop}: \\(\\) => void`), `contrato ausente: ${prop}`)
  }
})

test("HUD invoca callbacks sem depender de valores opcionais", () => {
  for (const prop of ["onOpenOrders", "onOpenMyPlots", "onOpenAvatarCustomizer"]) {
    assert.match(hud, new RegExp(`${prop}\\(\\)`), `invocação ausente: ${prop}`)
  }
})
