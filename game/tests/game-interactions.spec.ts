import { expect, test, type Locator, type Page } from "@playwright/test";

async function dragTo(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Drag endpoints must be visible");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
}

test("multiple trays can be dragged to the board consecutively", async ({ page }) => {
  await page.goto("/");

  await dragTo(page, page.getByTestId("source-source-matcha-1"), page.getByTestId("board-cell-0-0"));
  await expect(page.getByTestId("board-source-matcha-1")).toBeVisible();

  await dragTo(page, page.getByTestId("source-source-cocoa-1"), page.getByTestId("board-cell-1-0"));
  await expect(page.getByTestId("board-source-cocoa-1")).toBeVisible();
  await expect(page.locator('[data-testid^="board-source"]')).toHaveCount(2);
});

test("the demo switches between a pure level and a visibly mixed level", async ({ page }) => {
  await page.goto("/");
  const pureTray = page.getByTestId("source-source-matcha-1");
  await expect(pureTray.locator(".drink-cup--matcha")).toHaveCount(2);
  await expect(pureTray.locator(".drink-cup--cocoa")).toHaveCount(0);

  await page.getByTestId("demo-level-mixed").click();
  const mixedTray = page.getByTestId("source-source-mixed-1-1");
  await expect(mixedTray.locator(".drink-cup--matcha")).toHaveCount(1);
  await expect(mixedTray.locator(".drink-cup--cocoa")).toHaveCount(1);
  await expect(mixedTray.locator(".tray-count")).toHaveText("2/6");
  await expect(page.getByTestId("demo-level-mixed")).toHaveAttribute("aria-pressed", "true");
});

test("dragging uses a board-sized preview and highlights the exact destination", async ({ page }) => {
  await page.goto("/");
  const source = page.getByTestId("source-source-matcha-1");
  const target = page.getByTestId("board-cell-2-1");
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Drag endpoints must be visible");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await expect(page.locator(".staging-slot--selected")).toHaveCount(0);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });

  const ghost = page.getByTestId("tray-drag-ghost");
  await expect(ghost).toBeVisible();
  await expect(target).toHaveClass(/board-cell--drag-target/);
  const ghostBox = await ghost.boundingBox();
  expect(ghostBox).not.toBeNull();
  expect(ghostBox!.width).toBeLessThan(to.width);
  expect(ghostBox!.height).toBeLessThan(to.height);

  await page.mouse.up();
  await expect(page.getByTestId("board-source-matcha-1")).toHaveAttribute("style", /grid-area: 2 \/ 3/);
});

test("dragging preserves the grab point and places by the visible preview center", async ({ page }) => {
  await page.goto("/");
  const source = page.getByTestId("source-source-matcha-1");
  const target = page.getByTestId("board-cell-2-1");
  await source.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Drag endpoints must be visible");

  const grabRatioX = 0.2;
  const grabRatioY = 0.7;
  const pointerX = to.x + to.width * 0.35;
  const pointerY = to.y + to.height * 0.55;
  await page.mouse.move(from.x + from.width * grabRatioX, from.y + from.height * grabRatioY);
  await page.mouse.down();
  await page.mouse.move(pointerX, pointerY, { steps: 8 });

  const ghost = page.getByTestId("tray-drag-ghost");
  const ghostBox = await ghost.boundingBox();
  expect(ghostBox).not.toBeNull();
  expect(Math.abs((pointerX - ghostBox!.x) / ghostBox!.width - grabRatioX)).toBeLessThan(0.04);
  expect(Math.abs((pointerY - ghostBox!.y) / ghostBox!.height - grabRatioY)).toBeLessThan(0.04);
  await expect(target).toHaveClass(/board-cell--drag-target/);

  await page.mouse.up();
  await expect(page.getByTestId("board-source-matcha-1")).toHaveAttribute("style", /grid-area: 2 \/ 3/);
});

test("a placed tray is fixed while every staging tray remains draggable", async ({ page }) => {
  await page.goto("/");
  const firstCell = page.getByTestId("board-cell-0-0");
  await dragTo(page, page.getByTestId("source-source-matcha-1"), firstCell);

  const placed = page.getByTestId("board-source-matcha-1");
  const emptyCell = page.getByTestId("board-cell-3-2");
  await expect(placed.locator(".tray-card")).toBeDisabled();
  await dragTo(page, placed, emptyCell);
  await expect(placed).toHaveAttribute("style", /grid-area: 1 \/ 1/);
  await expect(emptyCell).not.toHaveClass(/board-cell--occupied/);

  await dragTo(page, page.getByTestId("source-source-vanilla-1"), emptyCell);
  await expect(page.getByTestId("board-source-vanilla-1")).toHaveAttribute("style", /grid-area: 3 \/ 4/);
});

test("board cells keep their physical row and column after trays are placed", async ({ page }) => {
  await page.goto("/");
  const cellIds = Array.from({ length: 20 }, (_, index) => `board-cell-${index % 4}-${Math.floor(index / 4)}`);
  const before = await Promise.all(cellIds.map(async (id) => {
    const box = await page.getByTestId(id).boundingBox();
    if (!box) throw new Error(`${id} must be visible`);
    return box;
  }));

  await dragTo(page, page.getByTestId("source-source-matcha-1"), page.getByTestId("board-cell-2-1"));
  await dragTo(page, page.getByTestId("source-source-cocoa-1"), page.getByTestId("board-cell-1-1"));

  const after = await Promise.all(cellIds.map(async (id) => {
    const box = await page.getByTestId(id).boundingBox();
    if (!box) throw new Error(`${id} must remain visible`);
    return box;
  }));
  after.forEach((box, index) => {
    expect(Math.abs(box.x - before[index].x)).toBeLessThan(0.5);
    expect(Math.abs(box.y - before[index].y)).toBeLessThan(0.5);
    expect(Math.abs(box.width - before[index].width)).toBeLessThan(0.5);
    expect(Math.abs(box.height - before[index].height)).toBeLessThan(0.5);
  });

  await dragTo(page, page.getByTestId("source-source-matcha-2"), page.getByTestId("board-cell-3-1"));
  await expect(page.getByTestId("board-source-matcha-2")).toHaveAttribute("style", /grid-area: 2 \/ 4/);
  await expect(page.getByTestId("board-source-matcha-2").locator(".drink-cup")).toHaveCount(4, { timeout: 1500 });
});

test("merge transfers drinks one by one and dismisses the emptied tray with an exit animation", async ({ page }) => {
  await page.goto("/");
  await dragTo(page, page.getByTestId("source-source-matcha-1"), page.getByTestId("board-cell-2-1"));
  await dragTo(page, page.getByTestId("source-source-matcha-2"), page.getByTestId("board-cell-3-1"));

  const destination = page.getByTestId("board-source-matcha-2");
  const animatedDestination = page.getByTestId("merge-tray-source-matcha-2");
  const emptiedSource = page.getByTestId("merge-tray-source-matcha-1");
  await expect(page.getByTestId("merge-cup-flight")).toHaveCount(2);
  await expect(animatedDestination.locator(".drink-cup")).toHaveCount(2);
  await expect(emptiedSource.locator(".drink-cup")).toHaveCount(2);
  await expect(emptiedSource.locator(".drink-cup")).toHaveCount(1, { timeout: 450 });
  await expect(animatedDestination.locator(".drink-cup")).toHaveCount(4, { timeout: 1500 });
  await expect(emptiedSource).toHaveClass(/merge-source-tray--empty/);
  expect(await emptiedSource.evaluate((element) => getComputedStyle(element).animationName)).toBe("merge-empty-tray-exit");
  await expect(emptiedSource).toHaveCount(0, { timeout: 1600 });
  await expect(destination.locator(".drink-cup")).toHaveCount(4);
});

test("a true tap toggles selection and the selected tray is placed by a cell tap", async ({ page }) => {
  await page.goto("/");
  const source = page.getByTestId("source-source-matcha-1");
  const target = page.getByTestId("board-cell-1-0");

  await source.click();
  await expect(page.locator(".staging-slot--selected")).toHaveCount(1);
  await expect(target).toBeEnabled();

  await source.click();
  await expect(page.locator(".staging-slot--selected")).toHaveCount(0);
  await expect(target).toBeDisabled();

  await source.click();
  await target.click();
  await expect(page.getByTestId("board-source-matcha-1")).toHaveAttribute("style", /grid-area: 1 \/ 2/);
  await expect(page.locator(".staging-slot--selected")).toHaveCount(0);
});

test("the placement pad remains larger than a placed tray", async ({ page }) => {
  await page.goto("/");
  const cell = page.getByTestId("board-cell-0-0");
  await dragTo(page, page.getByTestId("source-source-matcha-1"), cell);

  const cellBox = await cell.boundingBox();
  const trayBox = await page.getByTestId("board-source-matcha-1").boundingBox();
  expect(cellBox).not.toBeNull();
  expect(trayBox).not.toBeNull();
  expect(cellBox!.width).toBeGreaterThan(trayBox!.width + 12);
  expect(cellBox!.height).toBeGreaterThan(trayBox!.height + 12);
  await expect(cell).toHaveClass(/board-cell--occupied/);
  expect(await page.getByTestId("board-source-matcha-1").evaluate((element) => getComputedStyle(element).animationName)).toBe("tray-drop-in");
});

test("a full tray keeps all six drinks inside its bounds and retains the fuller destination", async ({ page }) => {
  await page.goto("/");
  await dragTo(page, page.getByTestId("source-source-matcha-1"), page.getByTestId("board-cell-0-0"));
  await dragTo(page, page.getByTestId("source-source-cocoa-1"), page.getByTestId("board-cell-1-0"));
  await dragTo(page, page.getByTestId("source-source-vanilla-1"), page.getByTestId("board-cell-0-1"));
  await dragTo(page, page.getByTestId("source-source-vanilla-2"), page.getByTestId("board-cell-1-1"));
  await dragTo(page, page.getByTestId("source-source-matcha-2"), page.getByTestId("board-cell-3-2"));
  await dragTo(page, page.getByTestId("source-source-cocoa-2"), page.getByTestId("board-cell-3-3"));
  await dragTo(page, page.getByTestId("source-source-vanilla-3"), page.getByTestId("board-cell-2-1"));

  const fullTray = page.getByTestId("board-source-vanilla-2");
  await expect(fullTray.locator(".drink-cup")).toHaveCount(6, { timeout: 1800 });
  await expect(page.getByTestId("merge-tray-source-vanilla-3")).toHaveCount(0, { timeout: 1800 });
  const fits = await fullTray.evaluate((tray) => {
    const trayBounds = tray.getBoundingClientRect();
    return Array.from(tray.querySelectorAll(".drink-cup")).every((cup) => {
      const cupBounds = cup.getBoundingClientRect();
      return cupBounds.left >= trayBounds.left && cupBounds.right <= trayBounds.right && cupBounds.top >= trayBounds.top && cupBounds.bottom <= trayBounds.bottom;
    });
  });
  expect(fits).toBe(true);
});
