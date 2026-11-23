import { weightFromName } from "./lib/userFont";

describe("fonte do usuário", () => {
  it("descobre o peso pelo nome do arquivo", () => {
    expect(weightFromName("SamsungSans-Regular.ttf")).toBe(400);
    expect(weightFromName("SamsungSans-Medium.ttf")).toBe(500);
    expect(weightFromName("SamsungSans-Bold.ttf")).toBe(700);
    expect(weightFromName("SamsungSans-Light.ttf")).toBe(300);
    expect(weightFromName("SamsungSans-Thin.ttf")).toBe(100);
    expect(weightFromName("minhafonte.ttf")).toBe(400);
  });
});
