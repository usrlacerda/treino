import { act } from "@testing-library/react";

/** Simula o botão voltar do aparelho. */
export async function pressBack() {
  await act(async () => { history.back(); await new Promise((r) => setTimeout(r, 30)); });
}
