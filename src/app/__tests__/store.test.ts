
import { describe, expect, it } from "vitest";
import { store } from "../store";

describe("Redux store", () => {
  it("initializes the tickets state", () => {
    const state = store.getState();

    expect(state).toHaveProperty("tickets");
    expect(state.tickets).toBeDefined();
  });

  it("handles an unknown action without crashing", () => {
    const previousTicketsState = store.getState().tickets;

    expect(() => {
      store.dispatch({
        type: "test/unknownAction",
      });
    }).not.toThrow();

    const currentState = store.getState();

    // An unknown action must not change the tickets reducer state.
    expect(currentState.tickets).toEqual(
      previousTicketsState
    );
  });
});
